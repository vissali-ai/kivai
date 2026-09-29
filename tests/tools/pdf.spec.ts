import { PDFDocument } from "pdf-lib";
import JSZip from "jszip";
import { test, expect, openTool, pdfFile, imageFile, invalidFile, download, expectNoOverflow } from "./helpers";

test("unir PDFs: rejeita inválido e mantém a ordem escolhida no download", async ({ page }) => {
  await openTool(page, "unir-pdfs");
  await page.locator('input[type=file]').first().setInputFiles(invalidFile);
  await expect(page.getByRole("alert").filter({ hasText: /\S/ })).toContainText("PDF");
  await page.locator('input[type=file]').first().setInputFiles([await pdfFile("primeiro.pdf", [240]), await pdfFile("segundo.pdf", [360, 480])]);
  await page.getByRole("button", { name: "Mover segundo.pdf para cima" }).click();
  await page.getByRole("button", { name: "Criar PDF unido" }).click();
  const result = await download(page, page.getByRole("button", { name: "Baixar PDF", exact: true }));
  const pdf = await PDFDocument.load(result.bytes);
  expect(pdf.getPages().map((p) => p.getWidth())).toEqual([360, 480, 240]);
  await expectNoOverflow(page);
});

test("dividir PDF: rejeita corrompido e exporta todas as páginas no ZIP", async ({ page }) => {
  await openTool(page, "dividir-pdf");
  await page.locator('input[type=file]').first().setInputFiles({ ...invalidFile, name: "corrompido.pdf", mimeType: "application/pdf" });
  await expect(page.getByRole("alert").filter({ hasText: /\S/ })).toContainText("Não foi possível");
  await page.locator('input[type=file]').first().setInputFiles(await pdfFile());
  await page.getByRole("button", { name: "Dividir PDF", exact: true }).click();
  const result = await download(page, page.getByRole("button", { name: "Baixar ZIP", exact: true }));
  const zip = await JSZip.loadAsync(result.bytes);
  expect(Object.keys(zip.files)).toEqual(["pagina-1.pdf", "pagina-2.pdf"]);
  for (const [index, name] of Object.keys(zip.files).entries()) {
    const pdf = await PDFDocument.load(await zip.file(name)!.async("uint8array"));
    expect(pdf.getPageCount()).toBe(1);
    expect(pdf.getPage(0).getWidth()).toBe([240, 360][index]);
  }
  await expectNoOverflow(page);
});

test("girar PDF: soma o ângulo à orientação de cada página", async ({ page }) => {
  await openTool(page, "girar-pdf");
  await page.locator('input[type=file]').first().setInputFiles(invalidFile);
  await expect(page.getByRole("alert").filter({ hasText: /\S/ })).toContainText("PDF");
  await page.locator('input[type=file]').first().setInputFiles(await pdfFile("orientado.pdf", [240, 360, 480], [0, 90, 270]));
  await page.getByRole("button", { name: "Girar PDF", exact: true }).click();
  const result = await download(page, page.getByRole("button", { name: "Baixar PDF", exact: true }));
  const pdf = await PDFDocument.load(result.bytes);
  expect(pdf.getPages().map((p) => p.getRotation().angle)).toEqual([90, 180, 0]);
  await expectNoOverflow(page);
});

test("imagens para PDF: ignora formato inválido e gera uma página por imagem", async ({ page }) => {
  await openTool(page, "imagens-para-pdf");
  await page.locator('input[type=file]').first().setInputFiles(invalidFile);
  await expect(page.getByRole("alert").filter({ hasText: /\S/ })).toContainText("JPG, PNG ou WebP");
  await page.locator('input[type=file]').first().setInputFiles([await imageFile(page), await imageFile(page, "segunda.png", 120, 240)]);
  await page.getByRole("button", { name: "Gerar PDF", exact: true }).click();
  const result = await download(page, page.getByRole("button", { name: "Baixar PDF", exact: true }));
  const pdf = await PDFDocument.load(result.bytes);
  expect(pdf.getPageCount()).toBe(2);
  expect(pdf.getPage(0).getWidth()).toBeCloseTo(595.28, 1);
  await expectNoOverflow(page);
});
