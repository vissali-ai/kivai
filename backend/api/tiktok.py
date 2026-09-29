"""TikTok endpoints preserved from the current production branch."""
import shutil
from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from starlette.background import BackgroundTask
try:
    from ..instagram_downloader import TikTokResolveError, prepare_tiktok_download, resolve_tiktok_public
except ImportError:
    from instagram_downloader import TikTokResolveError, prepare_tiktok_download, resolve_tiktok_public

router = APIRouter()

class TikTokResolveRequest(BaseModel):
    url: str = Field(min_length=1, max_length=2048)
    authorized: bool

@router.post("/tiktok/resolve")
async def tiktok_resolve(payload: TikTokResolveRequest):
    if not payload.authorized:
        raise HTTPException(
            status_code=422,
            detail="Confirme que o conteúdo é seu ou que você possui autorização para baixá-lo.",
        )
    try:
        return await resolve_tiktok_public(payload.url)
    except TikTokResolveError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc

@router.get("/tiktok/media/{token}")
async def tiktok_media(token: str, download: bool = False):
    try:
        file_path, temp_dir = await prepare_tiktok_download(token)
        return FileResponse(
            path=file_path,
            media_type="video/mp4",
            filename=Path(file_path).name,
            headers={
                "Cache-Control": "private, no-store, max-age=0",
                "X-Content-Type-Options": "nosniff",
            },
            background=BackgroundTask(shutil.rmtree, temp_dir, True),
        )
    except TikTokResolveError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc
