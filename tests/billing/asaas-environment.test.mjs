import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import { timingSafeEqual } from "node:crypto";

const source = ts.transpileModule(fs.readFileSync(new URL("../../lib/billing/asaas.ts", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const defaults = {
  KIVAI_ASAAS_RECURRING_SYNC: "true", ASAAS_ENVIRONMENT: "sandbox", VERCEL_ENV: "preview",
  ASAAS_API_KEY: "sandbox-api-key-fixture-only", ASAAS_WEBHOOK_TOKEN: "independent-webhook-token-fixture-only",
  KIVAI_ASAAS_SANDBOX_SUPABASE_REF: "abcdefghijklmnopqrst",
  SUPABASE_URL: "https://abcdefghijklmnopqrst.supabase.co",
  NEXT_PUBLIC_SUPABASE_URL: "https://abcdefghijklmnopqrst.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "fixture-service", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "fixture-public",
};
function load(overrides = {}) {
  const loadedModule = { exports: {} }; const calls = [];
  new Function("require", "module", "exports", "process", "fetch", source)(name => {
    if (name === "server-only") return {};
    if (name === "node:crypto") return { timingSafeEqual };
    throw Error(name);
  }, loadedModule, loadedModule.exports, { env: { ...defaults, ...overrides } }, async url => { calls.push(url); return Response.json({ id: "pay_fixture" }); });
  return { ...loadedModule.exports, calls };
}
test("configured sandbox permits only the isolated server/browser project", async () => {
  const api = load(); assert.equal(api.isAsaasSyncConfigured(), true);
  await api.asaasGet("/payments/pay_fixture"); assert.equal(api.calls[0], "https://api-sandbox.asaas.com/v3/payments/pay_fixture");
});
test("sandbox rejects production database even when explicitly named as sandbox", async () => {
  const api = load({ KIVAI_ASAAS_SANDBOX_SUPABASE_REF: "fphphknegwlgydwulehl", SUPABASE_URL: "https://fphphknegwlgydwulehl.supabase.co", NEXT_PUBLIC_SUPABASE_URL: "https://fphphknegwlgydwulehl.supabase.co" });
  assert.equal(api.isAsaasSyncConfigured(), false); await assert.rejects(api.asaasGet("/payments/pay_fixture"), /ASAAS_NOT_CONFIGURED/); assert.equal(api.calls.length, 0);
});
test("missing isolation, browser mismatch, invalid environment and production-on-preview fail closed", () => {
  for (const override of [{KIVAI_ASAAS_SANDBOX_SUPABASE_REF:""},{NEXT_PUBLIC_SUPABASE_URL:""},{SUPABASE_URL:"https://fphphknegwlgydwulehl.supabase.co"},{ASAAS_ENVIRONMENT:""},{ASAAS_ENVIRONMENT:"production"},{KIVAI_ASAAS_RECURRING_SYNC:"false"},{NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:""}]) {
    const api=load(override);assert.equal(api.isAsaasSyncConfigured(),false);assert.equal(api.matchesAsaasWebhookToken(defaults.ASAAS_WEBHOOK_TOKEN),false);
  }
});
test("production needs explicit configuration and remains available on production target",()=>{
  assert.equal(load({ASAAS_ENVIRONMENT:"production",VERCEL_ENV:"production",KIVAI_ASAAS_SANDBOX_SUPABASE_REF:""}).isAsaasSyncConfigured(),true);
});
test("webhook token must differ from API key and must not contain whitespace",()=>{
  for(const token of [defaults.ASAAS_API_KEY,"x".repeat(32)+" ","x".repeat(256)])assert.equal(load({ASAAS_WEBHOOK_TOKEN:token}).isAsaasSyncConfigured(),false);
});
