export type NivelCompressao = "leve" | "equilibrada" | "maxima";

export type OpcoesCompressao = {
  nivel: NivelCompressao;
};

export type ResultadoCompressao = {
  blob: Blob;
  largura: number;
  altura: number;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  extensao: "jpg" | "png" | "webp";
  tamanhoOriginal: number;
  tamanhoFinal: number;
  bytesEconomizados: number;
  percentualReducao: number;
  usouOriginal: boolean;
};

const QUALIDADE_POR_NIVEL: Record<NivelCompressao, number> = {
  leve: 0.9,
  equilibrada: 0.75,
  maxima: 0.55,
};

function carregarImagem(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const imagem = new Image();

    imagem.onload = () => {
      URL.revokeObjectURL(url);
      resolve(imagem);
    };

    imagem.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não foi possível carregar a imagem."));
    };

    imagem.src = url;
  });
}

function canvasParaBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  qualidade?: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Não foi possível processar a imagem."));
          return;
        }

        resolve(blob);
      },
      mimeType,
      qualidade
    );
  });
}

function obterFormato(file: File): {
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  extensao: "jpg" | "png" | "webp";
} {
  if (file.type === "image/png") {
    return {
      mimeType: "image/png",
      extensao: "png",
    };
  }

  if (file.type === "image/webp") {
    return {
      mimeType: "image/webp",
      extensao: "webp",
    };
  }

  return {
    mimeType: "image/jpeg",
    extensao: "jpg",
  };
}

export async function comprimirImagem(
  file: File,
  opcoes: OpcoesCompressao
): Promise<ResultadoCompressao> {
  const formatosAceitos = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  if (!formatosAceitos.includes(file.type)) {
    throw new Error("Formato inválido. Use JPG, PNG ou WebP.");
  }

  const imagem = await carregarImagem(file);

  const canvas = document.createElement("canvas");
  canvas.width = imagem.naturalWidth;
  canvas.height = imagem.naturalHeight;

  const contexto = canvas.getContext("2d");

  if (!contexto) {
    throw new Error(
      "Seu navegador não suporta o processamento da imagem."
    );
  }

  contexto.drawImage(imagem, 0, 0);

  const { mimeType, extensao } = obterFormato(file);

  const qualidade =
    mimeType === "image/png"
      ? undefined
      : QUALIDADE_POR_NIVEL[opcoes.nivel];

  const blobProcessado = await canvasParaBlob(
    canvas,
    mimeType,
    qualidade
  );

  const usarOriginal = blobProcessado.size >= file.size;

  const blobFinal = usarOriginal
    ? file
    : blobProcessado;

  const tamanhoOriginal = file.size;
  const tamanhoFinal = blobFinal.size;

  const bytesEconomizados = Math.max(
    0,
    tamanhoOriginal - tamanhoFinal
  );

  const percentualReducao =
    tamanhoOriginal > 0
      ? (bytesEconomizados / tamanhoOriginal) * 100
      : 0;

  return {
    blob: blobFinal,
    largura: imagem.naturalWidth,
    altura: imagem.naturalHeight,
    mimeType,
    extensao,
    tamanhoOriginal,
    tamanhoFinal,
    bytesEconomizados,
    percentualReducao,
    usouOriginal: usarOriginal,
  };
}
