import { PDFDocument, degrees } from "pdf-lib";

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

export async function rotatePdf(
  file: File,
  angle: 90 | 180 | 270
): Promise<Uint8Array> {
  const bytes = await file.arrayBuffer();

  const pdf = await PDFDocument.load(bytes);

  pdf.getPages().forEach((page) => {
    page.setRotation(degrees(angle));
  });

  return await pdf.save();
}