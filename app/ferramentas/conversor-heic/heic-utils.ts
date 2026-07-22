export async function converterHeicParaJpg(
  arquivo: File
): Promise<{
  blob: Blob;
  largura: number;
  altura: number;
}> {
  const { default: heic2any } = await import("heic2any");

  const convertido = await heic2any({
    blob: arquivo,
    toType: "image/jpeg",
    quality: 0.95,
  });

  const blob = Array.isArray(convertido)
    ? convertido[0]
    : convertido;

  const url = URL.createObjectURL(blob);

  const imagem = await carregarImagem(url);

  URL.revokeObjectURL(url);

  return {
    blob,
    largura: imagem.naturalWidth,
    altura: imagem.naturalHeight,
  };
}

function carregarImagem(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const imagem = new Image();

    imagem.onload = () => resolve(imagem);

    imagem.onerror = () =>
      reject(new Error("Erro ao abrir imagem convertida."));

    imagem.src = src;
  });
}