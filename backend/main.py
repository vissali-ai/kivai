"""ASGI entry point, compatible with Railway's `uvicorn main:app`."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

if __package__:
    from .api import tiktok, background, html_pdf, instagram, pdf, video_compress, video_hevc, video_mov_mp4, video_mp4_avi, video_mp4_mov
    from .api.video_common import detailed_video_metadata  # Compatibility for existing callers.
else:
    from api import tiktok, background, html_pdf, instagram, pdf, video_compress, video_hevc, video_mov_mp4, video_mp4_avi, video_mp4_mov
    from api.video_common import detailed_video_metadata

app = FastAPI(
    title="Kivai Backend",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://kivai.com.br",
        "https://www.kivai.com.br",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-PDF-Page-Count", "X-Video-Duration", "X-Video-Width", "X-Video-Height", "X-Video-FPS", "X-Video-Original-Size", "X-Video-Compressed-Size", "X-Video-Codec", "X-Audio-Codec", "X-Conversion-Strategy", "Content-Disposition", "Content-Length", "Content-Range", "Accept-Ranges"],
)

@app.get("/")
def raiz():
    return {
        "status": "online",
        "servico": "Kivai Backend",
    }

@app.get("/health")
def health():
    return {
        "status": "ok",
        "device": str(background.device),
    }

for route_module in (
    instagram, tiktok, pdf, video_compress, video_mp4_mov, video_mp4_avi,
    video_mov_mp4, video_hevc, html_pdf, background,
):
    app.include_router(route_module.router)
