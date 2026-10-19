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
const content = { title: "Café da manhã", subtitle: "Comece bem", caption: "Conheça nossa cafeteria.", cta: "Conheça", hashtags: ["#cafe"], imagePrompt: "Mesa com uma xícara de café", slides: [{ title: "Café", body: "Conheça a casa" }] };
const brief = { ...schema.initialPostProject.brief, theme: "Cafeteria com café da manhã" };

test("image adapter refuses disabled, blocked and invalid images, converts a valid raster", async () => {
  const originalFetch = globalThis.fetch, originalKey = process.env.GEMINI_API_KEY, originalFlag = process.env.GEMINI_IMAGE_GENERATION_ENABLED;
  const sharp = require("sharp");
  const bytes = await sharp({ create: { width: 320, height: 400, channels: 3, background: "red" } }).png().toBuffer();
  class GeminiRequestError extends Error {}
  const adapter = load("lib/ai/post-image.ts", { "server-only": {}, "@/lib/ai/gemini": { GeminiRequestError } });
  try {
    process.env.GEMINI_API_KEY = "test-only"; process.env.GEMINI_IMAGE_GENERATION_ENABLED = "false";
    globalThis.fetch = async () => { throw Error("Provider must not be called"); };
    await assert.rejects(adapter.generatePostImage("Café", "4:5"));
    process.env.GEMINI_IMAGE_GENERATION_ENABLED = "true";
    for (const finishReason of ["SAFETY", "STOP"]) {
      globalThis.fetch = async (_url, options) => {
        assert.equal(JSON.parse(options.body).generationConfig.imageConfig.aspectRatio, "4:5");
        return Response.json({ candidates: [{ finishReason, content: { parts: [{ inlineData: { mimeType: "image/png", data: bytes.toString("base64") } }] } }] });
      };
      if (finishReason !== "STOP") await assert.rejects(adapter.generatePostImage("Café", "4:5"));
      else {
        const image = await adapter.generatePostImage("Café", "4:5");
        const meta = await sharp(Buffer.from(image.split(",")[1], "base64")).metadata();
        assert.equal(meta.format, "jpeg"); assert.equal(meta.width, 320);
      }
    }
    globalThis.fetch = async () => Response.json({ candidates: [{ finishReason: "STOP", content: { parts: [{ inlineData: { mimeType: "image/svg+xml", data: "PHN2Zz4=" } }] } }] });
    await assert.rejects(adapter.generatePostImage("Café", "4:5"));
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = originalKey;
    if (originalFlag === undefined) delete process.env.GEMINI_IMAGE_GENERATION_ENABLED; else process.env.GEMINI_IMAGE_GENERATION_ENABLED = originalFlag;
  }
});
test("creator validates consent, limits and raster-only projects", () => {
  assert.equal(schema.creatorRequestSchema.safeParse({ action: "content", consent: false, brief }).success, false);
  assert.equal(schema.creatorRequestSchema.safeParse({ action: "image", consent: true, prompt: "a".repeat(1801), format: "square" }).success, false);
  assert.equal(schema.postProjectSchema.safeParse({ ...schema.initialPostProject, image: "https://example.com/tracking.png" }).success, false);
  assert.equal(schema.postProjectSchema.safeParse({ ...schema.initialPostProject, logo: "data:image/svg+xml;base64,PHN2Zz4=" }).success, false);
  assert.equal(schema.postProjectSchema.safeParse(schema.initialPostProject).success, true);
  assert.equal(schema.postContentSchema.safeParse({ ...content, title: "x".repeat(141) }).success, false);
});
test("creator charges server-defined costs and refunds every failure after reservation", async () => {
  const original = process.env.GEMINI_API_KEY; process.env.GEMINI_API_KEY = "test-only";
  try {
    for (const scenario of ["content", "image", "disabled", "unauthorized", "invalid", "no-credit", "quota", "provider-error", "invalid-output", "finalization"]) {
      const charged = [], finalized = []; let calls = 0;
      const route = load("app/api/ai/post-creator/route.ts", {
        "@/lib/post-creator/schema": schema,
        "@/lib/billing/sumup": { authenticateBillingUser: async () => { if (scenario === "unauthorized") throw Error(); return { id: "user-test" }; } },
        "@/lib/ai/credits": { reserveAiCredits: async x => { charged.push(x.cost); return { allowed: scenario !== "no-credit" }; }, finalizeAiCredits: async (_u, _id, ok) => { finalized.push(ok); return scenario !== "finalization" || !ok; } },
        "@/lib/ai/limits": { reserveAiRequest: async () => scenario !== "quota" },
        "@/lib/ai/gemini": { requestGeminiJsonParts: async () => { calls++; if (scenario === "provider-error") throw Error(); return scenario === "invalid-output" ? {} : content; } },
        "@/lib/ai/post-image": { postImageEnabled: () => scenario !== "disabled", generatePostImage: async () => { calls++; return "data:image/jpeg;base64,dGVzdA=="; } },
      });
      const input = ["image", "disabled"].includes(scenario) ? { action: "image", consent: true, prompt: content.imagePrompt, format: "square", cost: 0 } : { action: "content", consent: scenario !== "invalid", brief, cost: 0 };
      const result = await route.POST(new Request("http://localhost/api/ai/post-creator", { method: "POST", body: JSON.stringify(input) }));
      const success = ["content", "image"].includes(scenario);
      assert.equal(result.status, success ? 200 : scenario === "unauthorized" ? 401 : scenario === "invalid" ? 400 : scenario === "no-credit" ? 402 : scenario === "quota" ? 429 : 503, scenario);
      assert.deepEqual(charged, ["disabled", "unauthorized", "invalid"].includes(scenario) ? [] : [scenario === "image" ? 5 : 1], scenario);
      assert.deepEqual(finalized, success ? [true] : ["disabled", "unauthorized", "invalid", "no-credit"].includes(scenario) ? [] : scenario === "finalization" ? [true, false] : [false], scenario);
      if (["disabled", "unauthorized", "invalid", "no-credit", "quota"].includes(scenario)) assert.equal(calls, 0);
    }
  } finally { if (original === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = original; }
});
