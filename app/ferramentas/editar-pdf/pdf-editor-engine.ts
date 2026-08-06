import type { PDFDocumentProxy } from "pdfjs-dist";
import { StandardFonts, degrees, rgb, type PDFDocument, type PDFImage, type PDFPage } from "pdf-lib";

import { PDF_EDITOR_MAX_PAGES } from "./config";
import type { EditorElement, EditorPage } from "./editor-types";

export type InspectedPdf = { document: PDFDocumentProxy; bytes: Uint8Array; pages: EditorPage[] };

function editorError(code: string) { return new Error(code); }

async function canvasBlob(canvas: HTMLCanvasElement) { return new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(editorError("render-failed")), "image/jpeg", 0.78)); }

export async function inspectEditorPdf(file: File, onStage: (stage: string) => void): Promise<InspectedPdf> {
  const signature = new TextDecoder("ascii").decode(await file.slice(0, 5).arrayBuffer());
  if (signature !== "%PDF-") throw editorError("invalid-pdf");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  let document: PDFDocumentProxy;
  try { document = await pdfjs.getDocument({ data: bytes.slice(), enableXfa: false }).promise; }
  catch (error) { if (error instanceof Error && /password/i.test(`${error.name} ${error.message}`)) throw editorError("protected-pdf"); throw editorError("corrupt-pdf"); }
  if (document.numPages > PDF_EDITOR_MAX_PAGES) { await document.cleanup(); throw editorError("too-many-pages"); }
  onStage("Preparando páginas");
  const pages: EditorPage[] = [];
  for (let index = 0; index < document.numPages; index++) {
    const pdfPage = await document.getPage(index + 1); const viewport = pdfPage.getViewport({ scale: 0.45 }); const canvas = window.document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height); const context = canvas.getContext("2d", { alpha: false }); if (!context) throw editorError("render-failed");
    await pdfPage.render({ canvas, canvasContext: context, viewport, background: "white" }).promise; const blob = await canvasBlob(canvas);
    const natural = pdfPage.getViewport({ scale: 1 }); pages.push({ id: crypto.randomUUID(), sourceIndex: index, width: natural.width, height: natural.height, rotation: 0, thumbnailUrl: URL.createObjectURL(blob), excluded: false, originalIndex: index });
    canvas.width = 1; canvas.height = 1; pdfPage.cleanup();
  }
  return { document, bytes, pages };
}

export async function renderEditorPage(inspected: InspectedPdf, page: EditorPage, canvas: HTMLCanvasElement, scale: number) {
  if (page.sourceIndex === null) { const width = page.rotation % 180 ? page.height : page.width; const height = page.rotation % 180 ? page.width : page.height; canvas.width = Math.ceil(width * scale); canvas.height = Math.ceil(height * scale); const context = canvas.getContext("2d"); if (context) { context.fillStyle = "#fff"; context.fillRect(0, 0, canvas.width, canvas.height); } return; }
  const source = await inspected.document.getPage(page.sourceIndex + 1); const viewport = source.getViewport({ scale, rotation: page.rotation }); canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height); const context = canvas.getContext("2d", { alpha: false }); if (!context) return;
  await source.render({ canvas, canvasContext: context, viewport, background: "white" }).promise; source.cleanup();
}

export function disposeEditorPdf(inspected: InspectedPdf | null) { if (!inspected) return; inspected.pages.forEach((page) => page.thumbnailUrl && URL.revokeObjectURL(page.thumbnailUrl)); void inspected.document.cleanup(); }

