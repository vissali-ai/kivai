import { test, expect, openTool } from "./helpers";

const fileSlugs = ["descompactar-zip", "descompactar-rar", "compactar-arquivos-zip", "renomear-arquivos-em-lote", "adicionar-prefixo-sufixo-arquivos"];

test("catálogo CMS: as seis ferramentas registradas mantêm rota e SEO públicos", async ({ page }) => {
  test.setTimeout(180_000);
  for (const slug of [...fileSlugs, "removedor-de-metadados"]) {
    await openTool(page, slug);
    await expect(page).toHaveTitle(/Kivai/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://www.kivai.com.br/ferramentas/${slug}`);
    await expect(page.getByRole("heading", { name: "Como usar", exact: true })).toBeVisible();
  }
});

test("catálogo CMS: hubs e diretório não duplicam ferramentas", async ({ page }) => {
  await page.goto("/ferramentas/arquivos");
  for (const slug of fileSlugs) await expect(page.locator(`main a[href="/ferramentas/${slug}"]`)).toHaveCount(1);
  await page.goto("/ferramentas/imagens");
  await expect(page.locator('a[href="/ferramentas/removedor-de-metadados"]').filter({ has: page.getByRole("heading") })).toHaveCount(1);
  await page.goto("/ferramentas");
  for (const slug of [...fileSlugs, "removedor-de-metadados"]) {
    await expect(page.locator(`main a[href="/ferramentas/${slug}"]`)).toHaveCount(1);
  }
});
