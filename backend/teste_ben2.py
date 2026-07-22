from pathlib import Path

import torch
from PIL import Image
from ben2 import BEN_Base


BASE_DIR = Path(__file__).resolve().parent
ENTRADA = BASE_DIR / "teste-entrada.png"
SAIDA = BASE_DIR / "teste-saida.png"


def main():
    if not ENTRADA.exists():
        raise FileNotFoundError(
            f"Imagem de teste não encontrada: {ENTRADA}"
        )

    device = torch.device("cpu")

    print("Carregando BEN2...")

    model = BEN_Base.from_pretrained("PramaLLC/BEN2")
    model.to(device).eval()

    print("Abrindo imagem...")

    imagem = Image.open(ENTRADA).convert("RGB")

    print("Removendo fundo...")

    with torch.inference_mode():
        resultado = model.inference(imagem)

    resultado.save(SAIDA)

    print(f"Resultado salvo em: {SAIDA}")


if __name__ == "__main__":
    main()