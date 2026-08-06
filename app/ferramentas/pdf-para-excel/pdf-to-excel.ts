import type { TextItem } from "pdfjs-dist/types/src/display/api";

import {
  PDF_TO_EXCEL_MAX_CELLS,
  PDF_TO_EXCEL_MAX_PAGES,
  type EmptyRowsMode,
  type HeaderMode,
  type NumericMode,
  type TableOrganization,
} from "./config";

type PositionedText = {
  text: string;
  x: number;
  y: number;
  width: number;
  fontSize: number;
};

type LineCell = { text: string; x: number; endX: number };
type PositionedLine = { y: number; cells: LineCell[] };

export type PdfPagePreview = {
  pageNumber: number;
  thumbnailUrl: string;
};

export type PdfInspection = {
  pageCount: number;
  previews: PdfPagePreview[];
};

export type ExtractedTable = {
  id: string;
  pageNumber: number;
  tableNumber: number;
  data: string[][];
  originalData: string[][];
  sheetName: string;
  included: boolean;
};

export type ExportOptions = {
  organization: TableOrganization;
  headerMode: HeaderMode;
  emptyRows: EmptyRowsMode;
  numericMode: NumericMode;
};

function pdfError(code: string) {
  return new Error(code);
}

async function loadPdf(file: File) {
  const signature = new TextDecoder("ascii").decode(await file.slice(0, 5).arrayBuffer());
  if (signature !== "%PDF-") throw pdfError("invalid-pdf");
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  try {
    return await pdfjs.getDocument({
      data: await file.arrayBuffer(),
      enableXfa: false,
    }).promise;
  } catch (error) {
    if (error instanceof Error && /password/i.test(`${error.name} ${error.message}`)) throw pdfError("protected-pdf");
    throw pdfError("corrupt-pdf");
  }
}

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(pdfError("render-failed")), "image/jpeg", 0.76));
}

export async function inspectPdf(file: File, onPage: (current: number, total: number) => void): Promise<PdfInspection> {
  const pdf = await loadPdf(file);
  try {
    if (pdf.numPages > PDF_TO_EXCEL_MAX_PAGES) throw pdfError("too-many-pages");
    const previews: PdfPagePreview[] = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const base = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: Math.min(0.38, 260 / base.width) });
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.ceil(viewport.width));
      canvas.height = Math.max(1, Math.ceil(viewport.height));
      const context = canvas.getContext("2d", { alpha: false });
      if (!context) throw pdfError("render-failed");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvas, canvasContext: context, viewport, background: "white" }).promise;
      const blob = await canvasToBlob(canvas);
      previews.push({ pageNumber, thumbnailUrl: URL.createObjectURL(blob) });
      canvas.width = 1;
      canvas.height = 1;
      page.cleanup();
      onPage(pageNumber, pdf.numPages);
    }
    return { pageCount: pdf.numPages, previews };
  } finally {
    await pdf.cleanup();
  }
}

export function disposeInspection(inspection: PdfInspection | null) {
  inspection?.previews.forEach((preview) => URL.revokeObjectURL(preview.thumbnailUrl));
}

function groupIntoLines(items: PositionedText[]) {
  const lines: PositionedText[][] = [];
  for (const item of [...items].sort((a, b) => b.y - a.y || a.x - b.x)) {
    const tolerance = Math.max(2.2, item.fontSize * 0.32);
    const line = lines.find((candidate) => Math.abs(candidate[0].y - item.y) <= tolerance);
    if (line) line.push(item);
    else lines.push([item]);
  }
  return lines.map((line) => line.sort((a, b) => a.x - b.x));
}

function lineCells(items: PositionedText[]): LineCell[] {
  if (items.length === 1 && /\s{2,}|\t/.test(items[0].text)) {
    const parts = items[0].text.split(/\s{2,}|\t/).map((part) => part.trim()).filter(Boolean);
    const step = Math.max(items[0].width / Math.max(parts.length, 1), 1);
    return parts.map((text, index) => ({ text, x: items[0].x + index * step, endX: items[0].x + (index + 1) * step }));
  }
  const cells: LineCell[] = [];
  for (const item of items) {
    const previous = cells[cells.length - 1];
    const gap = previous ? item.x - previous.endX : Number.POSITIVE_INFINITY;
    const threshold = Math.max(10, item.fontSize * 0.9);
    if (previous && gap <= threshold) {
      previous.text = `${previous.text} ${item.text}`.replace(/\s+/g, " ").trim();
      previous.endX = Math.max(previous.endX, item.x + item.width);
    } else {
      cells.push({ text: item.text.trim(), x: item.x, endX: item.x + item.width });
    }
  }
  return cells.filter((cell) => cell.text);
}

