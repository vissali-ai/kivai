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

test("due date is later than the checkout expiry, in Sao Paulo instead of UTC",()=>{
  const result = nextAsaasFirstDueDate(new Date("2026-11-09T18:00:00.000Z"));
  assert.equal(result,"2026-11-09 16:10:00");
});
test("crosses calendar day in Sao Paulo when checkout is close to midnight",()=>{
  const result=nextAsaasFirstDueDate(new Date("2026-11-10T02:58:00.000Z"));
  assert.equal(result,"2026-11-10 01:08:00");
});
test("preserves Brazil local time and format independent of UTC calendar day",()=>{
  const result=nextAsaasFirstDueDate(new Date("2026-11-10T00:00:00.000Z"));
  assert.equal(result,"2026-11-09 22:10:00");
  assert.match(result,/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
});
test("rejects invalid date",()=>{
  assert.throws(()=>nextAsaasFirstDueDate(new Date(NaN)),/ASAAS_INVALID_CURRENT_TIME/);
});

test("first due date remains after entire 60-minute checkout lifetime",()=>{
  const start = new Date("2026-11-09T18:00:00.000Z");
  const due = nextAsaasFirstDueDate(start);
  const formatter = new Intl.DateTimeFormat("en-CA", {timeZone:"America/Sao_Paulo",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23"});
  const dueParts = due.replace(/[- :]/g,"");
  const expiryParts = Object.fromEntries(formatter.formatToParts(new Date(start.getTime()+60*60000)).map(p=>[p.type,p.value]));
  const expirySort = ["year","month","day","hour","minute","second"].map(k=>expiryParts[k]).join("");
  assert.ok(dueParts > expirySort);
});
