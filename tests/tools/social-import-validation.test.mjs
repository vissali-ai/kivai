import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const require = createRequire(import.meta.url);
const filename = path.join(root, "lib/ai/social-report-import.ts");
const module = { exports: {} };
const transpiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText;
new Function("require", "module", "exports", transpiled)(require, module, module.exports);
const { socialImportResultSchema, socialImportRequestSchema } = module.exports;

const found = (overrides = {}) => ({
  network: "Instagram",
  startDate: "2026-09-01",
  endDate: "2026-09-30",
  metrics: [{ key: "reach", value: 12000, evidence: "Contas alcançadas: 12.000" }],
  warnings: [],
  ...overrides,
});

test("Accepts valid reach, including a measured zero", () => {
  assert.equal(socialImportResultSchema.safeParse(found()).success, true);
  assert.equal(socialImportResultSchema.safeParse(found({
    metrics: [{ key: "reach", value: 0, evidence: "Alcance: 0" }],
  })).success, true);
});

test("Rejects metrics that do not exist in Social Media report", () => {
  assert.equal(socialImportResultSchema.safeParse(found({
    metrics: [{ key: "password", value: 1, evidence: "Password" }],
  })).success, false);
});

test("Rejects negative and nonnumeric metrics", () => {
  for (const value of [-1, "1.000", null]) {
    assert.equal(socialImportResultSchema.safeParse(found({
      metrics: [{ key: "reach", value, evidence: "Alcance" }],
    })).success, false);
  }
});

test("Rejects duplicate metrics and backwards periods", () => {
  assert.equal(socialImportResultSchema.safeParse(found({
    metrics: [
      { key: "reach", value: 12000, evidence: "Alcance: 12000" },
      { key: "reach", value: 13000, evidence: "Alcance: 13000" },
    ],
  })).success, false);
  assert.equal(socialImportResultSchema.safeParse(found({
    startDate: "2026-09-30", endDate: "2026-09-01",
  })).success, false);
});

test("Allows up to three images but no combined PDFs or spreadsheets", () => {
  const img = { kind: "binary", mimeType: "image/jpeg", data: "AAAA".repeat(30) };
  const source = "Instagram Insights", networkHint = "Instagram";
  assert.equal(socialImportRequestSchema.safeParse({ source, networkHint, files: [img, img, img] }).success, true);
  assert.equal(socialImportRequestSchema.safeParse({
    source, networkHint,
    files: [{ kind: "binary", mimeType: "application/pdf", data: "AAAA".repeat(30) }, img],
  }).success, false);
  assert.equal(socialImportRequestSchema.safeParse({
    source, networkHint,
    files: [{ kind: "text", content: "Reach,12000" }, img],
  }).success, false);
});
