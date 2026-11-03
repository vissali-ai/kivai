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

if __package__:
    from . import instagram_stories_provider
else:
    import instagram_stories_provider


INSTAGRAM_HOSTS = {"instagram.com", "www.instagram.com", "m.instagram.com"}
INSTAGRAM_POST_PATH = re.compile(r"^/(?:p|reel|reels|tv)/([A-Za-z0-9_-]{5,})/?$")
INSTAGRAM_STORY_PATH = re.compile(
    r"^/stories/(?P<username>[A-Za-z0-9._]{1,30})/(?P<story_id>\d{5,})/?$"
)
INSTAGRAM_STORY_PROFILE_PATH = re.compile(r"^/stories/(?P<username>[A-Za-z0-9._]{1,30})/?$")
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
    post_match = INSTAGRAM_POST_PATH.fullmatch(path)
    story_match = INSTAGRAM_STORY_PATH.fullmatch(path)

    if post_match:
        media_id = post_match.group(1)
    elif story_match:
        media_id = story_match.group("story_id")
    elif INSTAGRAM_STORY_PROFILE_PATH.fullmatch(path):
        media_id = INSTAGRAM_STORY_PROFILE_PATH.fullmatch(path).group("username").lower()
    else:
        raise InstagramResolveError(
            "Use o link de um Reel, de uma publicação pública ou de um Story específico do Instagram."
        )

    canonical = urlunsplit(("https", "www.instagram.com", path.rstrip("/") + "/", "", ""))
    return canonical, media_id


def _is_instagram_story_url(url: str) -> bool:
    path = urlsplit(url).path
    return bool(INSTAGRAM_STORY_PATH.fullmatch(path) or INSTAGRAM_STORY_PROFILE_PATH.fullmatch(path))


def _story_url_parts(url: str) -> tuple[str, str | None]:
    path = urlsplit(url).path
    profile = INSTAGRAM_STORY_PROFILE_PATH.fullmatch(path)
    if profile:
        return profile.group("username").lower(), None
    match = INSTAGRAM_STORY_PATH.fullmatch(path)
    if not match:
        raise InstagramResolveError("Cole o link de um Story específico do Instagram.")
    return match.group("username"), match.group("story_id")

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
        return [entry for entry in entries if isinstance(entry, dict)][:20]
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


def _json_value_after_key(text: str, key: str) -> Any | None:
    marker = f'"{key}"'
    decoder = json.JSONDecoder()
    start = text.find(marker)

    while start >= 0:
        colon = text.find(":", start + len(marker))
        if colon < 0:
            return None
        value_start = colon + 1
        while value_start < len(text) and text[value_start].isspace():
            value_start += 1
        try:
            value, _ = decoder.raw_decode(text[value_start:])
            return value
        except json.JSONDecodeError:
            start = text.find(marker, start + len(marker))
    return None


def _largest_image_candidate(info: dict[str, Any]) -> dict[str, Any] | None:
    candidates: list[dict[str, Any]] = []

    image_versions = info.get("image_versions2")
    if isinstance(image_versions, dict):
        raw_candidates = image_versions.get("candidates")
        if isinstance(raw_candidates, list):
            candidates.extend(item for item in raw_candidates if isinstance(item, dict))

    thumbnails = info.get("thumbnails")
    if isinstance(thumbnails, list):
        candidates.extend(item for item in thumbnails if isinstance(item, dict))

    thumbnail = info.get("thumbnail")
    if isinstance(thumbnail, str) and thumbnail.startswith("https://"):
        candidates.append({"url": thumbnail})

    usable = [
        item for item in candidates
        if isinstance(item.get("url"), str) and item["url"].startswith("https://")
    ]
    if not usable:
        return None
    return max(
        # yt-dlp orders thumbnails from lowest to highest preference. Prefer
        # the last candidate when Instagram omits dimensions.
        reversed(usable),
        key=lambda item: ((item.get("width") or 0) * (item.get("height") or 0), item.get("width") or 0),
    )


