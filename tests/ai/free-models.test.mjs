import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const path = fileURLToPath(new URL("../../lib/ai/free-models.ts", import.meta.url));
const compiled = ts.transpileModule(readFileSync(path, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const common = { exports: {} };
runInNewContext(compiled, { module: common, exports: common.exports });
const { GEMINI_FREE_TEXT_MODELS, geminiCandidates } = common.exports;

test("Catalog includes only named and unique text models", () => {
  assert.equal(GEMINI_FREE_TEXT_MODELS.length, 8);
  assert.equal(new Set(GEMINI_FREE_TEXT_MODELS.map((v) => v.id)).size, 8);
  assert.ok(GEMINI_FREE_TEXT_MODELS.every((v) => !/image|live|tts/i.test(v.id)));
});
test("Google Search grounding on Free Tier limited to Gemini 2.5 Flash/Lite", () => {
  const ids = GEMINI_FREE_TEXT_MODELS.filter((v) => v.tasks.includes("search")).map((v) => v.id).sort();
  assert.deepEqual(ids, ["gemini-2.5-flash", "gemini-2.5-flash-lite"]);
  assert.deepEqual(Array.from(geminiCandidates("search", "auto")), ["gemini-2.5-flash-lite", "gemini-2.5-flash"]);
});
test("Editorial writing supports free text models without paid-only media", () => {
  for (const model of GEMINI_FREE_TEXT_MODELS) {
    assert.deepEqual(Array.from(geminiCandidates("text", model.id)), [model.id]);
  }
  assert.deepEqual(Array.from(geminiCandidates("url", "gemini-3.8-flash")), ["gemini-3.8-flash"]);
});
test("Reject unsupported paid model and using text-only models for paid grounding", () => {
  assert.throws(() => geminiCandidates("text", "gemini-4-argon"));
  assert.throws(() => geminiCandidates("search", "gemini-3.5-flash-lite"));
  assert.throws(() => geminiCandidates("search", "gemini-2.5-pro"));
  assert.throws(() => geminiCandidates("url", "gemini-3.1-flash-lite-image"));
});
