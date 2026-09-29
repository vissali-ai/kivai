import jsQR from "jsqr";
import { test, expect, openTool, download, expectNoOverflow } from "./helpers";

test("contador: conta texto em português, sinaliza limite e permite limpar", async ({ page }) => {
  await openTool(page, "contador-de-palavras");
  await page.getByLabel("Seu texto", { exact: true }).fill("Olá mundo!\n\nMais três palavras.");
  const metric = (label: string) => page.getByText(label, { exact: true }).locator("..").locator("p").last();
  await expect(metric("Palavras")).toHaveText("5");
  await expect(metric("Frases")).toHaveText("2");
  await expect(metric("Parágrafos")).toHaveText("2");
  await expect(metric("Linhas")).toHaveText("3");
  await page.getByLabel("Limite personalizado").fill("10");
  await expect(page.getByText(/acima|exced|ultrapass/i).first()).toBeVisible();
  await page.getByRole("button", { name: "Limpar", exact: true }).click();
  await expect(metric("Palavras")).toHaveText("0");
  await expect(page.getByRole("button", { name: "Copiar", exact: true })).toBeDisabled();
  await expectNoOverflow(page);
});

test("QR Code: desabilita entrada vazia e gera PNG legível com a URL informada", async ({ page }) => {
  await openTool(page, "gerador-de-qr-code");
  const png = page.getByRole("button", { name: "Baixar PNG", exact: true });
  await expect(png).toBeDisabled();
  await page.getByLabel("Endereço do site").fill("example.com/kivai-teste");
  await expect(png).toBeEnabled();
  const result = await download(page, png);
  expect(result.bytes.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const pixels = await page.evaluate(async (data) => {
    const image = new Image();
    image.src = `data:image/png;base64,${data}`;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(image, 0, 0);
    return { width: canvas.width, height: canvas.height, data: Array.from(ctx.getImageData(0, 0, canvas.width, canvas.height).data) };
  }, result.bytes.toString("base64"));
  expect(jsQR(new Uint8ClampedArray(pixels.data), pixels.width, pixels.height)?.data).toBe("https://example.com/kivai-teste");
  const svg = await download(page, page.getByRole("button", { name: "Baixar SVG", exact: true }));
  expect(svg.bytes.toString()).toContain("<svg");
  await page.getByLabel("Endereço do site").fill("");
  await expect(png).toBeDisabled();
  await expectNoOverflow(page);
});
