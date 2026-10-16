import { normalizeReportLabel } from "./campaign-types";

/** Leitor RFC-like com aspas escapadas e quebras de linha dentro de células. */
export function parseDelimited(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    if (char === '"') {
      if (quoted && text[index + 1] === '"') {
        cell += '"';
        index++;
      } else {
        quoted = !quoted;
      }
    } else if (char === delimiter && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\r" || char === "\n") && !quoted) {
      if (char === "\r" && text[index + 1] === "\n") index++;
      row.push(cell);
      cell = "";
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
    } else {
      cell += char;
    }
  }
  if (quoted) throw new Error("O CSV contém aspas não fechadas.");
  row.push(cell);
  if (row.some((value) => value.trim())) rows.push(row);
  return rows;
}

export function parseReportNumber(value: string): number {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "--" || trimmed === "—") return NaN;
  const cleaned = trimmed.replace(/[^\d,.-]/g, "");
  if (!cleaned || !/^-?[\d.,]+$/.test(cleaned)) return NaN;
  const comma = cleaned.lastIndexOf(",");
  const dot = cleaned.lastIndexOf(".");
  if (comma > dot) return Number(cleaned.replace(/\./g, "").replace(",", "."));
  if (dot > comma && comma >= 0) return Number(cleaned.replace(/,/g, ""));
  if (comma >= 0) return Number(cleaned.replace(",", "."));
  if (/^\d{1,3}(\.\d{3})+$/.test(cleaned)) return Number(cleaned.replace(/\./g, ""));
  return Number(cleaned);
}

export function findColumn(header: string[], aliases: readonly string[]) {
  const allowed = new Set(aliases.map(normalizeReportLabel));
  return header.findIndex((column) => allowed.has(normalizeReportLabel(column)));
}

export function readCsvHeader(
  text: string,
  required: Record<string, readonly string[]>,
  optional: Record<string, readonly string[]> = {},
) {
  for (const delimiter of [";", "\t", ","]) {
    const rows = parseDelimited(text.replace(/^\uFEFF/, ""), delimiter);
    for (let rowIndex = 0; rowIndex < Math.min(rows.length, 20); rowIndex++) {
      const header = rows[rowIndex];
      const indices = Object.fromEntries(
        [...Object.entries(required), ...Object.entries(optional)].map(([key, names]) => [key, findColumn(header, names)]),
      );
      if (Object.keys(required).every((key) => indices[key] >= 0)) {
        return { rows: rows.slice(rowIndex + 1), indices, header, delimiter };
      }
    }
  }
  return null;
}
