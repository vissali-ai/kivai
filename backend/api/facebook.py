"""Facebook resolve route and the existing signed-media streaming transport."""
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from .instagram import instagram_media

if __package__.startswith("backend."):
    from ..facebook_downloader import resolve_facebook_public
    from ..instagram_downloader import InstagramResolveError, read_media_token
else:
    from facebook_downloader import resolve_facebook_public
    from instagram_downloader import InstagramResolveError, read_media_token

router = APIRouter()


class FacebookResolveRequest(BaseModel):
    url: str = Field(min_length=1, max_length=2048)


@router.post("/facebook/resolve")
async def facebook_resolve(payload: FacebookResolveRequest):
    try:
        return await resolve_facebook_public(payload.url)
    except InstagramResolveError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc


@router.get("/facebook/media/{token}")
async def facebook_media(token: str, request: Request, download: bool = False):
    try:
        media = read_media_token(token)
        if not media.filename.startswith("facebook-") or media.kind != "video":
            raise InstagramResolveError("Este link não pertence a um vídeo do Facebook.", 410)
    except InstagramResolveError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc
    return await instagram_media(token, request, download)
