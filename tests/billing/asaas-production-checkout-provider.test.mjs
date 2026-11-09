import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";

const source = fs.readFileSync(new URL("../../lib/billing/asaas-production-checkout-provider.ts", import.meta.url), "utf8");
const js = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText;
const mod = { exports: {} };
new Function("require", "module", "exports", js)(name => {
  assert.equal(name, "server-only");
  return {};
}, mod, mod.exports);
const { productionCheckoutConfigured, createAsaasProductionCheckout } = mod.exports;
const keys = ["VERCEL_ENV","ASAAS_ENVIRONMENT","KIVAI_ASAAS_PRODUCTION_CHECKOUT","ASAAS_API_KEY"];
const original = Object.fromEntries(keys.map(k => [k, process.env[k]]));
function setProduction() {
  process.env.VERCEL_ENV = "production";
  process.env.ASAAS_ENVIRONMENT = "production";
  process.env.KIVAI_ASAAS_PRODUCTION_CHECKOUT = "true";
  process.env.ASAAS_API_KEY = "test-only-placeholder-key-123456";
}
function restore() {
  for (const k of keys) original[k] === undefined ? delete process.env[k] : process.env[k] = original[k];
}
function payload() {
  return {
    billingTypes: ["CREDIT_CARD"], chargeTypes: ["RECURRENT"], minutesToExpire: 60,
    externalReference: "kivai_asaas_11111111-1111-4111-8111-111111111111",
    callback: {
      successUrl: "https://kivai.com.br/conta?pagamento=pendente",
      cancelUrl: "https://kivai.com.br/planos?pagamento=cancelado",
      expiredUrl: "https://kivai.com.br/planos?pagamento=expirado"
    },
    items: [{ name: "Kivai Pro mensal", description: "Assinatura", quantity: 1, value: 19.9 }],
    subscription: { cycle: "MONTHLY", nextDueDate: "2026-11-11 12:00:00" }
  };
}
test("production checkout is disabled by default and on preview", async () => {
  try {
    setProduction();
    delete process.env.KIVAI_ASAAS_PRODUCTION_CHECKOUT;
    assert.equal(productionCheckoutConfigured(), false);
    let calls = 0;
    await assert.rejects(createAsaasProductionCheckout(payload(), { fetchImpl: async () => {
      calls++;
      throw Error("unexpected external call");
    }}), /DISABLED/);
    assert.equal(calls, 0);
    process.env.KIVAI_ASAAS_PRODUCTION_CHECKOUT = "true";
    process.env.VERCEL_ENV = "preview";
    assert.equal(productionCheckoutConfigured(), false);
  } finally { restore(); }
});
test("invalid payload and callback do not reach provider", async () => {
  try {
    setProduction();
    let calls = 0;
    const fakeFetch = async () => { calls++; throw Error("unexpected external call"); };
    await assert.rejects(createAsaasProductionCheckout({...payload(), callback: {...payload().callback, successUrl:"https://evil.example/"}}, {fetchImpl:fakeFetch}), /INVALID_PRODUCTION_CALLBACK/);
    await assert.rejects(createAsaasProductionCheckout({...payload(), chargeTypes:["DETACHED"]}, {fetchImpl:fakeFetch}), /INVALID_PRODUCTION_CHECKOUT_PAYLOAD/);
    await assert.rejects(createAsaasProductionCheckout({...payload(), subscription:{cycle:"MONTHLY",nextDueDate:"today"}}, {fetchImpl:fakeFetch}), /INVALID_PRODUCTION_CHECKOUT_PAYLOAD/);
    assert.equal(calls, 0);
  } finally { restore(); }
});
test("valid payload uses mocked production transport only once", async () => {
  try {
    setProduction();
    const requests = [];
    const result = await createAsaasProductionCheckout(payload(), {fetchImpl:async (url, options) => {
      requests.push({url, options});
      return {ok:true,json:async()=>({id:"checkout_123456"})};
    }});
    assert.equal(result.id, "checkout_123456");
    assert.equal(requests.length, 1);
    assert.equal(requests[0].url, "https://api.asaas.com/v3/checkouts");
    assert.equal(JSON.parse(requests[0].options.body).externalReference, payload().externalReference);
  } finally { restore(); }
});
