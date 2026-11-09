import {test} from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";

const source=fs.readFileSync(new URL("../../app/api/billing/asaas/webhook/route.ts",import.meta.url),"utf8");
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const old=process.env.KIVAI_ASAAS_VERIFIED_AUTO_LINK;
function setup({reference="kivai_asaas_11111111-1111-4111-8111-111111111111",status="ACTIVE",cycle="MONTHLY",value=19.9,promoted=true,existingLink=false}={}){
 const calls=[],applied=[];
 const mods={
 "@/lib/billing/asaas":{
  isAsaasSyncConfigured:()=>true,
  matchesAsaasWebhookToken:x=>x==="secret",
  asaasGet:async route=>{
   calls.push(route);
   if(route.startsWith("/payments/"))return{id:"pay_12345678",status:"CONFIRMED",value:19.9,subscription:"sub_12345678"};
   if(route.startsWith("/subscriptions/"))return{id:"sub_12345678",status,value,cycle,
    billingType:"CREDIT_CARD",customer:"cus_12345678",externalReference:reference};
   throw Error("INVALID_RESOURCE");
  }
 },
 "@/lib/blog/supabase":{supabaseRest:async(path,options={})=>{
  calls.push(path);
  if(path.startsWith("kivai_recurring_webhook_inbox?")&&options.method==="POST")return[{provider_event_id:"evt_unique"}];
  if(path.startsWith("kivai_recurring_webhook_inbox?")&&options.method==="PATCH")return[];
  if(path.startsWith("kivai_recurring_provider_links?"))
    return (existingLink||promoted&&calls.includes("rpc/kivai_promote_asaas_verified_subscription"))
      ? [{provider_subscription_id:"sub_12345678",expected_amount_brl:19.9}]:[];
  if(path==="rpc/kivai_promote_asaas_verified_subscription")return{linked:promoted};
  if(path==="rpc/kivai_apply_asaas_paid_charge"){applied.push(JSON.parse(options.body));return{applied:true};}
  throw Error("UNKNOWN_PATH:"+path);
 }}
 };
 const m={exports:{}};
 new Function("require","module","exports",js)(name=>{assert.ok(name in mods,name);return mods[name]},m,m.exports);
 return{calls,applied,send:()=>m.exports.POST(new Request("https://kivai.com.br/api/billing/asaas/webhook",{
  method:"POST",headers:{"asaas-access-token":"secret"},
  body:JSON.stringify({id:"evt_unique",event:"PAYMENT_CONFIRMED",payment:{id:"pay_12345678",subscription:"sub_12345678"}})
 }))};
}
test("auto-link flag defaults disabled: unmatched payment never grants access",async()=>{
 try {
  delete process.env.KIVAI_ASAAS_VERIFIED_AUTO_LINK;
  const ctx=setup();
  await ctx.send();
  assert.equal(ctx.applied.length,0);
  assert.equal(ctx.calls.some(x=>x.includes("promote_asaas")),false);
 }finally{if(old!==undefined)process.env.KIVAI_ASAAS_VERIFIED_AUTO_LINK=old;}
});
test("verified subscription and pre-existing validated lifecycle allow guarded promotion and paid charge",async()=>{
 try{
  process.env.KIVAI_ASAAS_VERIFIED_AUTO_LINK="true";
  const ctx=setup();
  const r=await ctx.send();
  assert.equal(r.status,200);
  assert.equal(ctx.calls.filter(x=>x==="rpc/kivai_promote_asaas_verified_subscription").length,1);
  assert.equal(ctx.applied.length,1);
  assert.equal(ctx.applied[0].p_payment_id,"pay_12345678");
 }finally{if(old===undefined)delete process.env.KIVAI_ASAAS_VERIFIED_AUTO_LINK;else process.env.KIVAI_ASAAS_VERIFIED_AUTO_LINK=old;}
});
test("bad reference, wrong price and unapproved database promotion prevent activation",async()=>{
 try{
  process.env.KIVAI_ASAAS_VERIFIED_AUTO_LINK="true";
  for(const x of [{reference:null},{cycle:"WEEKLY"},{value:9.99},{promoted:false}]){
   const ctx=setup(x);
   const response=await ctx.send();
   assert.equal(response.status,200);
   assert.equal(ctx.applied.length,0);
  }
 }finally{if(old===undefined)delete process.env.KIVAI_ASAAS_VERIFIED_AUTO_LINK;else process.env.KIVAI_ASAAS_VERIFIED_AUTO_LINK=old;}
});
