import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";

const source = fs.readFileSync(new URL("../../lib/billing/asaas-first-due-date.ts", import.meta.url), "utf8");
const js = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText;
const mod = {exports:{}};
new Function("require","module","exports",js)(()=>{throw Error("Unexpected dependency");},mod,mod.exports);
const { nextAsaasFirstDueDate } = mod.exports;

test("formats near-term first charge in Sao Paulo instead of server UTC",()=>{
  const result = nextAsaasFirstDueDate(new Date("2026-11-09T18:00:00.000Z"));
  assert.equal(result,"2026-11-09 15:05:00");
});
test("crosses calendar day in Sao Paulo when checkout is close to midnight",()=>{
  const result=nextAsaasFirstDueDate(new Date("2026-11-10T02:58:00.000Z"));
  assert.equal(result,"2026-11-10 00:03:00");
});
test("preserves Brazil local time and format independent of UTC calendar day",()=>{
  const result=nextAsaasFirstDueDate(new Date("2026-11-10T00:00:00.000Z"));
  assert.equal(result,"2026-11-09 21:05:00");
  assert.match(result,/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
});
test("rejects invalid date",()=>{
  assert.throws(()=>nextAsaasFirstDueDate(new Date(NaN)),/ASAAS_INVALID_CURRENT_TIME/);
});
