"""Video hevc endpoints and helpers."""

import os
import re
import shutil
import tempfile
from fastapi import File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask
from .video_common import (
    VIDEO_CONVERT_MAX_FILE_SIZE,
    run_ffmpeg,
    video_metadata,
)
from fastapi import APIRouter


router = APIRouter()

@router.post("/video/hevc-to-mp4")
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

@router.post("/video/mp4-to-hevc")
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