def _story_media_result_from_html(html: str, username: str, story_id: str | None) -> dict[str, Any]:
    payload = _json_value_after_key(html, "xdt_api__v1__feed__reels_media")
    if not isinstance(payload, dict):
        raise InstagramResolveError(
            "O Instagram exige autenticação para acessar este Story ou não disponibilizou a mídia publicamente.",
            403,
        )

    reels_media = payload.get("reels_media")
    if not isinstance(reels_media, list):
        raise InstagramResolveError(
            "Não encontramos a mídia deste Story na página pública do Instagram.",
            422,
        )

    all_items: list[dict[str, Any]] = []
    for reel in reels_media:
        if not isinstance(reel, dict):
            continue
        owner = reel.get("user")
        if isinstance(owner, dict) and owner.get("username") and str(owner["username"]).lower() != username.lower():
            continue
        items = reel.get("items")
        if isinstance(items, list):
            all_items.extend(item for item in items if isinstance(item, dict))

    if story_id is None:
        results = []
        seen = set()
        for entry in all_items:
            item_id = str(entry.get("pk") or entry.get("id") or "").split("_", 1)[0]
            if not item_id.isdigit() or item_id in seen:
                continue
            seen.add(item_id)
            results.extend(_story_item_result(entry, username, item_id)["items"])
        if not results:
            raise InstagramResolveError("Este perfil não possui Stories públicos disponíveis agora.", 404)
        return {
            "source": "instagram", "contentType": "story", "shortcode": username,
            "title": f"Stories de @{username}", "author": username,
            "thumbnailToken": None, "items": results, "expiresIn": TOKEN_TTL_SECONDS,
        }

    selected = next(
        (
            item for item in all_items
            if str(item.get("pk") or item.get("id") or "").split("_", 1)[0] == story_id
        ),
        None,
    )
    if selected is None:
        raise InstagramResolveError(
            "Este Story pode ter expirado ou o Instagram não disponibilizou o item solicitado.",
            410,
        )

    return _story_item_result(selected, username, story_id)


def _story_item_result(selected: dict[str, Any], username: str, story_id: str) -> dict[str, Any]:
    user = selected.get("user") if isinstance(selected.get("user"), dict) else {}
    author = str(user.get("username") or username).strip().lstrip("@")[:100]
    headers = {
        "Referer": "https://www.instagram.com/",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    }

    video_versions = selected.get("video_versions")
    videos = [
        item for item in video_versions
        if isinstance(item, dict)
        and isinstance(item.get("url"), str)
        and item["url"].startswith("https://")
    ] if isinstance(video_versions, list) else []

    if videos:
        chosen = max(
            videos,
            key=lambda item: ((item.get("width") or 0) * (item.get("height") or 0), item.get("width") or 0),
        )
        media = RemoteMedia(
            url=str(chosen["url"]),
            filename=f"instagram-story-{safe_filename(author, fallback='story')}-{story_id}.mp4",
            media_type="video/mp4",
            kind="video",
            headers=headers,
            max_bytes=MAX_VIDEO_BYTES,
        )
        item = {
            "id": f"story-{story_id}",
            "kind": "video",
            "filename": media.filename,
            "format": "MP4",
            "width": chosen.get("width"),
            "height": chosen.get("height"),
            "duration": selected.get("video_duration"),
            "size": None,
            "downloadToken": create_media_token(media),
        }
    else:
        chosen = _largest_image_candidate(selected)
        if not chosen:
            raise InstagramResolveError(
                "Não encontramos uma foto ou um vídeo disponível neste Story.",
                422,
            )
        media = RemoteMedia(
            url=str(chosen["url"]),
            filename=f"instagram-story-{safe_filename(author, fallback='story')}-{story_id}.jpg",
            media_type="image/jpeg",
            kind="image",
            headers=headers,
            max_bytes=MAX_IMAGE_BYTES,
        )
        item = {
            "id": f"story-{story_id}",
            "kind": "image",
            "filename": media.filename,
            "format": "JPG",
            "width": chosen.get("width"),
            "height": chosen.get("height"),
            "duration": None,
            "size": None,
            "downloadToken": create_media_token(media),
        }

    return {
        "source": "instagram",
        "contentType": "story",
        "shortcode": story_id,
        "title": f"Story de @{author}" if author else "Story do Instagram",
        "author": author or None,
        "thumbnailToken": None,
        "items": [item],
        "expiresIn": TOKEN_TTL_SECONDS,
    }


