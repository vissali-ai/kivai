import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";

export async function loadPrintPdf(bytes: Uint8Array) {
  if (bytes.length > 50 * 1024 * 1024) throw new Error("O limite é 50 MB.");
  if (!new TextDecoder().decode(bytes.slice(0, 1024)).includes("%PDF-")) throw new Error("Selecione um arquivo PDF válido.");
  let doc: PDFDocument;
  try { doc = await PDFDocument.load(bytes); } catch { throw new Error("PDF inválido, corrompido ou protegido por senha. Envie uma cópia sem senha."); }
  if (!doc.getPageCount() || doc.getPageCount() > 500) throw new Error("Envie um PDF com 1 a 500 páginas.");
  return doc;
}

export function uniformPages(doc: PDFDocument) {
  const sizes = doc.getPages().map(p => { const s = p.getSize(); return Math.abs(p.getRotation().angle % 180) === 90 ? [s.height, s.width] : [s.width, s.height]; });
  return sizes.every(s => Math.abs(s[0] - sizes[0][0]) < 1 && Math.abs(s[1] - sizes[0][1]) < 1);
}

export async function prepareManual(bytes: Uint8Array, reverse: boolean, rotateBack: boolean) {
  const source = await loadPrintPdf(bytes);
  if (!uniformPages(source)) throw new Error("Separe as páginas por tamanho e orientação antes de usar o modo manual.");
  const fronts = await PDFDocument.create();
  const backs = await PDFDocument.create();
  const count = source.getPageCount();
  for (let i = 0; i < count; i += 2) fronts.addPage((await fronts.copyPages(source, [i]))[0]);
  const pairs = Array.from({ length: Math.ceil(count / 2) }, (_, i) => i);
  if (reverse) pairs.reverse();
  for (const pair of pairs) {
    const index = pair * 2 + 1;
    if (index < count) {
      const page = (await backs.copyPages(source, [index]))[0];
      if (rotateBack) page.setRotation(degrees((page.getRotation().angle + 180) % 360));
      backs.addPage(page);
    } else {
      const last = source.getPage(count - 1);
      const { width, height } = last.getSize();
      const blank = backs.addPage([width, height]);
      blank.setRotation(last.getRotation());
    }
  }
  return { fronts: await fronts.save(), backs: await backs.save() };
}

export async function testPdf(side: "front" | "back", count = 1, landscape = false) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  for (let i = 1; i <= count; i++) {
    const page = doc.addPage(landscape ? [842, 595] : [595, 842]);
    const { width, height } = page.getSize();
    const back = side === "back";
    const y = back ? height / 2 - 90 : height - 170;
    page.drawText(`KIVAI - ${back ? "VERSO" : "FRENTE"} ${i}`, { x: 55, y, size: 30, font, color: rgb(0.12, 0.32, 0.55) });
    page.drawText("TOPO", { x: width / 2 - 24, y: height - 45, size: 16, font });
    page.drawLine({ start: { x: width / 2, y: height - 100 }, end: { x: width / 2, y: height - 55 }, thickness: 3 });
    for (const sign of [-1, 1]) page.drawLine({ start: { x: width / 2, y: height - 55 }, end: { x: width / 2 + sign * 10, y: height - 70 }, thickness: 3 });
    page.drawText(back ? "Confira face, topo e numero com a frente." : "Preserve a ordem das folhas ao recolocar a pilha.", { x: 55, y: y - 40, size: 13 });
  }
  return doc.save();
}
