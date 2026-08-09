import { degrees } from "pdf-lib";
import { PDF_PAGE_SIZES } from "../redimensionar-pdf/config";
import type { ResizePageInfo } from "../redimensionar-pdf/resize-pdf-engine";
import { SHEET_SIZES, mmToPoints, type Position, type PrintSettings } from "./config";

export type Slot = { x: number; y: number; width: number; height: number; sourcePage: number };
export type SheetLayout = { width: number; height: number; slots: Slot[]; columns: number; rows: number; occupiedPercent: number };
export type VisualPlacement = { x: number; y: number; width: number; height: number };
export type VisualCrop = { x: number; y: number; width: number; height: number };
function fail(code: string): never { throw new Error(code); }
function sheetDimensions(settings: PrintSettings, source: ResizePageInfo) { const selected = settings.sheet === "Personalizado" ? settings.customSheet : { width: SHEET_SIZES[settings.sheet].widthMm, height: SHEET_SIZES[settings.sheet].heightMm }; if (selected.width <= 20 || selected.height <= 20) fail("invalid-sheet"); const landscape = settings.orientation === "original" ? source.orientation === "landscape" : settings.orientation === "landscape"; return { width: mmToPoints(landscape ? selected.height : selected.width), height: mmToPoints(landscape ? selected.width : selected.height) }; }
function gridFor(count: number, order: PrintSettings["order"]) { if (count === 1) return [1, 1]; if (count === 2) return order === "vertical" ? [1, 2] : [2, 1]; if (count === 6) return order === "vertical" ? [2, 3] : [3, 2]; if (count === 8) return order === "vertical" ? [2, 4] : [4, 2]; const side = Math.ceil(Math.sqrt(count)); return [side, Math.ceil(count / side)]; }
function contentBox(source: ResizePageInfo, settings: PrintSettings, maxWidth: number, maxHeight: number) { let width = source.widthPt; let height = source.heightPt; if (settings.content !== "original" && settings.content !== "scale") { const size = PDF_PAGE_SIZES[settings.content]; const landscape = source.orientation === "landscape"; width = mmToPoints(landscape ? size.heightMm : size.widthMm); height = mmToPoints(landscape ? size.widthMm : size.heightMm); } const scale = settings.content === "scale" ? settings.scale / 100 : Math.min(1, maxWidth / width, maxHeight / height); width *= scale; height *= scale; if (width > maxWidth || height > maxHeight) { const fit = Math.min(maxWidth / width, maxHeight / height); width *= fit; height *= fit; } return { width, height }; }
function align(position: PrintSettings["position"], freeX: number, freeY: number) { const x = position.endsWith("right") ? freeX : position.endsWith("center") || position === "center" || position.startsWith("top-center") || position.startsWith("bottom-center") ? freeX / 2 : 0; const y = position.startsWith("top") ? freeY : position.startsWith("center") || position === "center" ? freeY / 2 : 0; return { x, y }; }

function createPositionedLayout(pages: ResizePageInfo[], settings: PrintSettings, positions: Position[], startPage: number): SheetLayout { const source = pages[startPage] ?? pages[0]; const sheet = sheetDimensions(settings, source); const margins = { left: mmToPoints(settings.margins.left), right: mmToPoints(settings.margins.right), top: mmToPoints(settings.margins.top), bottom: mmToPoints(settings.margins.bottom) }; const availableWidth = sheet.width - margins.left - margins.right; const availableHeight = sheet.height - margins.top - margins.bottom; if (availableWidth <= 10 || availableHeight <= 10) fail("invalid-margins"); const slots: Slot[] = []; for (let sourcePage = startPage; sourcePage < pages.length; sourcePage++) { const box = contentBox(pages[sourcePage], settings, availableWidth, availableHeight); const position = positions[sourcePage] ?? "center"; const offset = position === "custom" ? { x: mmToPoints(settings.customPosition.x), y: mmToPoints(settings.customPosition.y) } : align(position, availableWidth - box.width, availableHeight - box.height); slots.push({ x: margins.left + offset.x, y: margins.bottom + offset.y, width: box.width, height: box.height, sourcePage }); } const occupied = slots.reduce((sum, slot) => sum + slot.width * slot.height, 0); return { ...sheet, slots, columns: 1, rows: 1, occupiedPercent: Math.min(100, occupied / (sheet.width * sheet.height) * 100) }; }

