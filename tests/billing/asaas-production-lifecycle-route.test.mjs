import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";

const src = fs.readFileSync(new URL("../../app/api/billing/asaas/production-lifecycle/route.ts", import.meta.url), "utf8");
const js = ts.transpileModule(src, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText;
const keys = ["VERCEL_ENV","ASAAS_ENVIRONMENT","KIVAI_ASAAS_PRODUCTION_LIFECYCLE",
  "KIVAI_ASAAS_RECURRING_SYNC","ASAAS_API_KEY","ASAAS_WEBHOOK_TOKEN"];
const original = Object.fromEntries(keys.map(k=>[k,process.env[k]]));
function restore() { for (const k of keys) original[k] === undefined ? delete process.env[k] : process.env[k]=original[k]; }
function settings() {
  process.env.VERCEL_ENV = "production";
  process.env.ASAAS_ENVIRONMENT = "production";
  process.env.KIVAI_ASAAS_PRODUCTION_LIFECYCLE = "true";
  process.env.KIVAI_ASAAS_RECURRING_SYNC = "true";
  process.env.ASAAS_API_KEY = "placeholder-production-key-for-testing";
  process.env.ASAAS_WEBHOOK_TOKEN = "placeholder-long-webhook-token-for-testing";
}
const goodSubscription = {
  id:"sub_12345678", status:"ACTIVE", customer:"cus_12345678",
  billingType:"CREDIT_CARD", value:19.9, cycle:"MONTHLY",
  externalReference:"kivai_asaas_11111111-1111-4111-8111-111111111111"
};
function setup(verified=goodSubscription) {
  const calls = [];
  const modules = {
    "server-only": {},
    "node:crypto": {timingSafeEqual:(a,b)=>a.equals(b)},
    "@/lib/billing/asaas": {asaasGet:async(path)=>{calls.push(["provider",path]);return verified;}},
    "@/lib/blog/supabase": {supabaseRest:async(path,options)=>{calls.push(["db",path,options]);return{linked:true};}}
  };
  const out={exports:{}};
  new Function("require","module","exports",js)(name=>{
    assert.ok(Object.hasOwn(modules,name), name);
    return modules[name];
  },out,out.exports);
  async function send(event="SUBSCRIPTION_CREATED",token=process.env.ASAAS_WEBHOOK_TOKEN) {
    return out.exports.POST(new Request("https://kivai.com.br/api/billing/asaas/production-lifecycle",{
      method:"POST",headers:{"asaas-access-token":token??""},
      body:JSON.stringify({id:"evt_12345678",event,
        subscription:{id:"sub_12345678"},checkout:{id:"chk_12345678",status:"PAID"}})
    }));
  }
  return {send,calls};
}
test("disabled by default and on preview; never reaches API",async()=>{
  try {
    settings();delete process.env.KIVAI_ASAAS_PRODUCTION_LIFECYCLE;
    const s=setup(); assert.equal((await s.send()).status,503); assert.equal(s.calls.length,0);
    settings();process.env.VERCEL_ENV="preview";
    assert.equal((await s.send()).status,503);assert.equal(s.calls.length,0);
  } finally {restore();}
});
test("reject unauthorized tokens before any calls",async()=>{
  try {settings();const s=setup();assert.equal((await s.send("SUBSCRIPTION_CREATED","wrong")).status,401);assert.equal(s.calls.length,0);}finally{restore();}
});
test("never promotes CHECKOUT_PAID from webhook payload",async()=>{
  try {settings();const s=setup();assert.equal((await s.send("CHECKOUT_PAID")).status,200);assert.equal(s.calls.length,0);}finally{restore();}
});
test("verified subscription only records candidate, not paid charge or entitlement",async()=>{
  try {
    settings();const s=setup();assert.equal((await s.send()).status,200);
    assert.deepEqual(s.calls.map(c=>c[1]),["/subscriptions/sub_12345678","rpc/kivai_record_asaas_subscription_candidate"]);
  }finally{restore();}
});
test("missing reference records unmatched; invalid state blocks database write",async()=>{
  try {
    settings();const a=setup({...goodSubscription,externalReference:null});
    assert.equal((await a.send()).status,200);
    assert.equal(a.calls[1][1],"rpc/kivai_record_asaas_unmatched_subscription");
    const b=setup({...goodSubscription,status:"INACTIVE"});
    assert.equal((await b.send()).status,200);
    assert.equal(b.calls.length,1);
  }finally{restore();}
});
