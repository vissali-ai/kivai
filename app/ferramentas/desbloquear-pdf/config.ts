export const PDF_UNLOCK_MAX_FILE_SIZE = 25 * 1024 * 1024;
export const PDF_UNLOCK_MAX_FILE_SIZE_LABEL = "25 MB";
export const PDF_UNLOCK_MAX_PAGES = 100;

export type PdfProtection = "none" | "password" | "restrictions";

export type PdfInspection = {
  protection: PdfProtection;
  passwordRequired: boolean;
  pageCount: number | null;
};
