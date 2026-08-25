import asyncio
import io
import os
import re
import shutil
import tempfile

import bleach
from bleach.css_sanitizer import CSSSanitizer
from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response, StreamingResponse
from PIL import Image, UnidentifiedImageError
from pydantic import BaseModel, Field
from playwright.async_api import async_playwright
from pypdf import PdfReader, PdfWriter
from pypdf.errors import PdfReadError
from starlette.background import BackgroundTask

try:
    from .instagram_downloader import (
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

device = "cpu"

PDF_UNLOCK_MAX_FILE_SIZE = 25 * 1024 * 1024
PDF_UNLOCK_MAX_PAGES = 100
VIDEO_CONVERT_MAX_FILE_SIZE = 200 * 1024 * 1024
VIDEO_COMPRESS_MAX_DURATION = 2 * 60 * 60
VIDEO_COMPRESS_MAX_DIMENSION = 3840
VIDEO_COMPRESS_EXTENSIONS = {"mp4", "mov", "webm", "avi", "mkv", "mpeg", "mpg"}
VIDEO_COMPRESS_FORMATS = {"mov", "mp4", "matroska", "webm", "avi", "mpeg"}
MOV_COPY_VIDEO_CODECS = {"h264", "hevc", "mpeg4", "prores", "mjpeg"}
MOV_COPY_AUDIO_CODECS = {"aac", "alac", "mp3", "ac3", "eac3", "pcm_s16le", "pcm_s24le"}
AVI_COPY_VIDEO_CODECS = {"mpeg4"}
AVI_COPY_AUDIO_CODECS = {"mp3"}
MP4_COPY_VIDEO_CODECS = {"h264", "hevc", "mpeg4", "av1"}
MP4_COPY_AUDIO_CODECS = {"aac", "mp3"}

VIDEO_COMPRESS_MODES = {
    "light": {"crf": 20, "factor": 1.0},
    "balanced": {"crf": 25, "factor": 0.72},
    "maximum": {"crf": 30, "factor": 0.48},
}
VIDEO_COMPRESS_PRESETS = {
    "custom": {},
    "whatsapp": {"mode": "maximum", "height": 720, "audio": "reduce", "audio_kbps": 96},
    "email": {"mode": "maximum", "height": 480, "audio": "reduce", "audio_kbps": 64},
    "social": {"mode": "balanced", "height": 1080, "audio": "keep", "audio_kbps": 128},
    "site": {"mode": "maximum", "height": 720, "audio": "reduce", "audio_kbps": 96},
    "quality": {"mode": "light", "height": None, "audio": "keep", "audio_kbps": 128},
}


class InstagramResolveRequest(BaseModel):
    url: str = Field(min_length=1, max_length=2048)
    authorized: bool


model = None

def get_background_model():
    global model
    if model is None:
        import torch
        from ben2 import BEN_Base

        print("Carregando motor de remoção de fundo...")
        model = BEN_Base.from_pretrained("PramaLLC/BEN2")
        model.to(torch.device(device)).eval()
        print("Motor carregado com sucesso.")
    return model


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
        "device": str(device),
    }


@app.post("/instagram/resolve")
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


@app.get("/instagram/media/{token}")
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


async def read_valid_pdf(file: UploadFile) -> bytes:
    if file.content_type not in {"application/pdf", "application/octet-stream"}:
        raise HTTPException(status_code=415, detail="Selecione um arquivo no formato PDF.")
    content = await file.read(PDF_UNLOCK_MAX_FILE_SIZE + 1)
    if len(content) > PDF_UNLOCK_MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="O arquivo ultrapassa o limite permitido.")
    if not content.startswith(b"%PDF-"):
        raise HTTPException(status_code=415, detail="Selecione um arquivo no formato PDF.")
    return content


@app.post("/pdf-unlock/inspect")
async def inspect_pdf_unlock(file: UploadFile = File(...)):
    content = await read_valid_pdf(file)
    try:
        reader = PdfReader(io.BytesIO(content), strict=False)
        if not reader.is_encrypted:
            page_count = len(reader.pages)
            if page_count > PDF_UNLOCK_MAX_PAGES:
                raise HTTPException(status_code=413, detail="O PDF ultrapassa o limite de 100 páginas.")
            return {"protection": "none", "passwordRequired": False, "pageCount": page_count}

        empty_password_result = reader.decrypt("")
        if empty_password_result:
            page_count = len(reader.pages)
            if page_count > PDF_UNLOCK_MAX_PAGES:
                raise HTTPException(status_code=413, detail="O PDF ultrapassa o limite de 100 páginas.")
            return {"protection": "restrictions", "passwordRequired": False, "pageCount": page_count}

        return {"protection": "password", "passwordRequired": True, "pageCount": None}
    except HTTPException:
        raise
    except (PdfReadError, ValueError, TypeError):
        raise HTTPException(status_code=422, detail="Não foi possível abrir este PDF. Verifique o arquivo e tente novamente.")
    except Exception:
        raise HTTPException(status_code=422, detail="Este tipo de proteção ainda não é compatível com a ferramenta.")


@app.post("/pdf-unlock")
async def unlock_pdf(file: UploadFile = File(...), password: str = Form(default="", max_length=256)):
    content = await read_valid_pdf(file)
    try:
        reader = PdfReader(io.BytesIO(content), strict=False)
        if not reader.is_encrypted:
            raise HTTPException(status_code=409, detail="Este PDF já pode ser aberto sem senha.")

        decrypt_result = reader.decrypt(password)
        if not decrypt_result:
            if not password:
                raise HTTPException(status_code=422, detail="Este PDF exige uma senha para ser desbloqueado.")
            raise HTTPException(status_code=401, detail="A senha informada não corresponde a este PDF. Verifique e tente novamente.")

        page_count = len(reader.pages)
        if page_count > PDF_UNLOCK_MAX_PAGES:
            raise HTTPException(status_code=413, detail="O PDF ultrapassa o limite de 100 páginas.")

        writer = PdfWriter()
        writer.clone_document_from_reader(reader)
        output = io.BytesIO()
        writer.write(output)
        unlocked = output.getvalue()
        verification = PdfReader(io.BytesIO(unlocked), strict=False)
        if verification.is_encrypted or len(verification.pages) != page_count:
            raise RuntimeError("unlock-verification-failed")

        return Response(
            content=unlocked,
            media_type="application/pdf",
            headers={
                "Content-Disposition": 'attachment; filename="documento-desbloqueado.pdf"',
                "Cache-Control": "no-store",
                "X-PDF-Page-Count": str(page_count),
            },
        )
    except HTTPException:
        raise
    except (PdfReadError, ValueError, TypeError):
        raise HTTPException(status_code=422, detail="Não foi possível abrir este PDF. Verifique o arquivo e tente novamente.")
    except Exception:
        raise HTTPException(status_code=500, detail="Não foi possível desbloquear este PDF. Verifique a senha e tente novamente.")


async def run_ffmpeg(*args: str, timeout: int) -> tuple[int, bytes, bytes]:
    process = await asyncio.create_subprocess_exec(
        *args, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
    )
    try:
        stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=timeout)
        return process.returncode or 0, stdout, stderr
    except TimeoutError:
        process.kill()
        await process.communicate()
        raise


