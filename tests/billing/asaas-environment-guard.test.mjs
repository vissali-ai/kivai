import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import { timingSafeEqual } from "node:crypto";

const source = fs.readFileSync(new URL("../../lib/billing/asaas.ts",import.meta.url),"utf8");
const compiled = ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const m={exports:{}};
new Function("require","module","exports",compiled)(name=>{
  if(name==="server-only")return{};
  if(name==="node:crypto")return{timingSafeEqual};
  throw Error("Unexpected module: "+name);
},m,m.exports);
const keys=["VERCEL_ENV","ASAAS_ENVIRONMENT","KIVAI_ASAAS_RECURRING_SYNC","ASAAS_API_KEY","ASAAS_WEBHOOK_TOKEN"];
const old=Object.fromEntries(keys.map(k=>[k,process.env[k]]));
function restore(){for(const k of keys)old[k]===undefined?delete process.env[k]:process.env[k]=old[k];}
function configured(deployment,provider){
  process.env.VERCEL_ENV=deployment;
  process.env.ASAAS_ENVIRONMENT=provider;
  process.env.KIVAI_ASAAS_RECURRING_SYNC="true";
  process.env.ASAAS_API_KEY="placeholder-secure-server-key-not-real";
  process.env.ASAAS_WEBHOOK_TOKEN="placeholder-long-webhook-token-test";
}
test("production sync only allowed on production deploy",()=>{
  try {
    configured("production","production");
    assert.equal(m.exports.isAsaasSyncConfigured(),true);
    assert.equal(m.exports.matchesAsaasWebhookToken(process.env.ASAAS_WEBHOOK_TOKEN),true);
    for(const deployment of ["preview","development"]){
      configured(deployment,"production");
      assert.equal(m.exports.isAsaasSyncConfigured(),false);
      assert.equal(m.exports.matchesAsaasWebhookToken(process.env.ASAAS_WEBHOOK_TOKEN),false);
    }
  }finally{restore();}
});
test("production cannot silently fall back to sandbox",()=>{
  try {
    configured("production","sandbox");
    assert.equal(m.exports.isAsaasSyncConfigured(),false);
    configured("production","typo");
    assert.equal(m.exports.isAsaasSyncConfigured(),false);
    configured("preview","sandbox");
    assert.equal(m.exports.isAsaasSyncConfigured(),true);
    configured("development","sandbox");
    assert.equal(m.exports.isAsaasSyncConfigured(),false);
  }finally{restore();}
});
test("environment mismatch rejects API calls before fetch",async()=>{
  try {
    configured("preview","production");
    const oldFetch=globalThis.fetch;
    globalThis.fetch=()=>{throw Error("fetch must not be called");};
    try {
      await assert.rejects(m.exports.asaasGet("/payments/pay_12345678"),/ASAAS_NOT_CONFIGURED/);
    }finally{globalThis.fetch=oldFetch;}
  }finally{restore();}
});