export function createLayout(pages: ResizePageInfo[], settings: PrintSettings, startPage = 0, pagePositions?: Position[]): SheetLayout { if (pagePositions?.length) return createPositionedLayout(pages, settings, pagePositions, startPage); const source = pages[startPage] ?? pages[0]; const sheet = sheetDimensions(settings, source); const margins = { left: mmToPoints(settings.margins.left), right: mmToPoints(settings.margins.right), top: mmToPoints(settings.margins.top), bottom: mmToPoints(settings.margins.bottom) }; const availableWidth = sheet.width - margins.left - margins.right; const availableHeight = sheet.height - margins.top - margins.bottom; if (availableWidth <= 10 || availableHeight <= 10) fail("invalid-margins"); let count = settings.count === "auto" ? 16 : Math.max(1, Math.min(100, Math.floor(settings.count))); const [columns, rows] = gridFor(count, settings.order); const gapX = mmToPoints(settings.gapX); const gapY = mmToPoints(settings.gapY); const cellWidth = (availableWidth - gapX * (columns - 1)) / columns; const cellHeight = (availableHeight - gapY * (rows - 1)) / rows; if (cellWidth <= 5 || cellHeight <= 5) fail("invalid-spacing"); const box = contentBox(source, settings, cellWidth, cellHeight); if (settings.count === "auto") { const cols = Math.max(1, Math.floor((availableWidth + gapX) / (box.width + gapX))); const rowsAuto = Math.max(1, Math.floor((availableHeight + gapY) / (box.height + gapY))); count = Math.min(100, cols * rowsAuto); return createLayout(pages, { ...settings, count }, startPage); } const slots: Slot[] = []; for (let index = 0; index < count; index++) { let row = Math.floor(index / columns); let col = index % columns; if (settings.order === "vertical") { col = Math.floor(index / rows); row = index % rows; } if (settings.order === "zigzag" && row % 2) col = columns - 1 - col; const sourcePage = settings.repeat ? startPage : startPage + index; if (sourcePage >= pages.length) break; const itemBox = contentBox(pages[sourcePage], settings, cellWidth, cellHeight); const freeX = cellWidth - itemBox.width; const freeY = cellHeight - itemBox.height; const offset = settings.position === "custom" ? { x: mmToPoints(settings.customPosition.x), y: mmToPoints(settings.customPosition.y) } : align(settings.position, freeX, freeY); slots.push({ x: margins.left + col * (cellWidth + gapX) + offset.x, y: margins.bottom + (rows - 1 - row) * (cellHeight + gapY) + offset.y, width: itemBox.width, height: itemBox.height, sourcePage }); } const occupied = slots.reduce((sum, slot) => sum + slot.width * slot.height, 0); return { ...sheet, slots, columns, rows, occupiedPercent: Math.min(100, occupied / (sheet.width * sheet.height) * 100) }; }

export function createVisualLayout(pages: ResizePageInfo[], settings: PrintSettings, placements: VisualPlacement[]): SheetLayout {
  const sheet = sheetDimensions(settings, pages[0]);
  const slots = placements.slice(0, pages.length).map((placement, sourcePage) => ({
    x: placement.x * sheet.width,
    y: sheet.height - (placement.y + placement.height) * sheet.height,
    width: placement.width * sheet.width,
    height: placement.height * sheet.height,
    sourcePage,
  }));
  const occupied = slots.reduce((sum, slot) => sum + slot.width * slot.height, 0);
  return { ...sheet, slots, columns: 1, rows: 1, occupiedPercent: Math.min(100, occupied / (sheet.width * sheet.height) * 100) };
}

function cropBox(page: ResizePageInfo, rawWidth: number, rawHeight: number, crop: VisualCrop) {
  const rotation = ((page.rotation % 360) + 360) % 360;
  const visualWidth = page.widthPt;
  const visualHeight = page.heightPt;
  const left = crop.x * visualWidth;
  const right = (crop.x + crop.width) * visualWidth;
  const bottom = (1 - crop.y - crop.height) * visualHeight;
  const top = (1 - crop.y) * visualHeight;
  if (rotation === 90) return { left: rawWidth - top, right: rawWidth - bottom, bottom: left, top: right };
  if (rotation === 180) return { left: rawWidth - right, right: rawWidth - left, bottom: rawHeight - top, top: rawHeight - bottom };
  if (rotation === 270) return { left: bottom, right: top, bottom: rawHeight - right, top: rawHeight - left };
  return { left, right, bottom, top };
}