def video_metadata(probe_text: str) -> tuple[str | None, float | None, int | None, int | None, bool]:
    video = re.search(r"Video:\s*([^,\s]+).*?(\d{2,5})x(\d{2,5})", probe_text, flags=re.I)
    duration = re.search(r"Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)", probe_text, flags=re.I)
    seconds = None
    if duration:
        seconds = int(duration.group(1)) * 3600 + int(duration.group(2)) * 60 + float(duration.group(3))
    return (
        video.group(1).lower() if video else None,
        seconds,
        int(video.group(2)) if video else None,
        int(video.group(3)) if video else None,
        bool(re.search(r"Audio:\s*", probe_text, flags=re.I)),
    )


def detailed_video_metadata(probe_text: str) -> dict:
    codec, duration, width, height, has_audio = video_metadata(probe_text)
    input_format = re.search(r"Input #0,\s*([^,\s]+(?:,[^,\s]+)*)", probe_text, flags=re.I)
    audio = re.search(r"Audio:\s*([^,\s]+)", probe_text, flags=re.I)
    fps = re.search(r"(?:,|\s)(\d+(?:\.\d+)?)\s*fps(?:,|\s)", probe_text, flags=re.I)
    formats = set(input_format.group(1).lower().split(",")) if input_format else set()
    return {
        "format": next((item for item in ("mp4", "mov", "webm", "matroska", "avi", "mpeg") if item in formats), None),
        "formats": sorted(formats),
        "duration": duration,
        "width": width,
        "height": height,
        "videoCodec": codec,
        "audioCodec": audio.group(1).lower() if audio else None,
        "hasAudio": has_audio,
        "fps": float(fps.group(1)) if fps else None,
    }


async def save_video_upload(file: UploadFile, workdir: str) -> tuple[str, int]:
    extension = (file.filename or "").rsplit(".", 1)[-1].lower()
    if extension not in VIDEO_COMPRESS_EXTENSIONS:
        raise HTTPException(status_code=415, detail="Este formato de vÃ­deo ainda nÃ£o Ã© compatÃ­vel.")
    if file.content_type and not (file.content_type.startswith("video/") or file.content_type == "application/octet-stream"):
        raise HTTPException(status_code=415, detail="Selecione um arquivo de vÃ­deo vÃ¡lido.")
    input_path = os.path.join(workdir, f"entrada.{extension}")
    total = 0
    with open(input_path, "wb") as destination:
        while chunk := await file.read(1024 * 1024):
            total += len(chunk)
            if total > VIDEO_CONVERT_MAX_FILE_SIZE:
                raise HTTPException(status_code=413, detail="O vÃ­deo ultrapassa o limite permitido.")
            destination.write(chunk)
    if total == 0:
        raise HTTPException(status_code=422, detail="Selecione um arquivo de vÃ­deo vÃ¡lido.")
    return input_path, total


async def probe_video_file(ffmpeg: str, input_path: str) -> dict:
    _, _, probe_error = await run_ffmpeg(ffmpeg, "-hide_banner", "-i", input_path, timeout=30)
    metadata = detailed_video_metadata(probe_error.decode("utf-8", errors="replace"))
    if not metadata["format"] or metadata["format"] not in VIDEO_COMPRESS_FORMATS:
        raise HTTPException(status_code=415, detail="Este formato de vÃ­deo ainda nÃ£o Ã© compatÃ­vel.")
    if not metadata["videoCodec"] or not metadata["width"] or not metadata["height"] or not metadata["duration"]:
        raise HTTPException(status_code=422, detail="O codec deste vÃ­deo nÃ£o pÃ´de ser processado.")
    if metadata["duration"] > VIDEO_COMPRESS_MAX_DURATION:
        raise HTTPException(status_code=413, detail="O vÃ­deo ultrapassa o limite de duraÃ§Ã£o permitido.")
    if max(metadata["width"], metadata["height"]) > VIDEO_COMPRESS_MAX_DIMENSION:
        raise HTTPException(status_code=413, detail="A resoluÃ§Ã£o deste vÃ­deo ultrapassa o limite de 4K.")
    return metadata


async def save_mp4_upload(file: UploadFile, workdir: str) -> tuple[str, int]:
    extension = (file.filename or "").rsplit(".", 1)[-1].lower()
    if extension != "mp4":
        raise HTTPException(status_code=415, detail="Selecione um arquivo MP4 válido.")
    if file.content_type and file.content_type not in {"video/mp4", "application/mp4", "application/octet-stream"}:
        raise HTTPException(status_code=415, detail="Selecione um arquivo MP4 válido.")
    input_path = os.path.join(workdir, "entrada.mp4")
    total = 0
    with open(input_path, "wb") as destination:
        while chunk := await file.read(1024 * 1024):
            total += len(chunk)
            if total > VIDEO_CONVERT_MAX_FILE_SIZE:
                raise HTTPException(status_code=413, detail="O vídeo ultrapassa o limite permitido.")
            destination.write(chunk)
    if total == 0:
        raise HTTPException(status_code=422, detail="Selecione um arquivo MP4 válido.")
    return input_path, total


async def probe_mp4_file(ffmpeg: str, input_path: str) -> dict:
    metadata = await probe_video_file(ffmpeg, input_path)
    if metadata["format"] != "mp4":
        raise HTTPException(status_code=415, detail="Selecione um arquivo MP4 válido.")
    return metadata


def can_remux_mp4_to_mov(metadata: dict) -> bool:
    video_compatible = metadata["videoCodec"] in MOV_COPY_VIDEO_CODECS
    audio_compatible = not metadata["hasAudio"] or metadata["audioCodec"] in MOV_COPY_AUDIO_CODECS
    return video_compatible and audio_compatible


def can_remux_mp4_to_avi(metadata: dict) -> bool:
    video_compatible = metadata["videoCodec"] in AVI_COPY_VIDEO_CODECS
    audio_compatible = not metadata["hasAudio"] or metadata["audioCodec"] in AVI_COPY_AUDIO_CODECS
    return video_compatible and audio_compatible


async def save_mov_upload(file: UploadFile, workdir: str) -> tuple[str, int]:
    extension = (file.filename or "").rsplit(".", 1)[-1].lower()
    if extension != "mov":
        raise HTTPException(status_code=415, detail="Selecione um arquivo MOV válido.")
    if file.content_type and file.content_type not in {
        "video/quicktime", "video/x-quicktime", "video/mov", "application/octet-stream"
    }:
        raise HTTPException(status_code=415, detail="Selecione um arquivo MOV válido.")
    input_path = os.path.join(workdir, "entrada.mov")
    total = 0
    with open(input_path, "wb") as destination:
        while chunk := await file.read(1024 * 1024):
            total += len(chunk)
            if total > VIDEO_CONVERT_MAX_FILE_SIZE:
                raise HTTPException(status_code=413, detail="O vídeo ultrapassa o limite permitido.")
            destination.write(chunk)
    if total == 0:
        raise HTTPException(status_code=422, detail="Selecione um arquivo MOV válido.")
    return input_path, total


async def probe_mov_file(ffmpeg: str, input_path: str) -> dict:
    metadata = await probe_video_file(ffmpeg, input_path)
    with open(input_path, "rb") as source:
        header = source.read(64)
    if "mov" not in metadata.get("formats", []) or b"ftypqt  " not in header:
        raise HTTPException(status_code=415, detail="Selecione um arquivo MOV válido.")
    return metadata


