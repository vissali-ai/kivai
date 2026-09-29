import type { Page } from "@playwright/test";
import jsQR from "jsqr";
import { test, expect, openTool, download, expectNoOverflow } from "./helpers";

async function readQr(page: Page) {
  const result = await download(page, page.getByRole("button", { name: "Baixar PNG", exact: true }));
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
  return jsQR(new Uint8ClampedArray(pixels.data), pixels.width, pixels.height)?.data;
}

test("QR Code: preserva seis tipos de conteúdo e estado ao alternar", async ({ page }) => {
  test.setTimeout(120_000);
  await openTool(page, "gerador-de-qr-code");
  const cases: { type: string; fields: Record<string, string>; expected: string }[] = [
    { type: "URL", fields: { "qr-url": "example.com" }, expected: "https://example.com" },
    { type: "Texto", fields: { "qr-texto": "Olá, Kivai!" }, expected: "Olá, Kivai!" },
    { type: "WhatsApp", fields: { "qr-whatsapp-numero": "11987654321", "qr-whatsapp-mensagem": "Olá mundo" }, expected: "https://wa.me/5511987654321?text=Ol%C3%A1%20mundo" },
    { type: "Telefone", fields: { "qr-telefone": "1134567890" }, expected: "tel:+551134567890" },
    { type: "E-mail", fields: { "qr-email-destino": "teste@example.com", "qr-email-assunto": "Olá", "qr-email-mensagem": "Tudo bem?" }, expected: "mailto:teste@example.com?subject=Ol%C3%A1&body=Tudo+bem%3F" },
    { type: "Wi-Fi", fields: { "qr-wifi-nome": "Minha rede", "qr-wifi-senha": "senha123" }, expected: "WIFI:T:WPA;S:Minha rede;P:senha123;H:false;;" },
  ];
  for (const item of cases) {
    await page.getByRole("button", { name: new RegExp("^" + item.type) }).click();
    for (const [id, value] of Object.entries(item.fields)) await page.locator("#" + id).fill(value);
    await expect.poll(() => readQr(page)).toBe(item.expected);
  }
  await page.locator("#qr-wifi-seguranca").selectOption("nopass");
  await expect.poll(() => readQr(page)).toBe("WIFI:T:nopass;S:Minha rede;H:false;;");
  await page.getByRole("button", { name: /^URL/ }).click();
  await expect(page.locator("#qr-url")).toHaveValue("example.com");
  await expectNoOverflow(page);
});

test("QR Code: modelos visuais exportam SVG e PNG legível", async ({ page }) => {
  test.setTimeout(120_000);
  await openTool(page, "gerador-de-qr-code");
  await page.locator("#qr-url").fill("example.com/modelos");
  for (const model of ["Padrão", "Chamada superior", "Etiqueta lateral", "Cartão de marca", "Selo promocional"]) {
    await page.getByRole("button", { name: new RegExp(model) }).click();
    await expect.poll(() => readQr(page)).toBe("https://example.com/modelos");
    const svg = await download(page, page.getByRole("button", { name: "Baixar SVG", exact: true }));
    expect(svg.bytes.toString()).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
  }
  await expectNoOverflow(page);
});
