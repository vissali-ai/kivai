import { test, expect, openTool, imageFile, invalidFile, download, imageDetails, expectNoOverflow } from "./helpers";

test("conversor: valida entradas, converte e descarta o resultado ao trocar o arquivo", async ({ page }) => {
  await openTool(page, "conversor-de-imagens");
  const input = page.locator('input[type=file]').first();
  await input.setInputFiles(invalidFile);
  await expect(page.getByRole("alert").filter({ hasText: /\S/ })).toContainText("formato");
  await input.setInputFiles({ name: "vazia.png", mimeType: "image/png", buffer: Buffer.alloc(0) });
  await expect(page.getByRole("alert").filter({ hasText: /\S/ })).toContainText("vazio");
  await input.setInputFiles({ name: "grande.png", mimeType: "image/png", buffer: Buffer.alloc(5 * 1024 * 1024 + 1) });
  await expect(page.getByRole("alert").filter({ hasText: /\S/ })).toContainText("limite");
  await input.setInputFiles(await imageFile(page));
  await page.getByLabel("Formato de saída").selectOption("jpeg");
  await page.getByRole("button", { name: "Converter imagem", exact: true }).click();
  const result = await download(page, page.getByRole("button", { name: "Baixar imagem", exact: true }));
  expect(result.bytes.subarray(0, 3)).toEqual(Buffer.from([0xff, 0xd8, 0xff]));
  expect(await imageDetails(page, result.bytes, "image/jpeg")).toEqual({ width: 240, height: 120 });
  const originalPreview = page.locator('img[src^="blob:"]').first();
  expect(await originalPreview.evaluate(async (img: HTMLImageElement) => (await fetch(img.src)).ok)).toBe(true);
  await input.setInputFiles(await imageFile(page, "nova.png", 100, 80));
  await expect(page.getByRole("button", { name: "Baixar imagem", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Converter imagem", exact: true }).click();
  const second = await download(page, page.getByRole("button", { name: "Baixar imagem", exact: true }));
  expect(await imageDetails(page, second.bytes, "image/webp")).toEqual({ width: 100, height: 80 });
  await expectNoOverflow(page);
});

test("conversor: recupera de imagem corrompida sem oferecer download inválido", async ({ page }) => {
  await openTool(page, "conversor-de-imagens");
  const input = page.locator('input[type=file]').first();
  await input.setInputFiles({ ...invalidFile, name: "corrompida.png", mimeType: "image/png" });
  await page.getByRole("button", { name: "Converter imagem", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: /\S/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Baixar imagem", exact: true })).toHaveCount(0);
  await input.setInputFiles(await imageFile(page));
  await page.getByRole("button", { name: "Converter imagem", exact: true }).click();
  await expect(page.getByRole("button", { name: "Baixar imagem", exact: true })).toBeVisible();
});

test("compressor: não aumenta o arquivo e preserva as dimensões", async ({ page }) => {
  await openTool(page, "compressor-de-imagens");
  const input = page.locator('input[type=file]').first();
  await input.setInputFiles({ name: "vazia.png", mimeType: "image/png", buffer: Buffer.alloc(0) });
  await expect(page.getByText("O arquivo está vazio. Tente selecionar outro.", { exact: true })).toBeVisible();
  await input.setInputFiles(invalidFile);
  await expect(page.getByText("Formato inválido. Use PNG, JPG ou WebP.", { exact: true })).toBeVisible();
  await input.setInputFiles({ name: "grande.png", mimeType: "image/png", buffer: Buffer.alloc(5 * 1024 * 1024 + 1) });
  await expect(page.getByText("Esta imagem ultrapassa o limite gratuito de 5 MB.", { exact: true })).toBeVisible();
  const original = await imageFile(page);
  await input.setInputFiles(original);
  await page.getByRole("button", { name: "Comprimir imagem", exact: true }).click();
  const result = await download(page, page.getByRole("button", { name: "Baixar imagem", exact: true }));
  expect(result.bytes.length).toBeLessThanOrEqual(original.buffer.length);
  expect(await imageDetails(page, result.bytes, "image/png")).toEqual({ width: 240, height: 120 });
  // The original preview must still be usable after generating the result.
  const preview = page.getByAltText("Pré-visualização da imagem selecionada");
  expect(await preview.evaluate(async (img: HTMLImageElement) => (await fetch(img.src)).ok)).toBe(true);
  await expectNoOverflow(page);
});

test("redimensionar: preserva proporção, bloqueia dimensão zero e exporta tamanho escolhido", async ({ page }) => {
  await openTool(page, "redimensionar-imagem");
  const input = page.locator('input[type=file]').first();
  await input.setInputFiles(invalidFile);
  await expect(page.getByText("Use imagens JPG, PNG, WebP, GIF ou SVG.", { exact: true })).toBeVisible();
  await input.setInputFiles({ name: "grande.png", mimeType: "image/png", buffer: Buffer.alloc(20 * 1024 * 1024 + 1) });
  await expect(page.getByText(/ultrapassa o limite de 20 MB/)).toBeVisible();
  await input.setInputFiles(await imageFile(page));
  await page.getByLabel("Largura (px)", { exact: true }).fill("0");
  await page.getByRole("button", { name: "Redimensionar imagens", exact: true }).click();
  await expect(page.getByText("Informe a largura ou a altura desejada.", { exact: true })).toBeVisible();
  await page.getByLabel("Largura (px)", { exact: true }).fill("120");
  await page.getByLabel("Formato de saída").selectOption("png");
  await page.getByRole("button", { name: "Redimensionar imagens", exact: true }).click();
  const result = await download(page, page.getByRole("button", { name: "Baixar imagem", exact: true }));
  expect(await imageDetails(page, result.bytes, "image/png")).toEqual({ width: 120, height: 60 });
  await expectNoOverflow(page);
});

test("recortar: rejeita inválido e exporta apenas a região escolhida", async ({ page }) => {
  await openTool(page, "recortar-imagem");
  const input = page.locator('input[type=file]').first();
  await input.setInputFiles(invalidFile);
  await expect(page.getByRole("alert").filter({ hasText: /\S/ })).toContainText("Use PNG");
  await input.setInputFiles(await imageFile(page));
  await page.getByLabel("Largura (px)", { exact: true }).fill("60");
  await page.getByLabel("Altura (px)", { exact: true }).fill("40");
  await page.getByRole("button", { name: "Aplicar recorte" }).click();
  const result = await download(page, page.getByRole("button", { name: "Baixar PNG", exact: true }));
  expect(await imageDetails(page, result.bytes, "image/png")).toEqual({ width: 60, height: 40 });
  await expectNoOverflow(page);
});
