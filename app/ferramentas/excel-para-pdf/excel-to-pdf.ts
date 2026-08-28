import type { Alignment, Border, Borders, Fill, Font, Workbook, Worksheet } from "exceljs";
import type { CSSProperties } from "react";

import {
  EXCEL_TO_PDF_MAX_CELLS,
  EXCEL_TO_PDF_MAX_PAGES,
  EXCEL_TO_PDF_MAX_SHEETS,
  type ExcelPdfOptions,
} from "./config";

export type ExcelCell = {
  text: string;
  style: CSSProperties;
  rowSpan?: number;
  colSpan?: number;
  covered?: boolean;
};

export type ExcelSheet = {
  id: number;
  name: string;
  state: "visible" | "hidden" | "veryHidden";
  rowCount: number;
  columnCount: number;
  cells: ExcelCell[][];
  columnWidths: number[];
  rowHeights: number[];
  selected: boolean;
  excluded: boolean;
  originalIndex: number;
  hasBorders: boolean;
};

export type ExcelInspection = {
  workbook: Workbook;
  sheets: ExcelSheet[];
  warnings: string[];
  hasAdvancedElements: boolean;
  hasFormulaWithoutResult: boolean;
};

export type ExcelPage = {
  id: string;
  sheetName: string;
  pageNumberInSheet: number;
  rows: number[];
  columns: number[];
  width: number;
  height: number;
  margin: number;
  scale: number;
  orientation: "portrait" | "landscape";
  sheet: ExcelSheet;
  options: ExcelPdfOptions;
};

function excelError(code: string) { return new Error(code); }

function argbToCss(argb?: string) {
  if (!argb) return undefined;
  const value = argb.length === 8 ? argb.slice(2) : argb;
  return /^[0-9a-f]{6}$/i.test(value) ? `#${value}` : undefined;
}

function colorToCss(color?: { argb?: string; indexed?: number; theme?: number }) {
  if (!color) return undefined;
  if (color.argb) return argbToCss(color.argb);
  const indexed = ["#000000", "#ffffff", "#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff"];
  return color.indexed !== undefined ? indexed[color.indexed] : undefined;
}

function borderStyle(border?: Partial<Borders>) {
  const side = (value?: Partial<Border>) => value?.style ? `${value.style === "thin" ? 1 : 2}px solid ${colorToCss(value.color) ?? "#777"}` : undefined;
  return { borderTop: side(border?.top), borderRight: side(border?.right), borderBottom: side(border?.bottom), borderLeft: side(border?.left) };
}

function cellStyle(font?: Partial<Font>, fill?: Fill, alignment?: Partial<Alignment>, border?: Partial<Borders>): CSSProperties {
  const patternFill = fill?.type === "pattern" ? fill : undefined;
  return {
    color: colorToCss(font?.color),
    backgroundColor: patternFill ? colorToCss(patternFill.fgColor) : undefined,
    fontFamily: font?.name || "Arial, sans-serif",
    fontSize: font?.size ? `${font.size}pt` : undefined,
    fontWeight: font?.bold ? 700 : undefined,
    fontStyle: font?.italic ? "italic" : undefined,
    textDecoration: font?.underline ? "underline" : undefined,
    textAlign: alignment?.horizontal === "center" || alignment?.horizontal === "right" ? alignment.horizontal : "left",
    verticalAlign: alignment?.vertical === "middle" ? "middle" : alignment?.vertical === "bottom" ? "bottom" : "top",
    whiteSpace: alignment?.wrapText ? "pre-wrap" : "nowrap",
    ...borderStyle(border),
  };
}

function currencyFromNumFmt(numFmt: string) {
  if (/R\$/i.test(numFmt)) return "BRL";
  if (/€/.test(numFmt)) return "EUR";
  if (/£/.test(numFmt)) return "GBP";
  if (/US\$/i.test(numFmt) || /\$/.test(numFmt)) return "USD";
  return null;
}

function formatValue(value: unknown, numFmt: string, hasFormula: boolean, result: unknown) {
  const resolved = hasFormula ? result : value;
  if (resolved === null || resolved === undefined) return "";
  if (resolved instanceof Date) return new Intl.DateTimeFormat("pt-BR").format(resolved);
  if (typeof resolved === "number") {
    if (/%/.test(numFmt)) return new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 2 }).format(resolved);
    const currency = currencyFromNumFmt(numFmt);
    if (currency) return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(resolved);
    return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 8 }).format(resolved);
  }
  if (typeof resolved === "object" && resolved && "text" in resolved) return String((resolved as { text: unknown }).text);
  if (typeof resolved === "object") return "";
  return String(resolved);
}

