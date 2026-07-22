import { PDFDocument } from "pdf-lib";

export interface PdfInfo {
  pages: number;
  size: number;
}

export async function getPdfInfo(
  file: File
): Promise<PdfInfo> {
  const bytes = await file.arrayBuffer();

  const pdf = await PDFDocument.load(bytes);

  return {
    pages: pdf.getPageCount(),
    size: file.size,
  };
}

export async function compressPdf(
  file: File,
  quality: "low" | "medium" | "high"
): Promise<Uint8Array> {
  const bytes = await file.arrayBuffer();

  const pdf = await PDFDocument.load(bytes);

  return await pdf.save({
    useObjectStreams: true,
    addDefaultPage: false,
    objectsPerTick:
      quality === "high"
        ? 20
        : quality === "medium"
        ? 40
        : 80,
  });
}