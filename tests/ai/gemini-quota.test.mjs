import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const source = readFileSync(fileURLToPath(new URL("../../lib/ai/gemini-quota.ts", import.meta.url)), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const commonJs = { exports: {} };
runInNewContext(compiled, {
  module: commonJs, exports: commonJs.exports,
  require(name) { if (name === "server-only") return {}; throw new Error("Unexpected module: " + name); },
  console: { warn() {} }, setTimeout, Response,
});
const { interpretGeminiQuota } = commonJs.exports;

async function classify(error, headers = {}) {
  const response = new Response(JSON.stringify({ error }), {
    status: 429, headers: { "Content-Type": "application/json", ...headers },
  });
  return interpretGeminiQuota(response, "draft", "gemini-3.5-flash-lite");
}

test("Generic quota message mentioning billing must not be called a financial cap", async () => {
  const err = await classify({
    code: 429, status: "RESOURCE_EXHAUSTED",
    message: "You exceeded your current quota, please check your plan and billing details.",
  });
  assert.equal(err.kind, "unknown");
});

test("Per-minute quota overrides generic billing reference", async () => {
  const err = await classify({
    code: 429, status: "RESOURCE_EXHAUSTED",
    message: "You exceeded your current quota, please check your plan and billing details.",
    details: [{ violations: [{ quotaId: "GenerateRequestsPerMinutePerProjectPerModel-FreeTier" }] }],
  }, { "Retry-After": "4" });
  assert.equal(err.kind, "minute");
  assert.equal(err.retrySeconds, 4);
});

test("Daily quota is not mistaken for a billing limit", async () => {
  const err = await classify({
    code: 429, status: "RESOURCE_EXHAUSTED",
    message: "Please check billing details.",
    details: [{ violations: [{ quotaId: "GenerateRequestsPerDayPerProjectPerModel-FreeTier" }] }],
  });
  assert.equal(err.kind, "day");
});

test("Explicit zero quota must be diagnosed separately", async () => {
  const err = await classify({
    code: 429, status: "RESOURCE_EXHAUSTED",
    message: "Quota exceeded: limit: 0, please check billing details.",
  });
  assert.equal(err.kind, "zero");
});

test("Financial diagnosis is reserved for explicit spend cap evidence", async () => {
  const err = await classify({
    code: 429, status: "RESOURCE_EXHAUSTED",
    message: "Spend-based rate limit reached for this project.",
  });
  assert.equal(err.kind, "spend");
});

test("Specific billing account suspension remains a financial issue", async () => {
  const err = await classify({
    code: 429, status: "RESOURCE_EXHAUSTED",
    message: "Billing account disabled.",
  });
  assert.equal(err.kind, "spend");
});

test("Unrecognized quota errors remain uncertain", async () => {
  const err = await classify({ code: 429, status: "RESOURCE_EXHAUSTED", message: "Capacity exhausted" });
  assert.equal(err.kind, "unknown");
});