async function validatePackage(file: File) {
  const signature = new Uint8Array(await file.slice(0, 4).arrayBuffer());
  if (signature[0] !== 0x50 || signature[1] !== 0x4b) throw excelError("invalid-xlsx");
  const { default: JSZip } = await import("jszip");
  let zip: InstanceType<typeof JSZip>;
  try { zip = await JSZip.loadAsync(file); } catch { throw excelError("corrupt-xlsx"); }
  if (zip.file("EncryptedPackage") || zip.file("EncryptionInfo")) throw excelError("protected-xlsx");
  if (!zip.file("[Content_Types].xml") || !zip.file("xl/workbook.xml")) throw excelError("invalid-xlsx");
  return { hasAdvanced: Object.keys(zip.files).some((path) => /^xl\/(charts|drawings)\//i.test(path)) };
}

function extractSheet(worksheet: Worksheet, originalIndex: number, warnings: Set<string>): ExcelSheet | null {
  let maxRow = 0; let maxColumn = 0;
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    let last = 0;
    row.eachCell({ includeEmpty: false }, (_cell, columnNumber) => { last = Math.max(last, columnNumber); });
    if (last) { maxRow = Math.max(maxRow, rowNumber); maxColumn = Math.max(maxColumn, last); }
  });
  if (!maxRow || !maxColumn) return null;
  const cells = Array.from({ length: maxRow }, () => Array.from({ length: maxColumn }, () => ({ text: "", style: {} } as ExcelCell)));
  let hasBorders = false;
  for (let rowNumber = 1; rowNumber <= maxRow; rowNumber++) {
    for (let columnNumber = 1; columnNumber <= maxColumn; columnNumber++) {
      const cell = worksheet.getCell(rowNumber, columnNumber);
      const formulaValue = cell.value && typeof cell.value === "object" && "formula" in cell.value ? cell.value as { formula: string; result?: unknown } : null;
      if (formulaValue && formulaValue.result === undefined) warnings.add("formula-without-result");
      if (cell.border && Object.values(cell.border).some((side) => side && typeof side === "object" && "style" in side && side.style)) hasBorders = true;
      cells[rowNumber - 1][columnNumber - 1] = {
        text: formatValue(cell.value, cell.numFmt ?? "", Boolean(formulaValue), formulaValue?.result),
        style: cellStyle(cell.font, cell.fill, cell.alignment, cell.border),
      };
    }
  }
  for (const range of worksheet.model.merges ?? []) {
    const match = /^([A-Z]+)(\d+):([A-Z]+)(\d+)$/.exec(range);
    if (!match) continue;
    const col = (letters: string) => [...letters].reduce((total, char) => total * 26 + char.charCodeAt(0) - 64, 0);
    const c1 = col(match[1]); const r1 = Number(match[2]); const c2 = col(match[3]); const r2 = Number(match[4]);
    if (r1 <= maxRow && c1 <= maxColumn) cells[r1 - 1][c1 - 1] = { ...cells[r1 - 1][c1 - 1], rowSpan: r2 - r1 + 1, colSpan: c2 - c1 + 1 };
    for (let r = r1; r <= Math.min(r2, maxRow); r++) for (let c = c1; c <= Math.min(c2, maxColumn); c++) if (r !== r1 || c !== c1) cells[r - 1][c - 1].covered = true;
  }
  return {
    id: worksheet.id,
    name: worksheet.name,
    state: worksheet.state,
    rowCount: maxRow,
    columnCount: maxColumn,
    cells,
    columnWidths: Array.from({ length: maxColumn }, (_, index) => Math.max(28, Math.min(320, ((worksheet.getColumn(index + 1).width ?? 10) * 7 + 5)))),
    rowHeights: Array.from({ length: maxRow }, (_, index) => Math.max(20, Math.min(180, (worksheet.getRow(index + 1).height ?? 15) * 1.333))),
    selected: worksheet.state === "visible",
    excluded: false as boolean,
    originalIndex,
    hasBorders,
  };
}

export async function inspectExcel(file: File, onStage: (stage: string) => void): Promise<ExcelInspection> {
  onStage("Lendo a planilha");
  const pkg = await validatePackage(file);
  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  workbook.calcProperties.fullCalcOnLoad = false;
  try { await workbook.xlsx.load(await file.arrayBuffer()); } catch (error) {
    if (error instanceof Error && /password|encrypt|protect/i.test(error.message)) throw excelError("protected-xlsx");
    throw excelError("corrupt-xlsx");
  }
  onStage("Identificando as abas");
  if (workbook.worksheets.length > EXCEL_TO_PDF_MAX_SHEETS) throw excelError("too-many-sheets");
  const warnings = new Set<string>();
  const sheets = workbook.worksheets.map((sheet, index) => extractSheet(sheet, index, warnings)).filter((sheet): sheet is ExcelSheet => Boolean(sheet));
  if (!sheets.length) throw excelError("empty-xlsx");
  if (sheets.reduce((total, sheet) => total + sheet.rowCount * sheet.columnCount, 0) > EXCEL_TO_PDF_MAX_CELLS) throw excelError("too-many-cells");
  if (pkg.hasAdvanced) warnings.add("advanced-elements");
  return { workbook, sheets, warnings: [...warnings], hasAdvancedElements: pkg.hasAdvanced, hasFormulaWithoutResult: warnings.has("formula-without-result") };
}