def _extract_instagram_story_html_sync(url: str, story_id: str) -> dict[str, Any]:
    username, normalized_story_id = _story_url_parts(url)
    if (normalized_story_id or username) != story_id:
        raise InstagramResolveError("O link do Story não corresponde ao item solicitado.", 422)

    headers = {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
    }
    session_cookie = os.getenv("KIVAI_INSTAGRAM_SESSION_COOKIE", "").strip()
    if session_cookie:
        headers["Cookie"] = session_cookie

    try:
        with httpx.Client(timeout=httpx.Timeout(20, connect=10), follow_redirects=False) as client:
            with client.stream("GET", url, headers=headers) as response:
                if response.status_code in {301, 302, 303, 307, 308, 401, 403}:
                    raise InstagramResolveError(
                        "O Instagram exige autenticação para acessar este Story. O Kivai não solicita login ou senha do usuário.",
                        403,
                    )
                if response.status_code == 404:
                    raise InstagramResolveError(
                        "Este Story não foi encontrado. Ele pode ter expirado ou sido removido.",
                        410,
                    )
                if response.status_code != 200:
                    raise InstagramResolveError(
                        "Não foi possível consultar este Story agora. Tente novamente em alguns instantes.",
                        502,
                    )

                chunks: list[bytes] = []
                received = 0
                for chunk in response.iter_bytes():
                    received += len(chunk)
                    if received > MAX_INSTAGRAM_HTML_BYTES:
                        raise InstagramResolveError("A página do Story é maior que o limite permitido.", 502)
                    chunks.append(chunk)
                encoding = response.encoding or "utf-8"

        html = b"".join(chunks).decode(encoding, errors="replace")
        return _story_media_result_from_html(html, username, normalized_story_id)
    except httpx.HTTPError as exc:
        raise InstagramResolveError(
            "Não foi possível consultar este Story agora. Tente novamente em alguns instantes.",
            502,
        ) from exc


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

def instagram_download_error(message: str, *, is_story: bool = False) -> InstagramResolveError:
    normalized = message.lower()
    if is_story and any(term in normalized for term in ("login", "private", "not available", "restricted", "unreachable")):
        return InstagramResolveError(
            "O Instagram exige autenticação para acessar este Story ou não disponibilizou a mídia publicamente. O Kivai não solicita login ou senha do usuário.",
            403,
        )
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
        "Não foi possível localizar a mídia pública. O Instagram pode ter limitado o acesso temporariamente.",
        502,
    )

def _select_instagram_video(info: dict[str, Any]) -> dict[str, Any] | None:
    selected = _select_progressive_video(info)
    if selected:
        return selected

    formats = info.get("formats")
    if not isinstance(formats, list):
        return None
    candidates = [
        item for item in formats
        if isinstance(item, dict)
        and isinstance(item.get("url"), str)
        and item["url"].startswith("https://")
        and item.get("vcodec") != "none"
    ]
    if not candidates:
        return None

    # O Instagram expõe video_versions diretas e pode expor DASH separado.
    # Prefira a URL direta: ela é a opção mais segura para
    # preservar áudio + vídeo em um único arquivo no download do Kivai.
    direct_candidates = [
        item for item in candidates
        if not str(item.get("format_id") or "").lower().startswith("dash")
        and item.get("protocol") not in {"http_dash_segments", "m3u8", "m3u8_native"}
    ]
    if not direct_candidates:
        return None
    return max(direct_candidates, key=lambda item: (item.get("height") or 0, item.get("tbr") or 0))


