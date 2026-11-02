import { test, expect, expectNoOverflow } from "./helpers";

test("busca associa a opção ativa ao campo e permite navegar pelo teclado", async ({ page }) => {
  await page.route("**/api/search-index", route => route.fulfill({ json: { posts: [] } }));
  await page.goto("/");
  const search = page.getByRole("combobox", { name: "Buscar ferramentas e artigos do Kivai" });
  await expect(search).toHaveAttribute("aria-expanded", "false");
  await expect(search).not.toHaveAttribute("aria-controls");
  await search.fill("pdf");
  const list = page.getByRole("listbox");
  await expect(list).toBeVisible();
  await expect(search).toHaveAttribute("aria-controls", (await list.getAttribute("id"))!);
  const first = list.getByRole("option").first();
  await expect(search).toHaveAttribute("aria-activedescendant", (await first.getAttribute("id"))!);
  await search.press("ArrowDown");
  const selected = list.getByRole("option", { selected: true });
  await expect(search).toHaveAttribute("aria-activedescendant", (await selected.getAttribute("id"))!);
  const destination = await selected.getAttribute("href");
  await expectNoOverflow(page);
  await search.press("Enter");
  await expect(page).toHaveURL(new RegExp(`${destination}$`));
});

test("busca remove referências a resultados ao fechar ou não encontrar itens", async ({ page }) => {
  await page.route("**/api/search-index", route => route.fulfill({ json: { posts: [] } }));
  await page.goto("/");
  const search = page.getByRole("combobox", { name: "Buscar ferramentas e artigos do Kivai" });
  await search.fill("zzzzzzzzzzzzzzzz");
  await expect(page.getByText("Nenhum resultado encontrado.", { exact: true })).toBeVisible();
  await expect(page.getByRole("status", { name: "Buscar ferramentas e artigos do Kivai" })).toBeVisible();
  await expect(search).toHaveAttribute("aria-expanded", "false");
  await expect(search).not.toHaveAttribute("aria-controls");
  await expect(search).not.toHaveAttribute("aria-activedescendant");
  await search.press("Escape");
  await expect(page.getByRole("listbox")).toHaveCount(0);
  await expect(search).toHaveAttribute("aria-expanded", "false");
  await expect(search).not.toHaveAttribute("aria-controls");
  await expect(search).toHaveValue("");
});
