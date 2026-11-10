import { test, expect, expectNoOverflow } from "./helpers";
import type { Page } from "@playwright/test";

async function mockAccount(page: Page, options: { authFails?: boolean; accessFails?: boolean } = {}) {
  await page.addInitScript(() => localStorage.setItem("kivai_user_session", JSON.stringify({ access_token: "dashboard-test", user: { id: "dashboard-test" } })));
  await page.route("**/auth/v1/**", route => route.fulfill({ status: options.authFails ? 503 : 200, json: { id: "dashboard-test", email: `${"longemail".repeat(12)}@example.com` } }));
  await page.route("**/rest/v1/**", route => {
    const url = route.request().url();
    const json = url.includes("user_profiles") ? [{ full_name: "Teste", plan_code: "pro" }]
      : url.includes("subscription_requests") ? [{ id: "request-test", plan_code: "pro", billing_cycle: "monthly", amount_brl: 29, status: "awaiting_payment", payment_link: "https://example.com/payment" }]
      : [];
    return route.fulfill({ json });
  });
  await page.route("**/api/account/**", route => {
    const url = route.request().url();
    if (url.includes("/access")) return route.fulfill({ status: options.accessFails ? 503 : 200, json: { userId: "dashboard-test", plan: "pro", subscription: null } });
    if (url.includes("/announcements")) return route.fulfill({ json: { notices: [] } });
    if (url.includes("/routine-reminders")) return route.fulfill({ json: { preference: { enabled: false, weekday: 1, hour: 9, time_zone: "America/Sao_Paulo", tool_slug: "compressor-de-imagens" }, vapidPublicKey: "" } });
    return route.fulfill({ json: { projects: [] } });
  });
  await page.route("**/api/ai/credits", route => route.fulfill({ json: { wallet: { plan_code: "pro", free_limit: 100, free_remaining: 99, purchased_remaining: 5, total_remaining: 104, renews_on: "2026-11-01" }, hourly: { limit: 5, remaining: 4, renews_at: null }, salesEnabled: true } }));
}

