import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const requireDependency = createRequire(import.meta.url);
const testDirectory = path.dirname(fileURLToPath(import.meta.url));

// Execute the production TS modules with only the remote database boundary replaced.
// This suite never loads environment files or contacts production.
function createCms({ realTransport = false } = {}) {
  const root = path.resolve(testDirectory, "../..");
  const cache = new Map();
  const rows = [];
  const revalidated = [];
  const hubs = ["arquivos", "imagens"].map((slug) => ({ id: slug, slug, name: slug, path: `/ferramentas/${slug}` }));
  const mocks = {
    "server-only": {},
    "next/headers": { headers: async () => new Headers({ host: "www.kivai.com.br" }) },
    "next/cache": { revalidatePath: (...args) => revalidated.push(args) },
    "@/lib/blog/auth": { assertAdminApi: async () => {} },
    "@/lib/blog/repository": { listCategories: async () => [], listPublishedPosts: async () => [] },
    "@/lib/blog/publication-controls": { listBlogSitemapSlugs: async () => new Set() },
    "@/lib/site-cms/service-repository": { listSitemapSiteServices: async () => [], listStoredSiteServices: async () => [] },
    "@/lib/blog/supabase": {
      async supabaseRest(query, options = {}) {
        const [table, search] = query.split("?");
        const params = new URLSearchParams(search);
        const data = table === "site_hubs" ? hubs : rows;
        const selected = data.filter((row) => [...params].every(([key, value]) => !value.startsWith("eq.") || String(row[key]) === value.slice(3)));
        if (options.method === "POST") {
          const row = { id: `row-${rows.length}`, created_at: "2026-09-28", updated_at: "2026-09-28", ...JSON.parse(options.body) };
          data.push(row);
          return [row];
        }
        if (options.method === "PATCH") selected.forEach((row) => Object.assign(row, JSON.parse(options.body)));
        if (options.method === "DELETE") selected.forEach((row) => data.splice(data.indexOf(row), 1));
        return selected;
      },
    },
  };
  if (realTransport) {
    delete mocks["@/lib/blog/supabase"];
    mocks["@/lib/blog/config"] = {
      blogConfig: { supabaseUrl: "http://cms.invalid", serviceRoleKey: "test-only" },
      assertBlogDatabaseConfigured() {},
    };
  }
  function load(id, parent = path.join(root, "index.ts")) {
    if (Object.hasOwn(mocks, id)) return mocks[id];
    if (!id.startsWith("@/") && !id.startsWith(".") && !path.isAbsolute(id)) return requireDependency(id);
    let filename = id.startsWith("@/") ? path.join(root, id.slice(2)) : path.resolve(path.dirname(parent), id);
    if (!path.extname(filename)) filename += fs.existsSync(filename + ".ts") ? ".ts" : ".tsx";
    if (cache.has(filename)) return cache.get(filename).exports;
    const loadedModule = { exports: {} };
    cache.set(filename, loadedModule);
    const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    }).outputText;
    new Function("require", "module", "exports", code)((next) => load(next, filename), loadedModule, loadedModule.exports);
    return loadedModule.exports;
  }
  return { load, rows, revalidated };
}

const slugs = ["descompactar-zip", "descompactar-rar", "compactar-arquivos-zip", "renomear-arquivos-em-lote", "adicionar-prefixo-sufixo-arquivos", "removedor-de-metadados"];

test("Admin API lists and opens the six entries using the production handlers", async () => {
  const { load } = createCms();
  const list = await load("@/app/api/admin/site-content/route").GET();
  assert.equal(list.status, 200);
  const items = await list.json();
  const editor = load("@/app/api/admin/site-content/[id]/route");
  for (const slug of slugs) {
    const item = items.find((entry) => entry.existingToolSlug === slug);
    assert.ok(item);
    const response = await editor.GET(new Request("http://localhost/api/admin/site-content"), { params: Promise.resolve({ id: item.id }) });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).existingToolSlug, slug);
  }
});

