import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

const names=[
  "20261105193000_asaas_recurring_sync.sql",
  "20261109194000_asaas_checkout_intents.sql",
  "20261109203000_asaas_checkout_finalize.sql",
  "20261109213000_asaas_checkout_lifecycle_audit.sql",
  "20261109220000_asaas_verified_subscription_promotion.sql",
];
const migrations=await Promise.all(names.map(name=>readFile(new URL("../../supabase/migrations/"+name,import.meta.url),"utf8")));
const user="11111111-1111-4111-8111-111111111111";
const checkout="c7b1c696-b27b-4d3d-80b9-d1c018e387f8";
const sub="sub_asaa_00001";
const customer="cus_asaa_00001";
async function setup(){
 const db=new PGlite();
 await db.exec(`
  CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
  CREATE SCHEMA auth;
  CREATE TABLE auth.users(id uuid primary key);
  CREATE TYPE public.kivai_plan_code AS ENUM ('free','pro','agency');
  CREATE TABLE public.subscription_plans(code public.kivai_plan_code primary key,active boolean,
    price_monthly_brl numeric,price_annual_brl numeric);
  CREATE TABLE public.subscription_requests(id uuid primary key default gen_random_uuid(),user_id uuid,status text);
  CREATE TABLE public.user_subscriptions(
    id uuid primary key default gen_random_uuid(),user_id uuid references auth.users(id),
    plan_code public.kivai_plan_code,status text,provider text,provider_subscription_id text,
    provider_customer_id text,billing_cycle text,
    current_period_start timestamptz default now(),current_period_end timestamptz,
    cancel_at_period_end boolean default false,grace_until timestamptz,test_access boolean default false,
    created_at timestamptz default now(),updated_at timestamptz default now());
  CREATE TABLE public.user_profiles(user_id uuid primary key references auth.users(id),plan_code public.kivai_plan_code default 'free',lifecycle_stage text,updated_at timestamptz default now());
  CREATE TABLE public.customer_marketing_events(id uuid primary key default gen_random_uuid(),user_id uuid,event_type text,description text,metadata jsonb);
  INSERT INTO auth.users(id) VALUES ('11111111-1111-4111-8111-111111111111');
  INSERT INTO public.user_profiles(user_id) VALUES ('11111111-1111-4111-8111-111111111111');
  INSERT INTO public.subscription_plans VALUES('pro',true,19.90,199),('agency',true,59.90,599);
 `);
 for(const m of migrations)await db.exec(m);
 const intent=(await db.query("select public.kivai_reserve_asaas_checkout($1,'pro','monthly') as data",[user])).rows[0].data;
 await db.query("select public.kivai_claim_asaas_checkout($1,$2)",[intent.id,user]);
 await db.query("select public.kivai_finalize_asaas_checkout($1,$2,$3,$4)",[intent.id,user,intent.external_reference,checkout]);
 return {db,intent};
}
async function promote(db,ref,amount=19.9){
 return (await db.query("select public.kivai_promote_asaas_verified_subscription($1,$2,$3,$4,$5) as value",
 [ref,sub,customer,amount,"MONTHLY"])).rows[0].value;
}
async function prove(db,ref){
 await db.query("select public.kivai_record_asaas_checkout_lifecycle($1,$2,$3)",["evt_checkout_0001",checkout,"CHECKOUT_PAID"]);
 await db.query("select public.kivai_record_asaas_subscription_candidate($1,$2,$3,$4,$5,$6)",
  ["evt_subscription_0001",sub,ref,customer,19.9,"MONTHLY"]);
}
test("unconfirmed checkout and mismatched amounts never produce a link or access",async()=>{
 const {db,intent}=await setup();
 try {
  const denied=await promote(db,intent.external_reference);
  assert.equal(denied.linked,false);
  await prove(db,intent.external_reference);
  const mismatch=await promote(db,intent.external_reference,1.00);
  assert.equal(mismatch.linked,false);
  assert.equal((await db.query("select count(*)::int as n from public.kivai_recurring_provider_links")).rows[0].n,0);
  assert.equal((await db.query("select count(*)::int as n from public.user_subscriptions")).rows[0].n,0);
 }finally{await db.close();}
});
test("verified checkout + subscription creates idempotent link, only confirmed charge grants plan",async()=>{
 const {db,intent}=await setup();
 try {
  await prove(db,intent.external_reference);
  const first=await promote(db,intent.external_reference);
  assert.equal(first.linked,true);
  assert.equal(first.existing,false);
  const repeat=await promote(db,intent.external_reference);
  assert.equal(repeat.linked,true);
  assert.equal(repeat.existing,true);
  assert.equal((await db.query("select count(*)::int as n from public.user_subscriptions")).rows[0].n,0);
  const paid=(await db.query("select public.kivai_apply_asaas_paid_charge($1,$2,$3,$4) as value",
   ["pay_asaa_00001",sub,19.9,"evt_payment_00001"])).rows[0].value;
  assert.equal(paid.applied,true);
  const repeated=(await db.query("select public.kivai_apply_asaas_paid_charge($1,$2,$3,$4) as value",
   ["pay_asaa_00001",sub,19.9,"evt_payment_00001"])).rows[0].value;
  assert.equal(repeated.applied,false);
  const row=(await db.query("select plan_code,status,provider from public.user_subscriptions")).rows[0];
  assert.equal(row.plan_code,"pro");assert.equal(row.status,"active");assert.equal(row.provider,"asaas");
 }finally{await db.close();}
});
test("pre-existing other-provider subscription forbids promotion without disturbing data",async()=>{
 const {db,intent}=await setup();
 try{
  await prove(db,intent.external_reference);
  await db.query("insert into public.user_subscriptions(user_id,plan_code,status,provider,current_period_end) values($1,'pro','active','external_recurring',now()+interval '1 month')",[user]);
  const result=await promote(db,intent.external_reference);
  assert.equal(result.reason,"existing_active_subscription");
  assert.equal((await db.query("select count(*)::int as n from public.kivai_recurring_provider_links")).rows[0].n,0);
  assert.equal((await db.query("select provider from public.user_subscriptions")).rows[0].provider,"external_recurring");
 }finally{await db.close();}
});
test("promotion RPC service-only",async()=>{
 const {db}=await setup();
 try{
 const grants=(await db.query(`select
  has_function_privilege('anon','public.kivai_promote_asaas_verified_subscription(text,text,text,numeric,text)','EXECUTE') as anon,
  has_function_privilege('authenticated','public.kivai_promote_asaas_verified_subscription(text,text,text,numeric,text)','EXECUTE') as auth,
  has_function_privilege('service_role','public.kivai_promote_asaas_verified_subscription(text,text,text,numeric,text)','EXECUTE') as service
 `)).rows[0];
 assert.equal(grants.anon,false);assert.equal(grants.auth,false);assert.equal(grants.service,true);
 }finally{await db.close();}
});
