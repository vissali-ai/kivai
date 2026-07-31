export type FormatoSaida = "png" | "jpeg" | "webp";
export type PosicaoCorte = "superior-esquerda" | "superior" | "superior-direita" | "esquerda" | "centro" | "direita" | "inferior-esquerda" | "inferior" | "inferior-direita";

type OpcoesResize = {
  largura: number;
  altura: number;
  manterProporcao?: boolean;
  posicaoCorte?: PosicaoCorte;
  formato: FormatoSaida;
  qualidade?: number;
  corDeFundo?: string;
};

export async function redimensionarImagem(
  arquivo: File,
  opcoes: OpcoesResize
): Promise<{
  blob: Blob;
  largura: number;
  altura: number;
  extensao: "png" | "jpg" | "webp";
}> {
  const imagem = await carregarImagem(arquivo);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Seu navegador não suporta Canvas.");
  }

  if (opcoes.largura < 1 || opcoes.altura < 1) {
    throw new Error("Informe uma largura e altura maiores que zero.");
  }

  canvas.width = opcoes.largura;
  canvas.height = opcoes.altura;

  if (opcoes.formato === "jpeg") {
    ctx.fillStyle = opcoes.corDeFundo ?? "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  if (opcoes.manterProporcao) {
    // Preenche exatamente o tamanho solicitado sem deformar a imagem.
    // A parte excedente é recortada pelo próprio canvas, como em object-fit: cover.
    const escala = Math.max(
      canvas.width / imagem.naturalWidth,
      canvas.height / imagem.naturalHeight
    );
    const larguraDesenhada = imagem.naturalWidth * escala;
    const alturaDesenhada = imagem.naturalHeight * escala;
    const posicao = opcoes.posicaoCorte ?? "centro";
    const eixoX = posicao.includes("esquerda") ? 0 : posicao.includes("direita") ? canvas.width - larguraDesenhada : (canvas.width - larguraDesenhada) / 2;
    const eixoY = posicao.startsWith("superior") ? 0 : posicao.startsWith("inferior") ? canvas.height - alturaDesenhada : (canvas.height - alturaDesenhada) / 2;
    ctx.drawImage(
      imagem,
      eixoX,
      eixoY,
      larguraDesenhada,
      alturaDesenhada
    );
  } else {
    ctx.drawImage(imagem, 0, 0, canvas.width, canvas.height);
  }

  const mimeType =
    opcoes.formato === "png"
      ? "image/png"
      : opcoes.formato === "webp"
      ? "image/webp"
      : "image/jpeg";

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (resultado) => {
        if (!resultado) {
          reject(
            new Error("Não foi possível gerar a imagem.")
          );
          return;
        }

        resolve(resultado);
      },
      mimeType,
      opcoes.qualidade ?? 0.92
    );
  });

  return {
    blob,
    largura: canvas.width,
    altura: canvas.height,
    extensao:
      opcoes.formato === "jpeg"
        ? "jpg"
        : opcoes.formato,
  };
}

async function carregarImagem(
  arquivo: File
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(arquivo);

    const imagem = new Image();

    imagem.onload = () => {
      URL.revokeObjectURL(url);
      resolve(imagem);
    };

    imagem.onerror = () => {
      URL.revokeObjectURL(url);
      reject(
        new Error("Não foi possível abrir a imagem.")
      );
    };

    imagem.src = url;
  });
}
