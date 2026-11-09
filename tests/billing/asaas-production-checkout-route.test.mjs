import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";

const source = fs.readFileSync(new URL("../../app/api/billing/asaas/production-checkout/route.ts", import.meta.url), "utf8");
const js = ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const user = "11111111-1111-4111-8111-111111111111";
const id = "22222222-2222-4222-8222-222222222222";
const externalReference = "kivai_asaas_" + id;
const keys = ["VERCEL_ENV","ASAAS_ENVIRONMENT","KIVAI_ASAAS_PRODUCTION_CHECKOUT",
              "KIVAI_ASAAS_PRODUCTION_ROUTE","ASAAS_API_KEY",
              "KIVAI_ASAAS_RECURRING_SYNC","KIVAI_ASAAS_PRODUCTION_LIFECYCLE","ASAAS_WEBHOOK_TOKEN"];
const original = Object.fromEntries(keys.map(k=>[k,process.env[k]]));

function env(enabled=true) {
  process.env.VERCEL_ENV="production";
  process.env.ASAAS_ENVIRONMENT="production";
  process.env.KIVAI_ASAAS_PRODUCTION_CHECKOUT="true";
  process.env.KIVAI_ASAAS_PRODUCTION_ROUTE=enabled?"true":"false";
  process.env.KIVAI_ASAAS_RECURRING_SYNC="true";
  process.env.KIVAI_ASAAS_PRODUCTION_LIFECYCLE="true";
  process.env.ASAAS_WEBHOOK_TOKEN="placeholder-long-webhook-token-for-tests";
  process.env.ASAAS_API_KEY="placeholder-key-for-testing-only";
}
function restore(){for(const key of keys) original[key]===undefined?delete process.env[key]:process.env[key]=original[key];}
function setup({auth=true,existing=false,timeout=false,finalizeMismatch=false}={}) {
  const calls = [];
  const mocks = {
    "@/lib/auth/authenticated-billing-user":{authenticateBillingUser:async()=>{
      calls.push("auth");if(!auth)throw Error("unauthorized");return{id:user};
    }},
    "@/lib/blog/supabase":{supabaseRest:async(path,options)=>{
      calls.push(path);
      const args=JSON.parse(options.body);
      if(path==="rpc/kivai_reserve_asaas_checkout"){
        assert.equal(args.p_user_id,user);
        assert.equal(args.p_plan_code,"pro");
        return{id,external_reference:externalReference,existing,state:"reserved"};
      }
      if(path==="rpc/kivai_claim_asaas_checkout")return{
        id,external_reference:externalReference,plan_code:"pro",billing_cycle:"monthly",expected_amount_brl:19.9
      };
      if(path==="rpc/kivai_finalize_asaas_checkout")return{
        id,provider_checkout_id:finalizeMismatch?"bad":"chk_12345678",state:"created"
      };
      throw Error("unknown rpc");
    }},
    "@/lib/billing/asaas-first-due-date":{nextAsaasFirstDueDate:()=> "2026-11-09 15:05:00"},
    "@/lib/billing/asaas-checkout":{buildAsaasRecurringCheckout:input=>{
      calls.push("payload");assert.equal(input.baseUrl,"https://kivai.com.br");
      assert.equal(input.amountBrl,19.9);assert.equal(input.externalReference,externalReference);
      assert.equal(input.nextDueDate,"2026-11-09 15:05:00");
      return {externalReference:input.externalReference};
    }},
    "@/lib/billing/asaas-production-checkout-provider":{
      productionCheckoutConfigured:()=>process.env.VERCEL_ENV==="production" &&
        process.env.ASAAS_ENVIRONMENT==="production" &&
        process.env.KIVAI_ASAAS_PRODUCTION_CHECKOUT==="true",
      createAsaasProductionCheckout:async()=>{
        calls.push("provider:POST");
        if(timeout)throw Error("ambiguous provider timeout");
        return{id:"chk_12345678"};
      }
    }
  };
  const mod={exports:{}};
  new Function("require","module","exports",js)(name=>{
    assert.ok(Object.hasOwn(mocks,name),name);
    return mocks[name];
  },mod,mod.exports);
  const send=(body={plan:"pro",billing:"monthly"})=>mod.exports.POST(
    new Request("https://kivai.com.br/api/billing/asaas/production-checkout",{
      method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)
    }));
  return{send,calls};
}
test("disabled route never even authenticates or contacts provider",async()=>{
  try{
    env(false);let x=setup();assert.equal((await x.send()).status,503);assert.deepEqual(x.calls,[]);
    env(true);process.env.VERCEL_ENV="preview";x=setup();
    assert.equal((await x.send()).status,503);assert.deepEqual(x.calls,[]);
  }finally{restore();}
});
test("unconfigured lifecycle or financial webhook cannot start production checkout",async()=>{
  try {
    for (const missing of ["KIVAI_ASAAS_RECURRING_SYNC","KIVAI_ASAAS_PRODUCTION_LIFECYCLE","ASAAS_WEBHOOK_TOKEN"]) {
      env();delete process.env[missing];
      const x=setup();
      assert.equal((await x.send()).status,503);
      assert.deepEqual(x.calls,[]);
    }
  } finally {restore();}
});
test("unauthorized user cannot reserve checkout",async()=>{
  try{env();const x=setup({auth:false});assert.equal((await x.send()).status,401);
      assert.deepEqual(x.calls,["auth"]);}finally{restore();}
});
test("only server-side price and authenticated identity reach reservation",async()=>{
  try{
    env();const x=setup();
    const response=await x.send({plan:"pro",billing:"monthly",amountBrl:0.01,userId:"other"});
    assert.equal(response.status,200);
    assert.deepEqual(x.calls,["auth","rpc/kivai_reserve_asaas_checkout",
      "rpc/kivai_claim_asaas_checkout","payload","provider:POST","rpc/kivai_finalize_asaas_checkout"]);
    const data=await response.json();
    assert.equal(data.status,"awaiting_payment");
    assert.equal(Object.hasOwn(data,"paid"),false);
    assert.equal(Object.hasOwn(data,"access"),false);
  }finally{restore();}
});
test("duplicate pending reservation stops before claim or payment",async()=>{
  try{env();const x=setup({existing:true});assert.equal((await x.send()).status,409);
      assert.deepEqual(x.calls,["auth","rpc/kivai_reserve_asaas_checkout"]);}finally{restore();}
});
test("timeout and finalization mismatch never retry provider",async()=>{
  try{
    env();
    for(const options of [{timeout:true},{finalizeMismatch:true}]){
      const x=setup(options);assert.equal((await x.send()).status,503);
      assert.equal(x.calls.filter(c=>c==="provider:POST").length,1);
    }
  }finally{restore();}
});
test("reject invalid plan without starting reservation",async()=>{
  try{env();const x=setup();assert.equal((await x.send({plan:"agency-admin",billing:"monthly"})).status,400);
    assert.deepEqual(x.calls,["auth"]);}finally{restore();}
});
