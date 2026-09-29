"""Background endpoints and helpers."""

import io
from fastapi import File, HTTPException, UploadFile
from fastapi.responses import Response
from PIL import Image, UnidentifiedImageError
from fastapi import APIRouter


router = APIRouter()

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

@router.post("/remove-background")
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
