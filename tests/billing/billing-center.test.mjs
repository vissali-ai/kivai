import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";

const source = fs.readFileSync(new URL("../../app/api/account/billing-overview/route.ts", import.meta.url), "utf8");
const js = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function setup({ authenticated = true } = {}) {
  const paths = [];
  const module = { exports: {} };
  const dependencies = {
    "@/lib/auth/authenticated-billing-user": { authenticateBillingUser: async () => {
      if (!authenticated) throw Error("UNAUTHORIZED");
      return {id:"11111111-1111-4111-8111-111111111111"};
    }},
    "@/lib/billing/access": { getAccountAccess: async () => ({
      plan: "pro",
      subscription: {
        plan_code: "pro", status: "active", provider: "admin_manual",
        current_period_end: "2026-12-09T00:00:00Z", billing_cycle: "monthly", test_access: false,
      },
    })},
    "@/lib/blog/supabase": { supabaseRest: async path => {
      paths.push(path);
      if (path.startsWith("ai_credit_orders?")) return [{
        id:"test",credits:50,pack_code:"starter",status:"paid",amount_cents:990,created_at:"2026-11-09T00:00:00Z",
      }];
      return [];
    }},
  };
  new Function("require", "module", "exports", js)(key => {
    assert.ok(Object.hasOwn(dependencies,key),"Unexpected import: "+key);
    return dependencies[key];
  },module,module.exports);
  return {GET:module.exports.GET,paths};
}

test("billing center blocks unauthenticated users and returns no financial data", async () => {
  const {GET,paths} = setup({authenticated:false});
  const response = await GET(new Request("https://www.kivai.com.br/api/account/billing-overview"));
  assert.equal(response.status,401);
  assert.equal(paths.length,0);
  assert.match(response.headers.get("Cache-Control") || "",/no-store/);
});

test("billing center uses server-authenticated userId and does not expose payment credentials", async () => {
  const {GET,paths} = setup();
  const response = await GET(new Request("https://www.kivai.com.br/api/account/billing-overview?user_id=attacker"));
  assert.equal(response.status,200);
  assert.match(response.headers.get("Cache-Control") || "",/no-store/);
  assert.ok(paths.every(path=>path.includes("11111111-1111-4111-8111-111111111111")));
  assert.ok(paths.some(path=>path.startsWith("ai_credit_orders?")));
  const result = await response.json();
  assert.equal(result.plan,"pro");
  assert.equal(result.recurringManagementReady,false);
  assert.equal(result.servicesBillingReady,false);
  assert.equal(result.creditOrders[0].amount_cents,990);
  assert.equal(Object.hasOwn(result,"apiKey"),false);
});
