export const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

export function loadImage(file: Blob) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    // A imagem é usada tanto pelo Canvas quanto pela prévia. A URL precisa
    // permanecer ativa enquanto o componente a estiver exibindo.
    image.onload = () => resolve(image);
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Não foi possível abrir a imagem.")); };
    image.src = url;
  });
}

export function canvasBlob(canvas: HTMLCanvasElement, type = "image/png", quality = 0.92) {
  return new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Não foi possível gerar a imagem.")), type, quality));
}

export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
