import asyncio
import base64
import hashlib
import hmac
import ipaddress
import json
import os
import re
import secrets
import socket
import time
from dataclasses import dataclass
from html.parser import HTMLParser
from pathlib import Path
from typing import Any
from urllib.parse import urljoin, urlsplit, urlunsplit

import httpx


INSTAGRAM_HOSTS = {"instagram.com", "www.instagram.com", "m.instagram.com"}
INSTAGRAM_PATH = re.compile(r"^/(?:p|reel|reels|tv)/([A-Za-z0-9_-]{5,})/?$")
MAX_VIDEO_BYTES = 200 * 1024 * 1024
MAX_IMAGE_BYTES = 25 * 1024 * 1024
MAX_THUMBNAIL_BYTES = 10 * 1024 * 1024
MAX_INSTAGRAM_HTML_BYTES = 2 * 1024 * 1024
TOKEN_TTL_SECONDS = 10 * 60
MAX_REDIRECTS = 4


class InstagramResolveError(Exception):
    def __init__(self, detail: str, status_code: int = 422):
        super().__init__(detail)
        self.detail = detail
        self.status_code = status_code


@dataclass(frozen=True)
class RemoteMedia:
    url: str
    filename: str
    media_type: str
    kind: str
    headers: dict[str, str]
    max_bytes: int


def normalize_instagram_url(value: str) -> tuple[str, str]:
    value = value.strip()
    if len(value) > 2048:
        raise InstagramResolveError("O link informado é muito longo.")

    try:
        parsed = urlsplit(value)
    except ValueError as exc:
        raise InstagramResolveError("Cole um link válido do Instagram.") from exc

    hostname = (parsed.hostname or "").lower().rstrip(".")
    if parsed.scheme != "https" or hostname not in INSTAGRAM_HOSTS or parsed.username or parsed.password:
        raise InstagramResolveError("Cole um link público válido do Instagram.")
    if parsed.port not in (None, 443):
        raise InstagramResolveError("O link do Instagram utiliza uma porta não permitida.")

    path = re.sub(r"/+", "/", parsed.path)
    match = INSTAGRAM_PATH.fullmatch(path)
    if not match:
        raise InstagramResolveError("Nesta versão, use o link de um Reel ou de uma publicação pública com vídeo.")

    canonical = urlunsplit(("https", "www.instagram.com", path.rstrip("/") + "/", "", ""))
    return canonical, match.group(1)


def _token_secret() -> bytes:
    configured = os.getenv("KIVAI_DOWNLOAD_TOKEN_SECRET", "").strip()
    if configured:
        return hashlib.sha256(configured.encode("utf-8")).digest()
    return secrets.token_bytes(32)


_TOKEN_SECRET = _token_secret()


def create_media_token(media: RemoteMedia, *, ttl_seconds: int = TOKEN_TTL_SECONDS) -> str:
    payload = {
        "v": 1,
        "exp": int(time.time()) + ttl_seconds,
        "url": media.url,
        "filename": media.filename,
        "mediaType": media.media_type,
        "kind": media.kind,
        "headers": media.headers,
        "maxBytes": media.max_bytes,
    }
    encoded = base64.urlsafe_b64encode(
        json.dumps(payload, ensure_ascii=True, separators=(",", ":")).encode("utf-8")
    ).rstrip(b"=")
    signature = hmac.new(_TOKEN_SECRET, encoded, hashlib.sha256).digest()
    return f"{encoded.decode('ascii')}.{base64.urlsafe_b64encode(signature).rstrip(b'=').decode('ascii')}"


def read_media_token(token: str) -> RemoteMedia:
    try:
        encoded_text, signature_text = token.split(".", 1)
        encoded = encoded_text.encode("ascii")
        signature = base64.urlsafe_b64decode(signature_text + "=" * (-len(signature_text) % 4))
        expected = hmac.new(_TOKEN_SECRET, encoded, hashlib.sha256).digest()
        if not hmac.compare_digest(signature, expected):
            raise ValueError("invalid-signature")
        payload = json.loads(base64.urlsafe_b64decode(encoded_text + "=" * (-len(encoded_text) % 4)))
        if payload.get("v") != 1 or int(payload["exp"]) < int(time.time()):
            raise ValueError("expired-token")

        media = RemoteMedia(
            url=str(payload["url"]),
            filename=safe_filename(str(payload["filename"]), fallback="instagram-video.mp4"),
            media_type=str(payload["mediaType"]),
            kind=str(payload["kind"]),
            headers=filter_remote_headers(payload.get("headers") or {}),
            max_bytes=int(payload["maxBytes"]),
        )
        if media.kind not in {"video", "image", "thumbnail"}:
            raise ValueError("invalid-kind")
        if media.max_bytes not in {MAX_VIDEO_BYTES, MAX_IMAGE_BYTES, MAX_THUMBNAIL_BYTES}:
            raise ValueError("invalid-limit")
        return media
    except (KeyError, TypeError, ValueError, json.JSONDecodeError, UnicodeError) as exc:
        raise InstagramResolveError("Este link temporário expirou ou não é válido.", 410) from exc


