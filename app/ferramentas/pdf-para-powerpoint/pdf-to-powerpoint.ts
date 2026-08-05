import type { PageFit, RenderQuality, SlideFormat } from "./config";
import { PDF_TO_POWERPOINT_MAX_PAGES } from "./config";

export type PdfPagePreview = { pageNumber: number; width: number; height: number; thumbnailUrl: string };

async function loadPdf(file: File) {
  const signature = new TextDecoder("ascii").decode(await file.slice(0, 5).arrayBuffer());
  if (signature !== "%PDF-") throw new Error("invalid-pdf");
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  try {
    return await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  } catch (error) {
    if (error instanceof Error && /password/i.test(`${error.name} ${error.message}`)) throw new Error("protected-pdf");
    throw new Error("corrupt-pdf");
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number) {
  return new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("render-failed")), type, quality));
}

export async function inspectPdf(file: File, onProgress: (current: number, total: number) => void): Promise<PdfPagePreview[]> {
  const pdf = await loadPdf(file);
  try {
    if (pdf.numPages > PDF_TO_POWERPOINT_MAX_PAGES) throw new Error("too-many-pages");
    const previews: PdfPagePreview[] = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const base = page.getViewport({ scale: 1 });
      const scale = Math.min(0.42, 280 / base.width);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.ceil(viewport.width));
      canvas.height = Math.max(1, Math.ceil(viewport.height));
      const context = canvas.getContext("2d", { alpha: false });
      if (!context) throw new Error("render-failed");
      context.fillStyle = "#ffffff"; context.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvas, canvasContext: context, viewport, background: "white" }).promise;
      const blob = await canvasToBlob(canvas, "image/jpeg", 0.78);
      previews.push({ pageNumber, width: base.width, height: base.height, thumbnailUrl: URL.createObjectURL(blob) });
      canvas.width = 1; canvas.height = 1;
      page.cleanup(); onProgress(pageNumber, pdf.numPages);
    }
    return previews;
  } finally {
    await pdf.cleanup();
  }
}

function imagePlacement(imageRatio: number, slideWidth: number, slideHeight: number, fit: PageFit) {
  const slideRatio = slideWidth / slideHeight;
  const width = fit === "contain" ? (imageRatio > slideRatio ? slideWidth : slideHeight * imageRatio) : (imageRatio > slideRatio ? slideHeight * imageRatio : slideWidth);
  const height = width / imageRatio;
  return { x: (slideWidth - width) / 2, y: (slideHeight - height) / 2, w: width, h: height };
}

export async function convertPdfToPowerPoint(file: File, pageOrder: number[], options: { format: SlideFormat; fit: PageFit; quality: RenderQuality }, onProgress: (current: number, total: number, stage: string) => void): Promise<Blob> {
  if (!pageOrder.length) throw new Error("no-pages");
  const [pdf, { default: PptxGenJS }] = await Promise.all([loadPdf(file), import("pptxgenjs")]);
  try {
    const pptx = new PptxGenJS();
    const firstPage = await pdf.getPage(pageOrder[0]);
    const firstViewport = firstPage.getViewport({ scale: 1 });
    const firstRatio = firstViewport.width / firstViewport.height;
    let slideWidth = 10;
    let slideHeight = 7.5;
    if (options.format === "wide") { pptx.layout = "LAYOUT_WIDE"; slideWidth = 13.333; slideHeight = 7.5; }
    else if (options.format === "standard") { pptx.layout = "LAYOUT_4X3"; }
    else {
      slideHeight = Math.max(5, Math.min(14, slideWidth / firstRatio));
      pptx.defineLayout({ name: "KIVAI_AUTO", width: slideWidth, height: slideHeight });
      pptx.layout = "KIVAI_AUTO";
    }
    pptx.author = "Kivai"; pptx.subject = "PDF convertido em apresentação"; pptx.title = file.name.replace(/\.pdf$/i, "");
    const scale = options.quality === "high" ? 2.1 : 1.45;
    const jpegQuality = options.quality === "high" ? 0.96 : 0.88;
    for (let index = 0; index < pageOrder.length; index++) {
      const page = await pdf.getPage(pageOrder[index]);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.ceil(viewport.width)); canvas.height = Math.max(1, Math.ceil(viewport.height));
      const context = canvas.getContext("2d", { alpha: false });
      if (!context) throw new Error("render-failed");
      context.fillStyle = "#ffffff"; context.fillRect(0, 0, canvas.width, canvas.height);
      onProgress(index, pageOrder.length, "Criando os slides");
      await page.render({ canvas, canvasContext: context, viewport, background: "white" }).promise;
      const slide = pptx.addSlide(); slide.background = { color: "FFFFFF" };
      slide.addImage({ data: canvas.toDataURL("image/jpeg", jpegQuality), ...imagePlacement(viewport.width / viewport.height, slideWidth, slideHeight, options.fit) });
      canvas.width = 1; canvas.height = 1; page.cleanup(); onProgress(index + 1, pageOrder.length, "Criando os slides");
    }
    onProgress(pageOrder.length, pageOrder.length, "Gerando o PowerPoint");
    const output = await pptx.write({ outputType: "blob" });
    if (!(output instanceof Blob)) throw new Error("pptx-failed");
    onProgress(pageOrder.length, pageOrder.length, "Finalizando o arquivo");
    return output;
  } catch (error) {
    if (error instanceof RangeError || (error instanceof Error && /memory|allocation/i.test(error.message))) throw new Error("memory");
    throw error;
  } finally {
    await pdf.cleanup();
  }
}
