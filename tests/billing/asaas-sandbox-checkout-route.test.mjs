import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";

const source = fs.readFileSync(new URL("../../app/api/billing/asaas/sandbox-checkout/route.ts", import.meta.url),"utf8");
const js = ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const user="11111111-1111-4111-8111-111111111111";
const id="22222222-2222-4222-8222-222222222222";
const ref="kivai_asaas_22222222-2222-4222-8222-222222222222";
const old={VERCEL_ENV:process.env.VERCEL_ENV,ASAAS_ENVIRONMENT:process.env.ASAAS_ENVIRONMENT,
 KIVAI_ASAAS_SANDBOX_CHECKOUT:process.env.KIVAI_ASAAS_SANDBOX_CHECKOUT,
 ASAAS_SANDBOX_API_KEY:process.env.ASAAS_SANDBOX_API_KEY,VERCEL_URL:process.env.VERCEL_URL};
function environment(enabled=true) {
 process.env.VERCEL_ENV="preview";
 process.env.ASAAS_ENVIRONMENT="sandbox";
 process.env.KIVAI_ASAAS_SANDBOX_CHECKOUT=enabled?"true":"false";
 process.env.ASAAS_SANDBOX_API_KEY="sandbox_test_token_1234567890123";
 process.env.VERCEL_URL="kivai-test-kivai.vercel.app";
}
function restore(){for(const [k,v] of Object.entries(old)){if(v===undefined) delete process.env[k];else process.env[k]=v;}}
function route({auth=true,existing=false,failProvider=false}={}) {
 const calls=[];
 const mocks={
 "@/lib/auth/authenticated-billing-user":{authenticateBillingUser:async()=>{
   if(!auth)throw Error("UNAUTHORIZED"); return{id:user};
 }},
 "@/lib/blog/supabase":{supabaseRest:async(path,opts)=>{
   calls.push(path);
   const body=JSON.parse(opts.body);
   if(path==="rpc/kivai_reserve_asaas_checkout"){
     assert.equal(body.p_user_id,user);
     return{id,external_reference:ref,existing,state:"reserved"};
   }
   if(path==="rpc/kivai_claim_asaas_checkout")return{id,external_reference:ref,plan_code:"pro",billing_cycle:"monthly",expected_amount_brl:19.9};
   if(path==="rpc/kivai_finalize_asaas_checkout"){
     assert.equal(body.p_provider_checkout_id,"c7b1c696-b27b-4d3d-80b9-d1c018e387f8");
     return{id,state:"created",provider_checkout_id:body.p_provider_checkout_id};
   }
   throw Error("UNKNOWN_RPC");
 }},
 "@/lib/billing/asaas-checkout":{buildAsaasRecurringCheckout:payload=>{
   assert.equal(payload.amountBrl,19.9);
   assert.equal(payload.baseUrl,"https://kivai-test-kivai.vercel.app");
   return{externalReference:payload.externalReference};
 }},
 "@/lib/billing/asaas-checkout-provider":{createAsaasSandboxCheckout:async()=>{
   calls.push("provider:POST");
   if(failProvider) throw Error("provider timeout");
   return{id:"c7b1c696-b27b-4d3d-80b9-d1c018e387f8"};
 }},
 };
 const mod={exports:{}};
 new Function("require","module","exports",js)(key=>{assert.ok(key in mocks,key);return mocks[key]},mod,mod.exports);
 return{POST:mod.exports.POST,calls};
}
test("never accesses provider or database when checkout flag is disabled or on production",async()=>{
 try{
  environment(false);
  let x=route();
  assert.equal((await x.POST(new Request("https://kivai.com.br",{method:"POST"}))).status,503);
  assert.equal(x.calls.length,0);
  environment(true);
  process.env.VERCEL_ENV="production";
  x=route();
  assert.equal((await x.POST(new Request("https://kivai.com.br",{method:"POST"}))).status,503);
  assert.equal(x.calls.length,0);
 }finally{restore();}
});
test("unauthorized checkout cannot reserve or charge",async()=>{
 try{
  environment();
  const x=route({auth:false});
  const response=await x.POST(new Request("https://kivai.com.br",{method:"POST"}));
  assert.equal(response.status,401);
  assert.equal(x.calls.length,0);
 }finally{restore();}
});
test("only server-side amount is used and checkout is persisted before URL is disclosed",async()=>{
 try{
  environment();
  const x=route();
  const response=await x.POST(new Request("https://kivai.com.br",{method:"POST",headers:{"content-type":"application/json"},
    body:JSON.stringify({plan:"pro",billing:"monthly",amountBrl:0.01,userId:"attacker"})}));
  assert.equal(response.status,200);
  assert.deepEqual(x.calls,[
   "rpc/kivai_reserve_asaas_checkout",
   "rpc/kivai_claim_asaas_checkout",
   "provider:POST",
   "rpc/kivai_finalize_asaas_checkout"
  ]);
  const result=await response.json();
  assert.match(result.checkoutUrl,/^https:\/\/asaas\.com\/checkoutSession\/show\?id=/);
  assert.equal(result.status,"awaiting_payment");
  assert.equal(Object.hasOwn(result,"paid"),false);
  assert.equal(Object.hasOwn(result,"access"),false);
 }finally{restore();}
});
test("pre-existing intent and provider error never create a second checkout",async()=>{
 try{
  environment();
  let x=route({existing:true});
  let response=await x.POST(new Request("https://kivai.com.br",{method:"POST",body:JSON.stringify({plan:"pro",billing:"monthly"})}));
  assert.equal(response.status,409);
  assert.deepEqual(x.calls,["rpc/kivai_reserve_asaas_checkout"]);
  x=route({failProvider:true});
  response=await x.POST(new Request("https://kivai.com.br",{method:"POST",body:JSON.stringify({plan:"pro",billing:"monthly"})}));
  assert.equal(response.status,503);
  assert.equal(x.calls.filter(k=>k==="provider:POST").length,1);
 }finally{restore();}
});
