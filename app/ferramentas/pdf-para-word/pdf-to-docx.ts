import type { TextItem } from "pdfjs-dist/types/src/display/api";

export type PdfFileInfo = { pages: number };
type ExtractedItem = TextItem & { pageWidth: number; fontSize: number };

async function loadPdf(file: File) {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();
  return pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
}

export async function getPdfFileInfo(file: File): Promise<PdfFileInfo> {
  const pdf = await loadPdf(file);
  return { pages: pdf.numPages };
}

function groupLines(items: ExtractedItem[]) {
  const lines: ExtractedItem[][] = [];
  for (const item of items.sort((a, b) => b.transform[5] - a.transform[5] || a.transform[4] - b.transform[4])) {
    const y = item.transform[5];
    const line = lines.find((candidate) => Math.abs(candidate[0].transform[5] - y) <= Math.max(2, item.fontSize * 0.28));
    if (line) line.push(item);
    else lines.push([item]);
  }
  return lines.map((line) => line.sort((a, b) => a.transform[4] - b.transform[4]));
}

export async function convertPdfToDocx(file: File, onProgress: (value: number) => void): Promise<Blob> {
  const [{ Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, PageBreak }, pdf] = await Promise.all([
    import("docx"),
    loadPdf(file),
  ]);
  const children: InstanceType<typeof Paragraph>[] = [];
  const allFontSizes: number[] = [];
  const pages: ExtractedItem[][] = [];
  let extractedTextCharacters = 0;

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();
    const items = content.items
      .filter((item): item is TextItem => "str" in item && Boolean(item.str.trim()))
      .map((item) => ({ ...item, pageWidth: viewport.width, fontSize: Math.max(Math.abs(item.transform[0]), Math.abs(item.transform[3])) }));
    pages.push(items);
    allFontSizes.push(...items.map((item) => item.fontSize));
    extractedTextCharacters += items.reduce((sum, item) => sum + item.str.trim().length, 0);
    onProgress(Math.round((pageNumber / pdf.numPages) * 55));
  }

  if (extractedTextCharacters === 0) {
    throw new Error("PDF sem camada de texto extraível. OCR é necessário para documentos digitalizados.");
  }

  const sortedSizes = allFontSizes.sort((a, b) => a - b);
  const bodySize = sortedSizes[Math.floor(sortedSizes.length / 2)] || 11;

  pages.forEach((items, pageIndex) => {
    for (const line of groupLines(items)) {
      const first = line[0];
      const maxSize = Math.max(...line.map((item) => item.fontSize));
      const text = line.map((item) => item.str).join(" ").replace(/\s+/g, " ").trim();
      const center = first.transform[4] > first.pageWidth * 0.2 && first.transform[4] + line.reduce((sum, item) => sum + item.width, 0) < first.pageWidth * 0.8;
      const isHeading = maxSize >= bodySize * 1.3 && text.length < 140;
      const isList = /^[•·▪◦‣⁃*-]\s+/.test(text) || /^\d+[.)]\s+/.test(text);
      children.push(new Paragraph({
        heading: isHeading ? (maxSize >= bodySize * 1.65 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2) : undefined,
        alignment: center ? AlignmentType.CENTER : AlignmentType.LEFT,
        bullet: isList && !/^\d/.test(text) ? { level: 0 } : undefined,
        numbering: isList && /^\d/.test(text) ? { reference: "pdf-numbering", level: 0 } : undefined,
        spacing: { after: isHeading ? 160 : 80, line: 276 },
        indent: first.transform[4] > 55 ? { left: Math.round((first.transform[4] - 40) * 20) } : undefined,
        children: line.map((item, index) => new TextRun({
          text: `${index ? " " : ""}${item.str}`,
          size: Math.max(16, Math.min(48, Math.round(item.fontSize * 2))),
          bold: /bold|black|heavy/i.test(item.fontName) || isHeading,
          italics: /italic|oblique/i.test(item.fontName),
          font: item.fontName && !/^[A-Z]+\+/.test(item.fontName) ? item.fontName : undefined,
        })),
      }));
    }
    if (pageIndex < pages.length - 1) children.push(new Paragraph({ children: [new PageBreak()] }));
    onProgress(55 + Math.round(((pageIndex + 1) / pages.length) * 35));
  });

  const document = new Document({
    numbering: { config: [{ reference: "pdf-numbering", levels: [{ level: 0, format: "decimal", text: "%1.", alignment: AlignmentType.START }] }] },
    sections: [{ properties: {}, children }],
    creator: "Kivai",
    title: file.name.replace(/\.pdf$/i, ""),
    description: "Documento convertido de PDF para Word pelo Kivai.",
  });
  const blob = await Packer.toBlob(document);
  onProgress(100);
  return blob;
}
