import { test, expect, openTool, expectNoOverflow, imageFile, download, imageDetails } from "./helpers";

test("manual artwork exports, round-trips and transfers only after confirmation", async ({ page }, testInfo) => {
  await openTool(page, "criador-de-posts-com-ia");
  await expect(page.getByRole("button", { name: "Baixar arte em PNG" })).toBeEnabled();
  await expect(page.getByRole("button", { name: /Gerar imagem/ })).toHaveCount(0);
  await page.getByLabel("Título da arte").fill("Café feito para sua pausa");
  await page.getByLabel("Legenda para publicar").fill("Conheça nossos cafés. #cafe");
  await page.getByRole("combobox", { name: /^Formato/ }).selectOption("story");
  await page.getByLabel("Imagem própria", { exact: true }).setInputFiles(await imageFile(page));
  await expect(page.getByRole("button", { name: "Remover imagem", exact: true })).toBeVisible();
  await page.getByLabel("Logotipo", { exact: true }).setInputFiles(await imageFile(page, "logo.png", 80, 80));
  const png = await download(page, page.getByRole("button", { name: "Baixar arte em PNG" }));
  expect(await imageDetails(page, png.bytes, "image/png")).toEqual({ width: 1080, height: 1920 });
  const project = await download(page, page.getByRole("button", { name: "Baixar projeto editável" }));
  expect(JSON.parse(project.bytes.toString()).logo).toMatch(/^data:image\/png/);
  await page.getByLabel("Título da arte").fill("Alterado");
  page.once("dialog", dialog => dialog.accept());
  await page.getByLabel("Abrir projeto do dispositivo").setInputFiles({ name: project.name, mimeType: "application/json", buffer: project.bytes });
  await expect(page.getByLabel("Título da arte")).toHaveValue("Café feito para sua pausa");
  await expectNoOverflow(page);
  await page.locator("canvas").screenshot({ path: testInfo.outputPath("artwork.png") });
  await page.getByRole("button", { name: "Visualizar no Preview" }).click();
  await expect(page.getByRole("region", { name: "Post recebido do Criador" })).toBeVisible();
  await page.getByLabel("Nome do perfil", { exact: true }).fill("Minha marca");
  await page.getByRole("button", { name: "Aplicar post recebido" }).click();
  await expect(page.getByLabel("Nome do perfil", { exact: true })).toHaveValue("Minha marca");
  await expect(page.getByLabel("Legenda", { exact: false }).first()).toHaveValue("Conheça nossos cafés. #cafe");
  await expect(page.getByRole("combobox", { name: /^Formato/ })).toHaveValue("story");
  await expectNoOverflow(page);
});

test("AI suggestions remain staged until applied and preserve artwork", async ({ page }, testInfo) => {
  await page.addInitScript(() => localStorage.setItem("kivai_user_session", JSON.stringify({ access_token: "creator-test", user: { id: "creator-test" } })));
  await page.route("**/auth/v1/**", route => route.fulfill({ json: { id: "creator-test", email: "test@example.com" } }));
  await page.route("**/rest/v1/**", route => route.fulfill({ json: [] }));
  await page.route("**/api/account/**", route => route.fulfill({ json: { projects: [], userId: "creator-test", plan: "pro", subscription: null } }));
  await page.route("**/api/ai/credits", route => route.fulfill({ json: { wallet: { plan_code: "pro", free_limit: 100, free_remaining: 99, purchased_remaining: 0, total_remaining: 99, renews_on: "2026-11-01" }, hourly: { limit: 5, remaining: 4 }, salesEnabled: true } }));
  let calls = 0;
  await page.route("**/api/ai/post-creator", async route => {
    calls++; expect(route.request().postDataJSON().consent).toBe(true);
    await route.fulfill({ json: { content: { title: "Pausa para café", subtitle: "Seu novo ritual", caption: "Venha conhecer", cta: "Visite", hashtags: ["#cafe"], slides: [{ title: "Slide um", body: "Primeiro passo" }] } } });
  });
  await openTool(page, "criador-de-posts-com-ia");
  await expect(page.getByRole("button", { name: "Baixar arte em PNG" })).toBeEnabled();
  await page.getByLabel("Tema ou briefing").fill("Divulgar nossa cafeteria");
  await page.getByLabel("Título da arte").fill("Título manual");
  await page.getByLabel("Autorizo enviar").check();
  await page.getByRole("button", { name: "Gerar conteúdo · 1 crédito" }).click();
  await expect(page.getByRole("button", { name: "Aplicar conteúdo à arte" })).toBeVisible();
  await expect(page.getByLabel("Título da arte")).toHaveValue("Título manual");
  await page.getByRole("button", { name: "Aplicar conteúdo à arte" }).click();
  await expect(page.getByLabel("Título da arte")).toHaveValue("Pausa para café");
  await expect(page.getByLabel("Legenda para publicar")).toHaveValue("Venha conhecer\n\n#cafe");
  expect(calls).toBe(1);
  await expect(page.getByRole("link", { name: "Entrar ou criar conta", exact: true })).toHaveCount(0);
  let saved: Record<string, unknown> | null = null;
  await page.route("**/api/account/projects", async route => {
    if (route.request().method() === "POST") {
      const body = route.request().postDataJSON();
      expect(body.kind).toBe("post_creator");
      saved = { ...body, id: "12345678-1234-4234-8234-123456789abc", client_name: "", revision: 1, updated_at: new Date().toISOString() };
      return route.fulfill({ json: { project: saved } });
    }
    return route.fulfill({ json: { projects: saved ? [saved] : [] } });
  });
  await page.getByLabel("Nome do projeto").fill("Campanha de café");
  await page.getByRole("button", { name: "Salvar na conta", exact: true }).click();
  await expect(page.getByText("Projeto salvo na sua conta.", { exact: false })).toBeVisible();
  const accountExport = await download(page, page.getByRole("button", { name: "Exportar JSON", exact: true }));
  await page.getByLabel("Título da arte").fill("Alteração local");
  page.once("dialog", dialog => dialog.accept());
  await page.getByLabel("Abrir projeto do dispositivo").setInputFiles({ name: accountExport.name, mimeType: "application/json", buffer: accountExport.bytes });
  await expect(page.getByLabel("Título da arte")).toHaveValue("Pausa para café");
  await page.getByLabel("Título da arte").fill("Outro rascunho");
  await page.getByRole("button", { name: "Abrir", exact: true }).click();
  await expect(page.getByLabel("Título da arte")).toHaveValue("Outro rascunho");
  await page.getByRole("button", { name: "Abrir projeto", exact: true }).click();
  await expect(page.getByLabel("Título da arte")).toHaveValue("Pausa para café");
  await expect(page.getByRole("button", { name: "Baixar arte em PNG" })).toBeEnabled();
  await expectNoOverflow(page);
  await page.locator("#editar-post").scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath("editor.png") });
});
