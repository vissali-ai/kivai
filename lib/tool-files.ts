export type FileValidationOptions = {
  file: File;
  acceptedMimeTypes?: readonly string[];
  acceptedExtensions?: readonly string[];
  maxSizeBytes?: number;
};

export type ImageMetadata = {
  width: number;
  height: number;
  mimeType: string;
  size: number;
};

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const unit = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: unit ? 2 : 0 }).format(bytes / 1024 ** unit)} ${units[unit]}`;
}

export function validateFile({ file, acceptedMimeTypes = [], acceptedExtensions = [], maxSizeBytes }: FileValidationOptions): string | null {
  if (!file || file.size === 0) return "O arquivo está vazio. Tente selecionar outro.";
  const extension = file.name.includes(".") ? `.${file.name.split(".").pop()?.toLowerCase()}` : "";
  const normalizedExtensions = acceptedExtensions.map((item) => item.toLowerCase().startsWith(".") ? item.toLowerCase() : `.${item.toLowerCase()}`);
  const mimeIsAccepted = acceptedMimeTypes.length === 0 || acceptedMimeTypes.includes(file.type);
  const extensionIsAccepted = normalizedExtensions.length === 0 || normalizedExtensions.includes(extension);
  if (!mimeIsAccepted || !extensionIsAccepted) {
    const formats = normalizedExtensions.map((item) => item.slice(1).toUpperCase()).join(", ");
    return `Este formato não é compatível.${formats ? ` Envie ${formats}.` : " Tente selecionar outro arquivo."}`;
  }
  if (maxSizeBytes && file.size > maxSizeBytes) return `O arquivo ultrapassa o limite de ${formatFileSize(maxSizeBytes)}.`;
  return null;
}

export function findDuplicateFiles(files: readonly File[]): File[] {
  const seen = new Set<string>();
  return files.filter((file) => {
    const key = `${file.name.toLowerCase()}:${file.size}:${file.lastModified}`;
    if (seen.has(key)) return true;
    seen.add(key);
    return false;
  });
}

export async function getImageMetadata(file: File): Promise<ImageMetadata> {
  const error = validateFile({ file, acceptedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"] });
  if (error) throw new Error(error);
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = "async";
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Não foi possível ler a imagem. Ela pode estar corrompida ou usar um formato incompatível."));
      image.src = url;
    });
    if (!image.naturalWidth || !image.naturalHeight) throw new Error("A imagem não possui dimensões válidas.");
    return { width: image.naturalWidth, height: image.naturalHeight, mimeType: file.type, size: file.size };
  } finally {
    URL.revokeObjectURL(url);
  }
}
