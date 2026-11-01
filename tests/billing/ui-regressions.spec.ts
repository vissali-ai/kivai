import { test, expect } from "@playwright/test";
import { createHmac } from "node:crypto";

test("signup navigates to the account and the persistent navbar refreshes its session", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.route("**/auth/v1/signup", route => route.fulfill({ json: { access_token: "fixture-user", user: { id: "00000000-0000-4000-8000-000000000001" } } }));
  await page.route("**/api/account/email-delivery", route => route.fulfill({ json: { ok: true } }));
  await page.goto("/conta/cadastro");
  await expect(page.locator("header").getByRole("link", { name: "Entrar", exact: true })).toBeVisible();
  await page.getByLabel("Nome", { exact: true }).fill("Cliente Teste");
  await page.getByLabel("E-mail", { exact: true }).fill("test@example.invalid");
  await page.getByLabel("WhatsApp", { exact: true }).fill("11987654321");
  await page.getByLabel("Senha", { exact: true }).fill("local-test-password");
  await page.getByLabel("Confirmar senha", { exact: true }).fill("local-test-password");
  await page.getByRole("button", { name: "Criar conta", exact: true }).click();
  await expect(page).toHaveURL(/\/conta$/);
  await expect(page.locator("header").getByRole("link", { name: "Meu painel", exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test("password recovery preserves the token, clears the fragment and navigates to login", async ({ page }) => {
  const updates: { authorization: string | undefined; password: string }[] = [];
  await page.route("**/auth/v1/user", async route => {
    expect(route.request().method()).toBe("PUT");
    updates.push({ authorization: route.request().headers().authorization, password: route.request().postDataJSON().password });
    await route.fulfill({ json: {} });
  });
  await page.goto("/conta/redefinir-senha#type=recovery&access_token=local-recovery-token");
  await page.getByLabel("Nova senha", { exact: true }).fill("local-test-password");
  await page.getByLabel("Confirmar nova senha", { exact: true }).fill("local-test-password");
  await page.getByRole("button", { name: "Redefinir senha", exact: true }).click();
  await expect(page.getByText("Senha redefinida com sucesso.", { exact: false })).toBeVisible();
  expect(updates).toEqual([{ authorization: "Bearer local-recovery-token", password: "local-test-password" }]);
  expect(new URL(page.url()).hash).toBe("");
  await page.getByRole("button", { name: "Ir para o login" }).click();
  await expect(page).toHaveURL(/\/conta\/login$/);

  await page.goto("/conta/redefinir-senha");
  await page.getByLabel("Nova senha", { exact: true }).fill("local-test-password");
  await page.getByLabel("Confirmar nova senha", { exact: true }).fill("local-test-password");
  await page.getByRole("button", { name: "Redefinir senha", exact: true }).click();
  await expect(page.getByText("Este link de redefinição é inválido ou expirou.", { exact: false })).toBeVisible();
  expect(updates).toHaveLength(1);
});

for (const version of ["v1", "v2"]) {
  test(`email draft ${version} restores, autosaves and survives reload without sending mail`, async ({ page, context }) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => {
      if (message.text().includes("Duplicate extension names")) errors.push(message.text());
    });
    const payload = Buffer.from(JSON.stringify({ email: "admin@example.invalid", exp: Math.floor(Date.now() / 1000) + 3600 })).toString("base64url");
    const signature = createHmac("sha256", "fixture-secret-at-least-32-characters-long").update(payload).digest("base64url");
    await context.addCookies([{ name: "kivai_admin_session", value: `${payload}.${signature}`, url: "http://127.0.0.1:3103" }]);
    await page.goto("/login");
    await page.evaluate(({ version }) => {
      localStorage.setItem(`kivai-admin-email-marketing-draft-${version}`, JSON.stringify({ campaignName: "Rascunho local", subject: "Assunto preservado", message: version === "v1" ? "Primeiro parágrafo\n\nSegundo parágrafo" : '<p><a href="https://example.invalid">Conteúdo preservado</a></p>' }));
    }, { version });
    await page.goto("/admin/marketing/email-marketing");
    await expect(page.locator('input[name="campaignName"]')).toHaveValue("Rascunho local");
    await expect(page.locator('input[name="subject"]')).toHaveValue("Assunto preservado");
    if (version === "v2") await expect(page.locator(".tiptap a")).toHaveAttribute("href", "https://example.invalid");
    await expect(page.locator(".tiptap")).toContainText(version === "v1" ? "Segundo parágrafo" : "Conteúdo preservado");
    await page.locator('input[name="campaignName"]').fill("Rascunho atualizado");
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("kivai-admin-email-marketing-draft-v2") ?? "{}").campaignName)).toBe("Rascunho atualizado");
    await page.reload();
    await expect(page.locator('input[name="campaignName"]')).toHaveValue("Rascunho atualizado");
    await expect(page.locator('input[name="subject"]')).toHaveValue("Assunto preservado");
    page.once("dialog", dialog => dialog.accept());
    await page.getByRole("button", { name: "Limpar rascunho" }).click();
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("kivai-admin-email-marketing-draft-v2") ?? "{}").campaignName)).toBe("");
    await page.reload();
    await expect(page.locator('input[name="campaignName"]')).toHaveValue("");
    expect(errors).toEqual([]);
  });
}
