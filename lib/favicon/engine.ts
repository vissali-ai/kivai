import JSZip from "jszip";

export type FaviconAsset = { name: string; size: number; blob: Blob; url: string };

export async function generateFaviconAssets(file: File, names: Record<number, string>) {
  const image = await loadImage(file);
  const assets = await Promise.all(
    Object.entries(names).map(async ([value, name]) => {
      const size = Number(value);
      const blob = await renderPng(image, size);
      return { name, size, blob, url: URL.createObjectURL(blob) };
    })
  );
  const icoSources = assets.filter((asset) => [16, 32, 48].includes(asset.size));
  const icoBlob = new Blob([await createIco(icoSources)], { type: "image/x-icon" });
  return { assets, icoBlob, icoUrl: URL.createObjectURL(icoBlob) };
}

export async function createFaviconZip(assets: FaviconAsset[], icoBlob: Blob) {
  const zip = new JSZip();
  zip.file("favicon.ico", icoBlob);
  assets.forEach((asset) => zip.file(asset.name, asset.blob));
  return zip.generateAsync({ type: "blob" });
}

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Não foi possível abrir a imagem.")); };
    image.src = url;
  });
}

function renderPng(image: HTMLImageElement, size: number) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Seu navegador não suporta Canvas.");
  const scale = Math.min(size / image.naturalWidth, size / image.naturalHeight);
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(image, (size - width) / 2, (size - height) / 2, width, height);
  return new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Não foi possível gerar o PNG.")), "image/png"));
}

async function createIco(assets: FaviconAsset[]) {
  const data = await Promise.all(assets.map((asset) => asset.blob.arrayBuffer()));
  const headerSize = 6 + assets.length * 16;
  const result = new Uint8Array(headerSize + data.reduce((total, item) => total + item.byteLength, 0));
  const view = new DataView(result.buffer);
  view.setUint16(0, 0, true);
  view.setUint16(2, 1, true);
  view.setUint16(4, assets.length, true);
  let offset = headerSize;
  assets.forEach((asset, index) => {
    const entry = 6 + index * 16;
    view.setUint8(entry, asset.size === 256 ? 0 : asset.size);
    view.setUint8(entry + 1, asset.size === 256 ? 0 : asset.size);
    view.setUint8(entry + 2, 0);
    view.setUint8(entry + 3, 0);
    view.setUint16(entry + 4, 1, true);
    view.setUint16(entry + 6, 32, true);
    view.setUint32(entry + 8, data[index].byteLength, true);
    view.setUint32(entry + 12, offset, true);
    result.set(new Uint8Array(data[index]), offset);
    offset += data[index].byteLength;
  });
  return result;
}
