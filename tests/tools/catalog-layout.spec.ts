import { tools } from "../../lib/tools";
import { test, expect, expectNoOverflow } from "./helpers";

for (const signedIn of [false, true]) {
  test(`catalog layout sweep: ${signedIn ? "signed in" : "guest"}`, async ({ page }, testInfo) => {
    test.setTimeout(360_000);
    if (signedIn) {
      await page.addInitScript(() => { if (window.top === window) localStorage.setItem("kivai_user_session", JSON.stringify({ access_token: "layout-test", user: { id: "layout-test" } })); });
      await page.route("**/auth/v1/**", route => route.fulfill({ json: { id: "layout-test", email: "layout@example.com" } }));
      await page.route("**/rest/v1/**", route => route.fulfill({ json: [] }));
      await page.route("**/api/account/**", route => route.fulfill({ json: { projects: [], userId: "layout-test", plan: "pro", subscription: null } }));
      await page.route("**/api/ai/credits", route => route.fulfill({ json: { wallet: { plan_code: "pro", free_limit: 100, free_remaining: 100, purchased_remaining: 0, total_remaining: 100 }, hourly: { remaining: 5, limit: 5 } } }));
    }
    for (const tool of tools.filter(tool => tool.available)) {
      await test.step(tool.slug, async () => {
        const response = await page.goto(`/ferramentas/${tool.slug}`);
        expect.soft(response?.status(), tool.slug).toBe(200);
        const heading = page.locator("h1").first();
        await expect(heading, tool.slug).toBeVisible();
        await expect(page.getByRole("complementary", { name: "Adicionar ferramenta aos favoritos" }), tool.slug).toHaveCount(1);
        const library = page.getByRole("region", { name: "Projetos salvos" });
        if (await library.count()) {
          await expect(library.getByText("Carregando seus projetos...", { exact: true })).toHaveCount(0);
          const titleBox = await heading.boundingBox(), libraryBox = await library.boundingBox();
          expect.soft(libraryBox!.y, `${tool.slug}: saving must follow heading`).toBeGreaterThan(titleBox!.y + titleBox!.height);
          await expect.soft(library.getByRole("navigation", { name: "Ferramentas com projetos salvos" })).toHaveCount(0);
        }
        const breadcrumb = page.getByRole("navigation", { name: "Navegação estrutural da ferramenta" });
        if (await breadcrumb.count()) {
          const titleBox = await heading.boundingBox(), breadcrumbBox = await breadcrumb.boundingBox();
          expect.soft(titleBox!.y, `${tool.slug}: breadcrumb overlaps heading`).toBeGreaterThanOrEqual(breadcrumbBox!.y + breadcrumbBox!.height);
        }
        await expectNoOverflow(page);
        if (signedIn && ["calculadora-de-roas", "calculadora-de-roi", "calculadora-de-margem", "calculadora-de-markup"].includes(tool.slug)) {
          await page.screenshot({ path: testInfo.outputPath(`${tool.slug}.png`) });
        }
      });
    }
  });
}

test("opening the creator never jumps to an export button during hydration", async ({ page }) => {
  await page.goto("/ferramentas/criador-de-posts-com-ia");
  await expect(page.getByRole("button", { name: "Baixar arte em PNG" })).toBeEnabled();
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
});