def can_remux_mov_to_mp4(metadata: dict) -> bool:
    video_compatible = metadata["videoCodec"] in MP4_COPY_VIDEO_CODECS
    audio_compatible = not metadata["hasAudio"] or metadata["audioCodec"] in MP4_COPY_AUDIO_CODECS
    return video_compatible and audio_compatible


async def run_ffmpeg_cancellable(request: Request, *args: str, timeout: int) -> tuple[int, bytes, bytes]:
    process = await asyncio.create_subprocess_exec(
        *args, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
    )
    communicate = asyncio.create_task(process.communicate())
    elapsed = 0.0
    try:
        while not communicate.done():
            if await request.is_disconnected():
                process.kill()
                await communicate
                raise asyncio.CancelledError
            if elapsed >= timeout:
                process.kill()
                await communicate
                raise TimeoutError
            await asyncio.sleep(0.5)
            elapsed += 0.5
        stdout, stderr = await communicate
        return process.returncode or 0, stdout, stderr
    except BaseException:
        if process.returncode is None:
            process.kill()
        if not communicate.done():
            await communicate
        raise


@app.post("/video/compress/inspect")
async def inspect_video_for_compression(file: UploadFile = File(...)):
    workdir = tempfile.mkdtemp(prefix="kivai-video-inspect-")
    try:
        input_path, size = await save_video_upload(file, workdir)
        from imageio_ffmpeg import get_ffmpeg_exe

        metadata = await probe_video_file(get_ffmpeg_exe(), input_path)
        metadata["format"] = (file.filename or "video").rsplit(".", 1)[-1].lower()
        return {**metadata, "size": size}
    except HTTPException:
        raise
    except Exception as error:
        print(f"Erro ao analisar vÃ­deo: {type(error).__name__}")
        raise HTTPException(status_code=422, detail="O codec deste vÃ­deo nÃ£o pÃ´de ser processado.")
    finally:
        shutil.rmtree(workdir, ignore_errors=True)


@app.post("/video/compress")
async def compress_video(
    request: Request,
    file: UploadFile = File(...),
    mode: str = Form(default="balanced"),
    preset: str = Form(default="custom"),
    resolution: str = Form(default="auto"),
    fps: str = Form(default="original"),
    bitrate: str = Form(default="auto"),
    custom_bitrate: int = Form(default=2500),
    codec: str = Form(default="h264"),
    audio: str = Form(default="keep"),
    audio_bitrate: int = Form(default=128),
    target_mb: float | None = Form(default=None),
):
    if mode not in VIDEO_COMPRESS_MODES or preset not in VIDEO_COMPRESS_PRESETS:
        raise HTTPException(status_code=400, detail="ConfiguraÃ§Ã£o de compressÃ£o invÃ¡lida.")
    if resolution not in {"auto", "original", "2160", "1080", "720", "480", "360"}:
        raise HTTPException(status_code=400, detail="ResoluÃ§Ã£o invÃ¡lida.")
    if fps not in {"original", "60", "30", "24"} or bitrate not in {"auto", "low", "medium", "high", "custom"}:
        raise HTTPException(status_code=400, detail="ConfiguraÃ§Ã£o avanÃ§ada invÃ¡lida.")
    if codec not in {"h264", "hevc"} or audio not in {"keep", "reduce", "remove"}:
        raise HTTPException(status_code=400, detail="ConfiguraÃ§Ã£o de codec ou Ã¡udio invÃ¡lida.")
    if not 150 <= custom_bitrate <= 50_000 or audio_bitrate not in {64, 96, 128, 192}:
        raise HTTPException(status_code=400, detail="Bitrate invÃ¡lido.")
    if target_mb is not None and not 1 <= target_mb <= 200:
        raise HTTPException(status_code=400, detail="O tamanho desejado deve estar entre 1 e 200 MB.")

    workdir = tempfile.mkdtemp(prefix="kivai-video-compress-")
    output_path = os.path.join(workdir, "video-comprimido.mp4")
    try:
        input_path, original_size = await save_video_upload(file, workdir)
        from imageio_ffmpeg import get_ffmpeg_exe

        ffmpeg = get_ffmpeg_exe()
        metadata = await probe_video_file(ffmpeg, input_path)
        preset_values = VIDEO_COMPRESS_PRESETS[preset]
        effective_mode = preset_values.get("mode", mode)
        effective_audio = preset_values.get("audio", audio)
        effective_audio_kbps = int(preset_values.get("audio_kbps", audio_bitrate))
        requested_height = preset_values.get("height") if preset != "custom" else None
        if requested_height is None and resolution not in {"auto", "original"}:
            requested_height = int(resolution)
        if resolution == "auto" and preset == "custom":
            requested_height = {"light": None, "balanced": 1080, "maximum": 720}[effective_mode]
        final_height = min(metadata["height"], requested_height) if requested_height else metadata["height"]
        final_width = round(metadata["width"] * final_height / metadata["height"] / 2) * 2
        final_height = round(final_height / 2) * 2
        target_fps = min(float(fps), metadata["fps"]) if fps != "original" and metadata["fps"] else None

        audio_kbps = 0 if effective_audio == "remove" or not metadata["hasAudio"] else effective_audio_kbps
        mode_values = VIDEO_COMPRESS_MODES[effective_mode]
        height_rates = {2160: 10_000, 1080: 4_500, 720: 2_500, 480: 1_100, 360: 650}
        nearest_height = min(height_rates, key=lambda item: abs(item - final_height))
        auto_video_kbps = int(height_rates[nearest_height] * mode_values["factor"])
        selected_video_kbps = {
            "low": int(auto_video_kbps * 0.65), "medium": auto_video_kbps,
            "high": int(auto_video_kbps * 1.35), "custom": custom_bitrate,
        }.get(bitrate, auto_video_kbps)
        if target_mb is not None:
            total_kbps = int(target_mb * 8192 / metadata["duration"] * 0.97)
            source_total_kbps = int(original_size * 8 / metadata["duration"] / 1000)
            selected_video_kbps = min(50_000, max(150, total_kbps - audio_kbps), max(150, int(source_total_kbps * 0.95) - audio_kbps))

        command = [ffmpeg, "-hide_banner", "-loglevel", "error", "-y", "-i", input_path, "-map", "0:v:0"]
        if effective_audio != "remove":
            command.extend(["-map", "0:a?"])
        filters = []
        if final_width != metadata["width"] or final_height != metadata["height"]:
            filters.append(f"scale={final_width}:{final_height}:flags=lanczos")
        if target_fps and target_fps < metadata["fps"]:
            filters.append(f"fps={target_fps:g}")
        if filters:
            command.extend(["-vf", ",".join(filters)])
        encoder = "libx264" if codec == "h264" else "libx265"
        command.extend(["-c:v", encoder, "-preset", "medium", "-pix_fmt", "yuv420p"])
        if codec == "hevc":
            command.extend(["-tag:v", "hvc1"])
        if target_mb is not None or bitrate != "auto":
            command.extend(["-b:v", f"{selected_video_kbps}k", "-maxrate", f"{int(selected_video_kbps * 1.25)}k", "-bufsize", f"{selected_video_kbps * 2}k"])
        else:
            command.extend(["-crf", str(mode_values["crf"])])
        if effective_audio == "remove":
            command.append("-an")
        elif metadata["hasAudio"]:
            command.extend(["-c:a", "aac", "-b:a", f"{audio_kbps}k"])
        command.extend(["-movflags", "+faststart", output_path])

        returncode, _, conversion_error = await run_ffmpeg_cancellable(request, *command, timeout=1800)
        if returncode != 0 or not os.path.exists(output_path) or os.path.getsize(output_path) == 0:
            raise RuntimeError(conversion_error.decode("utf-8", errors="replace")[-1000:])
        verification_code, _, verification_error = await run_ffmpeg(
            ffmpeg, "-v", "error", "-i", output_path, "-f", "null", "-", timeout=180
        )
        if verification_code != 0:
            raise RuntimeError(verification_error.decode("utf-8", errors="replace")[-1000:])
        compressed_size = os.path.getsize(output_path)
        return FileResponse(
            output_path,
            media_type="video/mp4",
            filename="video-comprimido.mp4",
            headers={
                "Cache-Control": "no-store", "X-Video-Duration": f"{metadata['duration']:.3f}",
                "X-Video-Width": str(final_width), "X-Video-Height": str(final_height),
                "X-Video-Original-Size": str(original_size), "X-Video-Compressed-Size": str(compressed_size),
                "X-Video-Codec": "h264" if codec == "h264" else "hevc",
            },
            background=BackgroundTask(shutil.rmtree, workdir, True),
        )
    except asyncio.CancelledError:
        shutil.rmtree(workdir, ignore_errors=True)
        raise HTTPException(status_code=499, detail="A compressÃ£o foi cancelada.")
    except HTTPException:
        shutil.rmtree(workdir, ignore_errors=True)
        raise
    except TimeoutError:
        shutil.rmtree(workdir, ignore_errors=True)
        raise HTTPException(status_code=408, detail="A compressÃ£o demorou mais do que o limite permitido. Tente reduzir a resoluÃ§Ã£o.")
    except MemoryError:
        shutil.rmtree(workdir, ignore_errors=True)
        raise HTTPException(status_code=507, detail="Este vÃ­deo exige mais memÃ³ria do que o dispositivo pode disponibilizar. Tente reduzir o tamanho do arquivo ou utilizar outro dispositivo.")
    except Exception as error:
        print(f"Erro ao comprimir vÃ­deo: {type(error).__name__}")
        shutil.rmtree(workdir, ignore_errors=True)
        raise HTTPException(status_code=500, detail="NÃ£o foi possÃ­vel comprimir este vÃ­deo. Tente novamente com outro arquivo ou configuraÃ§Ã£o.")


