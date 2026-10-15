import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
function load(file, mocks = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.resolve(file), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  new Function("require", "module", "exports", code)(name => name in mocks ? mocks[name] : require(name), module, module.exports);
  return module.exports;
}
const schema = load("lib/ai/content-assistant.ts");
const briefing = { kind: "planner", theme: "Cafés especiais", audience: "Pessoas do bairro", objective: "Engajamento", tone: "Profissional", networks: ["Instagram"], format: "Carrossel", message: "", consent: true };
const suggestion = { message: "Conheça os cafés da casa", hook: "Qual café combina com você?", topics: ["Origem", "Preparo", "Escolha"], cta: "Conte sua preferência" };
const calendar = { kind: "calendar", theme: briefing.theme, audience: briefing.audience, objective: "Engajamento", tone: "Profissional", network: "Instagram", startDate: "2026-12-30", count: 3, intervalDays: 2, consent: true };
const item = { title: "Conheça um café", format: "Carrossel", caption: "Uma pausa no dia", cta: "Compartilhe", observations: "Fotografe o produto real" };

test("Rejects missing consent, oversized briefs, impossible dates and unbounded batches", () => {
  for (const input of [{ ...briefing, consent: false }, { ...briefing, theme: "a".repeat(601) }, { ...briefing, networks: [] }, { ...calendar, count: 8 }, { ...calendar, intervalDays: 0 }, { ...calendar, startDate: "2026-02-30" }]) assert.equal(schema.contentAssistantInput.safeParse(input).success, false);
});
test("Dates are computed by code across month/year and leap-day boundaries", () => {
  assert.deepEqual(schema.publicationDates("2026-12-30", 3, 2), ["2026-12-30", "2027-01-01", "2027-01-03"]);
  assert.deepEqual(schema.publicationDates("2028-02-28", 3, 1), ["2028-02-28", "2028-02-29", "2028-03-01"]);
  const result = schema.validateAssistantOutput(calendar, { items: Array.from({ length: 3 }, () => ({ ...item, date: "2000-01-01", network: "Inventada" })) });
  assert.equal(result.items[0].date, "2026-12-30");
  assert.equal(result.items[0].network, "Instagram");
  assert.throws(() => schema.validateAssistantOutput(calendar, { items: [item] }));
});

function route(options = {}) {
  const calls = [];
  class GeminiRequestError extends Error { constructor(status) { super(); this.status = status; } }
  const mocks = {
    "@/lib/ai/content-assistant": schema,
    "@/lib/billing/sumup": { authenticateBillingUser: async () => { calls.push("auth"); if (options.unauthorized) throw new Error(); return { id: "test-user" }; } },
    "@/lib/ai/credits": {
      reserveAiCredits: async input => { calls.push(["reserve", input.cost]); return { allowed: !options.insufficient }; },
      finalizeAiCredits: async (_user, _operation, success) => { calls.push(success ? "charge" : "refund"); return true; },
    },
    "@/lib/ai/limits": { reserveAiRequest: async () => { calls.push("limit"); return !options.limited; } },
    "@/lib/ai/gemini": { GeminiRequestError, requestGeminiJsonParts: async () => { calls.push("provider"); if (options.providerError) throw new GeminiRequestError(429); return options.output ?? suggestion; } },
  };
  return { ...load("app/api/ai/content-assistant/route.ts", mocks), calls };
}
function request(body = briefing) { return new Request("https://kivai.test/api/ai/content-assistant", { method: "POST", body: JSON.stringify(body) }); }
test("Authentication and input validation precede wallet and provider access", async () => {
  const unauth = route({ unauthorized: true });
  assert.equal((await unauth.POST(request())).status, 401);
  assert.deepEqual(unauth.calls, ["auth"]);
  const invalid = route();
  assert.equal((await invalid.POST(request({ ...briefing, consent: false }))).status, 400);
  assert.deepEqual(invalid.calls, ["auth"]);
});
test("Charges one credit only after a validated generation", async () => {
  const endpoint = route();
  const response = await endpoint.POST(request());
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.equal((await response.json()).suggestion.hook, suggestion.hook);
  assert.deepEqual(endpoint.calls, ["auth", ["reserve", 1], "limit", "provider", "charge"]);
});
test("Insufficient balance never calls provider or refunds unreserved credits", async () => {
  const endpoint = route({ insufficient: true });
  assert.equal((await endpoint.POST(request())).status, 402);
  assert.deepEqual(endpoint.calls, ["auth", ["reserve", 1]]);
});
test("Quota, provider and invalid-output failures refund the reservation", async () => {
  for (const options of [{ limited: true }, { providerError: true }, { output: { message: "invalid" } }]) {
    const endpoint = route(options);
    assert.ok((await endpoint.POST(request())).status >= 400);
    assert.equal(endpoint.calls.at(-1), "refund");
    assert.equal(endpoint.calls.includes("charge"), false);
    if (options.limited) assert.equal(endpoint.calls.includes("provider"), false);
  }
});
test("CMS exposes editable assistant copy for both registered tools", () => {
  const cms = load("lib/ai/content-assistant-copy.ts");
  for (const slug of Object.values(cms.assistantSlugs)) {
    assert.equal(cms.assistantFields(slug).length, 3);
    assert.equal(cms.assistantCopy(slug, [{ key: "ai-title", value: "Título editado", type: "text", label: "Título" }]).title, "Título editado");
  }
});
