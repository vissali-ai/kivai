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

export async function splitPdfAllPages(
  file: File
): Promise<
  {
    name: string;
    bytes: Uint8Array;
  }[]
> {
  const bytes = await file.arrayBuffer();

  const pdf = await PDFDocument.load(bytes);

  const result: {
    name: string;
    bytes: Uint8Array;
  }[] = [];

  for (let i = 0; i < pdf.getPageCount(); i++) {
    const newPdf = await PDFDocument.create();

    const [page] = await newPdf.copyPages(pdf, [i]);

    newPdf.addPage(page);

    result.push({
      name: `pagina-${i + 1}.pdf`,
      bytes: await newPdf.save(),
    });
  }

  return result;
}