@app.post("/video/mp4-to-mov/inspect")
async def inspect_mp4_to_mov(file: UploadFile = File(...)):
    workdir = tempfile.mkdtemp(prefix="kivai-mp4-mov-inspect-")
    try:
        input_path, size = await save_mp4_upload(file, workdir)
        from imageio_ffmpeg import get_ffmpeg_exe

        metadata = await probe_mp4_file(get_ffmpeg_exe(), input_path)
        return {
            **metadata,
            "size": size,
            "strategy": "remux" if can_remux_mp4_to_mov(metadata) else "transcode",
        }
    except HTTPException:
        raise
    except TimeoutError:
        raise HTTPException(status_code=408, detail="A análise demorou mais do que o limite permitido. Tente utilizar um arquivo menor.")
    except Exception as error:
        print(f"Erro ao analisar MP4 para MOV: {type(error).__name__}")
        raise HTTPException(status_code=422, detail="Não foi possível ler este vídeo. Verifique o arquivo e tente novamente.")
    finally:
        shutil.rmtree(workdir, ignore_errors=True)


@app.post("/video/mp4-to-mov")
async def mp4_to_mov(
    request: Request,
    file: UploadFile = File(...),
    quality: str = Form(default="auto"),
    resolution: str = Form(default="original"),
    fps: str = Form(default="original"),
):
    if quality not in {"auto", "high", "small"}:
        raise HTTPException(status_code=400, detail="Configuração de qualidade inválida.")
    if resolution not in {"original", "2160", "1080", "720", "480"}:
        raise HTTPException(status_code=400, detail="Resolução inválida.")
    if fps not in {"original", "60", "30", "24"}:
        raise HTTPException(status_code=400, detail="Configuração de FPS inválida.")

    workdir = tempfile.mkdtemp(prefix="kivai-mp4-mov-")
    output_path = os.path.join(workdir, "video-convertido.mov")
    try:
        input_path, original_size = await save_mp4_upload(file, workdir)
        from imageio_ffmpeg import get_ffmpeg_exe

        ffmpeg = get_ffmpeg_exe()
        metadata = await probe_mp4_file(ffmpeg, input_path)
        use_remux = quality == "auto" and resolution == "original" and fps == "original" and can_remux_mp4_to_mov(metadata)
        command = [
            ffmpeg, "-hide_banner", "-loglevel", "error", "-y", "-i", input_path,
            "-map", "0:v:0", "-map", "0:a?", "-map_metadata", "0",
        ]

        final_width = metadata["width"]
        final_height = metadata["height"]
        final_fps = metadata["fps"]
        output_video_codec = metadata["videoCodec"]
        output_audio_codec = metadata["audioCodec"] if metadata["hasAudio"] else None

        if use_remux:
            command.extend(["-c", "copy"])
        else:
            requested_height = metadata["height"] if resolution == "original" else min(metadata["height"], int(resolution))
            final_height = max(2, round(requested_height / 2) * 2)
            final_width = max(2, round(metadata["width"] * final_height / metadata["height"] / 2) * 2)
            filters = []
            if final_width != metadata["width"] or final_height != metadata["height"]:
                filters.append(f"scale={final_width}:{final_height}:flags=lanczos")
            if fps != "original" and metadata["fps"]:
                requested_fps = float(fps)
                if requested_fps < metadata["fps"]:
                    final_fps = requested_fps
                    filters.append(f"fps={requested_fps:g}")
            if filters:
                command.extend(["-vf", ",".join(filters)])
            crf, preset = {"auto": (20, "medium"), "high": (17, "slow"), "small": (26, "medium")}[quality]
            command.extend(["-c:v", "libx264", "-preset", preset, "-crf", str(crf), "-pix_fmt", "yuv420p", "-tag:v", "avc1"])
            output_video_codec = "h264"
            if metadata["hasAudio"]:
                if metadata["audioCodec"] in MOV_COPY_AUDIO_CODECS:
                    command.extend(["-c:a", "copy"])
                else:
                    command.extend(["-c:a", "aac", "-b:a", "192k"])
                    output_audio_codec = "aac"

        command.extend(["-movflags", "+faststart+use_metadata_tags", "-f", "mov", output_path])
        returncode, _, conversion_error = await run_ffmpeg_cancellable(request, *command, timeout=1800)
        if returncode != 0 or not os.path.exists(output_path) or os.path.getsize(output_path) == 0:
            raise RuntimeError(conversion_error.decode("utf-8", errors="replace")[-1000:])

        with open(output_path, "rb") as converted_file:
            header = converted_file.read(64)
        if b"ftypqt  " not in header:
            raise RuntimeError("mov-container-verification-failed")
        verification_code, _, verification_error = await run_ffmpeg(
            ffmpeg, "-v", "error", "-i", output_path, "-f", "null", "-", timeout=180
        )
        if verification_code != 0:
            raise RuntimeError(verification_error.decode("utf-8", errors="replace")[-1000:])

        converted_size = os.path.getsize(output_path)
        return FileResponse(
            output_path,
            media_type="video/quicktime",
            filename="video-convertido.mov",
            headers={
                "Cache-Control": "no-store",
                "X-Video-Duration": f"{metadata['duration']:.3f}",
                "X-Video-Width": str(final_width),
                "X-Video-Height": str(final_height),
                "X-Video-FPS": f"{final_fps:.3f}" if final_fps else "",
                "X-Video-Original-Size": str(original_size),
                "X-Video-Compressed-Size": str(converted_size),
                "X-Video-Codec": output_video_codec or "",
                "X-Audio-Codec": output_audio_codec or "none",
                "X-Conversion-Strategy": "remux" if use_remux else "transcode",
            },
            background=BackgroundTask(shutil.rmtree, workdir, True),
        )
    except asyncio.CancelledError:
        shutil.rmtree(workdir, ignore_errors=True)
        raise HTTPException(status_code=499, detail="A conversão foi cancelada.")
    except HTTPException:
        shutil.rmtree(workdir, ignore_errors=True)
        raise
    except TimeoutError:
        shutil.rmtree(workdir, ignore_errors=True)
        raise HTTPException(status_code=408, detail="A conversão demorou mais do que o limite permitido. Tente utilizar um arquivo menor.")
    except MemoryError:
        shutil.rmtree(workdir, ignore_errors=True)
        raise HTTPException(status_code=507, detail="Este vídeo exige mais memória do que o dispositivo pode disponibilizar. Tente utilizar um arquivo menor.")
    except Exception as error:
        print(f"Erro MP4 para MOV: {type(error).__name__}")
        shutil.rmtree(workdir, ignore_errors=True)
        raise HTTPException(status_code=500, detail="Não foi possível converter este vídeo para MOV. Tente novamente com outro arquivo.")


