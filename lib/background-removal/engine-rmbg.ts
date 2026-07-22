let recursosPromise: Promise<any> | null = null;

async function carregarRecursosRmbg() {
  if (!recursosPromise) {
    recursosPromise = import("@huggingface/transformers").then(
      async ({
        AutoModel,
        AutoProcessor,
        RawImage,
      }) => {
        const model = await AutoModel.from_pretrained(
          "briaai/RMBG-1.4",
          {
            dtype: "q8",
          }
        );

        const processor = await AutoProcessor.from_pretrained(
          "briaai/RMBG-1.4",
          {
            config: {
              do_normalize: true,
              do_pad: false,
              do_rescale: true,
              do_resize: true,
              image_mean: [0.5, 0.5, 0.5],
              feature_extractor_type: "ImageFeatureExtractor",
              image_std: [1, 1, 1],
              resample: 2,
              rescale_factor: 0.00392156862745098,
              size: {
                width: 1024,
                height: 1024,
              },
            },
          }
        );

        return {
          model,
          processor,
          RawImage,
        };
      }
    );
  }

  return recursosPromise;
}

export async function removerFundoRmbg(
  imagemUrl: string
): Promise<Blob> {
  const {
    model,
    processor,
    RawImage,
  } = await carregarRecursosRmbg();

  const imagemOriginal = await RawImage.fromURL(imagemUrl);

  const {
    pixel_values,
  } = await processor(imagemOriginal);

  const {
    output,
  } = await model({
    input: pixel_values,
  });

  const mascara = await RawImage.fromTensor(
    output[0]
      .mul(255)
      .to("uint8")
  ).resize(
    imagemOriginal.width,
    imagemOriginal.height
  );

  const canvas = document.createElement("canvas");

  canvas.width = imagemOriginal.width;
  canvas.height = imagemOriginal.height;

  const contexto = canvas.getContext("2d");

  if (!contexto) {
    throw new Error(
      "Não foi possível criar o contexto de processamento."
    );
  }

  const imagem = new Image();

  await new Promise<void>((resolve, reject) => {
    imagem.onload = () => resolve();

    imagem.onerror = () => {
      reject(
        new Error(
          "Não foi possível carregar a imagem original."
        )
      );
    };

    imagem.src = imagemUrl;
  });

  contexto.drawImage(
    imagem,
    0,
    0,
    canvas.width,
    canvas.height
  );

  const pixels = contexto.getImageData(
    0,
    0,
    canvas.width,
    canvas.height
  );

  const totalPixels =
    canvas.width * canvas.height;

  const canaisMascara =
    mascara.data.length / totalPixels;

  console.log("Diagnóstico da máscara RMBG:", {
    largura: mascara.width,
    altura: mascara.height,
    totalPixels,
    tamanhoDados: mascara.data.length,
    canaisMascara,
  });

  if (
    !Number.isInteger(canaisMascara) ||
    canaisMascara < 1
  ) {
    throw new Error(
      "Formato inesperado da máscara RMBG."
    );
  }

  for (let i = 0; i < totalPixels; i++) {
    const indiceMascara =
      i * canaisMascara;

    const alpha =
      mascara.data[indiceMascara];

    pixels.data[i * 4 + 3] = alpha;
  }

  contexto.putImageData(
    pixels,
    0,
    0
  );

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }

        reject(
          new Error(
            "Não foi possível gerar o PNG final."
          )
        );
      },
      "image/png"
    );
  });
}