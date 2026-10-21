import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";

function load(file, mocks) {
  const source = readFileSync(new URL("../../" + file, import.meta.url), "utf8");
  const data = { exports: {} };
  runInNewContext(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, {
    module: data, exports: data.exports, URL, Date, Set, console,
    require(name) {
      if (name === "server-only") return {};
      if (name === "next/server") return { NextResponse: Response };
      if (name in mocks) return mocks[name];
      throw new Error("Unexpected import: " + name);
    },
  });
  return data.exports;
}
const errorResponse = (e) => Response.json({ error: e.message }, { status: e.message === "Não autorizado." ? 401 : 400 });
const normalized = (value) => { const u = new URL(value); u.hash = ""; u.searchParams.delete("utm_source"); return u.toString(); };
const sourceUrl = "https://tecnoblog.net/noticias/fonte/";
function draftApi(overrides = {}) {
  const state = { authorized: true, posts: [], saved: [], baseCalls: 0, generated: 0, ...overrides };
  const api = load("app/api/admin/news-agent/draft/route.ts", {
    "@/lib/blog/auth": { assertAdminApi: async () => { if (!state.authorized) throw new Error("Não autorizado."); } },
    "@/lib/blog/editorial-api": { editorialApiError: errorResponse },
    "@/lib/blog/repository": {
      listAllPosts: async () => state.posts, listCategories: async () => [{ id: "cat", slug: "noticias" }],
      isSlugAvailable: async () => true,
      savePost: async (post) => { state.saved.push(post); return { ...post, id: "new-id" }; },
    },
    "@/lib/blog/slug": { slugify: () => "reportagem" },
    "@/lib/blog/editorial-ai": {
      validateSourceUrl: normalized,
      generateEditorialBase: async () => { state.generated++; return { title: "Reportagem", tags: [], contentHtml: "<p>Fatos</p>", model: "test-model" }; },
      saveEditorialBase: async () => { state.baseCalls++; if (state.baseFails) throw new Error("Database failure"); return { postId: "new-id" }; },
    },
  });
  return { api, state };
}
const request = (body) => new Request("https://kivai.test/api", { method: "POST", body: JSON.stringify(body) });