function clusterLines(lines: PositionedLine[]) {
  const groups: PositionedLine[][] = [];
  const verticalGaps = lines.slice(1).map((line, index) => Math.abs(lines[index].y - line.y)).filter((gap) => gap > 0);
  const typicalGap = verticalGaps.sort((a, b) => a - b)[Math.floor(verticalGaps.length / 2)] || 12;
  for (const line of lines) {
    const previousGroup = groups[groups.length - 1];
    const previousLine = previousGroup?.[previousGroup.length - 1];
    const continues = previousLine && Math.abs(previousLine.y - line.y) <= typicalGap * 2.2 && line.cells.length >= 2;
    if (continues) previousGroup.push(line);
    else if (line.cells.length >= 2) groups.push([line]);
  }
  return groups.filter((group) => group.length >= 2);
}

function tableFromLines(lines: PositionedLine[]) {
  const anchors: number[] = [];
  for (const line of lines) {
    for (const cell of line.cells) {
      const existing = anchors.findIndex((anchor) => Math.abs(anchor - cell.x) <= 14);
      if (existing >= 0) anchors[existing] = (anchors[existing] + cell.x) / 2;
      else anchors.push(cell.x);
    }
  }
  anchors.sort((a, b) => a - b);
  if (anchors.length < 2) return null;
  const rows = lines.map((line) => {
    const row = Array.from({ length: anchors.length }, () => "");
    for (const cell of line.cells) {
      let column = 0;
      let distance = Number.POSITIVE_INFINITY;
      anchors.forEach((anchor, index) => {
        const nextDistance = Math.abs(anchor - cell.x);
        if (nextDistance < distance) { distance = nextDistance; column = index; }
      });
      row[column] = row[column] ? `${row[column]} ${cell.text}` : cell.text;
    }
    return row;
  });
  const populatedColumns = anchors.map((_, index) => rows.filter((row) => row[index]?.trim()).length);
  const keep = populatedColumns.map((count, index) => count >= Math.max(2, Math.ceil(rows.length * 0.34)) ? index : -1).filter((index) => index >= 0);
  if (keep.length < 2) return null;
  return rows.map((row) => keep.map((index) => row[index] ?? ""));
}

function extractPageTables(items: PositionedText[], pageNumber: number): ExtractedTable[] {
  const lines = groupIntoLines(items).map((line) => ({ y: line[0].y, cells: lineCells(line) }));
  const groups = clusterLines(lines);
  const tables: ExtractedTable[] = [];
  groups.forEach((group) => {
    const data = tableFromLines(group);
    if (!data || data.length < 2 || data.reduce((sum, row) => sum + row.filter(Boolean).length, 0) < 4) return;
    const tableNumber = tables.length + 1;
    tables.push({
      id: `page-${pageNumber}-table-${tableNumber}`,
      pageNumber,
      tableNumber,
      data,
      originalData: data.map((row) => [...row]),
      sheetName: `Pagina ${pageNumber} - Tabela ${tableNumber}`,
      included: true,
    });
  });
  return tables;
}

export async function analyzePdf(
  file: File,
  pages: number[],
  onStage: (stage: string) => void,
): Promise<ExtractedTable[]> {
  if (!pages.length) throw pdfError("no-pages");
  const pdf = await loadPdf(file);
  const tables: ExtractedTable[] = [];
  let totalTextItems = 0;
  try {
    for (const pageNumber of pages) {
      onStage("Analisando páginas");
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent({ disableNormalization: false });
      const items = content.items
        .filter((item): item is TextItem => "str" in item && Boolean(item.str.trim()))
        .map((item) => ({
          text: item.str.replace(/\s+/g, " ").trim(),
          x: item.transform[4],
          y: item.transform[5],
          width: Math.max(item.width, 1),
          fontSize: Math.max(Math.abs(item.transform[0]), Math.abs(item.transform[3]), 8),
        }));
      totalTextItems += items.length;
      onStage("Identificando tabelas");
      tables.push(...extractPageTables(items, pageNumber));
      page.cleanup();
      if (tables.reduce((sum, table) => sum + table.data.length * (table.data[0]?.length ?? 0), 0) > PDF_TO_EXCEL_MAX_CELLS) throw pdfError("too-many-cells");
    }
  } finally {
    await pdf.cleanup();
  }
  if (!totalTextItems) throw pdfError("scanned-pdf");
  if (!tables.length) throw pdfError("no-tables");
  return tables;
}

