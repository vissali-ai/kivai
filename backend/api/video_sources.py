"""Platform detection and authorized media resolution for the video summarizer.

This adapter deliberately distinguishes URL recognition from media availability.
It reuses existing platform extractors and never attempts authenticated/private access.
"""
from __future__ import annotations

from urllib.parse import urlsplit

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

try:
    from .instagram import instagram_resolve
    from .facebook import facebook_resolve
    from .tiktok import tiktok_resolve
    from ..instagram_downloader import InstagramResolveError
    from .tiktok import TikTokResolveRequest
    from .facebook import FacebookResolveRequest
    from .instagram import InstagramResolveRequest
except ImportError:
    from api.instagram import instagram_resolve
    from api.facebook import facebook_resolve
    from api.tiktok import tiktok_resolve
    from instagram_downloader import InstagramResolveError
    from api.tiktok import TikTokResolveRequest
    from api.facebook import FacebookResolveRequest
    from api.instagram import InstagramResolveRequest

router = APIRouter()


class VideoSourceRequest(BaseModel):
    url: str = Field(min_length=8, max_length=2048)
    authorized: bool = False


YOUTUBE_HOSTS = {"youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"}
INSTAGRAM_HOSTS = {"instagram.com", "www.instagram.com", "m.instagram.com"}
FACEBOOK_HOSTS = {
    "facebook.com", "www.facebook.com", "m.facebook.com", "web.facebook.com",
    "mbasic.facebook.com", "fb.watch", "www.fb.watch", "fb.com", "www.fb.com",
    "fb.me", "www.fb.me",
}
TIKTOK_HOSTS = {"tiktok.com", "www.tiktok.com", "m.tiktok.com", "vm.tiktok.com", "vt.tiktok.com"}
VIMEO_HOSTS = {"vimeo.com", "www.vimeo.com", "player.vimeo.com"}
VIDEO_EXTENSIONS = {".mp4", ".mov", ".m4v", ".webm", ".mkv", ".avi", ".mpeg", ".mpg"}


def detect_video_source(value: str) -> dict[str, str]:
    raw = value.strip()
    if len(raw) > 2048:
        raise ValueError("O link informado é muito longo.")
    try:
        parsed = urlsplit(raw)
        host = (parsed.hostname or "").lower().rstrip(".")
    except ValueError as exc:
        raise ValueError("Cole um endereço HTTPS válido.") from exc
    if parsed.scheme != "https" or not host or parsed.username or parsed.password:
        raise ValueError("Cole um endereço HTTPS válido.")
    if parsed.port not in (None, 443):
        raise ValueError("O link utiliza uma porta não permitida.")

    if host in YOUTUBE_HOSTS:
        source = "youtube"
        capability = "summary"
    elif host in INSTAGRAM_HOSTS:
        source = "instagram"
        capability = "resolve"
    elif host in FACEBOOK_HOSTS:
        source = "facebook"
        capability = "resolve"
    elif host in TIKTOK_HOSTS:
        source = "tiktok"
        capability = "resolve"
    elif host in VIMEO_HOSTS:
        source = "vimeo"
        capability = "not_available"
    elif any(parsed.path.lower().split("?", 1)[0].endswith(ext) for ext in VIDEO_EXTENSIONS):
        source = "direct"
        capability = "not_validated"
    else:
        source = "unknown"
        capability = "not_supported"

    return {
        "source": source,
        "capability": capability,
        "url": raw,
    }


@router.post("/video/source/resolve")
async def resolve_video_source(payload: VideoSourceRequest):
    """Detect source and resolve media only for existing public-source adapters."""
    try:
        detected = detect_video_source(payload.url)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    source = detected["source"]
    if source == "youtube":
        return {**detected, "status": "ready", "message": "Link do YouTube identificado. Use o fluxo de resumo já existente."}

    if source in {"instagram", "facebook", "tiktok"} and not payload.authorized:
        raise HTTPException(
            status_code=422,
            detail="Confirme que o conteúdo é seu ou que você possui autorização para analisá-lo.",
        )

    try:
        if source == "instagram":
            media = await instagram_resolve(InstagramResolveRequest(url=payload.url, authorized=True))
        elif source == "facebook":
            media = await facebook_resolve(FacebookResolveRequest(url=payload.url))
        elif source == "tiktok":
            media = await tiktok_resolve(TikTokResolveRequest(url=payload.url, authorized=True))
        elif source == "vimeo":
            return {
                **detected,
                "status": "unsupported",
                "message": "A integração com Vimeo ainda não está disponível. Envie um arquivo de vídeo que você tenha direito de utilizar.",
            }
        elif source == "direct":
            return {
                **detected,
                "status": "pending_validation",
                "message": "O link parece apontar para um arquivo de vídeo, mas a origem e o arquivo ainda precisam ser validados.",
            }
        else:
            return {
                **detected,
                "status": "unsupported",
                "message": "Esta origem ainda não possui integração compatível. Envie o arquivo de vídeo diretamente.",
            }
        return {**detected, "status": "media_resolved", "media": media}
    except InstagramResolveError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc
