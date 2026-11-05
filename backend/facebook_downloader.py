"""Public Facebook URLs resolved through the configured SaveAPI account."""
import asyncio
import hashlib
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

if __package__:
    from . import saveapi_provider
    from .instagram_downloader import InstagramResolveError, RemoteMedia, MAX_VIDEO_BYTES, TOKEN_TTL_SECONDS, create_media_token
else:
    import saveapi_provider
    from instagram_downloader import InstagramResolveError, RemoteMedia, MAX_VIDEO_BYTES, TOKEN_TTL_SECONDS, create_media_token


def normalize_facebook_url(value: str) -> str:
    try:
        parsed = urlsplit(value.strip())
        host = (parsed.hostname or "").lower()
        allowed = host in {"facebook.com", "www.facebook.com", "m.facebook.com", "web.facebook.com", "mbasic.facebook.com", "fb.watch", "www.fb.watch", "fb.com", "www.fb.com", "fb.me", "www.fb.me"}
        if len(value) > 2048 or parsed.scheme != "https" or not allowed or parsed.username or parsed.password or parsed.port not in (None, 443):
            raise ValueError("invalid-url")
        if parsed.path in {"", "/"}:
            raise ValueError("missing-video")
        # Keep identifiers such as ?v= and story.php?id=&story_fbid=.
        query = urlencode([(key, val) for key, val in parse_qsl(parsed.query, keep_blank_values=True)
                           if not key.startswith("utm_") and key not in {"fbclid", "mibextid"}])
        return urlunsplit(("https", host, parsed.path, query, ""))
    except ValueError as exc:
        raise InstagramResolveError("Cole um link HTTPS válido de um vídeo público do Facebook ou fb.watch.", 422) from exc


def _resolve_facebook(url: str) -> dict:
    try:
        medias = saveapi_provider.fetch_media(url, platform="facebook")
    except saveapi_provider.MediaProviderError as exc:
        raise InstagramResolveError(exc.detail, exc.status_code) from exc
    video_id = hashlib.sha256(url.encode()).hexdigest()[:16]
    items = []
    for index, raw in enumerate(medias, 1):
        if raw["type"] != "video":
            continue
        extension = str(raw.get("ext") or "mp4").lower()
        content_types = {"mp4": "video/mp4", "m4v": "video/mp4", "webm": "video/webm"}
        if extension not in content_types:
            raise InstagramResolveError("O vídeo não está disponível em um formato compatível.", 422)
        size_mb = raw.get("size_mb")
        size = int(size_mb * 1024 * 1024) if isinstance(size_mb, (int, float)) and 0 < size_mb < 1e6 else None
        if size and size > MAX_VIDEO_BYTES:
            raise InstagramResolveError("Este vídeo ultrapassa o limite de 200 MB.", 413)
        media = RemoteMedia(url=raw["url"], filename=f"facebook-{video_id}-{index}.{extension}",
                            media_type=content_types[extension], kind="video", headers={}, max_bytes=MAX_VIDEO_BYTES)
        items.append({"id": f"{video_id}-{index}", "kind": "video", "filename": media.filename,
                      "format": extension.upper(), "width": raw.get("width"), "height": raw.get("height"),
                      "size": size, "downloadToken": create_media_token(media)})
    if not items:
        raise InstagramResolveError("Não encontramos vídeos nesta publicação. Cole o link de um vídeo ou Reel público.", 422)
    return {"source": "facebook", "title": "Vídeos do Facebook", "items": items, "expiresIn": TOKEN_TTL_SECONDS}


async def resolve_facebook_public(value: str) -> dict:
    url = normalize_facebook_url(value)
    try:
        return await asyncio.wait_for(asyncio.to_thread(_resolve_facebook, url), timeout=30)
    except TimeoutError as exc:
        raise InstagramResolveError("O Facebook demorou para responder. Tente novamente.", 504) from exc
