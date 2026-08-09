export type FormatoSaida = "png" | "jpeg" | "webp";

export type OpcoesResize = {
  largura?: number;
  altura?: number;
  porcentagem?: number;
  manterProporcao: boolean;
  naoAmpliar: boolean;
  formato: FormatoSaida;
  qualidade?: number;
  corDeFundo?: string;
};

export type DimensoesImagem = {
  largura: number;
  altura: number;
};

export async function obterDimensoesImagem(arquivo: Blob): Promise<DimensoesImagem> {
  const imagem = await carregarImagem(arquivo);
  return { largura: imagem.naturalWidth, altura: imagem.naturalHeight };
}

export function calcularDimensoes(
  original: DimensoesImagem,
  opcoes: Pick<OpcoesResize, "largura" | "altura" | "porcentagem" | "manterProporcao" | "naoAmpliar">
): DimensoesImagem {
  let largura: number;
  let altura: number;

  if (opcoes.porcentagem) {
    const escala = Math.max(0.01, (100 - opcoes.porcentagem) / 100);
    largura = Math.round(original.largura * escala);
    altura = Math.round(original.altura * escala);
  } else if (opcoes.manterProporcao) {
    const limiteLargura = opcoes.largura && opcoes.largura > 0 ? opcoes.largura : Number.POSITIVE_INFINITY;
    const limiteAltura = opcoes.altura && opcoes.altura > 0 ? opcoes.altura : Number.POSITIVE_INFINITY;

    if (!Number.isFinite(limiteLargura) && !Number.isFinite(limiteAltura)) {
      throw new Error("Informe a largura ou a altura desejada.");
    }

    let escala = Math.min(limiteLargura / original.largura, limiteAltura / original.altura);
    if (opcoes.naoAmpliar) escala = Math.min(1, escala);
    largura = Math.round(original.largura * escala);
    altura = Math.round(original.altura * escala);
  } else {
    largura = opcoes.largura ?? 0;
    altura = opcoes.altura ?? 0;
    if (opcoes.naoAmpliar) {
      largura = Math.min(largura, original.largura);
      altura = Math.min(altura, original.altura);
    }
  }

  if (!Number.isFinite(largura) || !Number.isFinite(altura) || largura < 1 || altura < 1) {
    throw new Error("Informe dimensões maiores que zero.");
  }

  return { largura: Math.max(1, largura), altura: Math.max(1, altura) };
}

export async function redimensionarImagem(arquivo: File, opcoes: OpcoesResize) {
  const imagem = await carregarImagem(arquivo);
  const dimensoes = calcularDimensoes(
    { largura: imagem.naturalWidth, altura: imagem.naturalHeight },
    opcoes
  );
  const canvas = document.createElement("canvas");
  const contexto = canvas.getContext("2d");

  if (!contexto) throw new Error("Seu navegador não oferece suporte ao processamento de imagens.");

  canvas.width = dimensoes.largura;
  canvas.height = dimensoes.altura;
  contexto.imageSmoothingEnabled = true;
  contexto.imageSmoothingQuality = "high";

  if (opcoes.formato === "jpeg") {
    contexto.fillStyle = opcoes.corDeFundo ?? "#ffffff";
    contexto.fillRect(0, 0, canvas.width, canvas.height);
  }

  contexto.drawImage(imagem, 0, 0, canvas.width, canvas.height);

  const mimeType = opcoes.formato === "png" ? "image/png" : opcoes.formato === "webp" ? "image/webp" : "image/jpeg";
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (resultado) => resultado ? resolve(resultado) : reject(new Error("Não foi possível gerar a imagem.")),
      mimeType,
      opcoes.qualidade ?? 0.9
    );
  });

  return {
    blob,
    largura: dimensoes.largura,
    altura: dimensoes.altura,
    extensao: opcoes.formato === "jpeg" ? "jpg" as const : opcoes.formato,
  };
}

async function carregarImagem(arquivo: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(arquivo);
    const imagem = new Image();
    imagem.onload = () => {
      URL.revokeObjectURL(url);
      resolve(imagem);
    };
    imagem.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não foi possível abrir esta imagem."));
    };
    imagem.src = url;
  });
}
