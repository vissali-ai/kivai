import io

import torch
from ben2 import BEN_Base
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from PIL import Image, UnidentifiedImageError


app = FastAPI(
    title="Nexion Tools Backend",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

device = torch.device("cpu")

print("Carregando motor de remoção de fundo...")

model = BEN_Base.from_pretrained("PramaLLC/BEN2")
model.to(device).eval()

print("Motor carregado com sucesso.")


@app.get("/")
def raiz():
    return {
        "status": "online",
        "servico": "Nexion Tools Backend",
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "device": str(device),
    }


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

        with torch.inference_mode():
            resultado = model.inference(imagem)

        buffer = io.BytesIO()
        resultado.save(buffer, format="PNG")

        return Response(
            content=buffer.getvalue(),
            media_type="image/png",
            headers={
                "Content-Disposition": (
                    'inline; filename="nexion-sem-fundo.png"'
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