export function parsePageRange(value: string, pageCount: number) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^[\d,\-\s]+$/.test(trimmed)) throw pdfError("invalid-pages");
  const pages = new Set<number>();
  for (const part of trimmed.split(",").map((item) => item.trim()).filter(Boolean)) {
    if (/^\d+$/.test(part)) pages.add(Number(part));
    else {
      const match = part.match(/^(\d+)\s*-\s*(\d+)$/);
      if (!match) throw pdfError("invalid-pages");
      const start = Number(match[1]);
      const end = Number(match[2]);
      if (start > end) throw pdfError("invalid-pages");
      for (let page = start; page <= end; page++) pages.add(page);
    }
  }
  const result = [...pages].sort((a, b) => a - b);
  if (!result.length || result.some((page) => page < 1 || page > pageCount)) throw pdfError("invalid-pages");
  return result;
}

function safeSheetName(name: string, used: Set<string>) {
  const base = name.replace(/[\\/*?:\[\]]/g, "-").replace(/\s+/g, " ").trim().slice(0, 31) || "Tabela";
  let candidate = base;
  let suffix = 2;
  while (used.has(candidate.toLowerCase())) {
    const ending = ` (${suffix++})`;
    candidate = `${base.slice(0, 31 - ending.length)}${ending}`;
  }
  used.add(candidate.toLowerCase());
  return candidate;
}

function looksLikeIdentifier(value: string) {
  const compact = value.trim();
  return /^0\d+$/.test(compact) || /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(compact) || /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(compact) || /^\d{5}-?\d{3}$/.test(compact);
}

function typedValue(raw: string, numericMode: NumericMode): { value: string | number | Date; format?: string } {
  const text = raw.trim();
  if (!text || numericMode === "text" || looksLikeIdentifier(text)) return { value: protectFormula(text) };
  const date = text.match(/^(0?[1-9]|[12]\d|3[01])\/(0?[1-9]|1[0-2])\/(\d{4})$/);
  if (date) {
    const value = new Date(Number(date[3]), Number(date[2]) - 1, Number(date[1]));
    if (value.getFullYear() === Number(date[3]) && value.getMonth() === Number(date[2]) - 1 && value.getDate() === Number(date[1])) return { value, format: "dd/mm/yyyy" };
  }
  const percentage = text.match(/^(-?[\d.,]+)\s*%$/);
  if (percentage) {
    const parsed = parseLocaleNumber(percentage[1]);
    if (parsed !== null) return { value: parsed / 100, format: "0.00%" };
  }
  const currency = text.match(/^(R\$|US\$|\$|€)\s*(-?[\d.,]+)$/i);
  if (currency) {
    const parsed = parseLocaleNumber(currency[2]);
    if (parsed !== null) return { value: parsed, format: currency[1].toUpperCase() === "R$" ? '"R$" #,##0.00' : '"$" #,##0.00' };
  }
  if (/^-?\d+$/.test(text) && !/^0\d+/.test(text)) return { value: Number(text), format: "#,##0" };
  if (/^-?[\d.,]+$/.test(text)) {
    const parsed = parseLocaleNumber(text);
    if (parsed !== null) return { value: parsed, format: "#,##0.00" };
  }
  return { value: protectFormula(text) };
}

function parseLocaleNumber(value: string) {
  const text = value.trim();
  const lastComma = text.lastIndexOf(",");
  const lastDot = text.lastIndexOf(".");
  let normalized = text;
  if (lastComma >= 0 && lastDot >= 0) normalized = lastComma > lastDot ? text.replace(/\./g, "").replace(",", ".") : text.replace(/,/g, "");
  else if (lastComma >= 0) normalized = /^-?\d{1,3}(,\d{3})+$/.test(text) ? text.replace(/,/g, "") : text.replace(",", ".");
  else if (lastDot >= 0 && /^-?\d{1,3}(\.\d{3})+$/.test(text)) normalized = text.replace(/\./g, "");
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

function protectFormula(value: string) {
  if (/^[=+@]/.test(value) || (/^-/.test(value) && !/^-\d+(?:[.,]\d+)?$/.test(value))) return `'${value}`;
  return value;
}

function hasHeader(data: string[][], mode: HeaderMode) {
  if (mode === "first") return true;
  if (mode === "none" || data.length < 2) return false;
  const firstText = data[0].filter(Boolean).filter((value) => typedValue(value, "auto").value === protectFormula(value.trim())).length;
  const secondNumeric = data[1].filter(Boolean).filter((value) => typeof typedValue(value, "auto").value === "number").length;
  return firstText >= Math.ceil(data[0].length / 2) && secondNumeric > 0;
}

function preparedRows(table: ExtractedTable, options: ExportOptions) {
  const rows = table.data.map((row) => [...row]);
  return options.emptyRows === "remove" ? rows.filter((row) => row.some((cell) => cell.trim())) : rows;
}

export async function createExcel(tables: ExtractedTable[], options: ExportOptions, onStage: (stage: string) => void) {
  const selected = tables.filter((table) => table.included);
  if (!selected.length) throw pdfError("no-selected-tables");
  const cells = selected.reduce((sum, table) => sum + table.data.length * (table.data[0]?.length ?? 0), 0);
  if (cells > PDF_TO_EXCEL_MAX_CELLS) throw pdfError("too-many-cells");
  onStage("Organizando os dados");
  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Kivai";
  workbook.created = new Date();
  const usedNames = new Set<string>();

  const addTable = (worksheet: import("exceljs").Worksheet, table: ExtractedTable, startRow: number) => {
    const rows = preparedRows(table, options);
    const header = hasHeader(rows, options.headerMode);
    rows.forEach((row, rowIndex) => {
      row.forEach((raw, columnIndex) => {
        const cell = worksheet.getCell(startRow + rowIndex, columnIndex + 1);
        const typed = typedValue(raw, options.numericMode);
        cell.value = typed.value;
        if (typed.format) cell.numFmt = typed.format;
        cell.alignment = { vertical: "top", wrapText: true };
      });
    });
    const columnCount = Math.max(1, ...rows.map((row) => row.length));
    if (header && rows.length) {
      const headerRow = worksheet.getRow(startRow);
      headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
      headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF334155" } };
      headerRow.height = 24;
      if (rows.length > 1) worksheet.autoFilter = { from: { row: startRow, column: 1 }, to: { row: startRow + rows.length - 1, column: columnCount } };
    }
    for (let column = 1; column <= columnCount; column++) {
      const maxLength = Math.max(8, ...rows.map((row) => String(row[column - 1] ?? "").length));
      worksheet.getColumn(column).width = Math.min(42, maxLength + 2);
    }
    return { rows: rows.length, header };
  };

  onStage("Criando a planilha");
  if (options.organization === "combined") {
    const sheet = workbook.addWorksheet(safeSheetName("Tabelas", usedNames), { views: [{ state: "frozen", ySplit: 1 }] });
    sheet.views = [{ state: "frozen", ySplit: 1, showGridLines: false }];
    let startRow = 1;
    selected.forEach((table, index) => {
      if (index) startRow += 2;
      sheet.getCell(startRow, 1).value = table.sheetName;
      sheet.getCell(startRow, 1).font = { bold: true, size: 12 };
      startRow += 1;
      startRow += addTable(sheet, table, startRow).rows;
    });
  } else {
    selected.forEach((table) => {
      const sheet = workbook.addWorksheet(safeSheetName(table.sheetName, usedNames));
      const added = addTable(sheet, table, 1);
      sheet.views = [{ state: "frozen", ySplit: added.header ? 1 : 0, showGridLines: false }];
    });
  }
  onStage("Finalizando o arquivo");
  const buffer = await workbook.xlsx.writeBuffer();
  return { blob: new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), sheetCount: workbook.worksheets.length };
}

export function createCsv(table: ExtractedTable, options: ExportOptions) {
  const rows = preparedRows(table, options);
  const content = rows.map((row) => row.map((cell) => `"${protectFormula(cell).replace(/"/g, '""')}"`).join(",")).join("\r\n");
  return new Blob(["\ufeff", content], { type: "text/csv;charset=utf-8" });
}
