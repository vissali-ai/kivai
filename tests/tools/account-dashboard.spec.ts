import { test, expect, expectNoOverflow } from "./helpers";
import type { Page } from "@playwright/test";

async function mockAccount(page: Page, options: { authFails?: boolean; accessFails?: boolean; plan?: "free" | "pro" | "agency" } = {}) {
  await page.addInitScript(() => localStorage.setItem("kivai_user_session", JSON.stringify({ access_token: "dashboard-test", user: { id: "dashboard-test" } })));
  await page.route("**/auth/v1/**", route => route.fulfill({ status: options.authFails ? 503 : 200, json: { id: "dashboard-test", email: `${"longemail".repeat(12)}@example.com` } }));
  await page.route("**/rest/v1/**", route => {
    const url = route.request().url();
    const json = url.includes("user_profiles") ? [{ full_name: "Teste", plan_code: options.plan ?? "pro" }]
      : url.includes("subscription_requests") ? [{ id: "request-test", plan_code: "pro", billing_cycle: "monthly", amount_brl: 29, status: "awaiting_payment", payment_link: "https://example.com/payment" }]
      : [];
    return route.fulfill({ json });
  });
  await page.route("**/api/account/**", route => {
    const url = route.request().url();
    if (url.includes("/access")) return route.fulfill({ status: options.accessFails ? 503 : 200, json: { userId: "dashboard-test", plan: options.plan ?? "pro", subscription: null } });
    if (url.includes("/project-folders")) return route.fulfill({ json: { folders: [], assignments: [] } });
    if (url.includes("/project-shortcuts")) return route.fulfill({ json: { toolKinds: ["post_creator", "calendar", "briefing", "social_report"] } });
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
  await expect(page.getByText("Plano Pro", { exact: true }).first()).toBeVisible();
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

test("dashboard presents services without personalization or plan upsell card", async ({ page }) => {
  await mockAccount(page);
  await page.goto("/conta");
  await expect(page.getByText("Personalize seu Kivai")).toHaveCount(0);
  await expect(page.getByText("Seu primeiro passo no Kivai")).toHaveCount(0);
  await expect(page.getByText("Mais recursos", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Soluções profissionais para o seu negócio" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Conhecer nossos serviços" })).toHaveAttribute("href", "/servicos");
  await expect(page.getByRole("link", { name: "Planos e benefícios Kivai" })).toHaveCount(0);
  await expectNoOverflow(page);
});

test("workspace navigation highlights projects and routines without duplicating the library", async ({ page }) => {
  await mockAccount(page);
  await page.goto("/conta");
  const nav = page.getByRole("navigation", { name: "Navegação do espaço de trabalho" });
  await expect(nav.getByRole("link", { name: "Início" })).toHaveAttribute("aria-current", "page");
  await expect(nav.getByRole("link", { name: "Meus Projetos" })).toHaveAttribute("href", "/conta/projetos");
  await expect(nav.getByRole("link", { name: "Minhas Rotinas" })).toHaveAttribute("href", "/conta/rotinas");
  await expect(nav.getByRole("link", { name: "Favoritos" })).toHaveAttribute("href", "/conta/favoritos");
  await expect(page.getByRole("region", { name: "Continue de onde parou" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Projetos salvos" })).toHaveCount(0);
  await nav.getByRole("link", { name: "Meus Projetos" }).click();
  await expect(page).toHaveURL(/\/conta\/projetos$/);
  await expect(page.getByRole("region", { name: "Projetos salvos" })).toBeVisible();
  await expectNoOverflow(page);
});

test("workspace navigation fits a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 740 });
  await mockAccount(page);
  await page.goto("/conta");
  await expect(page.getByRole("navigation", { name: "Navegação do espaço de trabalho" }).getByRole("link", { name: "Minhas Rotinas" })).toBeVisible();
  await expectNoOverflow(page);
});

test("routines live in the profile menu and not the dashboard", async ({ page }) => {
  await mockAccount(page);
  await page.goto("/conta");
  await expect(page.locator("#painel-lembretes")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Minha rotina semanal" })).toHaveCount(0);
  await page.locator('summary[aria-label="Abrir menu do usuário"]').click();
  await expect(page.getByRole("navigation", { name: "Menu da conta" }).getByRole("link", { name: "Minhas Rotinas" })).toHaveAttribute("href", "/conta/rotinas");
  await page.goto("/conta/rotinas");
  await expect(page.getByRole("heading", { name: "Minhas Rotinas" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Minha rotina semanal" })).toBeVisible();
  await expect(page.getByText("Você pode configurar uma rotina semanal por vez.", { exact: false })).toBeVisible();
  await expect(page.getByRole("link", { name: "Voltar ao painel" })).toHaveAttribute("href", "/conta");
  await expectNoOverflow(page);
});

test("unavailable plan never appears as free", async ({ page }) => {
  await mockAccount(page, { accessFails: true });
  await page.goto("/conta");
  await expect(page.getByText("Plano indisponível", { exact: true }).first()).toBeVisible();
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
  { id: "11111111-1111-4111-8111-111111111111", kind: "briefing", title: "Campanha São João", client_name: "Café Central", payload: { theme: "Projeto de campanha", objective: "Engajamento", audience: "Público local", networks: ["Instagram"], message: "Mensagem", pillar: "Informativo", format: "Carrossel", approach: "Lista", hook: "Abertura", topics: ["Tópico A"], ctaType: "Comentar", cta: "Saiba mais", tone: "Profissional", status: "Planejado" }, revision: 3, updated_at: "2026-10-16T12:00:00Z" },
  { id: "22222222-2222-4222-8222-222222222222", kind: "calendar", title: "Calendário de outubro", client_name: "Loja Azul", payload: [{ id: "post-one", date: "2026-11-11", title: "Postagem restaurada", network: "Instagram", format: "Post", objective: "Alcance", status: "Planejado", caption: "Legenda", cta: "", hashtags: "", observations: "", createdAt: "2026-11-01", updatedAt: "2026-11-01" }], revision: 2, updated_at: "2026-10-16T12:00:00Z" },
];

test("saved projects are easy to find and filter without losing the catalog", async ({ page }, testInfo) => {
  await mockAccount(page);
  await page.route("**/api/account/projects", route => route.fulfill({ json: { projects: savedProjects } }));
  await page.goto("/conta/projetos");
  const library = page.getByRole("region", { name: "Projetos salvos" });
  const search = library.getByRole("searchbox", { name: "Buscar projetos" });
  await expect(search).toBeVisible();
  const articles = library.locator("article");
  await expect(articles).toHaveCount(2);
  await expect(library.getByRole("button", { name: "Exibir em cards" })).toHaveAttribute("aria-pressed", "true");
  await library.getByRole("button", { name: "Exibir em lista" }).click();
  await expect(library.getByRole("button", { name: "Exibir em lista" })).toHaveAttribute("aria-pressed", "true");
  await expect(library.locator("[data-project-view]")).toHaveAttribute("data-project-view", "list");
  await search.fill("sao joao");
  await expect(articles).toHaveCount(1);
  await expect(articles.first()).toContainText("Campanha São João");
  await expect(articles.first().getByRole("link", { name: "Continuar projeto" })).toHaveAttribute("href", "/ferramentas/planejador-de-conteudo-social-media?project=11111111-1111-4111-8111-111111111111");
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
  await library.getByText("Ver todas as ferramentas compatíveis").click();
  await expect(library.getByRole("navigation", { name: "Todas as ferramentas com projetos salvos" }).getByRole("link")).toHaveCount(15);
  await expectNoOverflow(page);
  await search.scrollIntoViewIfNeeded();
  await library.screenshot({ path: testInfo.outputPath("project-library.png") });
});

test("user can choose and reorder shortcuts and the selection reloads from their account", async ({ page }) => {
  await mockAccount(page);
  const defaults = ["post_creator", "calendar", "briefing", "social_report"];
  let saved: string[] = [...defaults];
  let writes = 0;
  await page.route("**/api/account/projects", route => route.fulfill({ json: { projects: [] } }));
  await page.route("**/api/account/project-shortcuts", route => {
    if (route.request().method() === "PUT") {
      writes++;
      saved = (route.request().postDataJSON() as { toolKinds: string[] }).toolKinds;
      return route.fulfill({ json: { toolKinds: saved } });
    }
    return route.fulfill({ json: { toolKinds: saved } });
  });
  await page.goto("/conta/projetos");
  const section = page.getByRole("region", { name: "Projetos salvos" });
  const shortcuts = section.locator("section[aria-labelledby='create-project-shortcuts-title']");
  await expect(shortcuts.locator(":scope > div.grid > a").first()).toContainText("Criador de Posts com IA");
  await section.getByRole("button", { name: "Personalizar" }).click();
  await section.getByRole("button", { name: "Calendário", exact: true }).click();
  await section.getByRole("button", { name: "ROAS", exact: true }).click();
  await section.getByRole("button", { name: "Subir ROAS" }).click();
  await section.getByRole("button", { name: "Salvar minha seleção" }).click();
  await expect.poll(() => writes).toBe(1);
  expect(saved).toEqual(["post_creator", "briefing", "roas", "social_report"]);
  await page.reload();
  await expect(section.getByRole("heading", { name: "Crie seu primeiro projeto" })).toBeVisible();
  const cards = section.locator("section[aria-labelledby='create-project-shortcuts-title'] > div.grid > a");
  await expect(cards).toHaveCount(4);
  await expect(cards.nth(2)).toContainText("ROAS");
  await expect(cards.filter({ hasText: "Calendário" })).toHaveCount(0);
});

test("shortcut editor enforces six selections and makes all tools accessible", async ({ page }) => {
  await mockAccount(page);
  await page.route("**/api/account/projects", route => route.fulfill({ json: { projects: [] } }));
  await page.goto("/conta/projetos");
  const library = page.getByRole("region", { name: "Projetos salvos" });
  await library.getByRole("button", { name: "Personalizar" }).click();
  await library.getByRole("button", { name: "ROAS", exact: true }).click();
  await library.getByRole("button", { name: "ROI", exact: true }).click();
  await expect(library.getByRole("button", { name: "Margem", exact: true })).toBeDisabled();
  await expect(library.getByText("6/6 selecionadas")).toBeVisible();
  await library.getByRole("button", { name: "Cancelar", exact: true }).click();
  await library.getByText("Ver todas as ferramentas compatíveis").click();
  await expect(library.getByRole("navigation", { name: "Todas as ferramentas com projetos salvos" }).getByRole("link")).toHaveCount(15);
  await expectNoOverflow(page);
});

test("projects default to cards for free and pro, list for agency", async ({ page }) => {
  for (const plan of ["free", "pro", "agency"] as const) {
    await mockAccount(page, { plan });
    await page.route("**/api/account/projects", route => route.fulfill({ json: { projects: savedProjects } }));
    await page.goto("/conta/projetos");
    const library = page.getByRole("region", { name: "Projetos salvos" });
    const expected = plan === "agency" ? "list" : "cards";
    await expect(library.locator("[data-project-view]")).toHaveAttribute("data-project-view", expected);
    await expect(library.getByRole("button", { name: "Exibir em " + (expected === "cards" ? "cards" : "lista") })).toHaveAttribute("aria-pressed", "true");
    await expect(library.locator("article")).toHaveCount(2);
    await expect(library.locator("article").first().getByRole("link", { name: "Continuar projeto" })).toBeVisible();
    await library.locator("article").first().getByLabel("Mais ações para Campanha São João").click();
    await expect(library.locator("article").first().getByRole("button", { name: "Exportar JSON" })).toBeVisible();
    await expect(library.locator("article").first().getByRole("button", { name: "Excluir", exact: true })).toBeVisible();
    await expectNoOverflow(page);
  }
});

test("project view choice persists for the same account after reload", async ({ page }) => {
  await mockAccount(page, { plan: "pro" });
  await page.route("**/api/account/projects", route => route.fulfill({ json: { projects: savedProjects } }));
  await page.goto("/conta/projetos");
  const library = page.getByRole("region", { name: "Projetos salvos" });
  await expect(library.locator("[data-project-view]")).toHaveAttribute("data-project-view", "cards");
  await library.getByRole("button", { name: "Exibir em lista" }).click();
  await expect(library.locator("[data-project-view]")).toHaveAttribute("data-project-view", "list");
  await expect.poll(() => page.evaluate(() => localStorage.getItem("kivai:project-library-view:dashboard-test"))).toBe("list");
  await page.reload();
  await expect(library.locator("[data-project-view]")).toHaveAttribute("data-project-view", "list");
  await library.getByRole("button", { name: "Exibir em cards" }).click();
  await page.reload();
  await expect(library.locator("[data-project-view]")).toHaveAttribute("data-project-view", "cards");
});

test("library shows the saved folder name next to project metadata", async ({ page }) => {
  await mockAccount(page);
  const folderId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  await page.route("**/api/account/projects", route => route.fulfill({ json: { projects: savedProjects } }));
  await page.route("**/api/account/project-folders", route => route.fulfill({
    json: {
      folders: [{ id: folderId, name: "Campanhas", created_at: "2026-11-12T10:00:00Z" }],
      assignments: [{ project_id: savedProjects[0].id, folder_id: folderId }],
    },
  }));
  await page.goto("/conta/projetos");
  const articles = page.getByRole("region", { name: "Projetos salvos" }).locator("article");
  await expect(articles.filter({ hasText: "Campanha São João" })).toContainText("Pasta: Campanhas");
  await expect(articles.filter({ hasText: "Calendário de outubro" })).toContainText("Pasta: Sem pasta");
});

test("Agency duplicates a saved project in the library preserving its payload and client", async ({ page }) => {
  await mockAccount(page, { plan: "agency" });
  const original = savedProjects[0];
  const duplicate = { ...original, id: "99999999-9999-4999-8999-999999999999", title: "Campanha São João (cópia)", revision: 1 };
  let submitted: Record<string, unknown> | null = null;
  await page.route("**/api/account/projects", route => {
    if (route.request().method() === "POST") {
      submitted = route.request().postDataJSON() as Record<string, unknown>;
      return route.fulfill({ json: { project: duplicate } });
    }
    return route.fulfill({ json: { projects: savedProjects } });
  });
  await page.goto("/conta/projetos");
  const library = page.getByRole("region", { name: "Projetos salvos" });
  await library.getByLabel("Mais ações para Campanha São João").click();
  await library.getByRole("button", { name: "Duplicar", exact: true }).click();
  const modal = page.getByRole("dialog", { name: "Duplicar projeto" });
  await expect(modal.getByRole("textbox", { name: "Nome da cópia" })).toHaveValue("Campanha São João (cópia)");
  await modal.getByRole("button", { name: "Criar cópia" }).click();
  await expect(modal).toHaveCount(0);
  await expect.poll(() => submitted).toMatchObject({
    id: null, kind: "briefing", title: "Campanha São João (cópia)",
    clientName: "Café Central", payload: original.payload,
  });
  expect(submitted).not.toHaveProperty("revision");
  await expect(library.locator("article")).toHaveCount(3);
  await expect(library.locator("article").filter({ hasText: "Campanha São João (cópia)" })).toHaveCount(1);
  await expect(library.locator("article").filter({ hasText: "Campanha São João" })).toHaveCount(2);
});

test("duplicating handles plan limit without creating a fake project", async ({ page }) => {
  await mockAccount(page, { plan: "free" });
  let attempts = 0;
  await page.route("**/api/account/projects", route => {
    if (route.request().method() === "POST") {
      attempts++;
      return route.fulfill({ status: 409, json: { error: "Limite de projetos atingido" } });
    }
    return route.fulfill({ json: { projects: savedProjects } });
  });
  await page.goto("/conta/projetos");
  const library = page.getByRole("region", { name: "Projetos salvos" });
  await library.getByLabel("Mais ações para Campanha São João").click();
  await library.getByRole("button", { name: "Duplicar", exact: true }).click();
  const modal = page.getByRole("dialog", { name: "Duplicar projeto" });
  await modal.getByRole("button", { name: "Criar cópia" }).click();
  await expect(modal.getByRole("alert")).toContainText("Limite de projetos atingido");
  await expect(library.locator("article")).toHaveCount(2);
  expect(attempts).toBe(1);
  await modal.getByRole("button", { name: "Cancelar" }).click();
  await expect(modal).toHaveCount(0);
});

test("project folders can be created, assigned and filtered without losing projects", async ({ page }) => {
  await mockAccount(page);
  const folder = { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", name: "Campanhas", created_at: "2026-11-12T10:00:00Z" };
  const assignments: Array<{ project_id: string; folder_id: string }> = [];
  let created = 0;
  let moved = 0;
  await page.route("**/api/account/projects", route => route.fulfill({ json: { projects: savedProjects } }));
  await page.route("**/api/account/project-folders", route => {
    const method = route.request().method();
    if (method === "GET") return route.fulfill({ json: { folders: created ? [folder] : [], assignments } });
    const body = route.request().postDataJSON() as Record<string, unknown>;
    if (method === "POST") { created++; return route.fulfill({ status: 201, json: { folder } }); }
    if (method === "PUT") {
      moved++;
      assignments.splice(0, assignments.length);
      if (body.folderId) assignments.push({ project_id: String(body.projectId), folder_id: String(body.folderId) });
      return route.fulfill({ json: { ok: true } });
    }
    return route.fulfill({ status: 405, json: {} });
  });
  await page.goto("/conta/projetos");
  const library = page.getByRole("region", { name: "Projetos salvos" });
  await expect(library.getByLabel("Filtrar por pasta")).toBeVisible();
  await library.getByRole("textbox", { name: "Nova pasta" }).fill("Campanhas");
  await library.getByRole("button", { name: "Criar pasta" }).click();
  await expect(library.getByLabel("Filtrar por pasta")).toHaveValue(folder.id);
  await expect(library.locator("article")).toHaveCount(0);
  await library.getByLabel("Filtrar por pasta").selectOption("all");
  await library.getByLabel("Pasta de Campanha São João").selectOption(folder.id);
  await expect.poll(() => moved).toBe(1);
  await library.getByLabel("Filtrar por pasta").selectOption(folder.id);
  await expect(library.locator("article")).toHaveCount(1);
  await expect(library.locator("article").first()).toContainText("Campanha São João");
  await library.getByLabel("Pasta de Campanha São João").selectOption("");
  await expect(library.locator("article")).toHaveCount(0);
  await library.getByLabel("Filtrar por pasta").selectOption("all");
  await expect(library.locator("article")).toHaveCount(2);
  await expectNoOverflow(page);
});

test("empty folders and empty accounts explain the state instead of showing blank content", async ({ page }) => {
  await mockAccount(page);
  const folderId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  await page.route("**/api/account/projects", route => route.fulfill({ json: { projects: savedProjects } }));
  await page.route("**/api/account/project-folders", route => route.fulfill({
    json: { folders: [{ id: folderId, name: "Sem campanhas", created_at: "2026-11-12T10:00:00Z" }], assignments: [] },
  }));
  await page.goto("/conta/projetos");
  const library = page.getByRole("region", { name: "Projetos salvos" });
  await library.getByLabel("Filtrar por pasta").selectOption(folderId);
  await expect(library.getByRole("status").filter({ hasText: "Nenhum projeto nesta pasta" })).toBeVisible();
  await library.getByLabel("Filtrar por pasta").selectOption("all");
  await expect(library.locator("article")).toHaveCount(2);
  await page.route("**/api/account/projects", route => route.fulfill({ json: { projects: [] } }));
  await page.reload();
  await expect(library.getByRole("status").filter({ hasText: "Você ainda não tem projetos salvos" })).toBeVisible();
  await expectNoOverflow(page);
});

test("folder fetch failure offers retry without hiding projects", async ({ page }) => {
  await mockAccount(page);
  let attempts = 0;
  let unavailable = true;
  await page.route("**/api/account/projects", route => route.fulfill({ json: { projects: savedProjects } }));
  await page.route("**/api/account/project-folders", route => {
    attempts++;
    return route.fulfill(unavailable
      ? { status: 503, json: { error: "Indisponível" } }
      : { json: { folders: [], assignments: [] } });
  });
  await page.goto("/conta/projetos");
  const library = page.getByRole("region", { name: "Projetos salvos" });
  await expect(library.locator("article")).toHaveCount(2);
  await expect(library.getByRole("button", { name: "Tentar carregar pastas novamente" })).toBeVisible();
  unavailable = false;
  const beforeRetry = attempts;
  await library.getByRole("button", { name: "Tentar carregar pastas novamente" }).click();
  await expect(library.getByLabel("Filtrar por pasta")).toBeVisible();
  await expect(library.locator("article")).toHaveCount(2);
  expect(attempts).toBeGreaterThan(beforeRetry);
});

test("unavailable folder service does not conceal existing saved projects", async ({ page }) => {
  await mockAccount(page);
  await page.route("**/api/account/projects", route => route.fulfill({ json: { projects: savedProjects } }));
  await page.route("**/api/account/project-folders", route => route.fulfill({ status: 503, json: { error: "Serviço indisponível" } }));
  await page.goto("/conta/projetos");
  const library = page.getByRole("region", { name: "Projetos salvos" });
  await expect(library.getByRole("alert")).toContainText("Não foi possível carregar as pastas");
  await expect(library.locator("article")).toHaveCount(2);
  await expect(library.getByRole("link", { name: "Continuar projeto" })).toHaveCount(2);
});

test("planner resumes a saved project only after confirmation and updates the same revision", async ({ page }) => {
  await mockAccount(page, { plan: "agency" });
  let payloadSent: Record<string, unknown> | null = null;
  await page.route("**/api/account/projects", async route => {
    if (route.request().method() === "POST") {
      payloadSent = route.request().postDataJSON() as Record<string, unknown>;
      return route.fulfill({ json: { project: { ...savedProjects[0], revision: 4 } } });
    }
    return route.fulfill({ json: { projects: savedProjects } });
  });
  await page.goto("/conta/projetos");
  const project = page.getByRole("region", { name: "Projetos salvos" }).locator("article").filter({ hasText: "Campanha São João" });
  await project.getByRole("link", { name: "Continuar projeto" }).click();
  await expect(page).toHaveURL(/project=11111111-1111-4111-8111-111111111111/);
  const dialog = page.getByRole("dialog", { name: "Continuar projeto salvo?" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Continuar projeto" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("textbox", { name: "Tema do conteúdo" })).toHaveValue("Projeto de campanha");
  const library = page.getByRole("region", { name: "Projetos salvos" });
  await expect(library.getByRole("textbox", { name: "Nome do projeto" })).toHaveValue("Campanha São João");
  await library.getByRole("button", { name: "Salvar na conta", exact: true }).click();
  await expect.poll(() => payloadSent).toMatchObject({ id: savedProjects[0].id, kind: "briefing", revision: 3 });
});

test("calendar refuses to replace a local draft until user confirms", async ({ page }) => {
  await mockAccount(page);
  await page.addInitScript(() => {
    localStorage.setItem("kivai:calendario-editorial:v1", JSON.stringify([{ id: "local-draft", date: "2026-11-12", title: "Rascunho local", network: "Instagram", format: "Post", objective: "Alcance", status: "Ideia", caption: "", cta: "", hashtags: "", observations: "", createdAt: "2026-11-01", updatedAt: "2026-11-01" }]));
  });
  await page.route("**/api/account/projects", route => route.fulfill({ json: { projects: savedProjects } }));
  await page.goto("/ferramentas/calendario-editorial-redes-sociais?project=22222222-2222-4222-8222-222222222222");
  const dialog = page.getByRole("dialog", { name: "Continuar projeto salvo?" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Manter conteúdo atual" }).click();
  await expect(dialog).toHaveCount(0);
  await expect.poll(async () => page.evaluate(() => JSON.parse(localStorage.getItem("kivai:calendario-editorial:v1") ?? "[]")[0]?.title)).toBe("Rascunho local");
  await expect(page.getByText("Postagem restaurada", { exact: true })).toHaveCount(0);
});

test("supported tools expose a direct resume link while unverified tools keep their original route", async ({ page }) => {
  await mockAccount(page);
  const cases = [
    ["qr_code", "/ferramentas/gerador-de-qr-code"],
    ["social_report", "/ferramentas/gerador-de-relatorio-social-media"],
    ["preview_post", "/ferramentas/preview-de-post-redes-sociais"],
    ["roas", "/ferramentas/calculadora-de-roas"],
    ["roi", "/ferramentas/calculadora-de-roi"],
    ["margin", "/ferramentas/calculadora-de-margem"],
    ["markup", "/ferramentas/calculadora-de-markup"],
    ["proofreader", "/ferramentas/corretor-de-texto"],
  ] as const;
  const expanded = [
    ...savedProjects,
    ...cases.map(([kind], index) => ({
      id: `33333333-3333-4333-8333-${String(index + 1).padStart(12, "0")}`,
      kind,
      title: `Projeto extra ${index + 1}`,
      client_name: "",
      payload: {},
      revision: 1,
      updated_at: "2026-11-11T12:00:00Z",
    })),
    { id: "44444444-4444-4444-8444-444444444444", kind: "watermark", title: "Marca d'água não verificada", client_name: "", payload: {}, revision: 1, updated_at: "2026-11-11T12:00:00Z" },
  ];
  await page.route("**/api/account/projects", route => route.fulfill({ json: { projects: expanded } }));
  await page.goto("/conta/projetos");
  const library = page.getByRole("region", { name: "Projetos salvos" });
  await expect(library.locator("article")).toHaveCount(expanded.length);
  for (const [kind, href] of cases) {
    const project = expanded.find(item => item.kind === kind)!;
    const card = library.locator("article").filter({ hasText: project.title });
    await expect(card.getByRole("link", { name: "Continuar projeto" })).toHaveAttribute("href", `${href}?project=${project.id}`);
  }
  const watermark = library.locator("article").filter({ hasText: "Marca d'água não verificada" });
  await expect(watermark.getByRole("link", { name: "Continuar projeto" })).toHaveAttribute("href", "/ferramentas/adicionar-marca-dagua?project=44444444-4444-4444-8444-444444444444");
  await expectNoOverflow(page);
});

test("ROAS resumes the exact saved values and saves to the same project revision", async ({ page }) => {
  await mockAccount(page);
  const project = { id: "55555555-5555-4555-8555-555555555555", kind: "roas", title: "ROAS de novembro", client_name: "", revision: 2, updated_at: "2026-11-11T12:00:00Z", payload: { investimento: "100", receita: "500", margem: "30" } };
  let saved: Record<string, unknown> | null = null;
  await page.route("**/api/account/projects", route => {
    if (route.request().method() === "POST") {
      saved = route.request().postDataJSON() as Record<string, unknown>;
      return route.fulfill({ json: { project: { ...project, revision: 3 } } });
    }
    return route.fulfill({ json: { projects: [project] } });
  });
  await page.goto("/conta/projetos");
  await page.getByRole("region", { name: "Projetos salvos" }).getByRole("link", { name: "Continuar projeto" }).click();
  await expect(page).toHaveURL(/project=55555555-5555-4555-8555-555555555555/);
  const dialog = page.getByRole("dialog", { name: "Continuar projeto salvo?" });
  await dialog.getByRole("button", { name: "Continuar projeto" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.locator("#investimento")).toHaveValue("100");
  const library = page.getByRole("region", { name: "Projetos salvos" });
  await expect(library.getByRole("textbox", { name: "Nome do projeto" })).toHaveValue("ROAS de novembro");
  await library.getByRole("button", { name: "Salvar na conta", exact: true }).click();
  await expect.poll(() => saved).toMatchObject({ id: project.id, kind: "roas", revision: 2, payload: project.payload });
});

test("remaining saved project types link to their own tool and restore with confirmation", async ({ page }) => {
  await mockAccount(page);
  const cases = [
    ["post_creator", "/ferramentas/criador-de-posts-com-ia"],
    ["watermark", "/ferramentas/adicionar-marca-dagua"],
    ["engagement", "/ferramentas/calculadora-de-engajamento"],
    ["post_analysis", "/ferramentas/analisador-de-posts"],
    ["trend_radar", "/ferramentas/radar-de-tendencias"],
  ] as const;
  const extra = cases.map(([kind], index) => ({
    id: `66666666-6666-4666-8666-${String(index + 1).padStart(12, "0")}`,
    kind,
    title: `Retomar categoria ${index + 1}`,
    client_name: "",
    payload: {},
    revision: 1,
    updated_at: "2026-11-11T12:00:00Z",
  }));
  await page.route("**/api/account/projects", route => route.fulfill({ json: { projects: extra } }));
  await page.goto("/conta/projetos");
  const library = page.getByRole("region", { name: "Projetos salvos" });
  for (const [kind, route] of cases) {
    const project = extra.find(item => item.kind === kind)!;
    await expect(library.locator("article").filter({ hasText: project.title }).getByRole("link", { name: "Continuar projeto" })).toHaveAttribute("href", `${route}?project=${project.id}`);
  }
  await expectNoOverflow(page);
});

test("engagement calculator resumes saved inputs and preserves project revision", async ({ page }) => {
  await mockAccount(page);
  const project = {
    id: "77777777-7777-4777-8777-777777777777",
    kind: "engagement", title: "Engajamento novembro", client_name: "", revision: 5, updated_at: "2026-11-11T12:00:00Z",
    payload: { mode: "single", method: "followers", single: { likes: "100", comments: "20", shares: "10", saves: "5", followers: "2000", reach: "", impressions: "" }, posts: [], network: "Instagram", contentType: "Post" },
  };
  let saved: Record<string, unknown> | null = null;
  await page.route("**/api/account/projects", route => {
    if (route.request().method() === "POST") {
      saved = route.request().postDataJSON() as Record<string, unknown>;
      return route.fulfill({ json: { project: { ...project, revision: 6 } } });
    }
    return route.fulfill({ json: { projects: [project] } });
  });
  await page.goto("/conta/projetos");
  await page.getByRole("region", { name: "Projetos salvos" }).getByRole("link", { name: "Continuar projeto" }).click();
  const dialog = page.getByRole("dialog", { name: "Continuar projeto salvo?" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Continuar projeto" }).click();
  await expect(dialog).toHaveCount(0);
  const library = page.getByRole("region", { name: "Projetos salvos" });
  await expect(library.getByRole("textbox", { name: "Nome do projeto" })).toHaveValue("Engajamento novembro");
  await library.getByRole("button", { name: "Salvar na conta", exact: true }).click();
  await expect.poll(() => saved).toMatchObject({ id: project.id, revision: 5, kind: "engagement", payload: project.payload });
});

test("watermark resume makes clear that source image is not retained", async ({ page }) => {
  await mockAccount(page);
  const project = {
    id: "88888888-8888-4888-8888-888888888888", kind: "watermark", title: "Marca d'água salva",
    client_name: "", revision: 1, updated_at: "2026-11-11T12:00:00Z",
    payload: { text: "Marca", type: "text", opacity: 50, placement: { x: 0.5, y: 0.5, scale: 0.3 }, logoDataUrl: "" },
  };
  await page.route("**/api/account/projects", route => route.fulfill({ json: { projects: [project] } }));
  await page.goto("/conta/projetos");
  await page.getByRole("region", { name: "Projetos salvos" }).getByRole("link", { name: "Continuar projeto" }).click();
  const dialog = page.getByRole("dialog", { name: "Continuar projeto salvo?" });
  await expect(dialog).toContainText("A imagem principal não é armazenada no projeto");
  await dialog.getByRole("button", { name: "Manter conteúdo atual" }).click();
  await expect(dialog).toHaveCount(0);
});

test("project outage shows a retry instead of claiming the account is empty", async ({ page }) => {
  await mockAccount(page);
  let unavailable = true;
  await page.route("**/api/account/projects", route => route.fulfill(unavailable ? { status: 503, json: { error: "Não foi possível carregar os projetos." } } : { json: { projects: savedProjects } }));
  await page.goto("/conta/projetos");
  const library = page.getByRole("region", { name: "Projetos salvos" });
  await expect(library.getByRole("alert")).toContainText("Não foi possível carregar os projetos.");
  await expect(library.getByText("Você ainda não tem projetos salvos", { exact: false })).toHaveCount(0);
  unavailable = false;
  await library.getByRole("button", { name: "Tentar carregar projetos novamente" }).click();
  await expect(library.locator("article")).toHaveCount(2);
  await expect(library.getByRole("alert")).toHaveCount(0);
});
