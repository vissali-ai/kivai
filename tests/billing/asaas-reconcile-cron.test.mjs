import {test} from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import {timingSafeEqual} from "node:crypto";

const source=fs.readFileSync(new URL("../../app/api/cron/asaas-reconcile/route.ts",import.meta.url),"utf8");
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const keys=["VERCEL_ENV","ASAAS_ENVIRONMENT","KIVAI_ASAAS_RECURRING_SYNC",
  "KIVAI_ASAAS_PRODUCTION_LIFECYCLE","KIVAI_ASAAS_VERIFIED_AUTO_LINK",
  "KIVAI_ASAAS_RECONCILIATION","CRON_SECRET","ASAAS_WEBHOOK_TOKEN"];
const previous=Object.fromEntries(keys.map(k=>[k,process.env[k]]));
function enable(){
  process.env.VERCEL_ENV="production";
  process.env.ASAAS_ENVIRONMENT="production";
  process.env.KIVAI_ASAAS_RECURRING_SYNC="true";
  process.env.KIVAI_ASAAS_PRODUCTION_LIFECYCLE="true";
  process.env.KIVAI_ASAAS_VERIFIED_AUTO_LINK="true";
  process.env.KIVAI_ASAAS_RECONCILIATION="true";
  process.env.CRON_SECRET="placeholder-long-cron-secret-value-only";
  process.env.ASAAS_WEBHOOK_TOKEN="placeholder-long-webhook-token-only";
}
function restore(){for(const k of keys){previous[k]===undefined?delete process.env[k]:process.env[k]=previous[k];}}
const reference="kivai_asaas_11111111-1111-4111-8111-111111111111";
function setup({status="CONFIRMED",value=19.9,linked=true,paid=true,entries=1}={}){
  const calls=[],applied=[];
  const modules={
    "server-only":{},
    "node:crypto":{timingSafeEqual},
    "@/lib/billing/asaas":{
      isAsaasSyncConfigured:()=>true,
      asaasGet:async path=>{
        calls.push(path);
        if(path==="/payments/pay_12345678")return{
          id:"pay_12345678",subscription:"sub_12345678",value,status,billingType:"CREDIT_CARD"
        };
        if(path==="/subscriptions/sub_12345678")return{
          id:"sub_12345678",status:"ACTIVE",billingType:"CREDIT_CARD",
          customer:"cus_12345678",externalReference:reference,value:19.9,cycle:"MONTHLY"
        };
        throw Error("Unexpected provider path "+path);
      }
    },
    "@/lib/blog/supabase":{
      supabaseRest:async(path,opts={})=>{
        calls.push(path);
        if(path.startsWith("kivai_recurring_webhook_inbox?")&& !opts.method)
          return entries?[{provider_event_id:"evt_12345678",event_type:"PAYMENT_CONFIRMED",
            provider_payment_id:"pay_12345678",provider_subscription_id:"sub_12345678"}]:[];
        if(path==="rpc/kivai_promote_asaas_verified_subscription")return{linked};
        if(path.startsWith("kivai_recurring_provider_links?"))return[{
          provider_subscription_id:"sub_12345678",expected_amount_brl:19.9,state:"active"
        }];
        if(path==="rpc/kivai_apply_asaas_paid_charge"){
          applied.push(JSON.parse(opts.body));return{applied:paid};
        }
        if(path.startsWith("kivai_recurring_webhook_inbox?")&&opts.method==="PATCH")return[];
        throw Error("Unexpected DB path "+path);
      }
    }
  };
  const mod={exports:{}};
  new Function("require","module","exports",js)(key=>{
    assert.ok(Object.hasOwn(modules,key),key);
    return modules[key];
  },mod,mod.exports);
  const send=(auth=true)=>mod.exports.GET(new Request("https://kivai.com.br/api/cron/asaas-reconcile",{
    headers:{"Authorization": auth?"Bearer "+process.env.CRON_SECRET:"wrong"}
  }));
  return{send,calls,applied};
}
test("Cron stays disabled by default and never queries database",async()=>{
  try{
    enable();delete process.env.KIVAI_ASAAS_RECONCILIATION;
    const x=setup();assert.deepEqual(await (await x.send()).json(),{enabled:false,checked:0});assert.equal(x.calls.length,0);
    enable();process.env.VERCEL_ENV="preview";
    assert.deepEqual(await (await x.send()).json(),{enabled:false,checked:0});assert.equal(x.calls.length,0);
  }finally{restore();}
});
test("Cron requires bearer auth and cannot process unauthenticated requests",async()=>{
  try{
    enable();const x=setup();assert.equal((await x.send(false)).status,401);
    assert.deepEqual(x.calls,[]);
  }finally{restore();}
});
test("Verified manual review receives a single idempotent period",async()=>{
  try{
    enable();const x=setup();const r=await x.send();
    assert.equal(r.status,200);assert.deepEqual(await r.json(),{checked:1,applied:1,duplicate:0,unresolved:0});
    assert.equal(x.applied.length,1);
    assert.equal(x.applied[0].p_payment_id,"pay_12345678");
    assert.equal(x.calls.some(s=>s==="rpc/kivai_promote_asaas_verified_subscription"),true);
    assert.equal(x.calls.some(s=>s==="rpc/kivai_apply_asaas_paid_charge"),true);
  }finally{restore();}
});
test("Unpaid, wrong amount and missing lifecycle never grant access",async()=>{
  try{
    enable();
    for(const opts of [{status:"PENDING"},{value:0.01},{linked:false}]){
      const x=setup(opts);const r=await x.send();assert.equal(r.status,200);
      assert.equal((await r.json()).unresolved,1);
      assert.equal(x.applied.length,0);
    }
  }finally{restore();}
});
test("Duplicate confirmed charge is never applied twice",async()=>{
  try{
    enable();const x=setup({paid:false});const r=await x.send();
    assert.deepEqual(await r.json(),{checked:1,applied:0,duplicate:1,unresolved:0});
  }finally{restore();}
});
test("Empty manual review queue never calls Asaas",async()=>{
  try{
    enable();const x=setup({entries:0});
    assert.deepEqual(await (await x.send()).json(),{checked:0,applied:0,duplicate:0,unresolved:0});
    assert.equal(x.calls.some(v=>v.startsWith("/payments/")),false);
  }finally{restore();}
});
