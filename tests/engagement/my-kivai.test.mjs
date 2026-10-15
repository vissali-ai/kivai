import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");

function loadVisits() {
  const code = ts.transpileModule(read("../../lib/account/recent-tool-visits.ts"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  new Function("require", "module", "exports", code)(
    (name) => {
      assert.equal(name, "@/lib/tools");
      return { getToolBySlug: (slug) => ["removedor-de-fundo", "unir-pdfs", "gerador-de-qr-code", "compactar-pdf", "editar-pdf", "recortar-imagem", "compressor-de-imagens"].includes(slug) ? { slug, available: true } : null };
    }, module, module.exports,
  );
  return module.exports;
}

test("recent tools are per-account, compact, unique, and reject unknown slugs", () => {
  const values = new Map();
  const oldWindow = globalThis.window;
  globalThis.window = {
    localStorage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
    },
    dispatchEvent: () => {},
  };
  try {
    const { readRecentToolSlugs, rememberRecentTool } = loadVisits();
    const userA = "first-account";
    const userB = "second-account";
    assert.deepEqual(readRecentToolSlugs(userA), []);
    rememberRecentTool(userA, "removedor-de-fundo");
    rememberRecentTool(userA, "unir-pdfs");
    rememberRecentTool(userA, "removedor-de-fundo");
    rememberRecentTool(userA, "not-a-tool");
    assert.deepEqual(readRecentToolSlugs(userA), ["removedor-de-fundo", "unir-pdfs"]);
    assert.deepEqual(readRecentToolSlugs(userB), []);
    rememberRecentTool(userB, "gerador-de-qr-code");
    assert.deepEqual(readRecentToolSlugs(userB), ["gerador-de-qr-code"]);
    assert.deepEqual(readRecentToolSlugs(userA), ["removedor-de-fundo", "unir-pdfs"]);
    for (const slug of ["gerador-de-qr-code", "compactar-pdf", "editar-pdf", "recortar-imagem", "compressor-de-imagens"]) rememberRecentTool(userA, slug);
    assert.equal(readRecentToolSlugs(userA).length, 6);
    assert.ok(!readRecentToolSlugs(userA).includes("unir-pdfs"));
    values.set("kivai_recent_tools_v1:third-account", "invalid json");
    assert.deepEqual(readRecentToolSlugs("third-account"), []);
    rememberRecentTool("", "unir-pdfs");
    assert.equal(values.has("kivai_recent_tools_v1:"), false);
  } finally {
    if (oldWindow === undefined) delete globalThis.window;
    else globalThis.window = oldWindow;
  }
});

test("personalization extends existing onboarding and favorites instead of cloning them", () => {
  const account = read("../../components/account/account-welcome.tsx");
  const dashboard = read("../../components/account/account-dashboard.tsx");
  const favorites = read("../../components/tools/tool-favorite-control.tsx");
  assert.match(account, /user_onboarding\?select=goal,status/);
  assert.match(account, /resolution=merge-duplicates,return=minimal/);
  assert.match(account, /Alterar interesse/);
  assert.match(account, /Acessadas recentemente/);
  assert.match(account, /Histórico disponível apenas neste navegador e nesta conta/);
  assert.equal((dashboard.match(/<MyFavoriteTools\s*\/>/g) || []).length, 1);
  assert.match(dashboard, /<AccountWelcome userId=\{userId\}/);
  assert.match(favorites, /rememberRecentTool\(user\.id, slug\)/);
});