function hexColor(value: string) { const normalized = /^#[0-9a-f]{6}$/i.test(value) ? value.slice(1) : "000000"; return rgb(parseInt(normalized.slice(0, 2), 16) / 255, parseInt(normalized.slice(2, 4), 16) / 255, parseInt(normalized.slice(4, 6), 16) / 255); }

async function drawSource(output: PDFDocument, source: PDFDocument, page: EditorPage) {
  const finalWidth = page.rotation % 180 ? page.height : page.width; const finalHeight = page.rotation % 180 ? page.width : page.height; const target = output.addPage([finalWidth, finalHeight]);
  if (page.sourceIndex === null) return target;
  const [embedded] = await output.embedPdf(await source.save(), [page.sourceIndex]);
  if (page.rotation === 0) target.drawPage(embedded, { x: 0, y: 0, width: page.width, height: page.height });
  if (page.rotation === 90) target.drawPage(embedded, { x: page.height, y: 0, width: page.width, height: page.height, rotate: degrees(90) });
  if (page.rotation === 180) target.drawPage(embedded, { x: page.width, y: page.height, width: page.width, height: page.height, rotate: degrees(180) });
  if (page.rotation === 270) target.drawPage(embedded, { x: 0, y: page.width, width: page.width, height: page.height, rotate: degrees(270) });
  return target;
}

async function embeddedImage(pdf: PDFDocument, element: EditorElement, cache: Map<string, PDFImage>) { const existing = cache.get(element.id); if (existing) return existing; if (!element.imageBytes) return null; const image = element.imageFormat === "jpg" ? await pdf.embedJpg(element.imageBytes) : await pdf.embedPng(element.imageBytes); cache.set(element.id, image); return image; }

async function drawElement(pdf: PDFDocument, page: PDFPage, element: EditorElement, fontCache: Map<string, Awaited<ReturnType<PDFDocument["embedFont"]>>>, imageCache: Map<string, PDFImage>) {
  const pw = page.getWidth(); const ph = page.getHeight(); const x = element.x * pw; const width = element.width * pw; const height = element.height * ph; const y = ph - element.y * ph - height; const opacity = Math.max(0, Math.min(1, element.opacity));
  if (element.type === "text" || element.type === "signature") {
    const fontKey = element.fontFamily.includes("Times") || element.fontFamily === "Georgia" ? (element.italic ? StandardFonts.TimesRomanItalic : element.bold ? StandardFonts.TimesRomanBold : StandardFonts.TimesRoman) : element.fontFamily === "Courier" ? (element.bold ? StandardFonts.CourierBold : StandardFonts.Courier) : (element.italic ? StandardFonts.HelveticaOblique : element.bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica);
    let font = fontCache.get(fontKey); if (!font) { font = await pdf.embedFont(fontKey); fontCache.set(fontKey, font); }
    const size = element.fontSize * (pw / 612); const lines = (element.text ?? "").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").split("\n");
    lines.forEach((line, index) => { const lineWidth = font!.widthOfTextAtSize(line, size); const tx = element.align === "center" ? x + Math.max(0, (width - lineWidth) / 2) : element.align === "right" ? x + Math.max(0, width - lineWidth) : x; const ty = y + height - size - index * size * element.lineHeight; page.drawText(line, { x: tx, y: ty, size, font, color: hexColor(element.color), opacity, rotate: degrees(element.rotation) }); if (element.underline) page.drawLine({ start: { x: tx, y: ty - 1 }, end: { x: tx + lineWidth, y: ty - 1 }, thickness: Math.max(0.5, size / 16), color: hexColor(element.color), opacity }); }); return;
  }
  if (element.type === "image") { const image = await embeddedImage(pdf, element, imageCache); if (image) page.drawImage(image, { x, y, width, height, opacity, rotate: degrees(element.rotation) }); return; }
  if (element.type === "rectangle" || element.type === "highlight" || element.type === "cover") { page.drawRectangle({ x, y, width, height, color: hexColor(element.fillColor), borderColor: hexColor(element.borderColor), borderWidth: element.borderWidth, opacity, borderOpacity: opacity, rotate: degrees(element.rotation) }); return; }
  if (element.type === "ellipse") { page.drawEllipse({ x: x + width / 2, y: y + height / 2, xScale: width / 2, yScale: height / 2, color: hexColor(element.fillColor), borderColor: hexColor(element.borderColor), borderWidth: element.borderWidth, opacity, borderOpacity: opacity }); return; }
  if (element.type === "line" || element.type === "arrow") { const start = { x, y: y + height }; const end = { x: x + width, y }; page.drawLine({ start, end, thickness: element.borderWidth, color: hexColor(element.borderColor), opacity, dashArray: element.lineStyle === "solid" ? undefined : element.lineStyle === "dashed" ? [8, 5] : [2, 4] }); if (element.type === "arrow") { const angle = Math.atan2(end.y - start.y, end.x - start.x); const length = Math.max(8, element.borderWidth * 4); page.drawLine({ start: end, end: { x: end.x - length * Math.cos(angle - Math.PI / 6), y: end.y - length * Math.sin(angle - Math.PI / 6) }, thickness: element.borderWidth, color: hexColor(element.borderColor), opacity }); page.drawLine({ start: end, end: { x: end.x - length * Math.cos(angle + Math.PI / 6), y: end.y - length * Math.sin(angle + Math.PI / 6) }, thickness: element.borderWidth, color: hexColor(element.borderColor), opacity }); } return; }
  if (element.type === "draw" && element.points?.length) for (let index = 1; index < element.points.length; index++) { const previous = element.points[index - 1]; const current = element.points[index]; page.drawLine({ start: { x: previous.x * pw, y: ph - previous.y * ph }, end: { x: current.x * pw, y: ph - current.y * ph }, thickness: element.borderWidth, color: hexColor(element.color), opacity }); }
}

export async function exportEditedPdf(bytes: Uint8Array, pages: EditorPage[], elements: EditorElement[], onStage: (stage: string) => void) {
  const { PDFDocument } = await import("pdf-lib"); let source: PDFDocument; try { source = await PDFDocument.load(bytes.slice(), { ignoreEncryption: false, updateMetadata: false }); } catch { throw editorError("protected-pdf"); }
  const output = await PDFDocument.create(); output.setProducer("Kivai"); const fontCache = new Map(); const imageCache = new Map<string, PDFImage>(); const included = pages.filter((page) => !page.excluded); if (!included.length) throw editorError("no-pages");
  onStage("Preparando páginas");
  for (let index = 0; index < included.length; index++) { const state = included[index]; const page = await drawSource(output, source, state); const pageElements = elements.filter((element) => element.pageId === state.id).sort((a, b) => a.z - b.z); onStage(`Processando página ${index + 1} de ${included.length}`); for (const element of pageElements) await drawElement(output, page, element, fontCache, imageCache); }
  onStage("Finalizando o arquivo"); const result = await output.save({ useObjectStreams: true, addDefaultPage: false }); return new Blob([result as BlobPart], { type: "application/pdf" });
}
