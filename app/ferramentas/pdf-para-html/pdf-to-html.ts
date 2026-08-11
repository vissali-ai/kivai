import type { TextItem } from "pdfjs-dist/types/src/display/api";
import { PDF_TO_HTML_MAX_PAGES, type ConversionMode } from "./config";

type PositionedText = { text: string; x: number; y: number; width: number; height: number; fontSize: number; fontName: string };
type TextLine = { items: PositionedText[]; text: string; fontSize: number };
export type PdfInspection = { pageCount: number; thumbnailUrl: string };
export type HtmlConversion = { html: string; pages: number; textCharacters: number; scannedWarning: boolean };

function pdfError(code: string) { return new Error(code); }
function escapeHtml(value: string) { return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;"); }

async function loadPdf(file: File) {
  if (!file.size) throw pdfError("invalid-pdf");
  const signature = new TextDecoder("ascii").decode(await file.slice(0, 5).arrayBuffer());
  if (signature !== "%PDF-") throw pdfError("invalid-pdf");
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  try { return await pdfjs.getDocument({ data: await file.arrayBuffer(), enableXfa: false }).promise; }
  catch (error) {
    if (error instanceof Error && /password/i.test(`${error.name} ${error.message}`)) throw pdfError("protected-pdf");
    throw pdfError("corrupt-pdf");
  }
}

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(pdfError("render-failed")), "image/jpeg", 0.78));
}

export async function inspectPdf(file: File, onStage: (stage: string) => void): Promise<PdfInspection> {
  const pdf = await loadPdf(file);
  try {
    if (pdf.numPages > PDF_TO_HTML_MAX_PAGES) throw pdfError("too-many-pages");
    onStage("Preparando visualização");
    const page = await pdf.getPage(1); const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: Math.min(0.45, 300 / base.width) });
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.ceil(viewport.width)); canvas.height = Math.max(1, Math.ceil(viewport.height));
    const context = canvas.getContext("2d", { alpha: false }); if (!context) throw pdfError("render-failed");
    context.fillStyle = "#fff"; context.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvas, canvasContext: context, viewport, background: "white" }).promise;
    const thumbnailUrl = URL.createObjectURL(await canvasToBlob(canvas));
    canvas.width = 1; canvas.height = 1; page.cleanup();
    return { pageCount: pdf.numPages, thumbnailUrl };
  } finally { await pdf.cleanup(); }
}

export function disposeInspection(inspection: PdfInspection | null) { if (inspection?.thumbnailUrl) URL.revokeObjectURL(inspection.thumbnailUrl); }

export function parsePageRange(value: string, pageCount: number) {
  const trimmed = value.trim();
  if (!trimmed) return Array.from({ length: pageCount }, (_, index) => index + 1);
  if (!/^[\d,\-\s]+$/.test(trimmed)) throw pdfError("invalid-pages");
  const pages = new Set<number>();
  for (const part of trimmed.split(",").map((item) => item.trim()).filter(Boolean)) {
    if (/^\d+$/.test(part)) pages.add(Number(part));
    else {
      const match = part.match(/^(\d+)\s*-\s*(\d+)$/);
      if (!match || Number(match[1]) > Number(match[2])) throw pdfError("invalid-pages");
      for (let page = Number(match[1]); page <= Number(match[2]); page++) pages.add(page);
    }
  }
  const result = [...pages].sort((a, b) => a - b);
  if (!result.length || result.some((page) => page < 1 || page > pageCount)) throw pdfError("invalid-pages");
  return result;
}

function groupLines(items: PositionedText[]) {
  const groups: PositionedText[][] = [];
  for (const item of [...items].sort((a, b) => b.y - a.y || a.x - b.x)) {
    const line = groups.find((candidate) => Math.abs(candidate[0].y - item.y) <= Math.max(2.5, item.fontSize * 0.3));
    if (line) line.push(item); else groups.push([item]);
  }
  return groups.map((lineItems): TextLine => {
    lineItems.sort((a, b) => a.x - b.x); let text = ""; let endX = lineItems[0]?.x ?? 0;
    for (const item of lineItems) { const gap = item.x - endX; text += `${text && gap > Math.max(1.5, item.fontSize * 0.12) ? " " : ""}${item.text}`; endX = item.x + item.width; }
    return { items: lineItems, text: text.replace(/\s+/g, " ").trim(), fontSize: Math.max(...lineItems.map((item) => item.fontSize)) };
  }).filter((line) => line.text);
}