test("all available tools have exactly one Admin entry, including the six formerly separate tools", async () => {
  const { load } = createCms();
  const { tools } = load("@/lib/tools");
  const repository = load("@/lib/site-cms/repository");
  const managed = await repository.listManagedSiteContents();
  assert.equal(tools.filter((tool) => tool.available).length, 76);
  for (const tool of tools) assert.equal(managed.filter((item) => item.existingToolSlug === tool.slug).length, 1);
  for (const slug of slugs) {
    const entry = await repository.getSiteContentById(`existing:${slug}`);
    assert.equal(entry.path, `/ferramentas/${slug}`);
    assert.equal(entry.hubId, slug === "removedor-de-metadados" ? "imagens" : "arquivos");
    assert.match(entry.contentHtml, /<h2>Como usar<\/h2>/);
    assert.match(entry.contentHtml, /<h2>Perguntas frequentes<\/h2>/);
  }
});

test("Admin edits feed public SEO/editorial and sitemap preferences without duplicate records", async () => {
  for (const slug of slugs) {
    const { load } = createCms();
    const repository = load("@/lib/site-cms/repository");
    const seo = load("@/lib/seo");
    const sitemap = load("@/app/sitemap").default;
    const initial = await repository.getSiteContentById(`existing:${slug}`);
    const saved = await repository.updateSiteContent(initial.id, {
      ...initial, title: "Título editado", seoTitle: "SEO editado", seoDescription: "Resumo editado",
      contentHtml: "<h2>Instruções editadas</h2><p>Teste do CMS</p>", indexable: false,
    });
    assert.equal((await repository.listManagedSiteContents()).filter((item) => item.existingToolSlug === slug).length, 1);
    const metadata = await seo.getToolMetadataAsync(slug);
    assert.deepEqual(metadata.title, { absolute: "SEO editado | Kivai" });
    assert.equal(metadata.description, "Resumo editado");
    assert.equal(metadata.robots.index, false);
    assert.match((await repository.getPublishedToolOverride(slug)).contentHtml, /Instruções editadas/);
    const url = `${seo.SITE_URL}/ferramentas/${slug}`;
    assert.equal((await sitemap()).filter((item) => item.url === url).length, 0);
    await repository.updateSiteContent(saved.id, { ...saved, indexable: true, includeInSitemap: true });
    assert.equal((await sitemap()).filter((item) => item.url === url).length, 1);
    await repository.updateSiteContent(saved.id, { ...saved, indexable: true, includeInSitemap: false });
    assert.equal((await sitemap()).filter((item) => item.url === url).length, 0);
  }
});

test("archiving blocks metadata, republishing restores it, drafts preserve the original tool", async () => {
  const { load } = createCms();
  const repo = load("@/lib/site-cms/repository");
  const seo = load("@/lib/seo");
  const initial = await repo.getSiteContentById("existing:descompactar-zip");
  const saved = await repo.updateSiteContent(initial.id, { ...initial, status: "archived" });
  await assert.rejects(seo.getToolMetadataAsync(initial.slug), /NEXT_HTTP_ERROR_FALLBACK;404/);
  await repo.updateSiteContent(saved.id, { ...saved, status: "published", indexable: true, seoTitle: "Restaurada" });
  assert.deepEqual((await seo.getToolMetadataAsync(initial.slug)).title, { absolute: "Restaurada | Kivai" });
  await repo.updateSiteContent(saved.id, { ...saved, status: "draft", seoTitle: "Rascunho privado" });
  assert.notDeepEqual((await seo.getToolMetadataAsync(initial.slug)).title, { absolute: "Rascunho privado | Kivai" });
});

