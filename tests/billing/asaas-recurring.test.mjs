import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";

const source = fs.readFileSync(new URL("../../app/api/billing/asaas/webhook/route.ts", import.meta.url), "utf8");
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }}).outputText;

function setup({ configured = true, token = "valid", providerStatus = "CONFIRMED", value = 19.90, link = true, repeated = false, existingEventStatus = null } = {}) {
  const calls = [];
  const payments = [];
  const inbox = [];
  const mocks = {
    "@/lib/billing/asaas": {
      isAsaasSyncConfigured: () => configured,
      matchesAsaasWebhookToken: received => received === token,
      asaasGet: async () => ({ id: "pay_12345678", subscription: "sub_12345678", value, status: providerStatus }),
    },
    "@/lib/blog/supabase": {
      supabaseRest: async (path, opts = {}) => {
        calls.push({ path, method: opts.method || "GET" });
        if (path === "rpc/kivai_apply_asaas_paid_charge") {
          const args = JSON.parse(opts.body);
          payments.push(args);
          return { applied: !repeated };
        }
        if (path.startsWith("kivai_recurring_provider_links?")) {
          return link ? [{ provider_subscription_id: "sub_12345678", expected_amount_brl: 19.90 }] : [];
        }
        if (path.startsWith("kivai_recurring_webhook_inbox?") && opts.method === "POST") return existingEventStatus ? [] : [{ provider_event_id: "evt_unique" }];
        if (path.startsWith("kivai_recurring_webhook_inbox?") && opts.method !== "PATCH") return existingEventStatus ? [{ provider_event_id: "evt_unique", processing_status: existingEventStatus }] : [];
        if (path.startsWith("kivai_recurring_webhook_inbox?") && opts.method === "PATCH") {
          inbox.push(JSON.parse(opts.body));
          return [];
        }
        return [];
      },
    },
  };
  const module = { exports: {} };
  new Function("require", "module", "exports", js)(name => {
    assert.ok(Object.hasOwn(mocks, name), "unexpected import: " + name);
    return mocks[name];
  }, module, module.exports);
  async function send(event = "PAYMENT_CONFIRMED", auth = token) {
    return module.exports.POST(new Request("https://example.test/api/billing/asaas/webhook", {
      method: "POST",
      headers: { "asaas-access-token": auth },
      body: JSON.stringify({
        id: "evt_unique",
        event,
        payment: { id: "pay_12345678", subscription: "sub_12345678" },
      }),
    }));
  }
  return { send, calls, payments, inbox };
}

test("Asaas webhook stays disabled without explicit opt-in", async () => {
  const ctx = setup({ configured: false });
  assert.equal((await ctx.send()).status, 503);
  assert.equal(ctx.payments.length, 0);
});
test("rejects unauthenticated notification", async () => {
  const ctx = setup();
  assert.equal((await ctx.send("PAYMENT_CONFIRMED", "wrong")).status, 401);
  assert.equal(ctx.calls.length, 0);
});
test("only provider-verified paid events call the entitlement RPC", async () => {
  const ctx = setup();
  const response = await ctx.send();
  assert.equal(response.status, 200);
  assert.equal(ctx.payments.length, 1);
  assert.equal(ctx.payments[0].p_payment_id, "pay_12345678");
  assert.equal(ctx.payments[0].p_subscription_id, "sub_12345678");
  assert.equal(ctx.inbox[0].processing_status, "applied");
});
test("does not activate unpaid or unknown payments", async () => {
  for (const configuration of [
    { providerStatus: "PENDING" },
    { link: false },
    { value: 0.01 },
  ]) {
    const ctx = setup(configuration);
    const response = await ctx.send();
    assert.equal(response.status, 200);
    assert.equal(ctx.payments.length, 0);
    assert.equal(ctx.inbox[0].processing_status, "manual_review");
  }
});
test("refunds and chargebacks require manual review, without activation", async () => {
  const ctx = setup();
  assert.equal((await ctx.send("PAYMENT_REFUNDED")).status, 200);
  assert.equal(ctx.payments.length, 0);
  assert.equal(ctx.inbox[0].processing_status, "manual_review");
});
test("provider duplicate charges do not generate a new period", async () => {
  const ctx = setup({ repeated: true });
  assert.equal((await ctx.send()).status, 200);
  assert.equal(ctx.inbox[0].processing_status, "duplicate");
});
test("database migration enforces per-charge deduplication and service-only RPC", () => {
  const sql = fs.readFileSync(new URL("../../supabase/migrations/20261105193000_asaas_recurring_sync.sql", import.meta.url), "utf8");
  assert.match(sql, /provider_payment_id text not null unique/);
  assert.match(sql, /on conflict\(provider_payment_id\) do nothing/);
  assert.match(sql, /grant execute on function public.kivai_apply_asaas_paid_charge.* to service_role/i);
  assert.match(sql, /revoke all on public.kivai_recurring_paid_charges from public, anon, authenticated/);
});

test("refund, chargeback and overdue events go to manual review without granting or revoking access", async () => {
  for (const event of [
    "PAYMENT_REFUNDED", "PAYMENT_PARTIALLY_REFUNDED",
    "PAYMENT_CHARGEBACK_REQUESTED", "PAYMENT_CHARGEBACK_DISPUTE",
    "PAYMENT_OVERDUE", "SUBSCRIPTION_INACTIVATED", "SUBSCRIPTION_DELETED"
  ]) {
    const ctx = setup();
    assert.equal((await ctx.send(event)).status, 200, event);
    assert.equal(ctx.payments.length, 0, event);
    assert.equal(ctx.inbox[0].processing_status, "manual_review", event);
    assert.equal(ctx.calls.some(c => c.path === "rpc/kivai_apply_asaas_paid_charge"), false, event);
  }
});

test("re-delivered event that was already processed does not reapply any payment", async () => {
  for (const status of ["applied", "duplicate", "manual_review"]) {
    const ctx = setup({ existingEventStatus: status });
    assert.equal((await ctx.send()).status, 200, status);
    assert.equal(ctx.payments.length, 0, status);
    assert.equal(ctx.calls.some(c => c.path.startsWith("kivai_recurring_provider_links?")), false, status);
  }
});

test("a previously refunded payment must not be regranted based on a new paid webhook", async () => {
  const ctx = setup({providerStatus:"REFUNDED"});
  assert.equal((await ctx.send("PAYMENT_CONFIRMED")).status, 200);
  assert.equal(ctx.payments.length, 0);
  assert.equal(ctx.inbox[0].processing_status, "manual_review");
});
