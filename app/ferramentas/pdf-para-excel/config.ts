export const PDF_TO_EXCEL_MAX_FILE_SIZE = 25 * 1024 * 1024;
export const PDF_TO_EXCEL_MAX_FILE_SIZE_LABEL = "25 MB";
export const PDF_TO_EXCEL_MAX_PAGES = 50;
export const PDF_TO_EXCEL_MAX_CELLS = 50_000;

export type TableOrganization = "separate" | "combined";
export type HeaderMode = "auto" | "first" | "none";
export type EmptyRowsMode = "remove" | "keep";
export type NumericMode = "auto" | "text";
