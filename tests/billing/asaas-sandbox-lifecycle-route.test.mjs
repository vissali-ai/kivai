import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";

const source=fs.readFileSync(new URL("../../app/api/billing/asaas/sandbox-lifecycle/route.ts",import.meta.url),"utf8");
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const old={};
for(const key of ["VERCEL_ENV","ASAAS_ENVIRONMENT","KIVAI_ASAAS_LIFECYCLE_SYNC","ASAAS_SANDBOX_API_KEY","ASAAS_SANDBOX_WEBHOOK_TOKEN"])old[key]=process.env[key];
const token="webhook_token_test_abcdefghijklmnopqrstuvwxyz_12345";
function env(enabled=true){
 process.env.VERCEL_ENV="preview";
 process.env.ASAAS_ENVIRONMENT="sandbox";
 process.env.KIVAI_ASAAS_LIFECYCLE_SYNC=enabled?"true":"false";
 process.env.ASAAS_SANDBOX_API_KEY="sandbox_key_012345678901234567890";
 process.env.ASAAS_SANDBOX_WEBHOOK_TOKEN=token;
}
function restore(){for(const [k,v] of Object.entries(old)){if(v===undefined)delete process.env[k];else process.env[k]=v;}}
function subject({subscriptionReference=null}={}){
 const calls=[];const mod={exports:{}};
 new Function("require","module","exports",js)(id=>{
   if(id==="server-only")return{};
   if(id==="node:crypto")return requireCrypto;
   if(id==="@/lib/blog/supabase")return{supabaseRest:async(path)=>{calls.push(path);return{recorded:true,linked:true}}};
   throw Error("Unexpected module "+id);
 },mod,mod.exports);
 return{POST:mod.exports.POST,calls};
}
const requireCrypto={timingSafeEqual:(a,b)=>a.equals(b)};
function request(payload,authorization=token){
 return new Request("https://kivai-preview.vercel.app/api/billing/asaas/sandbox-lifecycle",{
   method:"POST",headers:{"content-type":"application/json","asaas-access-token":authorization},body:JSON.stringify(payload)
 });
}
test("lifecycle is disabled in production and never reads or writes",async()=>{
 try {
  env();
  process.env.VERCEL_ENV="production";
  const x=subject();
  const result=await x.POST(request({id:"evt_123456",event:"CHECKOUT_PAID",checkout:{id:"checkout_abcde",status:"PAID"}}));
  assert.equal(result.status,503);
  assert.equal(x.calls.length,0);
 }finally{restore();}
});
test("invalid webhook authentication never writes",async()=>{
 try {
  env();
  const x=subject();
  const r=await x.POST(request({id:"evt_123456",event:"CHECKOUT_PAID",checkout:{id:"checkout_abcde",status:"PAID"}},"incorrect"));
  assert.equal(r.status,401);assert.equal(x.calls.length,0);
 }finally{restore();}
});
test("valid checkout event is audit-only, never activates Pro",async()=>{
 try {
  env();const x=subject();
  const r=await x.POST(request({id:"evt_123456",event:"CHECKOUT_PAID",checkout:{id:"checkout_abcde",status:"PAID"}}));
  assert.equal(r.status,200);
  assert.deepEqual(x.calls,["rpc/kivai_record_asaas_checkout_lifecycle"]);
  assert.equal((await r.json()).message,"Evento registrado.");
 }finally{restore();}
});
