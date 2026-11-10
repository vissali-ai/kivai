import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import crypto from "node:crypto";

const source = fs.readFileSync(new URL("../../app/api/cron/asaas-monitor/route.ts", import.meta.url), "utf8");
const js = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText;
const keys = ["VERCEL_ENV","ASAAS_ENVIRONMENT","KIVAI_ASAAS_MONITORING",
  "CRON_SECRET","RESEND_API_KEY","KIVAI_ASAAS_ALERT_EMAIL"];
const original = Object.fromEntries(keys.map(key => [key, process.env[key]]));
const oldFetch = globalThis.fetch;
const token = "test-secret-longer-than-thirty-two-characters";
function env() {
  process.env.VERCEL_ENV = "production";
  process.env.ASAAS_ENVIRONMENT = "production";
  process.env.KIVAI_ASAAS_MONITORING = "true";
  process.env.CRON_SECRET = token;
  process.env.RESEND_API_KEY = "test-key-long-enough-for-monitor";
  process.env.KIVAI_ASAAS_ALERT_EMAIL = "financeiro@example.com";
}
function restore() {
  for (const key of keys) original[key] === undefined ? delete process.env[key] : process.env[key] = original[key];
  globalThis.fetch = oldFetch;
}
function setup({ reviews = [], paid = [], mailStatus = 200 } = {}) {
  const calls = [];
  const mocks = {
    "server-only": {},
    "node:crypto": crypto,
    "@/lib/blog/supabase": { supabaseRest: async path => {
      calls.push(path);
      if (path.startsWith("kivai_recurring_webhook_inbox?")) return reviews;
      if (path.startsWith("kivai_asaas_checkout_intents?")) return paid;
      throw Error("unexpected query");
    }}
  };
  const mod = { exports: {} };
  new Function("require", "module", "exports", js)(name => {
    assert.ok(Object.hasOwn(mocks, name), name);
    return mocks[name];
  }, mod, mod.exports);
  globalThis.fetch = async (url, options) => {
    calls.push("mail");
    assert.equal(url, "https://api.resend.com/emails");
    assert.match(options.headers["Idempotency-Key"], /^kivai-asaas-ops-\d{4}-\d{2}-\d{2}$/);
    const payload = JSON.parse(options.body);
    assert.deepEqual(payload.to, ["financeiro@example.com"]);
    assert.doesNotMatch(payload.text, /pay_[a-z0-9]+|cus_[a-z0-9]+|@example\.com/i);
    return { ok: mailStatus === 200, status: mailStatus };
  };
  const request = (secret = token) => new Request("https://www.kivai.com.br/api/cron/asaas-monitor", {
    headers: secret ? { Authorization: "Bearer " + secret } : {}
  });
  return { GET: mod.exports.GET, request, calls };
}

test("monitor stays inert when disabled, preview, or missing recipient", async () => {
  try {
    env();
    const x = setup();
    for (const key of ["KIVAI_ASAAS_MONITORING", "KIVAI_ASAAS_ALERT_EMAIL"]) {
      env(); delete process.env[key];
      assert.deepEqual(await (await x.GET(x.request())).json(), { enabled: false, checked: 0 });
    }
    env(); process.env.VERCEL_ENV = "preview";
    assert.deepEqual(await (await x.GET(x.request())).json(), { enabled: false, checked: 0 });
    assert.deepEqual(x.calls, []);
  } finally { restore(); }
});
test("cron authorization is required before reading financial event metadata", async () => {
  try {
    env();
    assert.deepEqual({deployment:process.env.VERCEL_ENV,provider:process.env.ASAAS_ENVIRONMENT,monitor:process.env.KIVAI_ASAAS_MONITORING,cron:(process.env.CRON_SECRET??"").length,api:(process.env.RESEND_API_KEY??"").length,email:process.env.KIVAI_ASAAS_ALERT_EMAIL},{deployment:"production",provider:"production",monitor:"true",cron:45,api:32,email:"financeiro@example.com"});
    const x = setup();
    assert.equal((await x.GET(x.request("invalid"))).status, 401);
    assert.equal((await x.GET(x.request(null))).status, 401);
    assert.deepEqual(x.calls, []);
  } finally { restore(); }
});
test("clean monitor performs only reads and sends no email", async () => {
  try {
    env(); const x = setup();
    const result = await x.GET(x.request());
    assert.equal(result.status, 200);
    assert.deepEqual(await result.json(), { enabled: true, alert: false, manualReview: 0, paidCheckoutUnverified: 0 });
    assert.equal(x.calls.length, 2);
    assert.equal(x.calls.some(s => s === "mail"), false);
  } finally { restore(); }
});
test("stale review and paid checkout generate a redacted operational email", async () => {
  try {
    env();
    const x = setup({
      reviews: [{ provider_event_id: "evt_private", event_type: "PAYMENT_CONFIRMED", created_at: "2026-11-09T01:00:00Z" }],
      paid: [{ id: "private-uuid", checkout_paid_at: "2026-11-09T01:00:00Z", subscription_verified_at: null }]
    });
    const result = await x.GET(x.request());
    assert.equal(result.status, 200);
    assert.deepEqual(await result.json(), { enabled: true, alert: true, manualReview: 1, paidCheckoutUnverified: 1 });
    assert.equal(x.calls.filter(c => c === "mail").length, 1);
    assert.equal(x.calls.filter(c => c.startsWith("rpc/")).length, 0);
  } finally { restore(); }
});
test("email delivery failure is not reported as successful monitoring", async () => {
  try {
    env(); const x = setup({ reviews: [{ provider_event_id: "evt", event_type: "PAYMENT_CONFIRMED", created_at: "2026-11-09T01:00:00Z" }], mailStatus: 503 });
    const result = await x.GET(x.request());
    assert.equal(result.status, 503);
    assert.deepEqual(await result.json(), { error: "Falha na verificação ou notificação operacional." });
  } finally { restore(); }
});
