import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import sanitize from "sanitize-html";

const sourceUrl = "https://tecnoblog.net/noticias/fonte/";
const article = { title: "Reportagem verificada", contentHtml: "<p>" + "Fatos atribuídos à fonte de referência. ".repeat(15) + "</p>" };
function response({ url = sourceUrl, finishReason = "STOP", text = JSON.stringify(article), thought = false } = {}) {
  return Response.json({ candidates: [{ finishReason,
    content: { parts: [...(thought ? [{ thought: true, text: "Raciocínio {não é JSON}" }] : []), { text }] },
    urlContextMetadata: { urlMetadata: [{ retrievedUrl: url, urlRetrievalStatus: "URL_RETRIEVAL_STATUS_SUCCESS" }] },
  }] });
}
function load(file, mocks, globals = {}) {
  const source = readFileSync(new URL("../../" + file, import.meta.url), "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const data = { exports: {} };
  runInNewContext(output, {
    module: data, exports: data.exports, URL, Date, AbortSignal, console,
    process: { env: { GEMINI_API_KEY: "test-key" } },
    require(name) {
      if (name === "server-only") return {};
      if (name in mocks) return mocks[name];
      throw new Error("Unexpected import: " + name);
    }, ...globals,
  });
  return data.exports;
}
function editorial(fetch, extra = {}, globals = {}) {
  return load("lib/blog/editorial-ai.ts", {
    "@/lib/blog/sanitize": { plainText: (html) => sanitize(html, { allowedTags: [] }), sanitizePostHtml: sanitize },
    "@/lib/blog/supabase": {},
    "@/lib/ai/gemini-quota": {},
    "@/lib/ai/free-models": { geminiCandidates: () => ["model-a", "model-b"] },
    ...extra,
  }, { fetch, ...globals });
}
const input = { sourceUrl, sourceTitle: "Fonte", sourceName: "Veículo" };

test("Exige leitura da fonte escolhida, não apenas sucesso de outra URL", async () => {
  const api = editorial(async () => response({ url: "https://example.com/outra-fonte" }));
  await assert.rejects(api.generateEditorialBase(input), /fonte não pôde ser lida/);
});
test("Rejeita geração interrompida mesmo com JSON e corpo suficientemente longo", async () => {
  const api = editorial(async () => response({ finishReason: "MAX_TOKENS" }));
  await assert.rejects(api.generateEditorialBase(input), /interrompeu/);
});
test("Ignora partes de raciocínio e sanitiza HTML antes de salvar", async () => {
  const api = editorial(async () => response({ thought: true,
    text: JSON.stringify({ ...article, contentHtml: article.contentHtml + '<script>alert(1)</script>' }) }));
  const result = await api.generateEditorialBase(input);
  assert.equal(result.title, article.title);
  assert.ok(!result.contentHtml.includes("script"));
});
test("URL equivalente com rastreamento não invalida leitura e é normalizada", async () => {
  const api = editorial(async () => response({ url: sourceUrl + "?utm_source=feed#top" }));
  const result = await api.generateEditorialBase({ ...input, sourceUrl: sourceUrl + "?fbclid=abc" });
  assert.equal(result.sourceUrl, sourceUrl);
});
test("Fallback usa somente o tempo restante da janela total", async () => {
  let now = 0;
  const budgets = [];
  let calls = 0;
  const api = editorial(async () => {
    if (calls++ === 0) { now += 54_000; return new Response(null, { status: 404 }); }
    return response();
  }, {}, { Date: { now: () => now }, AbortSignal: { timeout: (ms) => { budgets.push(ms); return undefined; } } });
  await api.generateEditorialBase(input);
  assert.deepEqual(budgets, [55_000, 11_000]);
});
test("Personalização recebe o final de bases entre 24 e 25 mil caracteres", async () => {
  let sent;
  const api = editorial(async () => response(), {
    "@/lib/ai/gemini": { requestGeminiJsonParts: async (_system, parts) => { sent = parts[0].text; return article; } },
  });
  await api.personalizeEditorialBase({ sourceUrl, baseTitle: "Base", baseHtml: "x".repeat(24_100) + "FATO_FINAL_ESSENCIAL" }, "");
  assert.ok(sent.includes("FATO_FINAL_ESSENCIAL"));
});
test("Cliente JSON compartilhado também recusa MAX_TOKENS e ignora thought", async () => {
  let complete = false;
  const api = load("lib/ai/gemini.ts", {
    "@/lib/ai/free-models": { geminiCandidates: () => ["model-a"] },
  }, { fetch: async () => response({ finishReason: complete ? "STOP" : "MAX_TOKENS", thought: true }) });
  await assert.rejects(api.requestGeminiJsonParts("editor", [{ text: "base" }]), /GEMINI_REQUEST_FAILED/);
  complete = true;
  const result = await api.requestGeminiJsonParts("editor", [{ text: "base" }]);
  assert.equal(result.title, article.title);
});
