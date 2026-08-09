import type { RawImage } from "@huggingface/transformers";

type Segmenter = (imagem: Blob) => Promise<RawImage>;

let segmenterPromise: Promise<Segmenter> | null = null;

async function carregarSegmentador() {
  if (!segmenterPromise) {
    segmenterPromise = import("@huggingface/transformers").then(
      async ({ pipeline }) => {
        return pipeline(
          "background-removal",
          "Xenova/modnet",
          {
            // O modelo quantizado tem cerca de 6,6 MB. O modelo fp32 usado
            // antes consumia memória demais e travava navegadores móveis.
            dtype: "q8",
          }
        ) as unknown as Segmenter;
      }
    );
  }

  return segmenterPromise;
}

export async function removerFundo(arquivo: File): Promise<Blob> {
  const segmenter = await carregarSegmentador();
  const imagemResultado = await segmenter(arquivo);

  return imagemResultado.toBlob();
}
