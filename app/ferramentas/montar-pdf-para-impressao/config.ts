export const PRINT_PDF_MAX_FILE_SIZE = 25 * 1024 * 1024;
export const PRINT_PDF_MAX_PAGES = 100;
export const mmToPoints = (mm: number) => (mm / 25.4) * 72;

export const SHEET_SIZES = {
  A6: { widthMm: 105, heightMm: 148 }, A5: { widthMm: 148, heightMm: 210 }, A4: { widthMm: 210, heightMm: 297 },
  A3: { widthMm: 297, heightMm: 420 }, A2: { widthMm: 420, heightMm: 594 }, A1: { widthMm: 594, heightMm: 841 },
  Carta: { widthMm: 215.9, heightMm: 279.4 }, "Ofício": { widthMm: 216, heightMm: 356 },
} as const;
export const CONTENT_SIZES = ["original", "A6", "A5", "A4", "A3", "A2", "A1"] as const;

export type SheetSize = keyof typeof SHEET_SIZES | "Personalizado";
export type ContentSize = typeof CONTENT_SIZES[number] | "scale";
export type Orientation = "original" | "portrait" | "landscape";
export type Position = "top-left" | "top-center" | "top-right" | "center-left" | "center" | "center-right" | "bottom-left" | "bottom-center" | "bottom-right" | "custom";
export type Order = "horizontal" | "vertical" | "zigzag";
export type PreviewMode = "before" | "after" | "compare";
export type Margins = { top: number; right: number; bottom: number; left: number };
export type PrintSettings = { sheet: SheetSize; customSheet: { width: number; height: number }; content: ContentSize; scale: number; orientation: Orientation; position: Position; customPosition: { x: number; y: number }; margins: Margins; count: number | "auto"; repeat: boolean; order: Order; gapX: number; gapY: number };
