import { test, expect, openTool, expectNoOverflow } from "./helpers";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("kivai_user_session", JSON.stringify({ access_token: "test-only", user: { id: "test" } })));
  await page.route("**/api/account/access", route => route.fulfill({ json: { userId: "test", plan: "free", subscription: null } }));
  await page.route("**/api/account/projects**", route => route.fulfill({ json: { projects: [] } }));
  await page.route("**/api/ai/credits", route => route.fulfill({ json: { wallet: { plan_code: "free", free_limit: 10, free_remaining: 10, purchased_remaining: 0, total_remaining: 10, renews_on: "2026-11-01" }, hourly: { limit: 5, remaining: 5, renews_at: null }, salesEnabled: true } }));
});

test("Planner requires consent, preserves existing copy, and applies generated fields without another request", async ({ page }) => {
  await page.addInitScript(() => { if (!localStorage.getItem("kivai:planejador-conteudo-social-media:v1")) localStorage.setItem("kivai:planejador-conteudo-social-media:v1", JSON.stringify({ theme: "Cafés especiais", audience: "Pessoas do bairro", objective: "Engajamento", networks: ["Instagram"], message: "Minha mensagem original", pillar: "", format: "Carrossel", approach: "", hook: "", topics: [""], ctaType: "Nenhum CTA", cta: "", tone: "Profissional", status: "Ideia" })); });
  let calls = 0;
  await page.route("**/api/ai/content-assistant", async route => {
    calls++;
    expect(route.request().postDataJSON().consent).toBe(true);
    await route.fulfill({ json: { kind: "planner", suggestion: { message: "Mensagem sugerida", hook: "Conheça seu próximo café", topics: ["Origem", "Preparo", "Escolha"], cta: "Comente sua preferência" } } });
  });
  await openTool(page, "planejador-de-conteudo-social-media");
  const generate = page.getByRole("button", { name: "Gerar sugestões · 1 crédito" });
  await expect(generate).toBeDisabled();
  await page.getByLabel(/Autorizo enviar o briefing/).check();
  await generate.click();
  await expect(page.getByRole("region", { name: "Sugestão de briefing" })).toBeVisible();
  await page.getByRole("button", { name: "Aplicar ao planejamento" }).click();
  await expect(page.getByLabel("Gancho ou abertura")).toHaveValue("Conheça seu próximo café");
  await expect(page.getByLabel(/Mensagem principal/)).toHaveValue("Minha mensagem original");
  expect(calls).toBe(1);
  await page.reload();
  await expect(page.getByLabel("Gancho ou abertura")).toHaveValue("Conheça seu próximo café");
  await expectNoOverflow(page);
});

test("Calendar adds only selected drafts, preserves existing items and prevents repeated insertion", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("kivai:calendario-editorial:v1", JSON.stringify([{ id: "existing", date: "2026-10-15", title: "Minha publicação existente", network: "Instagram", format: "Post", objective: "Engajamento", status: "Ideia", caption: "Texto original", cta: "", hashtags: "", observations: "", createdAt: "", updatedAt: "" }])));
  let calls = 0;
  await page.route("**/api/ai/content-assistant", async route => {
    calls++;
    const input = route.request().postDataJSON();
    expect(input).not.toHaveProperty("items");
    await route.fulfill({ json: { kind: "calendar", items: Array.from({ length: 3 }, (_, index) => ({ title: `Pauta de café ${index + 1}`, date: `2026-10-${15 + index}`, network: "Instagram", objective: "Engajamento", format: "Carrossel", caption: "Legenda de teste", cta: "Conheça", observations: "Use fotos reais" })) } });
  });
  await openTool(page, "calendario-editorial-redes-sociais");
  await page.getByLabel("Tema, negócio ou campanha").fill("Cafeteria do bairro");
  await page.getByLabel("Público do calendário").fill("Moradores da região");
  await page.getByLabel("Quantidade de sugestões").selectOption("3");
  await page.getByLabel(/Autorizo enviar o briefing/).check();
  await page.getByRole("button", { name: "Gerar sugestões · 1 crédito" }).click();
  await page.getByLabel("Pauta de café 3", { exact: true }).uncheck();
  await page.getByRole("button", { name: "Adicionar selecionadas (2)" }).click();
  await expect(page.getByRole("button", { name: "Adicionar selecionadas (0)" })).toBeDisabled();
  const items = await page.evaluate(() => JSON.parse(localStorage.getItem("kivai:calendario-editorial:v1") || "[]"));
  expect(items).toHaveLength(3);
  expect(items[0].title).toBe("Minha publicação existente");
  expect(items[1].status).toBe("Ideia");
  expect(items.some((item: { title: string }) => item.title === "Pauta de café 3")).toBe(false);
  expect(calls).toBe(1);
  await expectNoOverflow(page);
  await page.screenshot({ path: `test-results/calendar-ai-${test.info().project.name}.png`, fullPage: true });
});