test("dashboard shows credits and recovers from payment reporting failure", async ({ page }) => {
  await mockAccount(page);
  let attempts = 0;
  await page.route("**/api/account/subscription-request", route => route.fulfill({ status: ++attempts === 1 ? 500 : 200, json: { ok: attempts > 1 } }));
  await page.goto("/conta");
  await expect(page.getByText("Plano Pro", { exact: true })).toBeVisible();
  await expect(page.getByText("104", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Comprar créditos" })).toHaveAttribute("href", "/creditos");
  await expectNoOverflow(page);
  await page.getByRole("button", { name: "Já realizei o pagamento" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Não foi possível informar o pagamento" })).toBeVisible();
  await page.getByRole("button", { name: "Já realizei o pagamento" }).click();
  await expect(page.getByText("Pagamento informado. Aguardando confirmação e ativação.")).toBeVisible();
  expect(attempts).toBe(2);
  await expect(page.getByText("Não foi possível informar o pagamento", { exact: false })).toHaveCount(0);
});

test("account menu keeps profile, billing and upgrade in a compact dropdown", async ({ page }) => {
  await mockAccount(page);
  await page.goto("/conta");
  await expect(page.getByRole("link", { name: "Configurações" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Sair da conta" })).not.toBeVisible();
  await page.locator('summary[aria-label="Abrir menu do usuário"]').click();
  await expect(page.getByRole("navigation", { name: "Menu da conta" }).getByRole("link", { name: "Meus Dados" })).toHaveAttribute("href", "/conta/dados");
  await expect(page.getByRole("link", { name: "Minha assinatura e pagamentos" })).toHaveAttribute("href", "/conta/cobrancas");
  await expect(page.getByRole("navigation", { name: "Menu da conta" }).getByRole("link", { name: "Central de Atendimento" })).toHaveAttribute("href", "/conta/atendimento");
  await expect(page.locator("#painel-plano")).toHaveCount(0);
  await expect(page.locator("#painel-atendimento")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Sair da conta" })).toBeVisible();
  await expectNoOverflow(page);
});

test("profile menu stays completely visible on an iPhone-sized viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 740 });
  await mockAccount(page);
  await page.goto("/conta");
  await page.locator('summary[aria-label="Abrir menu do usuário"]').click();
  const menu = page.getByRole("navigation", { name: "Menu da conta" });
  await expect(menu.getByRole("link", { name: "Meus Dados" })).toBeVisible();
  const upgrade = page.getByRole("link", { name: "Conhecer Agency" });
  await expect(upgrade).toBeVisible();
  const bounds = await upgrade.locator("..").boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390);
  await expect(page.getByRole("button", { name: "Sair da conta" })).toBeInViewport();
  await expectNoOverflow(page);
});

test("bell combines announcements and support without dashboard duplicates", async ({ page }) => {
  await mockAccount(page);
  const noticeId = "12345678-1234-1234-1234-123456789012";
  await page.route("**/api/account/announcements", route => {
    if (route.request().method() === "POST") return route.fulfill({ json: { ok: true } });
    return route.fulfill({ json: { notices: [{ id: noticeId, title: "Aviso importante", body: "Mensagem de teste", link_url: "/planos", read: false, created_at: "2026-11-10T12:00:00Z" }] } });
  });
  await page.route("**/api/account/support/notifications", route => {
    if (route.request().method() === "PATCH") return route.fulfill({ json: { ok: true } });
    return route.fulfill({ json: { notifications: [{ id: "support-one", ticket_id: "ticket-one", title: "Protocolo atualizado", kind: "reply", read_at: null, created_at: "2026-11-10T13:00:00Z" }] } });
  });
  await page.goto("/conta");
  await expect(page.getByText("Seu espaço para retomar ferramentas recentes", { exact: false })).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Benefício de boas-vindas" })).toHaveCount(0);
  await expect(page.locator("#painel-avisos")).toHaveCount(0);
  const bell = page.getByRole("button", { name: "Notificações: 2 não lidas" });
  await expect(bell).toBeVisible();
  await bell.click();
  const panel = page.getByRole("region", { name: "Notificações" });
  await expect(panel.getByText("Aviso importante")).toBeVisible();
  await expect(panel.getByText("Protocolo atualizado")).toBeVisible();
  await expect(panel.getByText("Mensagem de teste")).toBeVisible();
  await expect(panel.getByRole("link", { name: "Saiba mais" })).toHaveAttribute("href", "/planos");
  await panel.getByRole("button", { name: "Marcar como lido" }).click();
  await expect(page.getByRole("button", { name: "Notificações: 1 não lidas" })).toBeVisible();
  await expect(panel.getByRole("link", { name: "Protocolo atualizado" })).toHaveAttribute("href", "/conta/atendimento?ticket=ticket-one");
  await expectNoOverflow(page);
});

test("unavailable plan never appears as free", async ({ page }) => {
  await mockAccount(page, { accessFails: true });
  await page.goto("/conta");
  await expect(page.getByText("Plano indisponível", { exact: true })).toBeVisible();
  await expect(page.getByText("Plano Grátis", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Atualizar painel" })).toBeVisible();
});

test("temporary auth outage preserves session and allows retry", async ({ page }) => {
  await mockAccount(page, { authFails: true });
  await page.goto("/conta");
  await expect(page.getByRole("button", { name: "Atualizar painel" })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("kivai_user_session"))).toContain("dashboard-test");
  await expect(page).toHaveURL(/\/conta$/);
  await page.route("**/auth/v1/**", route => route.fulfill({ json: { id: "dashboard-test", email: "teste@example.com" } }));
  await page.getByRole("button", { name: "Atualizar painel" }).click();
  await expect(page.getByText("104", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Atualizar painel" })).toHaveCount(0);
});

const savedProjects = [
  { id: "project-one", kind: "briefing", title: "Campanha São João", client_name: "Café Central", payload: {}, revision: 1, updated_at: "2026-10-16T12:00:00Z" },
  { id: "project-two", kind: "calendar", title: "Calendário de outubro", client_name: "Loja Azul", payload: [], revision: 1, updated_at: "2026-10-16T12:00:00Z" },
];

test("saved projects are easy to find and filter without losing the catalog", async ({ page }, testInfo) => {
  await mockAccount(page);
  await page.route("**/api/account/projects", route => route.fulfill({ json: { projects: savedProjects } }));
  await page.goto("/conta");
  const library = page.getByRole("region", { name: "Projetos salvos" });
  const search = library.getByRole("searchbox", { name: "Buscar projetos" });
  await expect(search).toBeVisible();
  const articles = library.locator("article");
  await expect(articles).toHaveCount(2);
  expect((await articles.first().boundingBox())!.y).toBeLessThan((await library.getByRole("navigation", { name: "Ferramentas com projetos salvos" }).boundingBox())!.y);
  await search.fill("sao joao");
  await expect(articles).toHaveCount(1);
  await expect(articles.first()).toContainText("Campanha São João");
  await expect(articles.first().getByRole("link", { name: "Abrir ferramenta" })).toHaveAttribute("href", "/ferramentas/planejador-de-conteudo-social-media");
  await search.fill("cafe");
  await expect(articles).toHaveCount(1);
  await search.fill("calendar");
  await expect(articles).toHaveCount(1);
  await library.getByLabel("Filtrar por cliente").selectOption("Café Central");
  await expect(library.getByText("Nenhum projeto encontrado.", { exact: false })).toBeVisible();
  await expect(library.getByText("Você ainda não tem projetos salvos", { exact: false })).toHaveCount(0);
  const clear = library.getByRole("button", { name: "Limpar filtros" });
  await clear.focus();
  await page.keyboard.press("Enter");
  await expect(articles).toHaveCount(2);
  await expect(library.getByRole("navigation").getByRole("link")).toHaveCount(14);
  await expectNoOverflow(page);
  await search.scrollIntoViewIfNeeded();
  await library.screenshot({ path: testInfo.outputPath("project-library.png") });
});

test("project outage shows a retry instead of claiming the account is empty", async ({ page }) => {
  await mockAccount(page);
  let unavailable = true;
  await page.route("**/api/account/projects", route => route.fulfill(unavailable ? { status: 503, json: { error: "Não foi possível carregar os projetos." } } : { json: { projects: savedProjects } }));
  await page.goto("/conta");
  const library = page.getByRole("region", { name: "Projetos salvos" });
  await expect(library.getByRole("alert")).toContainText("Não foi possível carregar os projetos.");
  await expect(library.getByText("Você ainda não tem projetos salvos", { exact: false })).toHaveCount(0);
  unavailable = false;
  await library.getByRole("button", { name: "Tentar carregar projetos novamente" }).click();
  await expect(library.locator("article")).toHaveCount(2);
  await expect(library.getByRole("alert")).toHaveCount(0);
});
