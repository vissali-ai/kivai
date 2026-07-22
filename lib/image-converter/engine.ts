export type FormatoSaida = "png" | "jpeg" | "webp";

export interface OpcoesConversao {
  formato: FormatoSaida;
  qualidade?: number;
  corDeFundo?: string;
}

export interface ResultadoConversao {
  blob: Blob;
  mimeType: string;
  extensao: "png" | "jpg" | "webp";
  largura: number;
  altura: number;
}

const MIME_TYPES: Record<FormatoSaida, string> = {
  png: "image/png",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

const EXTENSOES: Record<FormatoSaida, "png" | "jpg" | "webp"> = {
  png: "png",
  jpeg: "jpg",
  webp: "webp",
};

function normalizarQualidade(qualidade?: number) {
  if (qualidade === undefined) {
    return 0.9;
  }

  return Math.min(1, Math.max(0, qualidade));
}

function canvasParaBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  qualidade: number
) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Não foi possível gerar a imagem convertida."));
          return;
        }

        resolve(blob);
      },
      mimeType,
      qualidade
    );
  });
}

export async function converterImagem(
  arquivo: File,
  opcoes: OpcoesConversao
): Promise<ResultadoConversao> {
  const bitmap = await createImageBitmap(arquivo);

  try {
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;

    const contexto = canvas.getContext("2d");

    if (!contexto) {
      throw new Error("Não foi possível iniciar o processamento da imagem.");
    }

    if (opcoes.formato === "jpeg") {
      contexto.fillStyle = opcoes.corDeFundo ?? "#ffffff";
      contexto.fillRect(0, 0, canvas.width, canvas.height);
    }

    contexto.drawImage(bitmap, 0, 0);

    const mimeType = MIME_TYPES[opcoes.formato];
    const qualidade = normalizarQualidade(opcoes.qualidade);

    const blob = await canvasParaBlob(
      canvas,
      mimeType,
      qualidade
    );

    return {
      blob,
      mimeType,
      extensao: EXTENSOES[opcoes.formato],
      largura: bitmap.width,
      altura: bitmap.height,
    };
  } finally {
    bitmap.close();
  }
}