def _extract_instagram_stories_sync(url: str, shortcode: str) -> dict[str, Any]:
    if not instagram_stories_provider.configured():
        return _extract_instagram_story_html_sync(url, shortcode)
    username, _ = _story_url_parts(url)
    try:
        medias = instagram_stories_provider.fetch_stories(url)
    except instagram_stories_provider.StoriesProviderError as exc:
        raise InstagramResolveError(exc.detail, exc.status_code) from exc
    items = []
    for index, raw in enumerate(medias, start=1):
        kind = raw["type"]
        extension = str(raw.get("ext") or ("mp4" if kind == "video" else "jpg")).lower()
        allowed = {"mp4": "video/mp4", "webm": "video/webm", "m4v": "video/mp4"} if kind == "video" else {
            "jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png", "webp": "image/webp", "heic": "image/heic",
        }
        if extension not in allowed:
            raise InstagramResolveError("O formato deste Story não é compatível com o download.", 422)
        media = RemoteMedia(
            url=raw["url"], filename=f"instagram-story-{username}-{index}.{extension}",
            media_type=allowed[extension], kind=kind,
            headers={"Referer": "https://www.instagram.com/"},
            max_bytes=MAX_VIDEO_BYTES if kind == "video" else MAX_IMAGE_BYTES,
        )
        size_mb = raw.get("size_mb")
        size = int(size_mb * 1024 * 1024) if isinstance(size_mb, (int, float)) and 0 < size_mb < 1e6 else None
        if size and size > media.max_bytes:
            raise InstagramResolveError("Um dos Stories ultrapassa o limite de download permitido.", 413)
        items.append({
            "id": f"{username}-{index}", "kind": kind, "filename": media.filename,
            "format": extension.upper(), "width": raw.get("width"), "height": raw.get("height"),
            "duration": None, "size": size, "downloadToken": create_media_token(media),
        })
    return {
        "source": "instagram", "contentType": "story", "shortcode": shortcode,
        "title": f"Stories de @{username}", "author": username,
        "thumbnailToken": None, "items": items, "expiresIn": TOKEN_TTL_SECONDS,
    }