function paperSize(size: ExcelPdfOptions["pageSize"], orientation: "portrait" | "landscape") {
  const portrait = size === "letter" ? [816, 1056] : size === "legal" ? [816, 1344] : [794, 1123];
  return orientation === "portrait" ? { width: portrait[0], height: portrait[1] } : { width: portrait[1], height: portrait[0] };
}

function chunks(values: number[], sizes: number[], capacity: number) {
  const result: number[][] = []; let current: number[] = []; let used = 0;
  values.forEach((value) => { const size = sizes[value]; if (current.length && used + size > capacity) { result.push(current); current = []; used = 0; } current.push(value); used += size; });
  if (current.length) result.push(current); return result;
}

export function preparePages(sheets: ExcelSheet[], options: ExcelPdfOptions) {
  const pages: ExcelPage[] = [];
  for (const sheet of sheets.filter((item) => item.selected && !item.excluded)) {
    const totalWidth = sheet.columnWidths.reduce((a, b) => a + b, 0) + (options.showHeadings ? 38 : 0);
    const totalHeight = sheet.rowHeights.reduce((a, b) => a + b, 0) + (options.showHeadings ? 28 : 0);
    const resolvedOrientation = options.orientation === "auto" ? (totalWidth > totalHeight * 0.78 ? "landscape" : "portrait") : options.orientation;
    const size = paperSize(options.pageSize, resolvedOrientation);
    const margin = options.margins === "small" ? 28 : options.margins === "large" ? 72 : 48;
    const availableWidth = size.width - margin * 2; const availableHeight = size.height - margin * 2 - 30;
    let scale = 1;
    if (options.fitMode === "columns" || options.fitMode === "sheet") scale = Math.min(scale, availableWidth / totalWidth);
    if (options.fitMode === "rows" || options.fitMode === "sheet") scale = Math.min(scale, availableHeight / totalHeight);
    scale = Math.max(0.12, Math.min(1, scale));
    const rowCapacity = options.fitMode === "rows" || options.fitMode === "sheet" ? totalHeight + 1 : availableHeight / scale;
    const columnCapacity = options.fitMode === "columns" || options.fitMode === "sheet" ? totalWidth + 1 : availableWidth / scale;
    const rowIndexes = Array.from({ length: sheet.rowCount }, (_, index) => index);
    const columnIndexes = Array.from({ length: sheet.columnCount }, (_, index) => index);
    const rowGroups = chunks(rowIndexes, sheet.rowHeights, rowCapacity);
    const columnGroups = chunks(columnIndexes, sheet.columnWidths, columnCapacity);
    let pageNumberInSheet = 0;
    for (const rows of rowGroups) for (const columns of columnGroups) {
      pageNumberInSheet++;
      pages.push({ id: `${sheet.id}-${pageNumberInSheet}`, sheetName: sheet.name, pageNumberInSheet, rows: options.repeatFirstRow && rows[0] !== 0 ? [0, ...rows] : rows, columns, width: size.width, height: size.height, margin, scale, orientation: resolvedOrientation, sheet, options });
      if (pages.length > EXCEL_TO_PDF_MAX_PAGES) throw excelError("too-many-pages");
    }
  }
  if (!pages.length) throw excelError("no-sheets");
  return pages;
}

function columnLetter(index: number) { let value = index + 1; let result = ""; while (value) { value--; result = String.fromCharCode(65 + value % 26) + result; value = Math.floor(value / 26); } return result; }

