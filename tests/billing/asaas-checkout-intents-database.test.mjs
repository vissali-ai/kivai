import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

const migration = await readFile(new URL("../../supabase/migrations/20261109194000_asaas_checkout_intents.sql", import.meta.url), "utf8");
const user = "11111111-1111-4111-8111-111111111111";

async function dbSetup() {
 const db = new PGlite();
 await db.exec(`
 CREATE ROLE anon;
 CREATE ROLE authenticated;
 CREATE ROLE service_role;
 CREATE SCHEMA auth;
 CREATE TABLE auth.users(id uuid primary key);
 CREATE TYPE public.kivai_plan_code AS ENUM ('free','pro','agency');
 CREATE TABLE public.subscription_plans(
  code public.kivai_plan_code primary key, active boolean not null,
  price_monthly_brl numeric(10,2), price_annual_brl numeric(10,2)
 );
 CREATE TABLE public.user_subscriptions(
  id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id),
  status text, current_period_end timestamptz
 );
 CREATE TABLE public.subscription_requests(
  id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id), status text
 );
 INSERT INTO auth.users(id) VALUES ('11111111-1111-4111-8111-111111111111');
 INSERT INTO public.subscription_plans(code,active,price_monthly_brl,price_annual_brl)
 VALUES ('pro',true,19.90,199.00),('agency',true,59.90,599.00);
 `);
 await db.exec(migration);
 return db;
}
async function reserve(db, plan="pro",cycle="monthly") {
 return (await db.query("select public.kivai_reserve_asaas_checkout($1,$2,$3) as value", [user,plan,cycle])).rows[0].value;
}
async function claim(db,id) {
 return (await db.query("select public.kivai_claim_asaas_checkout($1,$2) as value",[id,user])).rows[0].value;
}
test("checkout reservation is unique per user and gets the current price from database",async()=>{
 const db=await dbSetup();
 try {
  const first=await reserve(db);
  assert.equal(first.existing,false);
  const second=await reserve(db,"agency","annual");
  assert.equal(second.existing,true);
  assert.equal(first.id,second.id);
  const row=(await db.query("select plan_code,billing_cycle,expected_amount_brl,state,provider_checkout_id from public.kivai_asaas_checkout_intents")).rows[0];
  assert.equal(row.plan_code,"pro");
  assert.equal(row.billing_cycle,"monthly");
  assert.equal(Number(row.expected_amount_brl),19.90);
  assert.equal(row.state,"reserved");
  assert.equal(row.provider_checkout_id,null);
  assert.equal((await db.query("select count(*)::int as count from public.kivai_asaas_checkout_intents")).rows[0].count,1);
 }finally {await db.close();}
});
test("claim is one-time; retry after ambiguous provider status never creates second checkout",async()=>{
 const db=await dbSetup();
 try{
  const reservation=await reserve(db);
  const claimed=await claim(db,reservation.id);
  assert.equal(claimed.external_reference,reservation.external_reference);
  assert.equal(Number(claimed.expected_amount_brl),19.9);
  await assert.rejects(()=>claim(db,reservation.id),/Reserva não disponível/);
  const again=await reserve(db);
  assert.equal(again.id,reservation.id);
  assert.equal(again.state,"creating");
  assert.equal((await db.query("select count(*)::int as count from public.kivai_asaas_checkout_intents")).rows[0].count,1);
 }finally {await db.close();}
});
test("active plan and pending legacy InfinitePay order block a new recurring checkout",async()=>{
 const db=await dbSetup();
 try{
  await db.query("insert into public.user_subscriptions(user_id,status,current_period_end) values ($1,'active',now()+interval '20 days')",[user]);
  await assert.rejects(()=>reserve(db),/Assinatura ativa/);
  await db.query("delete from public.user_subscriptions");
  await db.query("insert into public.subscription_requests(user_id,status) values ($1,'awaiting_payment')",[user]);
  await assert.rejects(()=>reserve(db),/Solicitação de pagamento ainda pendente/);
  assert.equal((await db.query("select count(*)::int as count from public.kivai_asaas_checkout_intents")).rows[0].count,0);
 }finally{await db.close();}
});
test("only unused expired reservations can be replaced, not creating or created checkouts",async()=>{
 const db=await dbSetup();
 try{
  const first=await reserve(db);
  await db.query("update public.kivai_asaas_checkout_intents set expires_at=now()-interval '1 minute' where id=$1",[first.id]);
  const second=await reserve(db);
  assert.notEqual(first.id,second.id);
  assert.equal((await db.query("select state from public.kivai_asaas_checkout_intents where id=$1",[first.id])).rows[0].state,"expired");
  await claim(db,second.id);
  await db.query("update public.kivai_asaas_checkout_intents set expires_at=now()-interval '1 day' where id=$1",[second.id]);
  const third=await reserve(db);
  assert.equal(third.id,second.id);
  assert.equal(third.state,"creating");
 }finally{await db.close();}
});
test("RLS and service-only RPCs block user-initiated creation",async()=>{
 const db=await dbSetup();
 try{
  const r=(await db.query("select relrowsecurity from pg_class where oid='public.kivai_asaas_checkout_intents'::regclass")).rows[0];
  assert.equal(r.relrowsecurity,true);
  const grants=(await db.query(`select
   has_function_privilege('anon','public.kivai_reserve_asaas_checkout(uuid,text,text)','EXECUTE') as anon_reserve,
   has_function_privilege('authenticated','public.kivai_claim_asaas_checkout(uuid,uuid)','EXECUTE') as auth_claim,
   has_function_privilege('service_role','public.kivai_reserve_asaas_checkout(uuid,text,text)','EXECUTE') as service_reserve,
   has_table_privilege('authenticated','public.kivai_asaas_checkout_intents','INSERT') as auth_insert
  `)).rows[0];
  assert.equal(grants.anon_reserve,false);
  assert.equal(grants.auth_claim,false);
  assert.equal(grants.service_reserve,true);
  assert.equal(grants.auth_insert,false);
 }finally{await db.close();}
});
