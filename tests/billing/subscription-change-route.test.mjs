import {test} from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
const src=fs.readFileSync(new URL("../../app/api/account/subscription-change/route.ts",import.meta.url),"utf8");
const js=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
function load(auth=true){
 const calls=[];
 const mocks={
  "@/lib/auth/authenticated-billing-user":{authenticateBillingUser:async()=>{
   if(!auth)throw Error("UNAUTHORIZED");
   return{id:"11111111-1111-4111-8111-111111111111"};
  }},
  "@/lib/blog/supabase":{supabaseRest:async(path,opts)=>{
   calls.push({path,args:JSON.parse(opts.body)});
   return{id:"22222222-2222-4222-8222-222222222222",state:"pending_review",action:JSON.parse(opts.body).p_action,existing:false};
  }},
 };
 const mod={exports:{}};
 new Function("require","module","exports",js)(key=>{assert.ok(key in mocks,key);return mocks[key]},mod,mod.exports);
 return {calls,send:(body)=>mod.exports.POST(new Request("https://kivai.com.br/api/account/subscription-change",{
  method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)
 }))};
}
test("authentication is required before any persistence",async()=>{
 const x=load(false);
 assert.equal((await x.send({action:"cancel_renewal"})).status,401);
 assert.equal(x.calls.length,0);
});
test("server-authenticated userId is used; caller cannot forge subscription or user ID",async()=>{
 const x=load();
 const response=await x.send({action:"cancel_renewal",userId:"attacker",subscriptionId:"attacker"});
 assert.equal(response.status,202);
 assert.deepEqual(x.calls,[{path:"rpc/kivai_request_subscription_change",args:{
  p_user_id:"11111111-1111-4111-8111-111111111111",
  p_action:"cancel_renewal",p_target_cycle:null
 }}]);
 const result=await response.json();
 assert.match(result.message,/NÃO foi alterada/);
 assert.match(response.headers.get("Cache-Control"),/no-store/);
});
test("bad action, unrequested cycle, and invalid cycle never write",async()=>{
 const x=load();
 for(const payload of [
  {action:"invalid"},
  {action:"cancel_renewal",targetCycle:"annual"},
  {action:"change_cycle",targetCycle:"weekly"},
  {action:"change_cycle"},
 ]) assert.equal((await x.send(payload)).status,400);
 assert.equal(x.calls.length,0);
});