@app.post("/video/mp4-to-avi/inspect")
async def inspect_mp4_to_avi(file: UploadFile = File(...)):
    workdir = tempfile.mkdtemp(prefix="kivai-mp4-avi-inspect-")
    try:
        input_path, size = await save_mp4_upload(file, workdir)
        from imageio_ffmpeg import get_ffmpeg_exe

        metadata = await probe_mp4_file(get_ffmpeg_exe(), input_path)
        return {
            **metadata,
            "size": size,
            "strategy": "remux" if can_remux_mp4_to_avi(metadata) else "transcode",
        }
    except HTTPException:
        raise
    except TimeoutError:
        raise HTTPException(status_code=408, detail="A análise demorou mais do que o limite permitido. Tente utilizar um arquivo menor.")
    except Exception as error:
        print(f"Erro ao analisar MP4 para AVI: {type(error).__name__}")
        raise HTTPException(status_code=422, detail="Não foi possível ler este vídeo. Verifique o arquivo e tente novamente.")
    finally:
        shutil.rmtree(workdir, ignore_errors=True)


@app.post("/video/mp4-to-avi")
async def mp4_to_avi(
    request: Request,
    file: UploadFile = File(...),
    quality: str = Form(default="auto"),
    resolution: str = Form(default="original"),
    fps: str = Form(default="original"),
):
    if quality not in {"auto", "high", "small"}:
        raise HTTPException(status_code=400, detail="Configuração de qualidade inválida.")
    if resolution not in {"original", "2160", "1080", "720", "480"}:
        raise HTTPException(status_code=400, detail="Resolução inválida.")
    if fps not in {"original", "60", "30", "24"}:
        raise HTTPException(status_code=400, detail="Configuração de FPS inválida.")

    workdir = tempfile.mkdtemp(prefix="kivai-mp4-avi-")
    output_path = os.path.join(workdir, "video-convertido.avi")
    try:
        input_path, original_size = await save_mp4_upload(file, workdir)
        from imageio_ffmpeg import get_ffmpeg_exe

        ffmpeg = get_ffmpeg_exe()
        metadata = await probe_mp4_file(ffmpeg, input_path)
        use_remux = quality == "auto" and resolution == "original" and fps == "original" and can_remux_mp4_to_avi(metadata)
        command = [
            ffmpeg, "-hide_banner", "-loglevel", "error", "-y", "-i", input_path,
            "-map", "0:v:0", "-map", "0:a?", "-map_metadata", "0",
        ]

        if use_remux:
            command.extend(["-c", "copy"])
        else:
            requested_height = metadata["height"] if resolution == "original" else min(metadata["height"], int(resolution))
            final_height = max(2, round(requested_height / 2) * 2)
            final_width = max(2, round(metadata["width"] * final_height / metadata["height"] / 2) * 2)
            filters = []
            if final_width != metadata["width"] or final_height != metadata["height"]:
                filters.append(f"scale={final_width}:{final_height}:flags=lanczos")
            if fps != "original" and metadata["fps"]:
                requested_fps = float(fps)
                if requested_fps < metadata["fps"]:
                    filters.append(f"fps={requested_fps:g}")
            if filters:
                command.extend(["-vf", ",".join(filters)])
            quality_scale = {"auto": 4, "high": 2, "small": 7}[quality]
            command.extend(["-c:v", "mpeg4", "-q:v", str(quality_scale), "-pix_fmt", "yuv420p", "-vtag", "XVID"])
            if metadata["hasAudio"]:
                command.extend(["-c:a", "libmp3lame", "-b:a", "192k"])

        command.extend(["-f", "avi", output_path])
        returncode, _, conversion_error = await run_ffmpeg_cancellable(request, *command, timeout=1800)
        if returncode != 0 or not os.path.exists(output_path) or os.path.getsize(output_path) == 0:
            raise RuntimeError(conversion_error.decode("utf-8", errors="replace")[-1000:])

        with open(output_path, "rb") as converted_file:
            header = converted_file.read(12)
        if header[:4] != b"RIFF" or header[8:12] != b"AVI ":
            raise RuntimeError("avi-container-verification-failed")
        verification_code, _, verification_error = await run_ffmpeg(
            ffmpeg, "-v", "error", "-i", output_path, "-f", "null", "-", timeout=180
        )
        if verification_code != 0:
            raise RuntimeError(verification_error.decode("utf-8", errors="replace")[-1000:])
        _, _, output_probe = await run_ffmpeg(ffmpeg, "-hide_banner", "-i", output_path, timeout=30)
        output_metadata = detailed_video_metadata(output_probe.decode("utf-8", errors="replace"))
        if output_metadata["format"] != "avi" or not output_metadata["videoCodec"] or not output_metadata["width"] or not output_metadata["height"]:
            raise RuntimeError("avi-output-probe-failed")

        converted_size = os.path.getsize(output_path)
        return FileResponse(
            output_path,
            media_type="video/x-msvideo",
            filename="video-convertido.avi",
            headers={
                "Cache-Control": "no-store",
                "X-Video-Duration": f"{(output_metadata['duration'] or metadata['duration']):.3f}",
                "X-Video-Width": str(output_metadata["width"]),
                "X-Video-Height": str(output_metadata["height"]),
                "X-Video-FPS": f"{output_metadata['fps']:.3f}" if output_metadata["fps"] else "",
                "X-Video-Original-Size": str(original_size),
                "X-Video-Compressed-Size": str(converted_size),
                "X-Video-Codec": output_metadata["videoCodec"] or "",
                "X-Audio-Codec": output_metadata["audioCodec"] or "none",
                "X-Conversion-Strategy": "remux" if use_remux else "transcode",
            },
            background=BackgroundTask(shutil.rmtree, workdir, True),
        )
    except asyncio.CancelledError:
        shutil.rmtree(workdir, ignore_errors=True)
        raise HTTPException(status_code=499, detail="A conversão foi cancelada.")
    except HTTPException:
        shutil.rmtree(workdir, ignore_errors=True)
        raise
    except TimeoutError:
        shutil.rmtree(workdir, ignore_errors=True)
        raise HTTPException(status_code=408, detail="A conversão demorou mais do que o limite permitido. Tente utilizar um arquivo menor.")
    except MemoryError:
        shutil.rmtree(workdir, ignore_errors=True)
        raise HTTPException(status_code=507, detail="Este vídeo exige mais memória do que o dispositivo pode disponibilizar. Tente utilizar um arquivo menor.")
    except Exception as error:
        print(f"Erro MP4 para AVI: {type(error).__name__}")
        shutil.rmtree(workdir, ignore_errors=True)
        raise HTTPException(status_code=500, detail="Não foi possível converter este vídeo para AVI. Tente novamente com outro arquivo.")


