import { test, expect } from "@playwright/test";

test("archived tool renders not-found, while an unchanged tool remains usable", async ({ page, request }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/ferramentas/descompactar-zip");
  await expect(page.locator('input[type="file"]')).toHaveCount(0);
  await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute("content", /noindex/);
  // Next can already have sent a 200 when streamed metadata signals notFound.
  // The crawler must still receive noindex and the browser must hide the tool.
  const archived = await request.get("/ferramentas/descompactar-zip", { headers: { "User-Agent": "Twitterbot/1.0" } });
  expect([200, 404]).toContain(archived.status());
  expect(await archived.text()).toMatch(/name="robots" content="noindex"/);
  const active = await page.goto("/ferramentas/compactar-arquivos-zip");
  expect(active?.status()).toBe(200);
  await expect(page.locator('input[type="file"]').first()).toBeAttached();
  expect(errors).toEqual([]);
});
