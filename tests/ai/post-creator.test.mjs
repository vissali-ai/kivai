import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
function load(file, mocks = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  new Function("require", "module", "exports", code)(name => name in mocks ? mocks[name] : require(name), module, module.exports);
  return module.exports;
}
const schema = load("lib/post-creator/schema.ts");
const content = { title: "Café da manhã", subtitle: "Comece bem", caption: "Conheça nossa cafeteria.", cta: "Conheça", hashtags: ["#cafe"], slides: [{ title: "Café", body: "Conheça a casa" }] };
const brief = { ...schema.initialPostProject.brief, theme: "Cafeteria com café da manhã" };

test("creator validates consent, limits and raster-only projects", () => {
  assert.equal(schema.creatorRequestSchema.safeParse({ action: "content", consent: false, brief }).success, false);
  assert.equal(schema.creatorRequestSchema.safeParse({ action: "image", consent: true, prompt: "qualquer imagem", format: "square" }).success, false);
  assert.equal(schema.postProjectSchema.safeParse({ ...schema.initialPostProject, image: "https://example.com/tracking.png" }).success, false);
  assert.equal(schema.postProjectSchema.safeParse({ ...schema.initialPostProject, logo: "data:image/svg+xml;base64,PHN2Zz4=" }).success, false);
  assert.equal(schema.postProjectSchema.safeParse(schema.initialPostProject).success, true);
  assert.equal(schema.postContentSchema.safeParse({ ...content, title: "x".repeat(141) }).success, false);
});
test("creator charges server-defined content cost and refunds every failure after reservation", async () => {
  const original = process.env.GEMINI_API_KEY; process.env.GEMINI_API_KEY = "test-only";
  try {
    for (const scenario of ["content", "unauthorized", "invalid", "no-credit", "quota", "provider-error", "invalid-output", "finalization"]) {
      const charged = [], finalized = []; let calls = 0;
      const route = load("app/api/ai/post-creator/route.ts", {
        "@/lib/post-creator/schema": schema,
        "@/lib/billing/sumup": { authenticateBillingUser: async () => { if (scenario === "unauthorized") throw Error(); return { id: "user-test" }; } },
        "@/lib/ai/credits": { reserveAiCredits: async x => { charged.push(x.cost); return { allowed: scenario !== "no-credit" }; }, finalizeAiCredits: async (_u, _id, ok) => { finalized.push(ok); return scenario !== "finalization" || !ok; } },
        "@/lib/ai/limits": { reserveAiRequest: async () => scenario !== "quota" },
        "@/lib/ai/gemini": { requestGeminiJsonParts: async () => { calls++; if (scenario === "provider-error") throw Error(); return scenario === "invalid-output" ? {} : content; } },
      });
      const input = { action: "content", consent: scenario !== "invalid", brief, cost: 0 };
      const result = await route.POST(new Request("http://localhost/api/ai/post-creator", { method: "POST", body: JSON.stringify(input) }));
      const success = scenario === "content";
      assert.equal(result.status, success ? 200 : scenario === "unauthorized" ? 401 : scenario === "invalid" ? 400 : scenario === "no-credit" ? 402 : scenario === "quota" ? 429 : 503, scenario);
      assert.deepEqual(charged, ["unauthorized", "invalid"].includes(scenario) ? [] : [1], scenario);
      assert.deepEqual(finalized, success ? [true] : ["unauthorized", "invalid", "no-credit"].includes(scenario) ? [] : scenario === "finalization" ? [true, false] : [false], scenario);
      if (["unauthorized", "invalid", "no-credit", "quota"].includes(scenario)) assert.equal(calls, 0);
    }
  } finally { if (original === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = original; }
});
