"""Video common endpoints and helpers."""

import asyncio
import os
import re
from fastapi import HTTPException, Request, UploadFile

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