@app.post("/video/mov-to-mp4/inspect")
async def inspect_mov_to_mp4(file: UploadFile = File(...)):
    workdir = tempfile.mkdtemp(prefix="kivai-mov-mp4-inspect-")
    try:
        input_path, size = await save_mov_upload(file, workdir)
        from imageio_ffmpeg import get_ffmpeg_exe

        metadata = await probe_mov_file(get_ffmpeg_exe(), input_path)
        return {
            **metadata,
            "size": size,
            "strategy": "remux" if can_remux_mov_to_mp4(metadata) else "transcode",
        }
    except HTTPException:
        raise
    except TimeoutError:
        raise HTTPException(status_code=408, detail="A análise demorou mais do que o limite permitido. Tente utilizar um arquivo menor.")
    except Exception as error:
        print(f"Erro ao analisar MOV para MP4: {type(error).__name__}")
        raise HTTPException(status_code=422, detail="Não foi possível ler este vídeo. Verifique o arquivo e tente novamente.")
    finally:
        shutil.rmtree(workdir, ignore_errors=True)


@app.post("/video/mov-to-mp4")
async def mov_to_mp4(
    request: Request,
    file: UploadFile = File(...),
    quality: str = Form(default="auto"),
    resolution: str = Form(default="original"),
    fps: str = Form(default="original"),
):
    if quality not in {"auto", "high", "small"}:
        raise HTTPException(status_code=400, detail="Configuração de qualidade inválida.")
    if resolution not in {"original", "2160", "1080", "720", "480"}:
        raise HTTPException(status_code=400, detail="Resolução inválida.")
    if fps not in {"original", "60", "30", "24"}:
        raise HTTPException(status_code=400, detail="Configuração de FPS inválida.")

    workdir = tempfile.mkdtemp(prefix="kivai-mov-mp4-")
    output_path = os.path.join(workdir, "video-convertido.mp4")
    try:
        input_path, original_size = await save_mov_upload(file, workdir)
        from imageio_ffmpeg import get_ffmpeg_exe

        ffmpeg = get_ffmpeg_exe()
        metadata = await probe_mov_file(ffmpeg, input_path)
        use_remux = quality == "auto" and resolution == "original" and fps == "original" and can_remux_mov_to_mp4(metadata)
        command = [
            ffmpeg, "-hide_banner", "-loglevel", "error", "-y", "-i", input_path,
            "-map", "0:v:0", "-map", "0:a?", "-map_metadata", "0",
        ]

        if use_remux:
            command.extend(["-c", "copy"])
            if metadata["videoCodec"] == "hevc":
                command.extend(["-tag:v", "hvc1"])
        else:
            requested_height = metadata["height"] if resolution == "original" else min(metadata["height"], int(resolution))
            final_height = max(2, round(requested_height / 2) * 2)
            final_width = max(2, round(metadata["width"] * final_height / metadata["height"] / 2) * 2)
            filters = []
            if final_width != metadata["width"] or final_height != metadata["height"]:
                filters.append(f"scale={final_width}:{final_height}:flags=lanczos")
            if fps != "original" and metadata["fps"]:
                requested_fps = float(fps)
                if requested_fps < metadata["fps"]:
                    filters.append(f"fps={requested_fps:g}")
            if filters:
                command.extend(["-vf", ",".join(filters)])
            crf, preset = {"auto": (20, "medium"), "high": (17, "slow"), "small": (26, "medium")}[quality]
            command.extend(["-c:v", "libx264", "-preset", preset, "-crf", str(crf), "-pix_fmt", "yuv420p", "-tag:v", "avc1"])
            if metadata["hasAudio"]:
                command.extend(["-c:a", "aac", "-b:a", "192k"])

        command.extend(["-movflags", "+faststart+use_metadata_tags", "-f", "mp4", output_path])
        returncode, _, conversion_error = await run_ffmpeg_cancellable(request, *command, timeout=1800)
        if returncode != 0 or not os.path.exists(output_path) or os.path.getsize(output_path) == 0:
            raise RuntimeError(conversion_error.decode("utf-8", errors="replace")[-1000:])

        with open(output_path, "rb") as converted_file:
            header = converted_file.read(64)
        if b"ftyp" not in header or b"ftypqt  " in header:
            raise RuntimeError("mp4-container-verification-failed")
        verification_code, _, verification_error = await run_ffmpeg(
            ffmpeg, "-v", "error", "-i", output_path, "-f", "null", "-", timeout=180
        )
        if verification_code != 0:
            raise RuntimeError(verification_error.decode("utf-8", errors="replace")[-1000:])
        _, _, output_probe = await run_ffmpeg(ffmpeg, "-hide_banner", "-i", output_path, timeout=30)
        output_metadata = detailed_video_metadata(output_probe.decode("utf-8", errors="replace"))
        if not output_metadata["videoCodec"] or not output_metadata["width"] or not output_metadata["height"]:
            raise RuntimeError("mp4-output-probe-failed")

        converted_size = os.path.getsize(output_path)
        return FileResponse(
            output_path,
            media_type="video/mp4",
            filename="video-convertido.mp4",
            headers={
                "Cache-Control": "no-store",
                "X-Video-Duration": f"{(output_metadata['duration'] or metadata['duration']):.3f}",
                "X-Video-Width": str(output_metadata["width"]),
                "X-Video-Height": str(output_metadata["height"]),
                "X-Video-FPS": f"{output_metadata['fps']:.3f}" if output_metadata["fps"] else "",
                "X-Video-Original-Size": str(original_size),
                "X-Video-Compressed-Size": str(converted_size),
                "X-Video-Codec": output_metadata["videoCodec"] or "",
                "X-Audio-Codec": output_metadata["audioCodec"] or "none",
                "X-Conversion-Strategy": "remux" if use_remux else "transcode",
            },
            background=BackgroundTask(shutil.rmtree, workdir, True),
        )
    except asyncio.CancelledError:
        shutil.rmtree(workdir, ignore_errors=True)
        raise HTTPException(status_code=499, detail="A conversão foi cancelada.")
    except HTTPException:
        shutil.rmtree(workdir, ignore_errors=True)
        raise
    except TimeoutError:
        shutil.rmtree(workdir, ignore_errors=True)
        raise HTTPException(status_code=408, detail="A conversão demorou mais do que o limite permitido. Tente utilizar um arquivo menor.")
    except MemoryError:
        shutil.rmtree(workdir, ignore_errors=True)
        raise HTTPException(status_code=507, detail="Este vídeo exige mais memória do que o dispositivo pode disponibilizar. Tente utilizar um arquivo menor.")
    except Exception as error:
        print(f"Erro MOV para MP4: {type(error).__name__}")
        shutil.rmtree(workdir, ignore_errors=True)
        raise HTTPException(status_code=500, detail="Não foi possível converter este vídeo para MP4. Tente novamente com outro arquivo.")