export async function buildVisualPrintPdf(bytes: Uint8Array, pages: ResizePageInfo[], settings: PrintSettings, placements: VisualPlacement[], crops: VisualCrop[], onStage: (value: string) => void) {
  const { PDFDocument, rgb } = await import("pdf-lib");
  const source = await PDFDocument.load(bytes.slice(), { ignoreEncryption: false, updateMetadata: false });
  const output = await PDFDocument.create();
  const layout = createVisualLayout(pages, settings, placements);
  const sheet = output.addPage([layout.width, layout.height]);
  sheet.drawRectangle({ x: 0, y: 0, width: layout.width, height: layout.height, color: rgb(1, 1, 1) });
  for (const slot of layout.slots) {
    const info = pages[slot.sourcePage];
    const sourcePage = source.getPage(slot.sourcePage);
    const crop = crops[slot.sourcePage] ?? { x: 0, y: 0, width: 1, height: 1 };
    const rawSize = sourcePage.getSize();
    const embedded = await output.embedPage(sourcePage, cropBox(info, rawSize.width, rawSize.height, crop));
    const rotation = ((info.rotation % 360) + 360) % 360;
    const visualRatio = (info.widthPt * crop.width) / (info.heightPt * crop.height);
    let drawWidth = slot.width;
    let drawHeight = slot.height;
    if (drawWidth / drawHeight > visualRatio) drawWidth = drawHeight * visualRatio;
    else drawHeight = drawWidth / visualRatio;
    const drawX = slot.x + (slot.width - drawWidth) / 2;
    const drawY = slot.y + (slot.height - drawHeight) / 2;
    if (rotation === 90) sheet.drawPage(embedded, { x: drawX + drawWidth, y: drawY, width: drawHeight, height: drawWidth, rotate: degrees(90) });
    else if (rotation === 180) sheet.drawPage(embedded, { x: drawX + drawWidth, y: drawY + drawHeight, width: drawWidth, height: drawHeight, rotate: degrees(180) });
    else if (rotation === 270) sheet.drawPage(embedded, { x: drawX, y: drawY + drawHeight, width: drawHeight, height: drawWidth, rotate: degrees(270) });
    else sheet.drawPage(embedded, { x: drawX, y: drawY, width: drawWidth, height: drawHeight });
  }
  onStage("Gerando o PDF para impressão");
  return new Blob([await output.save({ useObjectStreams: true }) as BlobPart], { type: "application/pdf" });
}

export async function buildPrintPdf(bytes: Uint8Array, pages: ResizePageInfo[], settings: PrintSettings, pagePositions: Position[] | undefined, onStage: (value: string) => void) { const { PDFDocument } = await import("pdf-lib"); const source = await PDFDocument.load(bytes.slice(), { ignoreEncryption: false, updateMetadata: false }); const output = await PDFDocument.create(); let cursor = 0; while (cursor < pages.length) { const layout = createLayout(pages, settings, cursor, pagePositions); const sheet = output.addPage([layout.width, layout.height]); sheet.drawRectangle({ x: 0, y: 0, width: layout.width, height: layout.height, color: (await import("pdf-lib")).rgb(1, 1, 1) }); for (const slot of layout.slots) { const info = pages[slot.sourcePage]; const sourcePage = source.getPage(slot.sourcePage); const embedded = await output.embedPage(sourcePage); const rotation = ((info.rotation % 360) + 360) % 360; const rawSize = sourcePage.getSize(); const visualRatio = rotation === 90 || rotation === 270 ? rawSize.height / rawSize.width : rawSize.width / rawSize.height; let drawWidth = slot.width; let drawHeight = slot.height; if (drawWidth / drawHeight > visualRatio) drawWidth = drawHeight * visualRatio; else drawHeight = drawWidth / visualRatio; const drawX = slot.x + (slot.width - drawWidth) / 2; const drawY = slot.y + (slot.height - drawHeight) / 2; if (rotation === 90) sheet.drawPage(embedded, { x: drawX + drawWidth, y: drawY, width: drawHeight, height: drawWidth, rotate: degrees(90) }); else if (rotation === 180) sheet.drawPage(embedded, { x: drawX + drawWidth, y: drawY + drawHeight, width: drawWidth, height: drawHeight, rotate: degrees(180) }); else if (rotation === 270) sheet.drawPage(embedded, { x: drawX, y: drawY + drawHeight, width: drawHeight, height: drawWidth, rotate: degrees(270) }); else sheet.drawPage(embedded, { x: drawX, y: drawY, width: drawWidth, height: drawHeight }); } onStage(`Montando folha ${output.getPageCount()}`); cursor += settings.repeat ? 1 : Math.max(1, layout.slots.length); } onStage("Gerando o PDF para impressão"); return new Blob([await output.save({ useObjectStreams: true }) as BlobPart], { type: "application/pdf" }); }
