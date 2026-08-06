export const EXCEL_TO_PDF_MAX_FILE_SIZE = 25 * 1024 * 1024;
export const EXCEL_TO_PDF_MAX_FILE_SIZE_LABEL = "25 MB";
export const EXCEL_TO_PDF_MAX_SHEETS = 20;
export const EXCEL_TO_PDF_MAX_CELLS = 50_000;
export const EXCEL_TO_PDF_MAX_PAGES = 100;

export type ExcelPageOrientation = "auto" | "portrait" | "landscape";
export type ExcelPageSize = "a4" | "letter" | "legal";
export type ExcelFitMode = "columns" | "rows" | "sheet" | "original";
export type ExcelMarginSize = "small" | "normal" | "large";

export type ExcelPdfOptions = {
  orientation: ExcelPageOrientation;
  pageSize: ExcelPageSize;
  fitMode: ExcelFitMode;
  margins: ExcelMarginSize;
  centerHorizontal: boolean;
  centerVertical: boolean;
  gridlines: "auto" | "show" | "hide";
  showHeadings: boolean;
  repeatFirstRow: boolean;
};

export const DEFAULT_EXCEL_PDF_OPTIONS: ExcelPdfOptions = {
  orientation: "auto",
  pageSize: "a4",
  fitMode: "columns",
  margins: "normal",
  centerHorizontal: false,
  centerVertical: false,
  gridlines: "auto",
  showHeadings: false,
  repeatFirstRow: false,
};
