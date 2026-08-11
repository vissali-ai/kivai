import asyncio
import io
import os
import re
import shutil
import tempfile

import bleach
from bleach.css_sanitizer import CSSSanitizer
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from PIL import Image, UnidentifiedImageError
from pydantic import BaseModel, Field
from playwright.async_api import async_playwright
from pypdf import PdfReader, PdfWriter
from pypdf.errors import PdfReadError
from starlette.background import BackgroundTask


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
    expose_headers=["X-PDF-Page-Count", "X-Video-Duration", "X-Video-Width", "X-Video-Height", "Content-Disposition"],
)

device = "cpu"

PDF_UNLOCK_MAX_FILE_SIZE = 25 * 1024 * 1024
PDF_UNLOCK_MAX_PAGES = 100
VIDEO_CONVERT_MAX_FILE_SIZE = 200 * 1024 * 1024

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
