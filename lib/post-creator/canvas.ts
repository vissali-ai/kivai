import { postFormats, type PostProject } from "./schema";

async function loadImage(source: string) {
  const image = new Image(); image.src = source;
  await image.decode(); return image;
}
export async function optimizePostImage(file: Blob, logo = false): Promise<string> {
  if (!/^(image\/png|image\/jpeg|image\/webp)$/.test(file.type) || file.size > 12 * 1024 * 1024) throw Error("Envie JPG, PNG ou WebP de até 12 MB.");
  const bitmap = await createImageBitmap(file);
  try {
    if (bitmap.width * bitmap.height > 40_000_000) throw Error("Imagem muito grande. Reduza para até 40 megapixels.");
    const limit = logo ? 80000 : 360000;
    for (const max of logo ? [400, 260, 160] : [1440, 1080, 800, 600]) {
      const canvas = document.createElement("canvas"); const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
      canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const ctx = canvas.getContext("2d"); if (!ctx) throw Error("Seu navegador não conseguiu preparar a imagem.");
      if (!logo) { ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, canvas.width, canvas.height); }
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const result = canvas.toDataURL(logo ? "image/png" : "image/jpeg", 0.82);
      if (result.length <= limit) return result;
    }
    throw Error("A imagem ainda está grande. Tente uma versão menor.");
  } finally { bitmap.close(); }
}

function linesFor(ctx: CanvasRenderingContext2D, text: string, width: number) {
  const lines: string[] = []; let line = "";
  for (const paragraph of text.split("\n")) {
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const candidate = line ? `${line} ${word}` : word;
      if (ctx.measureText(candidate).width <= width) { line = candidate; continue; }
      if (line) { lines.push(line); line = ""; }
      for (const char of Array.from(word)) {
        if (ctx.measureText(line + char).width > width && line) { lines.push(line); line = ""; }
        line += char;
      }
    }
    lines.push(line); line = "";
  }
  return lines;
}
function layoutText(ctx: CanvasRenderingContext2D, text: string, width: number, maxHeight: number, size: number, font: string, weight: number) {
  let lines: string[] = [];
  while (size >= 14) {
    ctx.font = `${weight} ${size}px ${font}`;
    lines = text ? linesFor(ctx, text, width) : [];
    if (lines.length * size * 1.2 <= maxHeight) break;
    size -= 2;
  }
  return { lines, size, height: lines.length * size * 1.2, font: `${weight} ${size}px ${font}` };
}
export async function renderPost(project: PostProject): Promise<HTMLCanvasElement> {
  const { width, height } = postFormats[project.format]; const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext("2d"); if (!ctx) throw Error("Não foi possível desenhar a arte neste navegador.");
  ctx.fillStyle = project.background; ctx.fillRect(0, 0, width, height);
  if (project.image) {
    const image = await loadImage(project.image); const scale = Math.max(width / image.width, height / image.height);
    ctx.drawImage(image, (width - image.width * scale) / 2, (height - image.height * scale) / 2, image.width * scale, image.height * scale);
    ctx.fillStyle = `rgba(0,0,0,${project.overlay / 100})`; ctx.fillRect(0, 0, width, height);
  } else {
    ctx.fillStyle = project.accent; ctx.globalAlpha = 0.18; ctx.beginPath(); ctx.arc(width, 0, width * 0.7, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
  }
  const font = project.font === "serif" ? "Georgia, serif" : "Arial, sans-serif";
  const title = layoutText(ctx, project.title, width - 144, height * 0.29, 88, font, 700);
  const subtitle = layoutText(ctx, project.subtitle, width - 144, height * 0.23, 42, font, 400);
  const cta = layoutText(ctx, project.cta, width - 192, 115, 36, font, 700);
  const total = title.height + subtitle.height + (subtitle.height ? 24 : 0) + (cta.height ? cta.height + 70 : 0);
  let y = project.position === "top" ? 210 : project.position === "center" ? (height - total) / 2 : height - total - 100;
  y = Math.max(210, y); ctx.textBaseline = "top";
  for (const block of [title, subtitle]) { ctx.font = block.font; ctx.fillStyle = project.foreground; for (const line of block.lines) { ctx.fillText(line, 72, y); y += block.size * 1.2; } y += 24; }
  if (cta.height) {
    ctx.fillStyle = project.accent; ctx.fillRect(72, y, width - 144, cta.height + 40); ctx.fillStyle = project.foreground; ctx.font = cta.font;
    cta.lines.forEach((line, i) => ctx.fillText(line, 96, y + 20 + i * cta.size * 1.2));
  }
  if (project.logo) { const logo = await loadImage(project.logo); const scale = Math.min(230 / logo.width, 110 / logo.height); ctx.drawImage(logo, width - 72 - logo.width * scale, 64, logo.width * scale, logo.height * scale); }
  return canvas;
}
export function downloadPostFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(url), 5000);
}