test("Rascunho exige Admin antes de consultar banco ou gerar conteúdo", async () => {
  const { api, state } = draftApi({ authorized: false });
  const r = await api.POST(request({ sourceUrl }));
  assert.equal(r.status, 401);
  assert.equal(state.generated, 0);
  assert.equal(state.saved.length, 0);
});
test("Link equivalente retorna rascunho existente sem gastar nova geração", async () => {
  const { api, state } = draftApi({ posts: [{ id: "existing", sourceUrl: sourceUrl + "?utm_source=rss" }] });
  const r = await api.POST(request({ sourceUrl: sourceUrl + "#top" }));
  assert.deepEqual(await r.json(), { id: "existing", existing: true });
  assert.equal(state.generated, 0);
});
test("Geração salva rascunho administrável com fonte, categoria e base preservada", async () => {
  const { api, state } = draftApi();
  const r = await api.POST(request({ sourceUrl, categorySlug: "noticias" }));
  assert.equal(r.status, 201);
  assert.equal(state.saved[0].status, "draft");
  assert.equal(state.saved[0].sourceUrl, sourceUrl);
  assert.equal(state.saved[0].categoryId, "cat");
  assert.equal(state.baseCalls, 1);
});
test("Falha ao preservar base não oculta o rascunho já salvo no CMS", async () => {
  const { api, state } = draftApi({ baseFails: true });
  const r = await api.POST(request({ sourceUrl }));
  assert.equal(r.status, 201);
  const body = await r.json();
  assert.equal(body.id, "new-id");
  assert.equal(body.baseReady, false);
  assert.match(body.warning, /Rascunho salvo/);
  assert.equal(state.saved.length, 1);
});
test("Mesmo post draft é acessível ao Admin e excluído da leitura pública", async () => {
  const draft = { id: "private-id", slug: "fixture-private-draft", status: "draft", title: "Fixture" };
  const api = load("lib/blog/repository.ts", {
    "@/lib/blog/config": { isBlogDatabaseConfigured: () => true },
    "@/lib/blog/sanitize": {}, "@/lib/blog/slug": {},
    "@/lib/blog/supabase": { supabaseRest: async (path) => {
      const query = new URLSearchParams(path.split("?")[1]);
      return query.get("status") === "eq.published" ? [] : [draft];
    } },
  });
  assert.equal((await api.getPostById(draft.id)).id, draft.id);
  assert.equal(await api.getPublishedPostBySlug(draft.slug), null);
});
test("Descartes continuam funcionando depois de mil registros", async () => {
  const rows = Array.from({ length: 1001 }, (_, i) => ({ source_url: `https://example.com/${i}` }));
  const api = load("lib/news-agent/editorial-dismissals.ts", {
    "@/lib/blog/supabase": { supabaseRest: async (path) => {
      const offset = Number(new URLSearchParams(path.split("?")[1]).get("offset"));
      return rows.slice(offset, offset + 500);
    } },
  });
  const urls = await api.listDismissedSuggestionUrls();
  assert.equal(urls.size, 1001);
  assert.ok(urls.has("https://example.com/1000"));
});
test("Todos aceita temas cadastrados além dos quinze iniciais", async () => {
  const topics = Array.from({ length: 16 }, (_, i) => ({ id: String(i), enabled: true }));
  const api = load("app/api/admin/news-agent/research/route.ts", {
    "@/lib/blog/auth": { assertAdminApi: async () => {} },
    "@/lib/blog/api": { apiError: errorResponse },
    "@/lib/news-agent/editorial-topics": { listEditorialTopics: async () => topics },
    "@/lib/news-agent/editorial-links": { researchEditorialLinks: async (input) => ({ count: input.topics.length }) },
  });
  const r = await api.POST(request({ topics: topics.map(t => t.id), region: "brasil", period: "7d" }));
  assert.equal(r.status, 200);
  assert.equal((await r.json()).count, 16);
});
test("Erro editorial preserva HTTP 429 e Retry-After sem expor erro interno", async () => {
  class QuotaError extends Error { kind = "minute"; retrySeconds = 4; }
  class RequestError extends Error { status = 503; }
  const api = load("lib/blog/editorial-api.ts", {
    "@/lib/ai/gemini-quota": { GeminiQuotaError: QuotaError },
    "@/lib/ai/gemini": { GeminiRequestError: RequestError },
    "@/lib/blog/api": { apiError: errorResponse },
  });
  const r = api.editorialApiError(new QuotaError("Cota por minuto"));
  assert.equal(r.status, 429);
  assert.equal(r.headers.get("Retry-After"), "4");
  const unavailable = api.editorialApiError(new RequestError("GEMINI_REQUEST_FAILED"));
  assert.equal(unavailable.status, 503);
  assert.ok(!(await unavailable.json()).error.includes("GEMINI_REQUEST_FAILED"));
});
test("Não reescreve base antiga se a fonte salva no post mudou", async () => {
  let personalized = false;
  const api = load("app/api/admin/posts/[id]/editorial-ai/route.ts", {
    "@/lib/blog/auth": { assertAdminApi: async () => {} },
    "@/lib/blog/editorial-api": { editorialApiError: errorResponse },
    "@/lib/blog/repository": { getPostById: async () => ({ id: "post", sourceUrl: "https://example.com/nova" }) },
    "@/lib/blog/editorial-ai": {
      getEditorialBase: async () => ({ sourceUrl }), validateSourceUrl: normalized,
      personalizeEditorialBase: async () => { personalized = true; },
    },
  });
  const r = await api.POST(request({ action: "personalize" }), { params: Promise.resolve({ id: "post" }) });
  assert.equal(r.status, 409);
  assert.equal(personalized, false);
});
