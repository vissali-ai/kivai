import {
  AutoModel,
  AutoProcessor,
  RawImage,
} from "@huggingface/transformers";

const MODEL_ID = "studioludens/birefnet-lite-512";

let modelPromise: Promise<any> | null = null;
let processorPromise: Promise<any> | null = null;

async function carregarMotor() {
  if (!modelPromise) {
   modelPromise = AutoModel.from_pretrained(MODEL_ID, {
  dtype: "fp32",
});
  }

  if (!processorPromise) {
    processorPromise = AutoProcessor.from_pretrained(MODEL_ID);
  }

  const [model, processor] = await Promise.all([
    modelPromise,
    processorPromise,
  ]);

  return { model, processor };
}

export async function removerFundoBiRefNet(
  arquivo: File
): Promise<Blob> {
  const { model, processor } = await carregarMotor();

  const bytes = new Uint8Array(await arquivo.arrayBuffer());
  const imagem = await RawImage.fromBlob(
    new Blob([bytes], { type: arquivo.type })
  );

  const larguraOriginal = imagem.width;
  const alturaOriginal = imagem.height;

const inputs = await processor(imagem);

const pixelValues =
  inputs.pixel_values ??
  inputs.input_image ??
  Object.values(inputs)[0];

if (!pixelValues) {
  throw new Error(
    "O Motor C não conseguiu preparar a imagem para processamento."
  );
}

const outputs = await model({
  input_image: pixelValues,
});

  const tensor =
    outputs.logits ??
    outputs.output ??
    outputs[0] ??
    Object.values(outputs)[0];

  if (!tensor) {
    throw new Error("O Motor C não retornou uma máscara válida.");
  }

  const dims = tensor.dims;

  if (!dims || dims.length < 2) {
    throw new Error("Dimensões inválidas na máscara do Motor C.");
  }

  const alturaMascara = dims[dims.length - 2];
  const larguraMascara = dims[dims.length - 1];

  const dados = tensor.data as Float32Array;

  const mascaraCanvas = document.createElement("canvas");
  mascaraCanvas.width = larguraMascara;
  mascaraCanvas.height = alturaMascara;

  const mascaraCtx = mascaraCanvas.getContext("2d");

  if (!mascaraCtx) {
    throw new Error("Não foi possível criar o canvas da máscara.");
  }

  const mascaraImageData = mascaraCtx.createImageData(
    larguraMascara,
    alturaMascara
  );

for (let i = 0; i < larguraMascara * alturaMascara; i++) {
  const valor = Number(dados[i]);

  const probabilidade =
    valor >= 0 && valor <= 1
      ? valor
      : 1 / (1 + Math.exp(-valor));

  const alpha = Math.max(
    0,
    Math.min(255, Math.round(probabilidade * 255))
  );

  const indice = i * 4;

  mascaraImageData.data[indice] = 255;
  mascaraImageData.data[indice + 1] = 255;
  mascaraImageData.data[indice + 2] = 255;
  mascaraImageData.data[indice + 3] = alpha;
}

  mascaraCtx.putImageData(mascaraImageData, 0, 0);

  const canvasFinal = document.createElement("canvas");
  canvasFinal.width = larguraOriginal;
  canvasFinal.height = alturaOriginal;

  const ctxFinal = canvasFinal.getContext("2d");

  if (!ctxFinal) {
    throw new Error("Não foi possível criar o canvas final.");
  }

  const bitmap = await createImageBitmap(arquivo);

  ctxFinal.drawImage(
    bitmap,
    0,
    0,
    larguraOriginal,
    alturaOriginal
  );

  ctxFinal.globalCompositeOperation = "destination-in";

  ctxFinal.drawImage(
    mascaraCanvas,
    0,
    0,
    larguraOriginal,
    alturaOriginal
  );

  ctxFinal.globalCompositeOperation = "source-over";

  const blob = await new Promise<Blob | null>((resolve) => {
    canvasFinal.toBlob(resolve, "image/png");
  });

  bitmap.close();

  if (!blob) {
    throw new Error("Não foi possível gerar o PNG final.");
  }

  return blob;
}