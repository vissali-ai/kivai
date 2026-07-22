import type { RawImage } from "@huggingface/transformers";

let segmenterPromise: Promise<any> | null = null;

async function carregarSegmentador() {
  if (!segmenterPromise) {
    segmenterPromise = import("@huggingface/transformers").then(
      async ({ pipeline }) => {
        return pipeline(
          "background-removal",
          "Xenova/modnet",
          {
            dtype: "fp32",
          }
        );
      }
    );
  }

  return segmenterPromise;
}

export async function removerFundo(
  imagemUrl: string
): Promise<Blob> {
  const segmenter = await carregarSegmentador();

  const resultado = await segmenter(imagemUrl);

  console.log("Resultado bruto do segmentador:", resultado);

  const imagemResultado = Array.isArray(resultado)
    ? resultado[0]
    : resultado;

  if (!imagemResultado) {
    throw new Error("O modelo não retornou uma imagem processada.");
  }

  const rawImage = imagemResultado as RawImage;

  return rawImage.toBlob();
}