def safe_filename(value: str, *, fallback: str) -> str:
    name = Path(value).name
    name = re.sub(r"[^A-Za-z0-9._-]+", "-", name).strip(".-")
    return name[:120] or fallback


def filter_remote_headers(headers: Any) -> dict[str, str]:
    if not isinstance(headers, dict):
        return {}
    allowed = {"user-agent", "referer", "origin", "accept"}
    return {
        str(key): str(value)[:1000]
        for key, value in headers.items()
        if str(key).lower() in allowed and isinstance(value, str)
    }


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
        return None
    return max(progressive, key=lambda item: (item.get("height") or 0, item.get("tbr") or 0))


def _video_entries(info: dict[str, Any]) -> list[dict[str, Any]]:
    entries = info.get("entries")
    if isinstance(entries, list):
        return [entry for entry in entries if isinstance(entry, dict)][:10]
    return [info]


class _OpenGraphParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.values: dict[str, str] = {}

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag.lower() != "meta":
            return
        values = {key.lower(): value for key, value in attrs if value is not None}
        name = (values.get("property") or values.get("name") or "").lower()
        content = values.get("content")
        if name and content and name not in self.values:
            self.values[name] = content


def _positive_int(value: str | None) -> int | None:
    try:
        parsed = int(value or "")
    except ValueError:
        return None
    return parsed if parsed > 0 else None


def _og_media_result_from_html(html: str, shortcode: str) -> dict[str, Any]:
    parser = _OpenGraphParser()
    parser.feed(html)
    headers = {"Referer": "https://www.instagram.com/", "User-Agent": "Mozilla/5.0"}
    title = parser.values.get("og:title", "Conteúdo público do Instagram").strip()

    video_url = (
        parser.values.get("og:video:secure_url")
        or parser.values.get("og:video")
        or parser.values.get("og:video:url")
        or ""
    ).strip()
    if video_url.startswith("https://"):
        declared_type = parser.values.get("og:video:type", "").lower()
        extension = "mp4"
        path_extension = Path(urlsplit(video_url).path).suffix.lower().lstrip(".")
        if path_extension in {"mp4", "m4v", "webm"}:
            extension = path_extension
        media_type = declared_type if declared_type.startswith("video/") else f"video/{extension}"
        media = RemoteMedia(
            url=video_url,
            filename=f"instagram-{shortcode}.{extension}",
            media_type=media_type,
            kind="video",
            headers=headers,
            max_bytes=MAX_VIDEO_BYTES,
        )
        return {
            "source": "instagram",
            "shortcode": shortcode,
            "title": title[:240],
            "author": None,
            "thumbnailToken": None,
            "items": [{
                "id": f"{shortcode}-1",
                "kind": "video",
                "filename": media.filename,
                "format": extension.upper(),
                "width": _positive_int(parser.values.get("og:video:width")),
                "height": _positive_int(parser.values.get("og:video:height")),
                "duration": None,
                "size": None,
                "downloadToken": create_media_token(media),
            }],
            "expiresIn": TOKEN_TTL_SECONDS,
        }

    image_url = parser.values.get("og:image", "").strip()
    if not image_url.startswith("https://"):
        raise InstagramResolveError(
            "Não encontramos uma foto ou um vídeo disponível nesse link público.",
            422,
        )

    declared_type = parser.values.get("og:image:type", "").lower()
    extension_by_type = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}
    extension = extension_by_type.get(declared_type)
    if not extension:
        path_extension = Path(urlsplit(image_url).path).suffix.lower().lstrip(".")
        extension = path_extension if path_extension in {"jpg", "jpeg", "png", "webp"} else "jpg"
    media_type = declared_type if declared_type.startswith("image/") else f"image/{'jpeg' if extension in {'jpg', 'jpeg'} else extension}"
    media = RemoteMedia(
        url=image_url,
        filename=f"instagram-{shortcode}.{extension}",
        media_type=media_type,
        kind="image",
        headers=headers,
        max_bytes=MAX_IMAGE_BYTES,
    )
    return {
        "source": "instagram",
        "shortcode": shortcode,
        "title": title[:240],
        "author": None,
        "thumbnailToken": None,
        "items": [{
            "id": f"{shortcode}-1",
            "kind": "image",
            "filename": media.filename,
            "format": extension.upper(),
            "width": _positive_int(parser.values.get("og:image:width")),
            "height": _positive_int(parser.values.get("og:image:height")),
            "duration": None,
            "size": None,
            "downloadToken": create_media_token(media),
        }],
        "expiresIn": TOKEN_TTL_SECONDS,
    }


