export const RESIZE_PDF_MAX_FILE_SIZE = 25 * 1024 * 1024;
export const RESIZE_PDF_MAX_FILE_SIZE_LABEL = "25 MB";
export const RESIZE_PDF_MAX_PAGES = 100;

export function mmToPoints(mm: number) { return (mm / 25.4) * 72; }
export function pointsToMm(points: number) { return (points / 72) * 25.4; }

export const PDF_PAGE_SIZES = {
  A6: { widthMm: 105, heightMm: 148, use: "Cartões, convites e folhetos pequenos" },
  A5: { widthMm: 148, heightMm: 210, use: "Agendas, apostilas pequenas e flyers" },
  A4: { widthMm: 210, heightMm: 297, use: "Documentos, contratos e impressão comum" },
  A3: { widthMm: 297, heightMm: 420, use: "Cartazes, tabelas e projetos" },
  A2: { widthMm: 420, heightMm: 594, use: "Pôsteres, plantas e apresentações" },
  A1: { widthMm: 594, heightMm: 841, use: "Cartazes grandes e projetos técnicos" },
} as const;

export type PdfTargetSize = keyof typeof PDF_PAGE_SIZES;
export type ResizeOrientation = "original" | "portrait" | "landscape";
export type ResizeMode = "fit" | "fill" | "stretch" | "original";
export type MarginPreset = "none" | "small" | "normal" | "large" | "custom";
export type BackgroundMode = "white" | "black" | "transparent" | "custom";
export type PreviewMode = "before" | "after" | "compare";
export type PageApplication = "all" | "selected" | "range";
export type PageMargins = { top: number; right: number; bottom: number; left: number };
