import asyncio
from pathlib import Path
from typing import Any
from urllib.parse import urlsplit, urlunsplit

try:
    from .instagram_downloader import (
        InstagramResolveError,
        MAX_VIDEO_BYTES,
        TOKEN_TTL_SECONDS,
        RemoteMedia,
        create_media_token,
        filter_remote_headers,
        open_remote_media,
        read_media_token,
    )
except ImportError:
    from instagram_downloader import (
        InstagramResolveError,
        MAX_VIDEO_BYTES,
        TOKEN_TTL_SECONDS,
        RemoteMedia,
        create_media_token,
        filter_remote_headers,
        open_remote_media,
        read_media_token,
    )


TIKTOK_HOSTS = {
    "tiktok.com",
    "www.tiktok.com",
    "m.tiktok.com",
    "vm.tiktok.com",
    "vt.tiktok.com",
}


class TikTokResolveError(Exception):
    def __init__(self, detail: str, status_code: int = 422):
        super().__init__(detail)
        self.detail = detail
        self.status_code = status_code


def normalize_tiktok_url(value: str) -> str:
    value = value.strip()
    if len(value) > 2048:
        raise TikTokResolveError("O link informado é muito longo.")

    try:
        parsed = urlsplit(value)
    except ValueError as exc:
        raise TikTokResolveError("Cole um link válido do TikTok.") from exc

    hostname = (parsed.hostname or "").lower().rstrip(".")
    if parsed.scheme != "https" or hostname not in TIKTOK_HOSTS or parsed.username or parsed.password:
        raise TikTokResolveError("Cole um link público válido do TikTok.")
    if parsed.port not in (None, 443):
        raise TikTokResolveError("O link do TikTok utiliza uma porta não permitida.")
    if not parsed.path or parsed.path == "/":
        raise TikTokResolveError("Cole o link de um vídeo público do TikTok.")

    return urlunsplit(("https", hostname, parsed.path, "", ""))


def _select_progressive_video(info: dict[str, Any]) -> dict[str, Any] | None:
    direct_url = info.get("url")
    if isinstance(direct_url, str) and direct_url.startswith("https://") and info.get("vcodec") != "none":
        return info

    formats = info.get("formats")
    if not isinstance(formats, list):
        return None

    progressive = [
        item
        for item in formats
        if isinstance(item, dict)
        and isinstance(item.get("url"), str)
        and item["url"].startswith("https://")
        and item.get("vcodec") not in (None, "none")
        and item.get("acodec") not in (None, "none")
    ]
    if not progressive:
        progressive = [
            item
            for item in formats
            if isinstance(item, dict)
            and isinstance(item.get("url"), str)
            and item["url"].startswith("https://")
            and item.get("vcodec") not in (None, "none")
        ]
    if not progressive:
        return None

    return max(progressive, key=lambda item: (item.get("height") or 0, item.get("tbr") or 0))


def tiktok_download_error(message: str) -> TikTokResolveError:
    normalized = message.lower()
    if any(term in normalized for term in ("private", "login required", "not available", "unavailable", "restricted")):
        return TikTokResolveError(
            "O vídeo não está disponível publicamente. Conteúdos privados, removidos ou restritos não são compatíveis.",
            403,
        )
    if any(term in normalized for term in ("unsupported url", "not a valid url", "invalid url")):
        return TikTokResolveError("Cole um link válido de um vídeo público do TikTok.", 422)
    return TikTokResolveError(
        "Não foi possível localizar o vídeo público. O TikTok pode ter limitado o acesso temporariamente.",
        502,
    )


def _extract_tiktok_sync(url: str) -> dict[str, Any]:
    try:
        import yt_dlp
    except ImportError as exc:
        raise TikTokResolveError("O resolvedor do TikTok ainda não está instalado no servidor.", 503) from exc

    options = {
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
        "noplaylist": True,
        "format": "best[ext=mp4]/best",
        "http_headers": {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
            "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
        },
        "impersonate": "chrome",
        "socket_timeout": 20,
        "retries": 1,
        "extractor_retries": 1,
        "nocheckcertificate": False,
    }

    try:
        with yt_dlp.YoutubeDL(options) as downloader:
            raw_info = downloader.extract_info(url, download=False)
            info = downloader.sanitize_info(raw_info)
    except yt_dlp.utils.DownloadError as exc:
        raise tiktok_download_error(str(exc)) from exc

    if not isinstance(info, dict):
        raise TikTokResolveError("O TikTok não retornou dados de vídeo compatíveis.", 422)

    selected = _select_progressive_video(info)
    if not selected:
        raise TikTokResolveError(
            "Este vídeo público não possui um arquivo compatível com o download nesta versão.",
            422,
        )

    known_size = selected.get("filesize") or selected.get("filesize_approx")
    if isinstance(known_size, (int, float)) and known_size > MAX_VIDEO_BYTES:
        raise TikTokResolveError("O vídeo ultrapassa o limite de 200 MB desta ferramenta.", 413)

    video_id = str(info.get("id") or "").strip()
    if not video_id:
        video_id = str(abs(hash(url)))

    extension = str(selected.get("ext") or "mp4").lower()
    if extension not in {"mp4", "m4v", "webm"}:
        extension = "mp4"

    headers = filter_remote_headers(selected.get("http_headers") or info.get("http_headers") or {})
    media = RemoteMedia(
        url=str(selected["url"]),
        filename=f"tiktok-{video_id}.{extension}",
        media_type=str(selected.get("mime_type") or f"video/{extension}"),
        kind="video",
        headers=headers,
        max_bytes=MAX_VIDEO_BYTES,
    )

    title = str(info.get("title") or info.get("description") or "Vídeo público do TikTok").strip()
    author = str(info.get("uploader") or info.get("creator") or info.get("channel") or "").strip()

    return {
        "source": "tiktok",
        "videoId": video_id,
        "title": title[:240],
        "author": author[:100] or None,
        "items": [
            {
                "id": video_id,
                "kind": "video",
                "filename": media.filename,
                "format": extension.upper(),
                "width": selected.get("width") or info.get("width"),
                "height": selected.get("height") or info.get("height"),
                "duration": info.get("duration"),
                "size": known_size,
                "downloadToken": create_media_token(media),
            }
        ],
        "expiresIn": TOKEN_TTL_SECONDS,
    }


async def resolve_tiktok_public(value: str) -> dict[str, Any]:
    url = normalize_tiktok_url(value)
    try:
        return await asyncio.wait_for(asyncio.to_thread(_extract_tiktok_sync, url), timeout=30)
    except TimeoutError as exc:
        raise TikTokResolveError("O TikTok demorou demais para responder. Tente novamente em alguns instantes.", 504) from exc


def read_tiktok_media_token(token: str) -> RemoteMedia:
    try:
        media = read_media_token(token)
    except InstagramResolveError as exc:
        raise TikTokResolveError(exc.detail, exc.status_code) from exc
    if not media.filename.startswith("tiktok-") or media.kind != "video":
        raise TikTokResolveError("Este link temporário não pertence a um vídeo do TikTok.", 410)
    return media


async def open_tiktok_remote_media(media: RemoteMedia, *, range_header: str | None = None):
    try:
        return await open_remote_media(media, range_header=range_header)
    except InstagramResolveError as exc:
        raise TikTokResolveError(exc.detail, exc.status_code) from exc