def _extract_instagram_photo_sync(url: str, shortcode: str) -> dict[str, Any]:
    headers = {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
    }
    candidates = [
        url,
        f"https://www.instagram.com/reel/{shortcode}/embed/",
        f"https://www.instagram.com/p/{shortcode}/embed/",
    ]
    last_error: InstagramResolveError | None = None

    try:
        with httpx.Client(timeout=httpx.Timeout(20, connect=10), follow_redirects=False) as client:
            for candidate in candidates:
                try:
                    with client.stream("GET", candidate, headers=headers) as response:
                        if response.status_code != 200:
                            last_error = InstagramResolveError(
                                "A publicação não está disponível publicamente.",
                                403 if response.status_code in {401, 403} else 502,
                            )
                            continue
                        chunks: list[bytes] = []
                        received = 0
                        for chunk in response.iter_bytes():
                            received += len(chunk)
                            if received > MAX_INSTAGRAM_HTML_BYTES:
                                raise InstagramResolveError("A página pública é maior que o limite permitido.", 502)
                            chunks.append(chunk)
                        encoding = response.encoding or "utf-8"
                    try:
                        return _og_media_result_from_html(
                            b"".join(chunks).decode(encoding, errors="replace"),
                            shortcode,
                        )
                    except InstagramResolveError as exc:
                        last_error = exc
                        continue
            if last_error:
                raise last_error
            raise InstagramResolveError(
                "Não foi possível consultar essa publicação pública agora. Tente novamente em alguns instantes.",
                502,
            )
    except httpx.HTTPError as exc:
        raise InstagramResolveError(
            "Não foi possível consultar essa publicação pública agora. Tente novamente em alguns instantes.",
            502,
        ) from exc


def instagram_download_error(message: str) -> InstagramResolveError:
    normalized = message.lower()
    if "no video in this post" in normalized:
        return InstagramResolveError(
            "Não encontramos um vídeo nesse link. Confira se a publicação contém um vídeo e está pública.",
            422,
        )
    if any(term in normalized for term in ("private", "login required", "not available", "restricted")):
        return InstagramResolveError(
            "A publicação não está disponível publicamente. Contas privadas e conteúdos restritos não são compatíveis.",
            403,
        )
    return InstagramResolveError(
        "Não foi possível localizar o vídeo público. O Instagram pode ter limitado o acesso temporariamente.",
        502,
    )


def _extract_instagram_sync(url: str, shortcode: str) -> dict[str, Any]:
    try:
        import yt_dlp
    except ImportError as exc:
        raise InstagramResolveError("O resolvedor do Instagram ainda não está instalado no servidor.", 503) from exc

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
        error_text = str(exc)
        # O HTML público às vezes ainda expõe og:video/og:image quando o
        # extrator principal encontra bloqueio temporário ou login.
        try:
            return _extract_instagram_photo_sync(url, shortcode)
        except InstagramResolveError:
            raise instagram_download_error(error_text) from exc

    if not isinstance(info, dict):
        raise InstagramResolveError("O Instagram não retornou dados de vídeo compatíveis.", 422)

    items: list[dict[str, Any]] = []
    for index, entry in enumerate(_video_entries(info), start=1):
        selected = _select_progressive_video(entry)
        if not selected:
            continue
        known_size = selected.get("filesize") or selected.get("filesize_approx")
        if isinstance(known_size, (int, float)) and known_size > MAX_VIDEO_BYTES:
            continue
        extension = str(selected.get("ext") or "mp4").lower()
        if extension not in {"mp4", "m4v", "webm"}:
            extension = "mp4"
        suffix = f"-{index}" if len(_video_entries(info)) > 1 else ""
        headers = filter_remote_headers(selected.get("http_headers") or entry.get("http_headers") or {})
        media = RemoteMedia(
            url=str(selected["url"]),
            filename=f"instagram-{shortcode}{suffix}.{extension}",
            media_type=str(selected.get("mime_type") or f"video/{extension}"),
            kind="video",
            headers=headers,
            max_bytes=MAX_VIDEO_BYTES,
        )
        items.append(
            {
                "id": f"{shortcode}-{index}",
                "kind": "video",
                "filename": media.filename,
                "format": extension.upper(),
                "width": selected.get("width") or entry.get("width"),
                "height": selected.get("height") or entry.get("height"),
                "duration": entry.get("duration") or info.get("duration"),
                "size": known_size,
                "downloadToken": create_media_token(media),
            }
        )

    if not items:
        raise InstagramResolveError(
            "Esta publicação pública não possui um vídeo progressivo compatível com o download nesta versão.",
            422,
        )

    thumbnail_url = info.get("thumbnail")
    thumbnail_token = None
    if isinstance(thumbnail_url, str) and thumbnail_url.startswith("https://"):
        thumbnail_token = create_media_token(
            RemoteMedia(
                url=thumbnail_url,
                filename=f"instagram-{shortcode}-capa.jpg",
                media_type="image/jpeg",
                kind="thumbnail",
                headers=filter_remote_headers(info.get("http_headers") or {}),
                max_bytes=MAX_THUMBNAIL_BYTES,
            )
        )

    title = str(info.get("title") or info.get("description") or "Vídeo público do Instagram").strip()
    return {
        "source": "instagram",
        "shortcode": shortcode,
        "title": title[:240],
        "author": str(info.get("uploader") or info.get("channel") or "").strip()[:100] or None,
        "thumbnailToken": thumbnail_token,
        "items": items,
        "expiresIn": TOKEN_TTL_SECONDS,
    }


