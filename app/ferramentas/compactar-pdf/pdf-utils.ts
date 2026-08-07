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

  if (quality === "low") {
    const pdf = await PDFDocument.load(bytes);

    return await pdf.save({
      useObjectStreams: true,
      addDefaultPage: false,
    });
  }

  const pdfjs = await import("pdfjs-dist");

  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();

  const source = await pdfjs.getDocument({
    data: new Uint8Array(bytes),
  }).promise;

  const output = await PDFDocument.create();
  const renderScale = quality === "medium" ? 1.5 : 1.1;
  const jpegQuality = quality === "medium" ? 0.82 : 0.62;

  for (let pageNumber = 1; pageNumber <= source.numPages; pageNumber++) {
    const sourcePage = await source.getPage(pageNumber);
    const pageSize = sourcePage.getViewport({ scale: 1 });
    const viewport = sourcePage.getViewport({ scale: renderScale });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) throw new Error("Canvas não suportado.");

    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);

    await sourcePage.render({
      canvas,
      canvasContext: context,
      viewport,
    }).promise;

    const jpegBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Falha ao gerar a página."))),
        "image/jpeg",
        jpegQuality
      );
    });

    const embeddedPage = await output.embedJpg(await jpegBlob.arrayBuffer());
    const targetPage = output.addPage([pageSize.width, pageSize.height]);

    targetPage.drawImage(embeddedPage, {
      x: 0,
      y: 0,
      width: pageSize.width,
      height: pageSize.height,
    });
  }

  return await output.save({
    useObjectStreams: true,
    addDefaultPage: false,
  });
}
