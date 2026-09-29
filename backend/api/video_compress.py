"""Video compress endpoints and helpers."""

import asyncio
import os
import shutil
import tempfile
from fastapi import File, Form, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask
from .video_common import (
    VIDEO_COMPRESS_MODES,
    VIDEO_COMPRESS_PRESETS,
    probe_video_file,
    run_ffmpeg,
    run_ffmpeg_cancellable,
    save_video_upload,
)
from fastapi import APIRouter


router = APIRouter()

@router.post("/video/compress/inspect")
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

@router.post("/video/compress")
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
