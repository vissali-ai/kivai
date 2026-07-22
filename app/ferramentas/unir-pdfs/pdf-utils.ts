import { PDFDocument } from "pdf-lib";

export interface PdfFile {
  id: string;
  file: File;
  pages: number;
  size: number;
}

export async function getPdfPageCount(
  file: File
): Promise<number> {
  const bytes = await file.arrayBuffer();

  const pdf = await PDFDocument.load(bytes);

  return pdf.getPageCount();
}

export async function mergePdfs(
  files: File[]
): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();

  for (const file of files) {
    const bytes = await file.arrayBuffer();

    const pdf = await PDFDocument.load(bytes);

    const copiedPages = await mergedPdf.copyPages(
      pdf,
      pdf.getPageIndices()
    );

    copiedPages.forEach((page) => {
      mergedPdf.addPage(page);
    });
  }

  return await mergedPdf.save();
}