def _extract_instagram_sync(url: str, shortcode: str) -> dict[str, Any]:
    if _is_instagram_story_url(url):
        return _extract_instagram_stories_sync(url, shortcode)

    try:
        import yt_dlp
    except ImportError as exc:
        raise InstagramResolveError("O resolvedor do Instagram ainda não está instalado no servidor.", 503) from exc

    options = {
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
        # Photos have no video formats. Keep their original image candidates,
        # including photo entries inside mixed carousels.
        "ignore_no_formats_error": True,
        "noplaylist": True,
        "format": "best[ext=mp4]/best",
        "http_headers": {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
            "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
        },
        "socket_timeout": 20,
        "retries": 1,
        "extractor_retries": 1,
        "nocheckcertificate": False,
    }
    try:
        with yt_dlp.YoutubeDL(options) as downloader:
            raw_info = downloader.extract_info(url, download=False, process=False)
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
        raise InstagramResolveError("O Instagram não retornou dados de mídia compatíveis.", 422)

    entries = _video_entries(info)
    items: list[dict[str, Any]] = []
    for index, entry in enumerate(entries, start=1):
        selected = _select_instagram_video(entry)

        if selected:
            known_size = selected.get("filesize") or selected.get("filesize_approx")
            if isinstance(known_size, (int, float)) and known_size > MAX_VIDEO_BYTES:
                continue
            extension = str(selected.get("ext") or "mp4").lower()
            if extension not in {"mp4", "m4v", "webm"}:
                extension = "mp4"
            suffix = f"-{index}" if len(entries) > 1 else ""
            prefix = "instagram"
            headers = filter_remote_headers(selected.get("http_headers") or entry.get("http_headers") or {})
            media = RemoteMedia(
                url=str(selected["url"]),
                filename=f"{prefix}-{shortcode}{suffix}.{extension}",
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
            continue

        # A video without a downloadable format must not become its cover photo.
        if not entry.get("formats") and not entry.get("url"):
            image = _largest_image_candidate(entry)
            if image:
                headers = filter_remote_headers(entry.get("http_headers") or info.get("http_headers") or {})
                media = RemoteMedia(
                    url=str(image["url"]),
                    filename=f"instagram-{shortcode}-{index}.jpg",
                    media_type="image/jpeg",
                    kind="image",
                    headers=headers,
                    max_bytes=MAX_IMAGE_BYTES,
                )
                items.append(
                    {
                        "id": f"{shortcode}-{index}",
                        "kind": "image",
                        "filename": media.filename,
                        "format": "JPG",
                        "width": image.get("width"),
                        "height": image.get("height"),
                        "duration": None,
                        "size": None,
                        "downloadToken": create_media_token(media),
                    }
                )

    if not items:
        raise InstagramResolveError(
            "Esta publicação pública não possui uma mídia progressiva compatível com o download nesta versão.",
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

    default_title = "Conteúdo público do Instagram"
    title = str(info.get("title") or info.get("description") or default_title).strip()
    return {
        "source": "instagram",
        "contentType": "publication",
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


TIKTOK_HOSTS = {"tiktok.com", "www.tiktok.com", "m.tiktok.com", "vm.tiktok.com", "vt.tiktok.com"}


def create_tiktok_download_token(source_url: str, video_id: str, *, ttl_seconds: int = TOKEN_TTL_SECONDS) -> str:
    payload = {
        "v": 2,
        "exp": int(time.time()) + ttl_seconds,
        "sourceUrl": source_url,
        "videoId": video_id,
    }
    encoded = base64.urlsafe_b64encode(
        json.dumps(payload, ensure_ascii=True, separators=(",", ":")).encode("utf-8")
    ).rstrip(b"=")
    signature = hmac.new(_TOKEN_SECRET, encoded, hashlib.sha256).digest()
    return f"{encoded.decode('ascii')}.{base64.urlsafe_b64encode(signature).rstrip(b'=').decode('ascii')}"


def read_tiktok_download_token(token: str) -> tuple[str, str]:
    try:
        encoded_text, signature_text = token.split(".", 1)
        encoded = encoded_text.encode("ascii")
        signature = base64.urlsafe_b64decode(signature_text + "=" * (-len(signature_text) % 4))
        expected = hmac.new(_TOKEN_SECRET, encoded, hashlib.sha256).digest()
        if not hmac.compare_digest(signature, expected):
            raise ValueError("invalid-signature")
        payload = json.loads(base64.urlsafe_b64decode(encoded_text + "=" * (-len(encoded_text) % 4)))
        if payload.get("v") != 2 or int(payload["exp"]) < int(time.time()):
            raise ValueError("expired-token")
        source_url = normalize_tiktok_url(str(payload["sourceUrl"]))
        video_id = re.sub(r"[^A-Za-z0-9_-]+", "", str(payload["videoId"]))[:80]
        if not video_id:
            raise ValueError("invalid-video-id")
        return source_url, video_id
    except (KeyError, TypeError, ValueError, json.JSONDecodeError, UnicodeError) as exc:
        raise TikTokResolveError("Este link temporário expirou ou não é válido.", 410) from exc


def _download_tiktok_sync(source_url: str, video_id: str) -> tuple[str, str]:
    try:
        import yt_dlp
    except ImportError as exc:
        raise TikTokResolveError("O resolvedor do TikTok ainda não está instalado no servidor.", 503) from exc

    import tempfile

    temp_dir = tempfile.mkdtemp(prefix="kivai-tiktok-")
    output_template = str(Path(temp_dir) / "tiktok-%(id)s.%(ext)s")
    options = {
        "quiet": True,
        "no_warnings": True,
        "noplaylist": True,
        "format": "best[ext=mp4]/best",
        "outtmpl": output_template,
        "max_filesize": MAX_VIDEO_BYTES,
        "overwrites": True,
        "http_headers": {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
            "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
        },
        "socket_timeout": 30,
        "retries": 2,
        "extractor_retries": 2,
        "nocheckcertificate": False,
    }

    try:
        with yt_dlp.YoutubeDL(options) as downloader:
            info = downloader.extract_info(source_url, download=True)
            if not isinstance(info, dict):
                raise TikTokResolveError("Não foi possível preparar o vídeo para download.", 502)

            requested = info.get("requested_downloads")
            candidate_paths: list[str] = []
            if isinstance(requested, list):
                for item in requested:
                    if isinstance(item, dict) and isinstance(item.get("filepath"), str):
                        candidate_paths.append(item["filepath"])
            prepared = downloader.prepare_filename(info)
            if isinstance(prepared, str):
                candidate_paths.append(prepared)

        files = [Path(path) for path in candidate_paths if Path(path).is_file()]
        if not files:
            files = [path for path in Path(temp_dir).glob("*") if path.is_file()]
        if not files:
            raise TikTokResolveError("Não foi possível preparar o vídeo para download.", 502)

        file_path = max(files, key=lambda path: path.stat().st_size)
        if file_path.stat().st_size > MAX_VIDEO_BYTES:
            raise TikTokResolveError("O vídeo ultrapassa o limite de 200 MB desta ferramenta.", 413)

        final_name = f"tiktok-{video_id}.mp4"
        final_path = Path(temp_dir) / final_name
        if file_path != final_path:
            file_path.replace(final_path)
        return str(final_path), temp_dir
    except yt_dlp.utils.DownloadError as exc:
        import shutil
        shutil.rmtree(temp_dir, ignore_errors=True)
        raise _tiktok_download_error(str(exc)) from exc
    except Exception:
        import shutil
        shutil.rmtree(temp_dir, ignore_errors=True)
        raise


async def prepare_tiktok_download(token: str) -> tuple[str, str]:
    source_url, video_id = read_tiktok_download_token(token)
    try:
        return await asyncio.wait_for(
            asyncio.to_thread(_download_tiktok_sync, source_url, video_id),
            timeout=90,
        )
    except TimeoutError as exc:
        raise TikTokResolveError("O TikTok demorou demais para preparar o vídeo. Tente novamente.", 504) from exc



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


def _tiktok_download_error(message: str) -> TikTokResolveError:
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
        raise _tiktok_download_error(str(exc)) from exc

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

    video_id = str(info.get("id") or "").strip() or hashlib.sha256(url.encode("utf-8")).hexdigest()[:16]
    extension = str(selected.get("ext") or "mp4").lower()
    if extension not in {"mp4", "m4v", "webm"}:
        extension = "mp4"

    media = RemoteMedia(
        url=str(selected["url"]),
        filename=f"tiktok-{video_id}.{extension}",
        media_type=str(selected.get("mime_type") or f"video/{extension}"),
        kind="video",
        headers=filter_remote_headers(selected.get("http_headers") or info.get("http_headers") or {}),
        max_bytes=MAX_VIDEO_BYTES,
    )
    title = str(info.get("title") or info.get("description") or "Vídeo público do TikTok").strip()
    author = str(info.get("uploader") or info.get("creator") or info.get("channel") or "").strip()

    return {
        "source": "tiktok",
        "videoId": video_id,
        "title": title[:240],
        "author": author[:100] or None,
        "items": [{
            "id": video_id,
            "kind": "video",
            "filename": media.filename,
            "format": extension.upper(),
            "width": selected.get("width") or info.get("width"),
            "height": selected.get("height") or info.get("height"),
            "duration": info.get("duration"),
            "size": known_size,
            "downloadToken": create_tiktok_download_token(url, video_id),
        }],
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
