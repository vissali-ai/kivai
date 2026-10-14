"use client";

import type { SocialImportRequest } from "@/lib/ai/social-report-import";

export type PreparedSocialImportFile = SocialImportRequest["files"][number];

const MAX_IMAGE = 700_000; // 3 screenshots stay within Vercel body and server-wide limits
const MAX_PDF = 2_000_000;
const MAX_SOURCE = 2_000_000;

function typeOfFile(file: File) {
  const name = file.name.toLowerCase();
  if (/\.(png|jpg|jpeg|webp)$/.test(name)) return "image" as const;
  if (name.endsWith(".pdf")) return "pdf" as const;
  if (name.endsWith(".csv")) return "csv" as const;
  if (name.endsWith(".xlsx")) return "xlsx" as const;
  return null;
}

export function validateSocialImportSelection(files: File[]) {
  if (!files.length) throw new Error("Escolha pelo menos um arquivo.");
  if (files.length > 3) throw new Error("Envie até três prints por análise.");
  const types = files.map(typeOfFile);
  if (types.some((t) => t === null)) {
    throw new Error("Use imagens JPG, PNG, WebP, PDF, CSV ou Excel (.xlsx).");
  }
  if (files.length > 1 && types.some((t) => t !== "image")) {
    throw new Error("Envie até três prints juntos ou um documento por vez.");
  }
  for (let i = 0; i < files.length; i++) {
    const limit = types[i] === "image" ? 12_000_000 : MAX_SOURCE;
    if (files[i].size > limit) throw new Error("Um dos arquivos ultrapassa o tamanho permitido.");
    if (files[i].size === 0) throw new Error("Um dos arquivos está vazio.");
  }
}

function asDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    reader.onload = () => resolve(String(reader.result || ""));
    reader.readAsDataURL(blob);
  });
}

async function imageToJpeg(file: File): Promise<PreparedSocialImportFile> {
  const objectUrl = URL.createObjectURL(file);
  let image: HTMLImageElement;
  try {
    image = new Image();
    image.src = objectUrl;
    await image.decode();
  } finally {
    URL.revokeObjectURL(objectUrl);
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx || !image.naturalWidth || !image.naturalHeight) {
    throw new Error("Não foi possível processar esta imagem.");
  }

  let ratio = Math.min(1, 2400 / Math.max(image.naturalWidth, image.naturalHeight));
  for (let attempt = 0; attempt < 7; attempt++) {
    canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    const quality = Math.max(.52, .88 - attempt * .055);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob) throw new Error("Falha ao preparar o print.");
    if (blob.size <= MAX_IMAGE) {
      const url = await asDataUrl(blob);
      const encoded = url.split(",")[1];
      if (!encoded) throw new Error("Não foi possível codificar o print.");
      return { kind: "binary", mimeType: "image/jpeg", data: encoded };
    }
    ratio *= .84;
  }

  throw new Error("O print ficou muito grande. Recorte a área dos indicadores e tente novamente.");
}

async function pdfToBase64(file: File): Promise<PreparedSocialImportFile> {
  if (file.size > MAX_PDF) throw new Error("O PDF deve ter no máximo 2 MB.");
  const url = await asDataUrl(file);
  const data = url.split(",")[1];
  if (!data) throw new Error("Não foi possível ler o PDF.");
  return { kind: "binary", mimeType: "application/pdf", data };
}

function shortenRows(rows: string[][]): string {
  const truncated = rows.slice(0, 120).map((cells, i) => `Linha ${i + 1}: ${cells.slice(0, 20).map((v, j) => `Coluna ${j + 1}=${v.trim().slice(0, 130)}`).filter(v => !v.endsWith("=")).join(" | ")}`);
  return truncated.join("\n").slice(0, 32_000);
}

function parseCsv(input: string): string[][] {
  const initialLine = input.slice(0, 400).split(/\r?\n/)[0] || "";
  const delimiter = [";", ",", "\t"].sort((a, b) => initialLine.split(b).length - initialLine.split(a).length)[0];
  const rows: string[][] = [];
  let row: string[] = [], cell = "", quoted = false;
  for (let i = 0; i < input.length && rows.length < 120; i++) {
    const ch = input[i];
    if (ch === '"') {
      if (quoted && input[i+1] === '"') { cell += '"'; i++; }
      else quoted = !quoted;
    } else if (ch === delimiter && !quoted) {
      row.push(cell); cell = "";
    } else if ((ch === "\n" || ch === "\r") && !quoted) {
      if (ch === "\r" && input[i+1] === "\n") i++;
      row.push(cell);
      if (row.some(x => x.trim())) rows.push(row);
      row = []; cell = "";
    } else cell += ch;
  }
  if (row.length || cell) { row.push(cell); if (row.some(x => x.trim())) rows.push(row); }
  return rows;
}

function excelCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    if ("result" in value) return excelCell(value.result);
    if ("text" in value) return excelCell(value.text);
    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText.map((part: { text?: string }) => part.text || "").join("");
    }
  }
  return "";
}

async function excelToText(file: File) {
  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(new Uint8Array(await file.arrayBuffer()) as unknown as Parameters<typeof workbook.xlsx.load>[0]);
  const sections: string[] = [];
  for (const sheet of workbook.worksheets.slice(0, 3)) {
    const rows: string[][] = [];
    sheet.eachRow({ includeEmpty: false }, (row) => {
      if (rows.length >= 100) return;
      const cells: string[] = [];
      for (let i = 1; i <= Math.min(row.cellCount, 20); i++) {
        cells.push(excelCell(row.getCell(i).value));
      }
      rows.push(cells);
    });
    sections.push(`Aba ${sections.length + 1}:\n${shortenRows(rows)}`);
  }
  return sections.join("\n").slice(0, 32_000);
}

export async function prepareSocialImportFiles(files: File[]): Promise<PreparedSocialImportFile[]> {
  validateSocialImportSelection(files);
  const ready: PreparedSocialImportFile[] = [];
  for (const file of files) {
    const type = typeOfFile(file);
    if (type === "image") ready.push(await imageToJpeg(file));
    else if (type === "pdf") ready.push(await pdfToBase64(file));
    else {
      const text = type === "csv" ? shortenRows(parseCsv(await file.text())) : await excelToText(file);
      if (!text.trim()) throw new Error("Nenhum conteúdo útil foi encontrado na planilha.");
      ready.push({ kind: "text", content: text });
    }
  }
  return ready;
}
