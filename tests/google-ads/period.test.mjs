import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import ts from "typescript";

// Reutiliza o código TypeScript real, compilado em memória. Não replica a
// implementação nos testes, portanto detecta regressões dos cálculos usados.
const sourceFile = fileURLToPath(new URL("../../lib/google-ads/diagnostics.ts", import.meta.url));
const compiled = ts.transpileModule(readFileSync(sourceFile, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  fileName: sourceFile,
}).outputText;
const moduleRecord = { exports: {} };
// Arquivo interno versionado e confiável do repositório, nunca conteúdo de cliente.
new Function("exports", "module", compiled)(moduleRecord.exports, moduleRecord);
const { inspectPeriod, compareAccumulatedGoal, buildCampaignDiagnostics } = moduleRecord.exports;

const baseGoals = {
  budget: 2000, leads: null, maxCpl: null,
  targetRoas: null, monthlyRevenue: null,
  conversionsAreLeads: false, conversionValueIsRevenue: false,
  objective: "sales", targetConversions: 100, maxCpa: 40,
  targetClicks: null, targetImpressions: null,
};
const totals = {
  cost: 497.95, conversions: 5, clicks: 200, impressions: 12000,
  conversionValue: 5, campaignCount: 1,
};

test("período completo até dia 15: proporcionaliza meta mensal corretamente", () => {
  const period = inspectPeriod("2026-10-01", "2026-10-15");
  assert.equal(period.valid, true);
  assert.equal(period.reportDays, 15);
  assert.ok(Math.abs(period.ratio - 15 / 31) < 1e-10);
  const expected = compareAccumulatedGoal("Conversões", "count", 100, 50, period);
  assert.ok(Math.abs(expected.expectedToDate - 48.38709677419355) < 0.000001);
  assert.ok(Math.abs(expected.differencePct - 3.3333333333333215) < 0.000001);
});

test("intervalo iniciado após dia 1 também é comparável à meta", () => {
  const period = inspectPeriod("2026-10-10", "2026-10-15");
  assert.equal(period.valid, true);
  assert.equal(period.fullMonthToDate, false);
  assert.ok(Math.abs(period.ratio - 6 / 31) < 1e-10);
  assert.ok(compareAccumulatedGoal("Custo", "currency", 2000, 400, period));
});

test("período atravessando meses soma as frações de cada mês", () => {
  const period = inspectPeriod("2026-09-15", "2026-10-15");
  assert.equal(period.valid, true);
  assert.equal(period.reportDays, 31);
  assert.ok(Math.abs(period.ratio - (16 / 30 + 15 / 31)) < 1e-10);
});

test("ano bissexto usa 29 dias em fevereiro", () => {
  assert.ok(Math.abs(inspectPeriod("2024-02-28", "2024-03-02").ratio - (2 / 29 + 2 / 31)) < 1e-10);
});

test("rejeita datas inválidas, inversas e períodos maiores que 366 dias", () => {
  assert.equal(inspectPeriod("2026-02-30", "2026-03-01").valid, false);
  assert.equal(inspectPeriod("2026-10-15", "2026-10-01").valid, false);
  assert.equal(inspectPeriod("2024-01-01", "2026-01-01").valid, false);
});

test("objetivo de reconhecimento não exige conversões", () => {
  const result = buildCampaignDiagnostics({
    goals: { ...baseGoals, objective: "awareness", targetConversions: null, maxCpa: null, targetImpressions: 10000 },
    totals: { ...totals, conversions: 0, cost: 200 },
    start: "2026-10-01", end: "2026-10-15",
  });
  assert.equal(result.insights.some(x => x.id === "zero_conversions"), false);
  assert.ok(result.pacing.impressions);
});

test("objetivo de vendas compara CPA e meta genérica de conversões", () => {
  const result = buildCampaignDiagnostics({
    goals: baseGoals, totals, start: "2026-10-01", end: "2026-10-15",
  });
  assert.ok(result.insights.some(x => x.id === "conversions_behind"));
  assert.ok(result.insights.some(x => x.id === "cpa_above"));
  assert.equal(result.insights.some(x => x.id === "leads_behind"), false);
});
