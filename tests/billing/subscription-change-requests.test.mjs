import {test} from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {PGlite} from "@electric-sql/pglite";
const migration=await readFile(new URL("../../supabase/migrations/20261109224500_subscription_change_requests.sql",import.meta.url),"utf8");
const user="11111111-1111-4111-8111-111111111111";
async function setup(plan="pro"){
 const db=new PGlite();
 await db.exec(`
  CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role;
  CREATE SCHEMA auth;CREATE TABLE auth.users(id uuid primary key);
  CREATE TYPE public.kivai_plan_code AS ENUM('free','pro','agency');
  CREATE TABLE public.user_subscriptions(
    id uuid primary key default gen_random_uuid(),user_id uuid references auth.users(id),
    plan_code public.kivai_plan_code,status text,provider text,
    provider_subscription_id text,billing_cycle text,current_period_end timestamptz,
    updated_at timestamptz default now());
  INSERT INTO auth.users VALUES ('11111111-1111-4111-8111-111111111111');
 `);
 await db.exec(migration);
 await db.query("insert into public.user_subscriptions(user_id,plan_code,status,provider,billing_cycle,current_period_end) values($1,$2,'active','asaas','monthly',now()+interval '1 month')",[user,plan]);
 return db;
}
async function change(db,action,cycle=null){
 return (await db.query("select public.kivai_request_subscription_change($1,$2,$3) as result",[user,action,cycle])).rows[0].result;
}
test("cancellation is a request only and does not change provider or active plan",async()=>{
 const db=await setup();
 try{
  const r=await change(db,"cancel_renewal");
  assert.equal(r.state,"pending_review");
  const original=(await db.query("select plan_code,status,provider from public.user_subscriptions")).rows[0];
  assert.deepEqual(original,{plan_code:"pro",status:"active",provider:"asaas"});
  const request=(await db.query("select action,target_plan,target_cycle from public.kivai_subscription_change_requests")).rows[0];
  assert.equal(request.action,"cancel_renewal");assert.equal(request.target_plan,"free");
  assert.equal(request.target_cycle,null);
  const again=await change(db,"cancel_renewal");
  assert.equal(again.existing,true);assert.equal(again.id,r.id);
 }finally{await db.close();}
});
test("only Pro can request Agency upgrade, only Agency can request downgrade",async()=>{
 const first=await setup("pro");
 try{
  const upgraded=await change(first,"upgrade");
  assert.equal(upgraded.existing,false);
  assert.equal((await first.query("select target_plan from public.kivai_subscription_change_requests")).rows[0].target_plan,"agency");
  assert.equal((await change(first,"downgrade")).existing,true);
 }finally{await first.close();}
 const other=await setup("agency");
 try{
  const downgraded=await change(other,"downgrade");
  assert.equal(downgraded.existing,false);
  assert.equal((await other.query("select target_plan from public.kivai_subscription_change_requests")).rows[0].target_plan,"pro");
 }finally{await other.close();}
});
test("cycle updates require actual change and all writes are service only",async()=>{
 const db=await setup();
 try{
  await assert.rejects(()=>change(db,"change_cycle","monthly"),/Nova periodicidade inválida/);
  const changed=await change(db,"change_cycle","annual");
  assert.equal(changed.existing,false);
  assert.equal((await db.query("select target_cycle from public.kivai_subscription_change_requests")).rows[0].target_cycle,"annual");
  const grants=(await db.query(`select
   has_function_privilege('anon','public.kivai_request_subscription_change(uuid,text,text)','EXECUTE') as anon,
   has_function_privilege('authenticated','public.kivai_request_subscription_change(uuid,text,text)','EXECUTE') as auth,
   has_function_privilege('service_role','public.kivai_request_subscription_change(uuid,text,text)','EXECUTE') as service,
   has_table_privilege('authenticated','public.kivai_subscription_change_requests','INSERT') as user_insert`)).rows[0];
  assert.equal(grants.anon,false);assert.equal(grants.auth,false);
  assert.equal(grants.user_insert,false);assert.equal(grants.service,true);
 }finally{await db.close();}
});
test("expired or free plans cannot request change",async()=>{
 const db=await setup();
 try{
  await db.query("update public.user_subscriptions set current_period_end=now()-interval '1 day'");
  await assert.rejects(()=>change(db,"cancel_renewal"),/Não há assinatura paga vigente/);
  assert.equal((await db.query("select count(*)::int as n from public.kivai_subscription_change_requests")).rows[0].n,0);
 }finally{await db.close();}
});
