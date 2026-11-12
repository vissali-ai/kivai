import { expect, test } from "./helpers";

const toolPath = "/ferramentas/contador-de-palavras?origem=teste#contador";

test("login iniciado na ferramenta retorna para ela com URL completa", async ({ page }, testInfo) => {
  await page.route("**/auth/v1/token?grant_type=password", (route) =>
    route.fulfill({ json: { access_token: "login-return-test", token_type: "bearer", expires_in: 3600 } })
  );
  await page.route("**/auth/v1/user", (route) =>
    route.fulfill({ json: { id: "login-return-user", email: "teste@example.com" } })
  );
  await page.route("**/api/account/email-delivery", (route) => route.fulfill({ json: { ok: true } }));

  await page.goto(toolPath);
  if (testInfo.project.name === "mobile") {
    await page.getByRole("button", { name: "Abrir menu" }).click();
    await page.getByRole("link", { name: "Entrar na conta" }).click();
  } else {
    await page.getByRole("link", { name: "Entrar", exact: true }).click();
  }

  await expect(page).toHaveURL(/\/conta\/login\?next=/);
  expect(new URL(page.url()).searchParams.get("next")).toBe(toolPath);

  await page.getByRole("textbox", { name: "E-mail" }).fill("teste@example.com");
  await page.getByLabel("Senha").fill("senha-de-teste");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();

  await expect(page).toHaveURL(new RegExp("contador-de-palavras\\?origem=teste#contador$"));
});

test("callback Google respeita destino armazenado pela autenticação", async ({ page }) => {
  await page.addInitScript((destination) => {
    sessionStorage.setItem("kivai_oauth_next", destination);
  }, toolPath);
  await page.route("**/api/account/email-delivery", (route) => route.fulfill({ json: { ok: true } }));

  await page.goto("/conta/callback#access_token=login-return-test&token_type=bearer&expires_in=3600");
  await expect(page).toHaveURL(new RegExp("contador-de-palavras\\?origem=teste#contador$"));
});


test("login sem next volta à última ferramenta acessada", async ({ page }) => {
  await page.route("**/auth/v1/token?grant_type=password", (route) =>
    route.fulfill({ json: { access_token: "login-return-test", token_type: "bearer", expires_in: 3600 } })
  );
  await page.route("**/auth/v1/user", (route) =>
    route.fulfill({ json: { id: "login-return-user", email: "teste@example.com" } })
  );
  await page.route("**/api/account/email-delivery", (route) => route.fulfill({ json: { ok: true } }));

  await page.goto(toolPath);
  await expect.poll(() => page.evaluate(() => {
    const saved = sessionStorage.getItem("kivai_auth_return_path");
    return saved ? JSON.parse(saved).destination as string : "";
  })).toBe(toolPath);

  await page.goto("/conta/login");
  expect(new URL(page.url()).searchParams.has("next")).toBe(false);
  await page.getByRole("textbox", { name: "E-mail" }).fill("teste@example.com");
  await page.getByLabel("Senha").fill("senha-de-teste");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();

  await expect(page).toHaveURL(new RegExp("contador-de-palavras\\?origem=teste#contador$"));
});

test("destinos externos no parametro next são rejeitados", async ({ page }) => {
  await page.route("**/auth/v1/token?grant_type=password", (route) =>
    route.fulfill({ json: { access_token: "login-return-test", token_type: "bearer", expires_in: 3600 } })
  );
  await page.route("**/api/account/email-delivery", (route) => route.fulfill({ json: { ok: true } }));

  await page.goto("/conta/login?next=%2F%2Fexample.org");
  await page.getByRole("textbox", { name: "E-mail" }).fill("teste@example.com");
  await page.getByLabel("Senha").fill("senha-de-teste");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/conta$/);
});

test("formulário de IA preserva rascunho durante login e volta ao mesmo ponto", async ({ page }) => {
  await page.route("**/auth/v1/token?grant_type=password", (route) =>
    route.fulfill({ json: { access_token: "login-return-test", token_type: "bearer", expires_in: 3600 } })
  );
  await page.route("**/auth/v1/user", (route) =>
    route.fulfill({ json: { id: "login-return-user", email: "teste@example.com" } })
  );
  await page.route("**/api/account/email-delivery", (route) => route.fulfill({ json: { ok: true } }));

  const toolPath = "/ferramentas/criador-de-plano-de-negocios-e-marcas";
  await page.goto(toolPath);
  await page.getByLabel("Nicho da marca").fill("Acessórios sustentáveis");
  await page.getByLabel("Produto e diferencial").fill("Bolsas produzidas em pequenos lotes");
  await page.getByLabel("Cliente ideal e necessidade").fill("Pessoas que buscam acessórios duráveis");

  await page.getByRole("button", { name: /Gerar com IA/ }).click();
  const login = page.getByRole("link", { name: "Entrar na conta" });
  await expect(login).toHaveAttribute("href", "/conta/login?next=" + encodeURIComponent(toolPath));
  await login.click();

  await expect(page).toHaveURL(/\/conta\/login\?next=/);
  await page.getByRole("textbox", { name: "E-mail" }).fill("teste@example.com");
  await page.getByLabel("Senha").fill("senha-de-teste");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();

  await expect(page).toHaveURL(new RegExp("criador-de-plano-de-negocios-e-marcas$"));
  await expect(page.getByLabel("Nicho da marca")).toHaveValue("Acessórios sustentáveis");
  await expect(page.getByLabel("Produto e diferencial")).toHaveValue("Bolsas produzidas em pequenos lotes");
  await expect(page.getByLabel("Cliente ideal e necessidade")).toHaveValue("Pessoas que buscam acessórios duráveis");
});
