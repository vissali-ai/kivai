import {test} from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {PGlite} from "@electric-sql/pglite";

const m1=await readFile(new URL("../../supabase/migrations/20261109194000_asaas_checkout_intents.sql",import.meta.url),"utf8");
const m2=await readFile(new URL("../../supabase/migrations/20261109203000_asaas_checkout_finalize.sql",import.meta.url),"utf8");
const user="11111111-1111-4111-8111-111111111111";
async function dbSetup() {
 const db=new PGlite();
 await db.exec(`
 CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role;
 CREATE SCHEMA auth;
 CREATE TABLE auth.users(id uuid primary key);
 CREATE TYPE public.kivai_plan_code AS ENUM('free','pro','agency');
 CREATE TABLE public.subscription_plans(
  code public.kivai_plan_code primary key,active boolean not null,
  price_monthly_brl numeric(10,2),price_annual_brl numeric(10,2));
 CREATE TABLE public.user_subscriptions(
  id uuid primary key default gen_random_uuid(),user_id uuid references auth.users(id),
  status text,current_period_end timestamptz);
 CREATE TABLE public.subscription_requests(
  id uuid primary key default gen_random_uuid(),user_id uuid references auth.users(id),status text);
 INSERT INTO auth.users VALUES('11111111-1111-4111-8111-111111111111');
 INSERT INTO public.subscription_plans VALUES('pro',true,19.90,199.00),('agency',true,59.90,599.00);
 `);
 await db.exec(m1);await db.exec(m2);return db;
}
async function reserve(db){
 return (await db.query("select public.kivai_reserve_asaas_checkout($1,'pro','monthly') as result",[user])).rows[0].result;
}
async function finalize(db,id,ref,checkout){
 return (await db.query("select public.kivai_finalize_asaas_checkout($1,$2,$3,$4) as result",[id,user,ref,checkout])).rows[0].result;
}
test("checkout UUID stored atomically and cannot be finalized twice",async()=>{
 const db=await dbSetup();
 try{
  const r=await reserve(db);
  const c="c7b1c696-b27b-4d3d-80b9-d1c018e387f8";
  await assert.rejects(()=>finalize(db,r.id,r.external_reference,c),/Checkout não pode ser finalizado/);
  await db.query("select public.kivai_claim_asaas_checkout($1,$2)",[r.id,user]);
  const result=await finalize(db,r.id,r.external_reference,c);
  assert.equal(result.state,"created");assert.equal(result.provider_checkout_id,c);
  await assert.rejects(()=>finalize(db,r.id,r.external_reference,c),/Checkout não pode ser finalizado/);
  const rows=(await db.query("select state,provider_checkout_id from public.kivai_asaas_checkout_intents")).rows;
  assert.equal(rows.length,1);assert.equal(rows[0].provider_checkout_id,c);
 }finally{await db.close();}
});
test("malicious external reference and wrong user cannot finalize another checkout",async()=>{
 const db=await dbSetup();
 try{
  const r=await reserve(db);
  await db.query("select public.kivai_claim_asaas_checkout($1,$2)",[r.id,user]);
  await assert.rejects(()=>finalize(db,r.id,"attacker","c7b1c696-b27b-4d3d-80b9-d1c018e387f8"),/não pode ser finalizado/);
  await assert.rejects(()=>db.query("select public.kivai_finalize_asaas_checkout($1,$2,$3,$4)",[r.id,"22222222-2222-4222-8222-222222222222",r.external_reference,"c7b1c696-b27b-4d3d-80b9-d1c018e387f8"]),/não pode ser finalizado/);
 }finally{await db.close();}
});
test("checkout finalization RPC is service-only",async()=>{
 const db=await dbSetup();
 try {
  const result=(await db.query(`select
   has_function_privilege('anon','public.kivai_finalize_asaas_checkout(uuid,uuid,text,text)','EXECUTE') as anon_access,
   has_function_privilege('authenticated','public.kivai_finalize_asaas_checkout(uuid,uuid,text,text)','EXECUTE') as user_access,
   has_function_privilege('service_role','public.kivai_finalize_asaas_checkout(uuid,uuid,text,text)','EXECUTE') as service_access`)).rows[0];
  assert.equal(result.anon_access,false);assert.equal(result.user_access,false);
  assert.equal(result.service_access,true);
 }finally{await db.close();}
});
