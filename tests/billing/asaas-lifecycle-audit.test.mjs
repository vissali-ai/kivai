import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

const migrations = await Promise.all([
  "20261109194000_asaas_checkout_intents.sql",
  "20261109203000_asaas_checkout_finalize.sql",
  "20261109213000_asaas_checkout_lifecycle_audit.sql",
].map(name=>readFile(new URL("../../supabase/migrations/"+name, import.meta.url),"utf8")));

const user="11111111-1111-4111-8111-111111111111";
const checkout="c7b1c696-b27b-4d3d-80b9-d1c018e387f8";
const sub="sub_sandbox_00001";
async function createDb() {
 const db=new PGlite();
 await db.exec(`
  CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
  CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid primary key);
  CREATE TYPE public.kivai_plan_code AS ENUM('free','pro','agency');
  CREATE TABLE public.subscription_plans(code public.kivai_plan_code primary key,active boolean,price_monthly_brl numeric,price_annual_brl numeric);
  CREATE TABLE public.subscription_requests(id uuid primary key default gen_random_uuid(),user_id uuid,status text);
  CREATE TABLE public.user_subscriptions(id uuid primary key default gen_random_uuid(),user_id uuid,status text,current_period_end timestamptz);
  INSERT INTO auth.users VALUES ('11111111-1111-4111-8111-111111111111');
  INSERT INTO public.subscription_plans VALUES('pro',true,19.90,199),('agency',true,59.90,599);
 `);
 for(const migration of migrations) await db.exec(migration);
 const reservation=(await db.query("select public.kivai_reserve_asaas_checkout($1,'pro','monthly') as data",[user])).rows[0].data;
 await db.query("select public.kivai_claim_asaas_checkout($1,$2)",[reservation.id,user]);
 await db.query("select public.kivai_finalize_asaas_checkout($1,$2,$3,$4)",[reservation.id,user,reservation.external_reference,checkout]);
 return {db,ref:reservation.external_reference};
}
async function checkoutEvent(db,event,type,id=checkout){
 return (await db.query("select public.kivai_record_asaas_checkout_lifecycle($1,$2,$3) as result",[event,id,type])).rows[0].result;
}
async function subscriptionEvent(db,event,ref,amount=19.9,cycle="MONTHLY"){
 return (await db.query("select public.kivai_record_asaas_subscription_candidate($1,$2,$3,$4,$5,$6) as result",[event,sub,ref,"cus_sandbox_0001",amount,cycle])).rows[0].result;
}
test("checkout paid event is deduplicated, does not activate subscriber, and records audit",async()=>{
 const {db}=await createDb();
 try {
  const first=await checkoutEvent(db,"evt_paid_00001","CHECKOUT_PAID");
  const repeated=await checkoutEvent(db,"evt_paid_00001","CHECKOUT_PAID");
  assert.equal(first.linked,true);
  assert.equal(repeated.reason,"duplicate");
  const count=(await db.query("select count(*)::int as n from public.kivai_asaas_lifecycle_events")).rows[0].n;
  assert.equal(count,1);
  const row=(await db.query("select checkout_paid_at from public.kivai_asaas_checkout_intents")).rows[0];
  assert.ok(row.checkout_paid_at);
  assert.equal((await db.query("select count(*)::int as n from public.user_subscriptions")).rows[0].n,0);
 }finally{await db.close();}
});
test("verified subscription with matching external ref, cycle and amount links only intent, not paid access",async()=>{
 const {db,ref}=await createDb();
 try{
  const linked=await subscriptionEvent(db,"evt_sub_00001",ref);
  assert.equal(linked.linked,true);
  const row=(await db.query("select provider_subscription_id,subscription_verified_at from public.kivai_asaas_checkout_intents")).rows[0];
  assert.equal(row.provider_subscription_id,sub);
  assert.ok(row.subscription_verified_at);
  assert.equal((await db.query("select count(*)::int as n from public.user_subscriptions")).rows[0].n,0);
 }finally{await db.close();}
});
test("reference or price mismatch quarantines event, never binds subscription",async()=>{
 const {db,ref}=await createDb();
 try{
  const r=await subscriptionEvent(db,"evt_sub_00002",ref,1);
  assert.equal(r.linked,false);
  assert.equal((await db.query("select provider_subscription_id from public.kivai_asaas_checkout_intents")).rows[0].provider_subscription_id,null);
  assert.equal((await db.query("select processing_status from public.kivai_asaas_lifecycle_events where provider_event_id='evt_sub_00002'")).rows[0].processing_status,"manual_review");
  const s=await subscriptionEvent(db,"evt_sub_00003","kivai_asaas_00000000-0000-4000-8000-000000000000");
  assert.equal(s.linked,false);
 }finally{await db.close();}
});
test("cancel event never revokes a paid checkout and unmatched subscriptions remain auditable",async()=>{
 const {db}=await createDb();
 try{
  await checkoutEvent(db,"evt_paid_00011","CHECKOUT_PAID");
  await checkoutEvent(db,"evt_cancel_00012","CHECKOUT_CANCELED");
  assert.equal((await db.query("select state from public.kivai_asaas_checkout_intents")).rows[0].state,"created");
  await db.query("select public.kivai_record_asaas_unmatched_subscription($1,$2)",["evt_sub_00099","sub_unknown_00099"]);
  const result=(await db.query("select processing_status from public.kivai_asaas_lifecycle_events where provider_event_id='evt_sub_00099'")).rows[0];
  assert.equal(result.processing_status,"manual_review");
 }finally{await db.close();}
});
test("lifecycle functions and table are inaccessible to public and authenticated users",async()=>{
 const {db}=await createDb();
 try{
  const row=(await db.query(`select
    has_function_privilege('anon','public.kivai_record_asaas_checkout_lifecycle(text,text,text)','EXECUTE') as anon_checkout,
    has_function_privilege('authenticated','public.kivai_record_asaas_subscription_candidate(text,text,text,text,numeric,text)','EXECUTE') as auth_subscription,
    has_function_privilege('service_role','public.kivai_record_asaas_checkout_lifecycle(text,text,text)','EXECUTE') as service_checkout,
    has_table_privilege('authenticated','public.kivai_asaas_lifecycle_events','SELECT') as auth_read
  `)).rows[0];
  assert.equal(row.anon_checkout,false);
  assert.equal(row.auth_subscription,false);
  assert.equal(row.service_checkout,true);
  assert.equal(row.auth_read,false);
 }finally{await db.close();}
});
