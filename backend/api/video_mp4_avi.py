"""Video mp4 avi endpoints and helpers."""

import asyncio
import os
import shutil
import tempfile
from fastapi import File, Form, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask
from .video_common import (
    can_remux_mp4_to_avi,
    detailed_video_metadata,
    probe_mp4_file,
    run_ffmpeg,
    run_ffmpeg_cancellable,
    save_mp4_upload,
)
from fastapi import APIRouter


router = APIRouter()

@router.post("/video/mp4-to-avi/inspect")
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

@router.post("/video/mp4-to-avi")
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