export function renderExcelPage(page: ExcelPage, target: HTMLElement, preview = false) {
  target.replaceChildren();
  Object.assign(target.style, { position: "relative", boxSizing: "border-box", width: `${page.width}px`, height: `${page.height}px`, padding: `${page.margin}px`, background: "#fff", color: "#111", overflow: "hidden", fontFamily: "Arial, sans-serif" });
  const wrapper = document.createElement("div");
  const table = document.createElement("table");
  Object.assign(table.style, { borderCollapse: "collapse", tableLayout: "fixed", transform: `scale(${page.scale})`, transformOrigin: "top left", marginLeft: page.options.centerHorizontal ? "auto" : "0", marginTop: page.options.centerVertical ? "auto" : "0" });
  const showGrid = page.options.gridlines === "show" || (page.options.gridlines === "auto" && !page.sheet.hasBorders);
  if (page.options.showHeadings) {
    const tr = document.createElement("tr"); const corner = document.createElement("th"); corner.style.width = "38px"; tr.appendChild(corner);
    page.columns.forEach((column) => { const th = document.createElement("th"); th.textContent = columnLetter(column); Object.assign(th.style, { background: "#f3f4f6", border: "1px solid #aaa", height: "28px", fontSize: "12px" }); tr.appendChild(th); }); table.appendChild(tr);
  }
  page.rows.forEach((rowIndex) => {
    const tr = document.createElement("tr"); tr.style.height = `${page.sheet.rowHeights[rowIndex]}px`;
    if (page.options.showHeadings) { const th = document.createElement("th"); th.textContent = String(rowIndex + 1); Object.assign(th.style, { width: "38px", background: "#f3f4f6", border: "1px solid #aaa", fontSize: "12px" }); tr.appendChild(th); }
    page.columns.forEach((columnIndex) => {
      const source = page.sheet.cells[rowIndex]?.[columnIndex];
      if (!source || source.covered) return;
      const td = document.createElement("td"); td.textContent = source.text; td.colSpan = Math.min(source.colSpan ?? 1, page.columns.length - page.columns.indexOf(columnIndex)); td.rowSpan = Math.min(source.rowSpan ?? 1, page.rows.length - page.rows.indexOf(rowIndex));
      Object.assign(td.style, source.style, { boxSizing: "border-box", width: `${page.sheet.columnWidths[columnIndex]}px`, maxWidth: `${page.sheet.columnWidths[columnIndex]}px`, height: `${page.sheet.rowHeights[rowIndex]}px`, overflow: "hidden", padding: "3px 5px", fontSize: source.style.fontSize ?? "11pt", border: showGrid && !source.style.borderTop ? "1px solid #d1d5db" : undefined });
      tr.appendChild(td);
    }); table.appendChild(tr);
  });
  wrapper.appendChild(table); target.appendChild(wrapper);
  const footer = document.createElement("div"); footer.textContent = `${page.sheetName} · ${page.pageNumberInSheet}`; Object.assign(footer.style, { position: "absolute", left: `${page.margin}px`, right: `${page.margin}px`, bottom: "16px", textAlign: "center", color: "#666", fontSize: "10px" }); target.appendChild(footer);
  if (preview) target.setAttribute("aria-label", `Prévia da página ${page.pageNumberInSheet} da aba ${page.sheetName}`);
}

export async function createExcelPdf(pages: ExcelPage[], onStage: (stage: string) => void) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
  const host = document.createElement("div"); Object.assign(host.style, { position: "fixed", left: "-100000px", top: "0", background: "#fff" }); document.body.appendChild(host);
  let pdf: InstanceType<typeof jsPDF> | null = null;
  try {
    onStage("Aplicando as configurações");
    for (let index = 0; index < pages.length; index++) {
      const page = pages[index]; const element = document.createElement("div"); host.appendChild(element); renderExcelPage(page, element);
      onStage("Gerando o PDF");
      const canvas = await html2canvas(element, {
        backgroundColor: "#ffffff",
        scale: 1.5,
        logging: false,
        useCORS: false,
        onclone: (clonedDocument) => {
          const root = clonedDocument.documentElement;
          const colors: Record<string, string> = { "--background": "#ffffff", "--foreground": "#111827", "--card": "#ffffff", "--card-foreground": "#111827", "--muted": "#f3f4f6", "--muted-foreground": "#6b7280", "--border": "#d1d5db", "--primary": "#4f46e5", "--primary-foreground": "#ffffff" };
          Object.entries(colors).forEach(([name, value]) => root.style.setProperty(name, value));
          clonedDocument.body.style.backgroundColor = "#ffffff";
          clonedDocument.body.style.color = "#111827";
        },
      });
      const format: [number, number] = [page.width * 0.75, page.height * 0.75];
      if (!pdf) pdf = new jsPDF({ unit: "pt", format, orientation: page.orientation, compress: true }); else pdf.addPage(format, page.orientation);
      pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight(), undefined, "FAST");
      canvas.width = 1; canvas.height = 1; element.remove();
      await new Promise((resolve) => window.setTimeout(resolve, 0));
    }
    if (!pdf) throw excelError("conversion-failed");
    onStage("Finalizando o arquivo"); return pdf.output("blob");
  } catch (error) {
    if (error instanceof RangeError || (error instanceof Error && /memory|allocation/i.test(error.message))) throw excelError("out-of-memory");
    if (error instanceof Error && ["out-of-memory", "too-many-pages"].includes(error.message)) throw error;
    throw excelError("conversion-failed");
  } finally { host.remove(); }
}
