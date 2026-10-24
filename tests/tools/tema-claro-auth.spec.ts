import { expect, test } from "@playwright/test";

// Validacao visual sem autenticacao: protege o tema claro e os textos do cadastro.
// Os mesmos cenarios rodam em desktop e mobile via playwright.config.ts.
const authenticationRoutes = [
  "/conta/cadastro",
  "/conta/login",
  "/conta/redefinir-senha",
  "/login",
];

for (const route of authenticationRoutes) {
  test(`tema claro e legivel em ${route}`, async ({ page }) => {
    await page.goto(route);
    const surface = page.locator("main.kivai-auth-page");
    await expect(surface).toBeVisible();

    const palette = await surface.evaluate((node) => {
      const background = getComputedStyle(node).backgroundColor;
      const card = node.querySelector("section");
      const cardBackground = card ? getComputedStyle(card).backgroundColor : "";
      const text = getComputedStyle(node).color;
      const input = node.querySelector("input:not([type=hidden])");
      const inputBackground = input ? getComputedStyle(input).backgroundColor : "";
      const inputText = input ? getComputedStyle(input).color : "";
      return { background, cardBackground, text, inputBackground, inputText };
    });
    expect(palette.background).toBe("rgb(236, 239, 243)");
    expect(palette.cardBackground).toBe("rgb(249, 250, 252)");
    expect(palette.text).toBe("rgb(32, 41, 56)");
    expect(palette.inputBackground).toBe("rgb(249, 250, 252)");
    expect(palette.inputText).toBe("rgb(32, 41, 56)");
  });
}

test("WhatsApp sem observacoes extras continua nao obrigatorio", async ({ page }) => {
  await page.goto("/conta/cadastro");
  const form = page.locator("form").filter({ has: page.getByRole("button", { name: "Criar conta" }) });
  const phone = form.getByRole("textbox", { name: "WhatsApp", exact: true });
  await expect(phone).toBeVisible();
  expect(await phone.getAttribute("required")).toBeNull();
  await expect(page.getByText("WhatsApp (opcional)", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Informe para facilitar o suporte e receber avisos, se você autorizar.", { exact: true })).toHaveCount(0);
});

test("pagina inicial continua com fundo cinza claro", async ({ page }) => {
  await page.goto("/");
  const surface = page.locator("main").first();
  const background = await surface.evaluate((element) => getComputedStyle(element).backgroundColor);
  expect(background).toBe("rgb(236, 239, 243)");
});
