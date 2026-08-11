export const HTML_TO_PDF_MAX_FILE_SIZE = 5 * 1024 * 1024;
export const HTML_TO_PDF_MAX_FILE_SIZE_LABEL = "5 MB";
export const HTML_TO_PDF_MAX_ELEMENTS = 10_000;
export type PageSize = "a4" | "a5" | "a3" | "letter" | "legal";
export type Orientation = "portrait" | "landscape";
export type MarginPreset = "none" | "small" | "normal" | "large" | "custom";
export type Scale = "auto" | "0.75" | "1" | "1.25" | "1.5";
export type PdfOptions = { pageSize: PageSize; orientation: Orientation; margin: MarginPreset; customMargins: [number, number, number, number]; scale: Scale; header: string; footer: string; pageNumbers: boolean };