async def resolve_instagram_public(value: str) -> dict[str, Any]:
    url, shortcode = normalize_instagram_url(value)
    try:
        return await asyncio.wait_for(asyncio.to_thread(_extract_instagram_sync, url, shortcode), timeout=30)
    except TimeoutError as exc:
        raise InstagramResolveError("O Instagram demorou demais para responder. Tente novamente em alguns instantes.", 504) from exc


async def ensure_public_https_url(value: str) -> None:
    parsed = urlsplit(value)
    if parsed.scheme != "https" or not parsed.hostname or parsed.username or parsed.password or parsed.port not in (None, 443):
        raise InstagramResolveError("A origem temporária da mídia não é segura.", 502)
    hostname = parsed.hostname.lower().rstrip(".")
    if hostname == "localhost" or hostname.endswith(".local"):
        raise InstagramResolveError("A origem temporária da mídia não é permitida.", 502)
    try:
        addresses = await asyncio.to_thread(socket.getaddrinfo, hostname, 443, type=socket.SOCK_STREAM)
    except socket.gaierror as exc:
        raise InstagramResolveError("Não foi possível localizar o servidor temporário da mídia.", 502) from exc
    if not addresses:
        raise InstagramResolveError("Não foi possível localizar o servidor temporário da mídia.", 502)
    for address in addresses:
        ip = ipaddress.ip_address(address[4][0])
        if not ip.is_global:
            raise InstagramResolveError("A origem temporária da mídia não é permitida.", 502)


async def open_remote_media(media: RemoteMedia, *, range_header: str | None = None) -> tuple[httpx.AsyncClient, httpx.Response]:
    client = httpx.AsyncClient(timeout=httpx.Timeout(30, connect=10), follow_redirects=False)
    current_url = media.url
    headers = dict(media.headers)
    if range_header and re.fullmatch(r"bytes=\d*-\d*", range_header):
        headers["Range"] = range_header

    try:
        for _ in range(MAX_REDIRECTS + 1):
            await ensure_public_https_url(current_url)
            request = client.build_request("GET", current_url, headers=headers)
            response = await client.send(request, stream=True)
            if response.status_code in {301, 302, 303, 307, 308}:
                location = response.headers.get("location")
                await response.aclose()
                if not location:
                    raise InstagramResolveError("O servidor da mídia retornou um redirecionamento inválido.", 502)
                current_url = urljoin(current_url, location)
                continue
            if response.status_code not in {200, 206}:
                await response.aclose()
                raise InstagramResolveError("O arquivo temporário não está mais disponível. Analise o link novamente.", 410)
            content_length = response.headers.get("content-length")
            if content_length:
                try:
                    exceeds_limit = int(content_length) > media.max_bytes
                except ValueError:
                    exceeds_limit = False
                if exceeds_limit:
                    await response.aclose()
                    raise InstagramResolveError("O arquivo ultrapassa o limite permitido nesta versão.", 413)
            return client, response
        raise InstagramResolveError("A mídia excedeu o limite de redirecionamentos.", 502)
    except Exception:
        await client.aclose()
        raise