function tableCells(line: TextLine) {
  if (line.items.length < 2) return null;
  const cells: string[] = []; let current = ""; let endX = line.items[0].x;
  for (const item of line.items) {
    const gap = item.x - endX;
    if (current && gap > Math.max(14, item.fontSize * 1.25)) { cells.push(current.trim()); current = item.text; }
    else current = `${current}${current ? " " : ""}${item.text}`;
    endX = item.x + item.width;
  }
  if (current.trim()) cells.push(current.trim());
  return cells.length >= 2 ? cells : null;
}

function safeLinksHtml(links: string[]) {
  const safe = [...new Set(links)].filter((url) => /^(https?:|mailto:)/i.test(url));
  return safe.length ? `<nav class="pdf-links" aria-label="Links da página"><h2>Links</h2><ul>${safe.map((url) => `<li><a href="${escapeHtml(url)}" rel="noopener noreferrer">${escapeHtml(url)}</a></li>`).join("")}</ul></nav>` : "";
}

function structuredPage(lines: TextLine[], pageNumber: number, links: string[]) {
  if (!lines.length) return `<section class="pdf-page" data-page="${pageNumber}"><p class="empty-page">Página sem texto extraível.</p></section>`;
  const sizes = lines.map((line) => line.fontSize).sort((a, b) => a - b); const median = sizes[Math.floor(sizes.length / 2)] || 12;
  const output = [`<section class="pdf-page" data-page="${pageNumber}">`]; let list: "ul" | "ol" | null = null;
  const closeList = () => { if (list) { output.push(`</${list}>`); list = null; } };
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index]; const firstCells = tableCells(line); const secondCells = lines[index + 1] ? tableCells(lines[index + 1]) : null;
    if (firstCells && secondCells) {
      closeList(); const rows: string[][] = [firstCells];
      while (lines[index + 1]) { const cells = tableCells(lines[index + 1]); if (!cells) break; rows.push(cells); index++; }
      const columnCount = Math.max(...rows.map((row) => row.length));
      output.push(`<table><thead><tr>${Array.from({ length: columnCount }, (_, cell) => `<th>${escapeHtml(rows[0][cell] ?? "")}</th>`).join("")}</tr></thead><tbody>${rows.slice(1).map((row) => `<tr>${Array.from({ length: columnCount }, (_, cell) => `<td>${escapeHtml(row[cell] ?? "")}</td>`).join("")}</tr>`).join("")}</tbody></table>`);
      continue;
    }
    const bullet = line.text.match(/^[•●▪◦\-]\s*(.+)$/); const numbered = line.text.match(/^\d+[.)]\s*(.+)$/);
    if (bullet || numbered) { const next = bullet ? "ul" : "ol"; if (list !== next) { closeList(); list = next; output.push(`<${next}>`); } output.push(`<li>${escapeHtml((bullet?.[1] ?? numbered?.[1]) || line.text)}</li>`); continue; }
    closeList(); const ratio = line.fontSize / median; const tag = ratio >= 1.75 ? "h1" : ratio >= 1.42 ? "h2" : ratio >= 1.22 ? "h3" : "p";
    const bold = line.items.every((item) => /bold|black|heavy/i.test(item.fontName)); const italic = line.items.every((item) => /italic|oblique/i.test(item.fontName));
    let content = escapeHtml(line.text); if (bold && tag === "p") content = `<strong>${content}</strong>`; if (italic && tag === "p") content = `<em>${content}</em>`;
    output.push(`<${tag}>${content}</${tag}>`);
  }
  closeList(); output.push(safeLinksHtml(links)); output.push("</section>"); return output.join("\n");
}

function visualPage(items: PositionedText[], pageNumber: number, width: number, height: number, links: string[]) {
  const spans = items.map((item) => `<span style="left:${(item.x / width * 100).toFixed(3)}%;top:${((height - item.y - item.height) / height * 100).toFixed(3)}%;font-size:${Math.max(8, item.fontSize).toFixed(2)}px">${escapeHtml(item.text)}</span>`).join("\n");
  return `<section class="pdf-page visual-page" data-page="${pageNumber}" style="aspect-ratio:${width}/${height}">${spans || '<p class="empty-page">Página sem texto extraível.</p>'}</section>${safeLinksHtml(links)}`;
}

