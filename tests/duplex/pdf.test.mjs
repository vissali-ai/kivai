import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import { createRequire } from "node:module";
import { PDFDocument, PDFName, PDFNumber } from "pdf-lib";
const module = { exports: {} };
new Function("require", "module", "exports", ts.transpileModule(fs.readFileSync("lib/duplex-print/pdf.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText)(createRequire(import.meta.url), module, module.exports);
const { prepareManual, loadPrintPdf, testPdf } = module.exports;
async function fixture(count, mixed = false) {
  const doc = await PDFDocument.create();
  for (let n = 1; n <= count; n++) { const p = doc.addPage([mixed && n === 2 ? 500 : 595, 842]); p.node.set(PDFName.of("TestPage"), PDFNumber.of(n)); }
  return doc.save();
}
async function ids(bytes) { return (await PDFDocument.load(bytes)).getPages().map(p => p.node.get(PDFName.of("TestPage"))?.asNumber() ?? null); }
for (const count of [1, 2, 3, 4, 5, 10]) for (const reverse of [false, true]) {
  test(`${count} pages, reverse=${reverse}: every physical sheet keeps its matching back`, async () => {
    const result = await prepareManual(await fixture(count), reverse, false);
    const fronts = await ids(result.fronts); const backs = await ids(result.backs);
    assert.equal(fronts.length, Math.ceil(count / 2));
    assert.equal(backs.length, fronts.length);
    const feed = reverse ? [...fronts].reverse() : fronts;
    feed.forEach((front, i) => assert.equal(backs[i], front + 1 > count ? null : front + 1));
  });
}
test("rejects corrupt, oversized and mixed-size files", async () => {
  await assert.rejects(loadPrintPdf(new Uint8Array([1, 2, 3])), /PDF válido/);
  await assert.rejects(loadPrintPdf(new Uint8Array(51 * 1024 * 1024)), /50 MB/);
  await assert.rejects(prepareManual(await fixture(2, true), false, false), /tamanho e orientação/);
  await assert.rejects(loadPrintPdf(await fixture(501)), /500 páginas/);
});
test("test sheets preserve count and landscape orientation", async () => {
  const doc = await PDFDocument.load(await testPdf("back", 2, true));
  assert.equal(doc.getPageCount(), 2);
  assert.ok(doc.getPage(0).getWidth() > doc.getPage(0).getHeight());
});
