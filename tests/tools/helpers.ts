import { test as base, expect, type Page, type Locator } from "@playwright/test";
import { PDFDocument, degrees } from "pdf-lib";
import { readFile } from "node:fs/promises";

export { expect };
export const test = base.extend<{ browserErrors: string[] }>({
  browserErrors: [async ({ page }, use) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.addInitScript(() => localStorage.setItem("kivai_cookie_consent", JSON.stringify({
      version: 1, necessary: true, analytics: false, advertising: false, updatedAt: new Date().toISOString(),
    })));
    await use(errors);
    expect(errors, "Unhandled browser errors").toEqual([]);
  }, { auto: true }],
});

export async function openTool(page: Page, slug: string) {
  const response = await page.goto(`/ferramentas/${slug}`);
  expect(response?.status()).toBe(200);
  await expect(page.locator("h1").first()).toBeVisible();
}

export async function expectNoOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "Horizontal overflow").toBe(true);
}

export async function imageFile(page: Page, name = "exemplo.png", width = 240, height = 120) {
  const data = await page.evaluate(({ width, height }) => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ff0000";
    ctx.fillRect(0, 0, width / 2, height);
    ctx.fillStyle = "#0000ff";
    ctx.fillRect(width / 2, 0, width / 2, height);
    return canvas.toDataURL("image/png").split(",")[1];
  }, { width, height });
  return { name, mimeType: "image/png", buffer: Buffer.from(data, "base64") };
}

export async function pdfFile(name = "exemplo.pdf", widths = [240, 360], rotations = widths.map(() => 0)) {
  const doc = await PDFDocument.create();
  widths.forEach((width, i) => {
    const page = doc.addPage([width, 480]);
    page.setRotation(degrees(rotations[i]));
    page.drawText(`Pagina ${i + 1}`, { x: 20, y: 200 });
  });
  return { name, mimeType: "application/pdf", buffer: Buffer.from(await doc.save()) };
}

export async function download(page: Page, trigger: Locator) {
  const pending = page.waitForEvent("download");
  await trigger.click();
  const result = await pending;
  expect(await result.failure()).toBeNull();
  return { name: result.suggestedFilename(), bytes: await readFile((await result.path())!) };
}

export async function imageDetails(page: Page, bytes: Buffer, mimeType: string) {
  return page.evaluate(async ({ data, mimeType }) => {
    const blob = await (await fetch(`data:${mimeType};base64,${data}`)).blob();
    const bitmap = await createImageBitmap(blob);
    const dimensions = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return dimensions;
  }, { data: bytes.toString("base64"), mimeType });
}

export const invalidFile = { name: "invalido.txt", mimeType: "text/plain", buffer: Buffer.from("Isto nao e uma imagem nem um PDF.") };