function documentHtml(title: string, body: string, mode: ConversionMode) {
  const css = mode === "visual" ? `body{margin:0;background:#eee;font-family:Arial,sans-serif}.pdf-page{position:relative;max-width:900px;margin:24px auto;background:#fff;box-shadow:0 2px 12px #0002;overflow:hidden}.visual-page span{position:absolute;white-space:pre;line-height:1.1}.pdf-links{max-width:900px;margin:16px auto;padding:16px;background:#fff}` : `body{max-width:900px;margin:0 auto;padding:32px 20px;color:#1f2937;font:16px/1.65 Arial,sans-serif}.pdf-page{padding:20px 0;border-bottom:1px solid #ddd}h1,h2,h3{line-height:1.25}table{width:100%;border-collapse:collapse;margin:1rem 0}th,td{border:1px solid #bbb;padding:8px;text-align:left}.empty-page{color:#666;font-style:italic}@media(max-width:600px){body{padding:20px 14px}.pdf-page{overflow-x:auto}}`;
  return `<!DOCTYPE html>\n<html lang="pt-BR">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>${escapeHtml(title)}</title>\n<style>${css}</style>\n</head>\n<body>\n${body}\n</body>\n</html>`;
}

export async function convertPdfToHtml(file: File, pages: number[], mode: ConversionMode, onStage: (stage: string) => void): Promise<HtmlConversion> {
  if (!pages.length) throw pdfError("invalid-pages");
  const pdf = await loadPdf(file); const pageHtml: string[] = []; let textCharacters = 0; let emptyPages = 0;
  try {
    for (let index = 0; index < pages.length; index++) {
      onStage(`Processando página ${index + 1} de ${pages.length}`); const pageNumber = pages[index]; const page = await pdf.getPage(pageNumber); const viewport = page.getViewport({ scale: 1 });
      const content = await page.getTextContent({ disableNormalization: false });
      const annotations = await page.getAnnotations({ intent: "display" });
      const links = annotations.map((annotation) => typeof annotation.url === "string" ? annotation.url : "").filter(Boolean);
      const items = content.items.filter((item): item is TextItem => "str" in item && Boolean(item.str.trim())).map((item) => ({ text: item.str, x: item.transform[4], y: item.transform[5], width: Math.max(item.width, 1), height: Math.max(item.height, Math.abs(item.transform[3]), 1), fontSize: Math.max(Math.abs(item.transform[0]), Math.abs(item.transform[3]), 8), fontName: item.fontName || "" }));
      const count = items.reduce((sum, item) => sum + item.text.trim().length, 0); textCharacters += count; if (count < 12) emptyPages++;
      onStage("Analisando estrutura"); pageHtml.push(mode === "structured" ? structuredPage(groupLines(items), pageNumber, links) : visualPage(items, pageNumber, viewport.width, viewport.height, links)); page.cleanup();
    }
  } finally { await pdf.cleanup(); }
  if (!textCharacters) throw pdfError("no-content");
  onStage("Criando HTML"); const title = file.name.replace(/\.pdf$/i, "") || "Documento convertido";
  return { html: documentHtml(title, pageHtml.join("\n"), mode), pages: pages.length, textCharacters, scannedWarning: emptyPages > 0 };
}

export function sanitizeHtmlDocument(html: string) {
  const documentNode = new DOMParser().parseFromString(html, "text/html");
  documentNode.querySelectorAll("script,iframe,object,embed,applet,base,form,meta[http-equiv]").forEach((element) => element.remove());
  documentNode.querySelectorAll("*").forEach((element) => {
    for (const attribute of [...element.attributes]) {
      const name = attribute.name.toLowerCase(); const value = attribute.value.trim();
      if (name.startsWith("on") || name === "srcdoc") element.removeAttribute(attribute.name);
      if (["href", "src", "action", "formaction"].includes(name) && /^(javascript|vbscript|file):/i.test(value.replace(/\s/g, ""))) element.removeAttribute(attribute.name);
      if (name === "style" && /expression\s*\(|url\s*\(\s*['"]?javascript:/i.test(value)) element.removeAttribute(attribute.name);
    }
    if (element.tagName === "A" && element.getAttribute("href")) element.setAttribute("rel", "noopener noreferrer");
  });
  documentNode.querySelectorAll("style").forEach((style) => { style.textContent = (style.textContent || "").replace(/@import[^;]+;/gi, "").replace(/url\s*\(\s*['"]?javascript:[^)]+\)/gi, ""); });
  return `<!DOCTYPE html>\n${documentNode.documentElement.outerHTML}`;
}