@app.post("/video/hevc-to-mp4")
async def hevc_to_mp4(file: UploadFile = File(...), quality: str = Form(default="auto")):
    if quality not in {"auto", "high", "small"}:
        raise HTTPException(status_code=400, detail="Configuração de qualidade inválida.")
    if file.content_type and not (file.content_type.startswith("video/") or file.content_type == "application/octet-stream"):
        raise HTTPException(status_code=415, detail="Selecione um vídeo HEVC/H.265 compatível.")

    workdir = tempfile.mkdtemp(prefix="kivai-hevc-")
    input_path = os.path.join(workdir, "entrada-video")
    output_path = os.path.join(workdir, "video-convertido.mp4")
    try:
        total = 0
        with open(input_path, "wb") as destination:
            while chunk := await file.read(1024 * 1024):
                total += len(chunk)
                if total > VIDEO_CONVERT_MAX_FILE_SIZE:
                    raise HTTPException(status_code=413, detail="O vídeo ultrapassa o limite permitido.")
                destination.write(chunk)
        if total == 0:
            raise HTTPException(status_code=422, detail="Não foi possível ler este vídeo.")

        from imageio_ffmpeg import get_ffmpeg_exe

        ffmpeg = get_ffmpeg_exe()
        _, _, probe_error = await run_ffmpeg(ffmpeg, "-hide_banner", "-i", input_path, timeout=30)
        codec, duration, width, height, has_audio = video_metadata(probe_error.decode("utf-8", errors="replace"))
        if codec not in {"hevc", "h265"}:
            raise HTTPException(status_code=415, detail="Não foi possível processar o codec deste arquivo.")
        if width is None or height is None:
            raise HTTPException(status_code=422, detail="Não foi possível ler este vídeo.")
        duration = duration or 0.0

        crf, preset = {"auto": (23, "medium"), "high": (19, "slow"), "small": (28, "medium")}[quality]
        command = [
            ffmpeg, "-hide_banner", "-loglevel", "error", "-y", "-i", input_path,
            "-map", "0:v:0", "-map", "0:a?", "-c:v", "libx264", "-preset", preset,
            "-crf", str(crf), "-pix_fmt", "yuv420p", "-movflags", "+faststart",
        ]
        if has_audio:
            command.extend(["-c:a", "aac", "-b:a", "192k"])
        command.append(output_path)
        returncode, _, conversion_error = await run_ffmpeg(*command, timeout=900)
        if returncode != 0 or not os.path.exists(output_path) or os.path.getsize(output_path) == 0:
            raise RuntimeError(conversion_error.decode("utf-8", errors="replace")[-1000:])

        verification_code, _, verification_error = await run_ffmpeg(
            ffmpeg, "-v", "error", "-i", output_path, "-f", "null", "-", timeout=120
        )
        if verification_code != 0:
            raise RuntimeError(verification_error.decode("utf-8", errors="replace")[-1000:])

        return FileResponse(
            output_path,
            media_type="video/mp4",
            filename="video-convertido.mp4",
            headers={
                "Cache-Control": "no-store",
                "X-Video-Duration": f"{duration:.3f}",
                "X-Video-Width": str(width),
                "X-Video-Height": str(height),
            },
            background=BackgroundTask(shutil.rmtree, workdir, True),
        )
    except HTTPException:
        shutil.rmtree(workdir, ignore_errors=True)
        raise
    except TimeoutError:
        shutil.rmtree(workdir, ignore_errors=True)
        raise HTTPException(status_code=408, detail="A conversão demorou mais do que o limite permitido. Tente utilizar um arquivo menor.")
    except MemoryError:
        shutil.rmtree(workdir, ignore_errors=True)
        raise HTTPException(status_code=507, detail="Este vídeo exige mais memória do que o dispositivo pode disponibilizar. Tente utilizar um arquivo menor.")
    except Exception as error:
        print(f"Erro HEVC para MP4: {type(error).__name__}")
        shutil.rmtree(workdir, ignore_errors=True)
        raise HTTPException(status_code=500, detail="Não foi possível converter o vídeo para MP4. Tente novamente com outro arquivo.")


@app.post("/video/mp4-to-hevc")
async def mp4_to_hevc(file: UploadFile = File(...), quality: str = Form(default="auto")):
    if quality not in {"auto", "high", "small"}:
        raise HTTPException(status_code=400, detail="Configuração de qualidade inválida.")
    if file.content_type and not (file.content_type.startswith("video/") or file.content_type == "application/octet-stream"):
        raise HTTPException(status_code=415, detail="Selecione um vídeo MP4 compatível.")

    workdir = tempfile.mkdtemp(prefix="kivai-mp4-hevc-")
    input_path = os.path.join(workdir, "entrada-video")
    output_path = os.path.join(workdir, "video-hevc.mp4")
    try:
        total = 0
        with open(input_path, "wb") as destination:
            while chunk := await file.read(1024 * 1024):
                total += len(chunk)
                if total > VIDEO_CONVERT_MAX_FILE_SIZE:
                    raise HTTPException(status_code=413, detail="O vídeo ultrapassa o limite permitido.")
                destination.write(chunk)
        if total == 0:
            raise HTTPException(status_code=422, detail="Não foi possível ler este vídeo.")

        from imageio_ffmpeg import get_ffmpeg_exe

        ffmpeg = get_ffmpeg_exe()
        _, _, probe_error = await run_ffmpeg(ffmpeg, "-hide_banner", "-i", input_path, timeout=30)
        probe_text = probe_error.decode("utf-8", errors="replace")
        _, duration, width, height, has_audio = video_metadata(probe_text)
        if not re.search(r"Input #0,\s*(?:mov,)?mp4(?:,|\s)", probe_text, flags=re.I):
            raise HTTPException(status_code=415, detail="O arquivo selecionado não possui um container MP4 válido.")
        if width is None or height is None:
            raise HTTPException(status_code=422, detail="Não foi possível ler este vídeo.")
        duration = duration or 0.0

        crf, preset = {"auto": (28, "medium"), "high": (22, "slow"), "small": (32, "medium")}[quality]
        command = [
            ffmpeg, "-hide_banner", "-loglevel", "error", "-y", "-i", input_path,
            "-map", "0:v:0", "-map", "0:a?", "-c:v", "libx265", "-tag:v", "hvc1",
            "-preset", preset, "-crf", str(crf), "-pix_fmt", "yuv420p", "-movflags", "+faststart",
        ]
        if has_audio:
            command.extend(["-c:a", "aac", "-b:a", "192k"])
        command.append(output_path)
        returncode, _, conversion_error = await run_ffmpeg(*command, timeout=900)
        if returncode != 0 or not os.path.exists(output_path) or os.path.getsize(output_path) == 0:
            raise RuntimeError(conversion_error.decode("utf-8", errors="replace")[-1000:])

        verification_code, _, verification_error = await run_ffmpeg(
            ffmpeg, "-v", "error", "-i", output_path, "-f", "null", "-", timeout=120
        )
        if verification_code != 0:
            raise RuntimeError(verification_error.decode("utf-8", errors="replace")[-1000:])

        return FileResponse(
            output_path,
            media_type="video/mp4",
            filename="video-hevc.mp4",
            headers={
                "Cache-Control": "no-store",
                "X-Video-Duration": f"{duration:.3f}",
                "X-Video-Width": str(width),
                "X-Video-Height": str(height),
            },
            background=BackgroundTask(shutil.rmtree, workdir, True),
        )
    except HTTPException:
        shutil.rmtree(workdir, ignore_errors=True)
        raise
    except TimeoutError:
        shutil.rmtree(workdir, ignore_errors=True)
        raise HTTPException(status_code=408, detail="A conversão demorou mais do que o limite permitido. Tente utilizar um arquivo menor.")
    except MemoryError:
        shutil.rmtree(workdir, ignore_errors=True)
        raise HTTPException(status_code=507, detail="Este vídeo exige mais memória do que o serviço pode disponibilizar. Tente utilizar um arquivo menor.")
    except Exception as error:
        print(f"Erro MP4 para HEVC: {type(error).__name__}")
        shutil.rmtree(workdir, ignore_errors=True)
        raise HTTPException(status_code=500, detail="Não foi possível converter o vídeo para HEVC. Tente novamente com outro arquivo.")


