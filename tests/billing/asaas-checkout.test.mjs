import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";

const source = fs.readFileSync(new URL("../../lib/billing/asaas-checkout.ts", import.meta.url), "utf8");
const js = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const mod = { exports: {} };
new Function("module", "exports", js)(mod, mod.exports);
const build = mod.exports.buildAsaasRecurringCheckout;

const input = {
  plan: "pro",
  billing: "monthly",
  amountBrl: 19.90,
  externalReference: "kivai_checkout_test_001",
  nextDueDate: "2026-11-10 15:00:00",
  baseUrl: "https://www.kivai.com.br",
};

test("Asaas sandbox checkout payload uses recurring credit card and verified server pricing", () => {
  const payload = build(input);
  assert.deepEqual(payload.chargeTypes, ["RECURRENT"]);
  assert.deepEqual(payload.billingTypes, ["CREDIT_CARD"]);
  assert.equal(payload.items[0].value, 19.90);
  assert.equal(payload.subscription.cycle, "MONTHLY");
  assert.equal(payload.externalReference, input.externalReference);
  assert.equal(payload.callback.successUrl, "https://www.kivai.com.br/conta?pagamento=pendente");
  assert.equal(Object.hasOwn(payload, "customer"), false);
  assert.equal(Object.hasOwn(payload, "customerData"), false);
});

test("annual Agency plan produces YEARLY without changing pricing", () => {
  const payload = build({ ...input, plan: "agency", billing: "annual", amountBrl: 299.90 });
  assert.equal(payload.subscription.cycle, "YEARLY");
  assert.equal(payload.items[0].value, 299.90);
});

test("invalid plan, cycle, amount, reference and redirect origin are rejected", () => {
  for (const changes of [
    {plan:"free"}, {billing:"weekly"}, {amountBrl:-1}, {amountBrl:1.234},
    {externalReference:".."}, {nextDueDate:"tomorrow"},
    {baseUrl:"http://www.kivai.com.br"}, {baseUrl:"https://evil.com/path"},
  ]) assert.throws(() => build({...input, ...changes}));
});

test("checkout completion redirect never grants paid access", () => {
  const payload = build(input);
  assert.equal(payload.callback.successUrl.includes("ativado"), false);
  assert.equal(payload.callback.successUrl.includes("success=true"), false);
});
