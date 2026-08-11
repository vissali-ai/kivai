import asyncio
import io
import re

import bleach
from bleach.css_sanitizer import CSSSanitizer
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from PIL import Image, UnidentifiedImageError
from pydantic import BaseModel, Field
from playwright.async_api import async_playwright


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
)

device = "cpu"

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