test("content and hub creation, editing and deletion invalidate all dependent pages and sitemap", async () => {
  const { load, revalidated } = createCms();
  for (const kind of ["site-content", "site-hubs"]) {
    const collection = load(`@/app/api/admin/${kind}/route`);
    const detail = load(`@/app/api/admin/${kind}/[id]/route`);
    const input = kind === "site-content"
      ? { contentType: "page", title: "Página teste", slug: "teste", status: "published", indexable: true }
      : { name: "Hub teste", slug: "teste", status: "published", indexable: true };
    const request = (value) => new Request("http://localhost/api", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(value) });
    const created = await collection.POST(request(input));
    assert.equal(created.status, 201);
    const item = await created.json();
    const context = { params: Promise.resolve({ id: item.id }) };
    assert.equal((await detail.PUT(request({ ...input, slug: "outro" }), context)).status, 200);
    assert.equal((await detail.DELETE(new Request("http://localhost/api"), context)).status, 204);
  }
  assert.deepEqual(revalidated, Array.from({ length: 6 }, () => [["/", "layout"], ["/sitemap.xml"]]).flat());
  revalidated.length = 0;
  const rejected = await load("@/app/api/admin/site-content/route").POST(new Request("http://localhost/api", { method: "POST", body: JSON.stringify({ title: "" }) }));
  assert.equal(rejected.status, 400);
  assert.deepEqual(revalidated, []);
});

test("archive visibility is cached, but private reads and mutations remain uncached", async () => {
  const { load } = createCms({ realTransport: true });
  const requests = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_url, options) => {
    requests.push(options);
    return Response.json([]);
  };
  try {
    const { supabaseRest } = load("@/lib/blog/supabase");
    await supabaseRest("site_contents?select=existing_tool_slug&status=eq.archived");
    await supabaseRest("site_contents?select=*&status=eq.archived");
    await supabaseRest("site_contents?select=*&status=eq.draft");
    await supabaseRest("site_contents", { method: "POST", body: "{}" });
    assert.equal(requests[0].cache, "force-cache");
    assert.equal(requests[0].next.revalidate, 300);
    assert.deepEqual(requests.slice(1).map((item) => item.cache), ["no-store", "no-store", "no-store"]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
test("duplex printing is managed, editable and validates printer data through Admin API", async () => {
  const { load } = createCms();
  const repo = load("@/lib/site-cms/repository");
  const initial = await repo.getSiteContentById("existing:imprimir-frente-e-verso");
  assert.equal(initial.title, "Imprimir Frente e Verso");
  assert.match(initial.contentHtml, /Como imprimir frente e verso/);
  assert.equal(initial.customData.printers.length, 6);
  const api = load("@/app/api/admin/site-content/[id]/route");
  const changed = { ...initial, title: "Impressão editada", customData: { ...initial.customData, printers: initial.customData.printers.map(p => ({ ...p, notes: "Orientação editada no Admin" })) } };
  const response = await api.PUT(new Request("http://localhost/api", { method: "PUT", body: JSON.stringify(changed) }), { params: Promise.resolve({ id: initial.id }) });
  assert.equal(response.status, 200);
  const published = await repo.getPublishedToolOverride(initial.slug);
  assert.equal(published.title, "Impressão editada");
  assert.equal(published.customData.printers[0].notes, "Orientação editada no Admin");
  await assert.rejects(repo.updateSiteContent(published.id, { ...published, customData: { printers: [{ ...initial.customData.printers[0], status: "confirmed", source: "" }] } }), /Cadastro de impressoras inválido/);
});


test("duplex public page consumes Admin edits and hides draft content", async () => {
  const { load } = createCms();
  const repo = load("@/lib/site-cms/repository");
  const initial = await repo.getSiteContentById("existing:imprimir-frente-e-verso");
  const saved = await repo.updateSiteContent(initial.id, { ...initial, title: "Duplex personalizado", customData: { ...initial.customData, printers: [] } });
  const page = load("@/app/ferramentas/imprimir-frente-e-verso/page").default;
  const result = await page();
  assert.equal(result.props.title, "Duplex personalizado");
  assert.deepEqual(result.props.children.props.printers, []);
  await repo.updateSiteContent(saved.id, { ...saved, status: "draft" });
  await assert.rejects(page(), /NEXT_HTTP_ERROR_FALLBACK;404/);
});
