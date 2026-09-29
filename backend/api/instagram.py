"""Instagram endpoints and helpers."""

from fastapi import HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

try:
    from ..instagram_downloader import (
        InstagramResolveError,
        open_remote_media,
        read_media_token,
        resolve_instagram_public,
    )
except ImportError:
    from instagram_downloader import (
        InstagramResolveError,
        open_remote_media,
        read_media_token,
        resolve_instagram_public,
    )

from fastapi import APIRouter


router = APIRouter()

class InstagramResolveRequest(BaseModel):
    url: str = Field(min_length=1, max_length=2048)
    authorized: bool

@router.post("/instagram/resolve")
async def instagram_resolve(payload: InstagramResolveRequest):
    if not payload.authorized:
        raise HTTPException(
            status_code=422,
            detail="Confirme que o conteúdo é seu ou que você possui autorização para baixá-lo.",
        )
    try:
        return await resolve_instagram_public(payload.url)
    except InstagramResolveError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc

@router.get("/instagram/media/{token}")
async def instagram_media(token: str, request: Request, download: bool = False):
    try:
        media = read_media_token(token)
        client, upstream = await open_remote_media(
            media,
            range_header=request.headers.get("range") if not download else None,
        )
        upstream_type = upstream.headers.get("content-type", "").split(";", 1)[0].lower()
        allowed_type = (
            upstream_type.startswith("video/")
            if media.kind == "video"
            else upstream_type.startswith("image/")
        )
        if not allowed_type and upstream_type != "application/octet-stream":
            await upstream.aclose()
            await client.aclose()
            raise InstagramResolveError("O servidor de origem não retornou uma mídia válida.", 502)

        async def stream():
            transferred = 0
            try:
                async for chunk in upstream.aiter_bytes():
                    transferred += len(chunk)
                    if transferred > media.max_bytes:
                        return
                    yield chunk
            finally:
                await upstream.aclose()
                await client.aclose()

        disposition = "attachment" if download else "inline"
        headers = {
            "Cache-Control": "private, no-store, max-age=0",
            "Content-Disposition": f'{disposition}; filename="{media.filename}"',
            "X-Content-Type-Options": "nosniff",
        }
        for name in ("content-length", "content-range", "accept-ranges"):
            if value := upstream.headers.get(name):
                headers[name.title()] = value
        return StreamingResponse(
            stream(),
            status_code=upstream.status_code,
            media_type=upstream_type or media.media_type,
            headers=headers,
        )
    except InstagramResolveError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc
