import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";

const source = fs.readFileSync(new URL("../../lib/billing/asaas-checkout-provider.ts", import.meta.url), "utf8");
const js = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const moduleMock = { exports: {} };
new Function("require", "module", "exports", js)(id => {
  assert.equal(id, "server-only");
  return {};
}, moduleMock, moduleMock.exports);
const create = moduleMock.exports.createAsaasSandboxCheckout;
const payload = {
  billingTypes: ["CREDIT_CARD"], chargeTypes: ["RECURRENT"], minutesToExpire: 60,
  externalReference: "kivai_checkout_test_0001",
  callback: { successUrl: "https://www.kivai.com.br/conta", cancelUrl: "https://www.kivai.com.br/planos", expiredUrl: "https://www.kivai.com.br/planos" },
  items: [{ name: "Pro", description: "Test", quantity: 1, value: 19.9 }],
  subscription: { cycle: "MONTHLY", nextDueDate: "2027-01-31 15:02:38" },
};
const original = {
  environment: process.env.ASAAS_ENVIRONMENT,
  enabled: process.env.KIVAI_ASAAS_SANDBOX_CHECKOUT,
};
function setTestEnvironment(enabled) {
  process.env.ASAAS_ENVIRONMENT = "sandbox";
  process.env.KIVAI_ASAAS_SANDBOX_CHECKOUT = enabled ? "true" : "false";
}
function restore() {
  if (original.environment === undefined) delete process.env.ASAAS_ENVIRONMENT;
  else process.env.ASAAS_ENVIRONMENT = original.environment;
  if (original.enabled === undefined) delete process.env.KIVAI_ASAAS_SANDBOX_CHECKOUT;
  else process.env.KIVAI_ASAAS_SANDBOX_CHECKOUT = original.enabled;
}
test("sandbox checkout refuses to call network while disabled or when environment is production", async () => {
  let calls = 0;
  const fetchImpl = async () => { calls++; return Response.json({id:"chk_test_12345"}); };
  try {
    setTestEnvironment(false);
    await assert.rejects(() => create(payload, {apiKey:"sandbox_only_token_12345678",fetchImpl}), /DISABLED/);
    process.env.ASAAS_ENVIRONMENT = "production";
    process.env.KIVAI_ASAAS_SANDBOX_CHECKOUT = "true";
    await assert.rejects(() => create(payload, {apiKey:"sandbox_only_token_12345678",fetchImpl}), /DISABLED/);
    assert.equal(calls, 0);
  } finally { restore(); }
});

test("sandbox transport calls only sandbox endpoint and returns checkout identifier, not entitlement", async () => {
  try {
    setTestEnvironment(true);
    const calls = [];
    const fetchImpl = async (url, options) => {
      calls.push({url,options});
      return Response.json({id:"chk_test_12345",status:"ACTIVE"});
    };
    const response = await create(payload, {apiKey:"sandbox_only_token_12345678",fetchImpl});
    assert.deepEqual(response,{id:"chk_test_12345",status:"ACTIVE"});
    assert.equal(calls.length,1);
    assert.equal(calls[0].url,"https://api-sandbox.asaas.com/v3/checkouts");
    assert.equal(calls[0].options.method,"POST");
    assert.equal(calls[0].options.headers.access_token,"sandbox_only_token_12345678");
    assert.equal(JSON.parse(calls[0].options.body).externalReference,payload.externalReference);
    assert.equal(Object.hasOwn(response,"access"),false);
  } finally { restore(); }
});

test("sandbox checkout does not retry failed creation", async () => {
  try {
    setTestEnvironment(true);
    let attempts = 0;
    const fetchImpl = async () => { attempts++; return new Response(null, {status:500}); };
    await assert.rejects(() => create(payload,{apiKey:"sandbox_only_token_12345678",fetchImpl}), /HTTP_500/);
    assert.equal(attempts,1);
  } finally { restore(); }
});