class HtmlToPdfRequest(BaseModel):
    html: str = Field(min_length=1, max_length=5_242_880)
    page_size: str = "A4"
    landscape: bool = False
    margins: dict[str, float]
    scale: float = Field(default=1, ge=0.75, le=1.5)
    header: str = Field(default="", max_length=200)
    footer: str = Field(default="", max_length=200)
    page_numbers: bool = False


@app.post("/html-to-pdf")
async def html_to_pdf(payload: HtmlToPdfRequest):
    if payload.page_size not in {"A3", "A4", "A5", "Letter", "Legal"}:
        raise HTTPException(status_code=400, detail="Tamanho de página inválido.")
    if set(payload.margins) != {"top", "right", "bottom", "left"} or any(not 0 <= float(value) <= 100 for value in payload.margins.values()):
        raise HTTPException(status_code=400, detail="Margens inválidas.")
    if len(re.findall(r"<[^>]+>", payload.html)) > 10_000:
        raise HTTPException(status_code=413, detail="Conteúdo muito grande.")
    tags = set(bleach.sanitizer.ALLOWED_TAGS) | {"html", "head", "body", "title", "meta", "style", "div", "span", "p", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "table", "thead", "tbody", "tfoot", "tr", "th", "td", "img", "section", "article", "header", "footer", "main", "br", "hr"}
    css_sanitizer = CSSSanitizer(allowed_css_properties={
        "background", "background-color", "border", "border-collapse", "border-color",
        "border-radius", "border-style", "border-width", "color", "display", "float",
        "font", "font-family", "font-size", "font-style", "font-weight", "height",
        "letter-spacing", "line-height", "list-style", "margin", "margin-bottom",
        "margin-left", "margin-right", "margin-top", "max-width", "min-width", "padding",
        "padding-bottom", "padding-left", "padding-right", "padding-top", "text-align",
        "text-decoration", "text-indent", "text-transform", "vertical-align", "white-space",
        "width", "word-break", "word-spacing",
    })
    cleaned = bleach.clean(payload.html, tags=tags, attributes={"*": ["class", "id", "style"], "img": ["src", "alt", "width", "height"], "a": ["href", "title"]}, protocols={"http", "https", "mailto", "data"}, css_sanitizer=css_sanitizer, strip=True)
    cleaned = re.sub(r"@import\s+[^;]+;|url\s*\(\s*(['\"]?)(?!data:)[^)]+\1\s*\)", "", cleaned, flags=re.I)
    if not re.search(r"[\wÀ-ÿ]|<(img|table)\b", cleaned, flags=re.I):
        raise HTTPException(status_code=400, detail="HTML sem conteúdo utilizável.")
    browser = None
    try:
        async with async_playwright() as manager:
            browser = await manager.chromium.launch(headless=True, args=["--disable-dev-shm-usage", "--no-sandbox"])
            page = await browser.new_page()
            async def block_external_requests(route):
                await route.abort()

            await page.route("**/*", block_external_requests)
            await page.set_content(cleaned, wait_until="domcontentloaded", timeout=15_000)
            await page.add_style_tag(content="@media print{img,table,tr,article,section{break-inside:avoid}h1,h2,h3{break-after:avoid}}")
            header = bleach.clean(payload.header, tags=set(), strip=True)
            footer = bleach.clean(payload.footer, tags=set(), strip=True)
            footer_template = f'<div style="font-size:9px;width:100%;padding:0 10mm;color:#555">{footer}<span style="float:right">' + ('Página <span class="pageNumber"></span> de <span class="totalPages"></span>' if payload.page_numbers else '') + '</span></div>'
            pdf = await asyncio.wait_for(page.pdf(format=payload.page_size, landscape=payload.landscape, print_background=True, scale=payload.scale, margin={key: f"{value}mm" for key, value in payload.margins.items()}, display_header_footer=bool(header or footer or payload.page_numbers), header_template=f'<div style="font-size:9px;width:100%;padding:0 10mm;color:#555">{header}</div>', footer_template=footer_template, tagged=True), timeout=30)
        return Response(content=pdf, media_type="application/pdf", headers={"Content-Disposition": 'attachment; filename="documento.pdf"'})
    except Exception as error:
        print(f"Erro HTML para PDF: {error}")
        raise HTTPException(status_code=500, detail="Não foi possível gerar o PDF.")
    finally:
        if browser is not None:
            await browser.close()


@app.post("/remove-background")
async def remove_background(
    file: UploadFile = File(...),
):
    if file.content_type not in {
        "image/png",
        "image/jpeg",
        "image/webp",
    }:
        raise HTTPException(
            status_code=415,
            detail="Formato não suportado. Envie PNG, JPG ou WebP.",
        )

    try:
        conteudo = await file.read()

        if len(conteudo) > 10 * 1024 * 1024:
            raise HTTPException(
                status_code=413,
                detail="A imagem excede o limite de 10 MB.",
            )

        imagem = Image.open(io.BytesIO(conteudo)).convert("RGB")

        import torch

        with torch.inference_mode():
            resultado = get_background_model().inference(imagem)

        buffer = io.BytesIO()
        resultado.save(buffer, format="PNG")

        return Response(
            content=buffer.getvalue(),
            media_type="image/png",
            headers={
                "Content-Disposition": (
                    'inline; filename="kivai-sem-fundo.png"'
                )
            },
        )

    except HTTPException:
        raise

    except UnidentifiedImageError:
        raise HTTPException(
            status_code=400,
            detail="O arquivo enviado não é uma imagem válida.",
        )

    except Exception as erro:
        print(f"Erro no processamento: {erro}")

        raise HTTPException(
            status_code=500,
            detail="Não foi possível processar a imagem.",
        )
