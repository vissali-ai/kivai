import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ts = require("typescript");

function loadPureTypeScript(fileName) {
  const source = readFileSync(new URL("../../lib/google-ads/" + fileName, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText;
  const sandbox = { exports: {}, Date, Intl, Number, Math, String, RegExp, Object };
  runInNewContext(compiled, sandbox, { filename: fileName });
  return sandbox.exports;
}

const { inspectPeriod, compareAccumulatedGoal, buildCampaignDiagnostics } =
  loadPureTypeScript("diagnostics.ts");
const { lastCompletedDayInTimeZone, firstDayOfMonthISO } =
  loadPureTypeScript("dates.ts");

const goals = {
  budget: 2000, leads: 100, maxCpl: 20, targetRoas: null, monthlyRevenue: null,
  conversionsAreLeads: true, conversionValueIsRevenue: false,
};

test("dia 16 em São Paulo usa dados encerrados até dia 15", () => {
  const at = new Date("2026-10-16T12:00:00Z");
  assert.equal(lastCompletedDayInTimeZone("America/Sao_Paulo", at), "2026-10-15");
  assert.equal(firstDayOfMonthISO("2026-10-15"), "2026-10-01");
});

test("meta de outubro: 100 leads, 15 de 31 dias, realizado 50", () => {
  const period = inspectPeriod("2026-10-01", "2026-10-15");
  assert.equal(period.valid, true);
  assert.equal(period.fullMonthToDate, true);
  assert.equal(period.daysInMonth, 31);
  assert.equal(period.elapsedDays, 15);
  const leads = compareAccumulatedGoal("Leads", "count", 100, 50, period);
  assert.ok(leads);
  assert.equal(Number(leads.expectedToDate.toFixed(2)), 48.39);
  assert.equal(Number(leads.difference.toFixed(2)), 1.61);
  assert.equal(Number(leads.differencePct.toFixed(2)), 3.33);
  assert.equal(Number(leads.achievedPct.toFixed(2)), 50);
});

test("orçamento acumulado de R$ 2.000 é R$ 967,74 no dia 15", () => {
  const period = inspectPeriod("2026-10-01", "2026-10-15");
  const budget = compareAccumulatedGoal("Investimento", "currency", 2000, 920, period);
  assert.ok(budget);
  assert.equal(Number(budget.expectedToDate.toFixed(2)), 967.74);
  assert.ok(budget.differencePct < 0);
});

test("CPL R$ 20 e ROAS alvo são taxas e não proporcionais", () => {
  const report = buildCampaignDiagnostics({
    goals, totals: {
      impressions: 4000, clicks: 200, cost: 1000,
      conversions: 50, conversionValue: null, campaignCount: 1,
    }, start: "2026-10-01", end: "2026-10-15",
  });
  assert.equal(report.metrics.cpl, 20);
  assert.equal(report.pacing.leads.expectedToDate, 100 * 15 / 31);
  assert.equal(report.pacing.investment.expectedToDate, 2000 * 15 / 31);
});

test("período parcial não compara metas mensais como se tivesse o mês todo", () => {
  const period = inspectPeriod("2026-10-05", "2026-10-15");
  assert.equal(period.fullMonthToDate, false);
  assert.equal(compareAccumulatedGoal("Leads", "count", 100, 50, period), null);
});

test("fevereiro e virada de ano mantêm quantidades corretas de dias", () => {
  assert.equal(inspectPeriod("2028-02-01", "2028-02-29").daysInMonth, 29);
  assert.equal(inspectPeriod("2027-02-01", "2027-02-28").daysInMonth, 28);
  assert.equal(lastCompletedDayInTimeZone("America/Sao_Paulo", new Date("2027-01-01T15:00:00Z")), "2026-12-31");
});
