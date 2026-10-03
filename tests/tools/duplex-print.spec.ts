import { test, expect } from "@playwright/test";
import { PDFDocument } from "pdf-lib";
import fs from "node:fs/promises";

test("manual PDF workflow, unknown printer, reverse stack and reset", async ({ page }) => {
  const errors: string[] = []; page.on("pageerror", e => errors.push(e.message));
  await page.goto("/pdf/imprimir-frente-e-verso");
  await expect(page).toHaveURL(/\/ferramentas\/imprimir-frente-e-verso/);
  await expect(page.getByRole("heading", { name: "Imprimir Frente e Verso", exact: true })).toBeVisible();
  const pdf = await PDFDocument.create(); for (let i = 0; i < 5; i++) pdf.addPage();
  await page.locator('input[type="file"]').setInputFiles({ name: "teste.pdf", mimeType: "application/pdf", buffer: Buffer.from(await pdf.save()) });
  await expect(page.getByRole("status")).toContainText("5 páginas");
  await page.getByLabel("Resultado do teste de orientação").selectOption("same");
  await expect(page.getByText("Troque a face para cima", { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: "Preparar PDFs para impressão" })).toHaveCount(0);
  await page.getByLabel("Resultado do teste de orientação").selectOption("correct");
  await page.getByLabel("Resultado da pilha").selectOption("reverse");
  await page.getByRole("button", { name: "Preparar PDFs para impressão" }).click();
  for (const name of ["Etapa 1 — Baixar frentes", "Etapa 2 — Baixar versos"]) {
    const wait = page.waitForEvent("download"); await page.getByRole("button", { name }).click();
    const download = await wait; const result = await PDFDocument.load(await fs.readFile((await download.path())!));
    expect(result.getPageCount()).toBe(3);
  }
  await expect(page.getByText("Incluímos um verso em branco", { exact: false })).toBeVisible();
  await page.screenshot({ path: test.info().outputPath("manual-result.png"), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  await page.getByLabel("Borda para virar as páginas").selectOption("short");
  await expect(page.getByRole("button", { name: "Etapa 1 — Baixar frentes" })).toHaveCount(0);
  await page.getByRole("combobox", { name: "Marca", exact: true }).selectOption("Brother");
  await page.getByRole("combobox", { name: "Modelo", exact: true }).selectOption("brother-dcp-t720dw");
  await expect(page.getByRole("button", { name: "Baixar PDF original para imprimir" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("invalid PDF is rejected without revealing printing controls", async ({ page }) => {
  await page.goto("/ferramentas/imprimir-frente-e-verso");
  await page.locator('input[type="file"]').setInputFiles({ name: "broken.pdf", mimeType: "application/pdf", buffer: Buffer.from("not a pdf") });
  await expect(page.locator("main [role=alert]")).toContainText("PDF válido");
  await expect(page.getByRole("combobox", { name: "Modelo", exact: true })).toHaveCount(0);
});
