import JSZip from "jszip";
import { test, expect, openTool, imageFile, pdfFile, download, expectNoOverflow } from "./helpers";

test("seletores: teclado, formatos e privacidade nas oito ferramentas de arquivos", async ({ page }) => {
  test.setTimeout(120_000);
  for (const slug of ["conversor-de-imagens", "compressor-de-imagens", "redimensionar-imagem", "recortar-imagem", "unir-pdfs", "dividir-pdf", "girar-pdf", "imagens-para-pdf"]) {
    await openTool(page, slug);
    const upload = page.locator("[data-tool-upload]");
    await expect(upload.getByText(/Formatos aceitos:/)).toBeVisible();
    await expect(page.getByText("Processamento local: o arquivo permanece no seu dispositivo.", { exact: true }).first()).toBeVisible();
    const button = upload.getByRole("button");
    await button.focus();
    const chooserPromise = page.waitForEvent("filechooser");
    await button.press("Enter");
    await (await chooserPromise).setFiles([]);
    await expectNoOverflow(page);
  }
});

test("PDF: resultado explícito, download repetido, invalidação e recomeço", async ({ page }) => {
  await openTool(page, "girar-pdf");
  let downloads = 0;
  page.on("download", () => downloads++);
  await page.locator('input[type=file]').first().setInputFiles(await pdfFile());
  await page.getByRole("button", { name: "Girar PDF", exact: true }).click();
  await expect(page.getByRole("region", { name: "Arquivo pronto para baixar" })).toBeVisible();
  expect(downloads).toBe(0);
  const button = page.getByRole("button", { name: "Baixar PDF", exact: true });
  const first = await download(page, button);
  const second = await download(page, button);
  expect(first.bytes.equals(second.bytes)).toBe(true);
  await expect(page.getByRole("status")).toContainText("Download solicitado");
  await page.getByRole("radio", { name: /180°/ }).check();
  await expect(button).toHaveCount(0);
  await page.getByRole("button", { name: "Girar PDF", exact: true }).click();
  await page.getByRole("button", { name: "Começar novamente", exact: true }).click();
  await expect(page.locator("[data-tool-upload] button")).toBeVisible();
  await expect(button).toHaveCount(0);
});

test("contador: explica falha de copiar/colar e recupera ao editar", async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, "clipboard", {
    value: { readText: async () => { throw new Error("denied"); }, writeText: async () => { throw new Error("denied"); } },
  }));
  await openTool(page, "contador-de-palavras");
  await page.getByRole("button", { name: "Colar", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: /\S/ })).toContainText("opção Colar");
  await page.getByLabel("Seu texto", { exact: true }).fill("Texto de exemplo");
  await expect(page.getByRole("alert").filter({ hasText: /\S/ })).toHaveCount(0);
  await page.getByRole("button", { name: "Copiar", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: /\S/ })).toContainText("opção Copiar");
  await page.getByRole("button", { name: "Limpar", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: /\S/ })).toHaveCount(0);
});

test("recortar: erro de processamento permite tentar novamente", async ({ page }) => {
  await openTool(page, "recortar-imagem");
  await page.locator('input[type=file]').first().setInputFiles(await imageFile(page));
  await page.getByRole("button", { name: "Aplicar recorte" }).waitFor();
  await page.evaluate(() => {
    const original = HTMLCanvasElement.prototype.toBlob;
    HTMLCanvasElement.prototype.toBlob = function (callback) {
      HTMLCanvasElement.prototype.toBlob = original;
      callback(null);
    };
  });
  await page.getByRole("button", { name: "Aplicar recorte" }).click();
  await expect(page.getByRole("alert").filter({ hasText: /\S/ })).toContainText("Tente uma imagem menor");
  await page.getByRole("button", { name: "Aplicar recorte" }).click();
  await expect(page.getByRole("region", { name: "Imagem recortada pronta" })).toBeVisible();
  await page.getByRole("button", { name: "Começar novamente" }).click();
  await expect(page.locator("[data-tool-upload] button")).toHaveText("Selecionar imagem");
});

test("redimensionar: ZIP preserva arquivos com o mesmo nome e permite recomeçar", async ({ page }) => {
  await openTool(page, "redimensionar-imagem");
  await page.locator('input[type=file]').first().setInputFiles([await imageFile(page), await imageFile(page)]);
  await page.getByRole("button", { name: "Redimensionar imagens", exact: true }).click();
  const result = await download(page, page.getByRole("button", { name: "Baixar tudo em ZIP", exact: true }));
  const zip = await JSZip.loadAsync(result.bytes);
  expect(Object.keys(zip.files)).toHaveLength(2);
  await page.getByRole("button", { name: "Começar novamente" }).click();
  await expect(page.getByRole("button", { name: "Baixar tudo em ZIP", exact: true })).toHaveCount(0);
  await expect(page.locator("[data-tool-upload] button")).toHaveText("Selecionar imagens");
});
