import { test, expect, openTool, expectNoOverflow } from "./helpers";

test("marketing calculators retain their results with saving below the calculation", async ({ page }) => {
  for (const sample of [
    { slug: "roas", fields: { investimento: "1000", receita: "5000" }, result: "5,00x" },
    { slug: "roi", fields: { investimento: "1000", retorno: "1500" }, result: "50,00%" },
    { slug: "margem", fields: { precoVenda: "100", custoTotal: "60" }, result: "40,00%" },
    { slug: "markup", fields: { custoTotal: "100", markup: "50" }, result: "33,33%" },
  ]) {
    await openTool(page, `calculadora-de-${sample.slug}`);
    await expect(page.getByRole("region", { name: "Projetos salvos" }).getByText("Carregando seus projetos...")).toHaveCount(0);
    for (const [id, value] of Object.entries(sample.fields)) await page.locator(`#${id}`).fill(value!);
    await expect(page.getByText(sample.result, { exact: true }).first()).toBeVisible();
    const input = await page.locator(`#${Object.keys(sample.fields)[0]}`).boundingBox();
    const library = await page.getByRole("region", { name: "Projetos salvos" }).boundingBox();
    expect(library!.y).toBeGreaterThan(input!.y + input!.height);
    await expectNoOverflow(page);
  }
});
