"""Pdf endpoints and helpers."""

import io
from fastapi import File, Form, HTTPException, UploadFile
from fastapi.responses import Response
from pypdf import PdfReader, PdfWriter
from pypdf.errors import PdfReadError
from fastapi import APIRouter


router = APIRouter()

PDF_UNLOCK_MAX_PAGES = 100

PDF_UNLOCK_MAX_FILE_SIZE = 25 * 1024 * 1024

async def read_valid_pdf(file: UploadFile) -> bytes:
    if file.content_type not in {"application/pdf", "application/octet-stream"}:
        raise HTTPException(status_code=415, detail="Selecione um arquivo no formato PDF.")
    content = await file.read(PDF_UNLOCK_MAX_FILE_SIZE + 1)
    if len(content) > PDF_UNLOCK_MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="O arquivo ultrapassa o limite permitido.")
    if not content.startswith(b"%PDF-"):
        raise HTTPException(status_code=415, detail="Selecione um arquivo no formato PDF.")
    return content

@router.post("/pdf-unlock/inspect")
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

@router.post("/pdf-unlock")
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
