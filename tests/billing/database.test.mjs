import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
const db = new PGlite();
const migration = fs.readFileSync(new URL('../../supabase/migrations/20260930234728_plan_access_and_saved_projects.sql', import.meta.url), 'utf8');
before(async () => { await db.exec(fs.readFileSync(new URL('./schema-fixture.sql', import.meta.url), 'utf8')); await db.exec(migration); });
after(async () => db.close());
async function user(profile = true) { const id = crypto.randomUUID(); await db.query('insert into auth.users values($1)',[id]); if(profile) await db.query('insert into user_profiles(user_id) values($1)',[id]); return id; }
async function request(id,plan='pro',cycle='monthly') { const r = await db.query("insert into subscription_requests(user_id,customer_email,plan_code,billing_cycle,status) values($1,'test@example.invalid',$2,$3,'payment_reported') returning id",[id,plan,cycle]); return r.rows[0].id; }
async function confirm(id) { return (await db.query('select kivai_confirm_payment($1) result',[id])).rows[0].result; }
async function access(id) { return (await db.query('select kivai_effective_plan($1) plan',[id])).rows[0].plan; }
async function grant(id,plan='pro') { await db.query("select kivai_set_access($1,$2,now()+interval '30 days','admin_manual')",[id,plan]); }
async function save(id,client='',project=null,revision=0) { return (await db.query("select kivai_save_project($1,$2,'calendar','Calendário',$3,'[]',$4) result",[id,project,client,revision])).rows[0].result; }
test('Free -> Pro and Agency, sequential duplicate confirmation is idempotent',async()=>{
 for(const plan of ['pro','agency']) { const id=await user(); assert.equal(await access(id),'free'); const r=await request(id,plan); await confirm(r); assert.equal(await access(id),plan); assert.equal((await confirm(r)).alreadyActive,true); const rows=await db.query('select * from customer_communications where user_id=$1',[id]); assert.equal(rows.rows.length,1); }
});
test('Atomic rollback if profile is missing; no partial subscription or outbox',async()=>{
 const id=await user(false),r=await request(id); await assert.rejects(confirm(r),/Perfil não encontrado/); assert.equal(await access(id),'free'); assert.equal((await db.query('select * from user_subscriptions where user_id=$1',[id])).rows.length,0);
});
test('Monthly to annual same-plan renewal preserves time; month-end clamps correctly',async()=>{
 const id=await user(); await grant(id); await db.query("update user_subscriptions set current_period_end='2099-01-31T12:00:00Z' where user_id=$1",[id]);
 await confirm(await request(id)); const end=(await db.query('select current_period_end::text e from user_subscriptions where user_id=$1',[id])).rows[0].e; assert.match(end,/2099-02-28/);
 await confirm(await request(id,'pro','annual')); assert.match((await db.query('select current_period_end::text e from user_subscriptions where user_id=$1',[id])).rows[0].e,/2100-02-28/);
});
test('Manual Agency synchronizes profile/subscription; revoke and expiration remove access',async()=>{
 const id=await user(); await grant(id); await grant(id,'agency'); assert.equal(await access(id),'agency');
 assert.equal((await db.query('select plan_code from user_profiles where user_id=$1',[id])).rows[0].plan_code,'agency');
 await db.query("update user_subscriptions set current_period_end=now()-interval '1 second' where user_id=$1",[id]); assert.equal(await access(id),'free');
 await db.query('select kivai_expire_access()'); assert.equal((await db.query('select plan_code from user_profiles where user_id=$1',[id])).rows[0].plan_code,'free');
 await grant(id); await db.query("select kivai_set_access($1,'free',null,'admin_manual')",[id]); assert.equal(await access(id),'free');
});
test('Free cannot save; Pro quota and Agency client restriction; stale revision rejected',async()=>{
 const id=await user(); await assert.rejects(save(id),/Plano pago/); await grant(id); await assert.rejects(save(id,'Cliente A'),/Agency/);
 const p=await save(id); await save(id,'',p.id,p.revision); await assert.rejects(save(id,'',p.id,p.revision),/outra aba/);
 for(let i=1;i<30;i++) await save(id); await assert.rejects(save(id),/Limite de projetos/);
 await grant(id,'agency'); await save(id,'Cliente A');
});
test('Cross-owner updates fail, RLS isolates projects, user cannot upgrade self or invoke admin RPC',async()=>{
 const a=await user(),b=await user(); await grant(a); await grant(b); const p=await save(a); await assert.rejects(save(b,'',p.id,p.revision),/não encontrado/);
 await db.query("select set_config('request.jwt.claim.sub',$1,false)",[b]); await db.exec('set role authenticated');
 try { assert.equal((await db.query('select * from saved_tool_projects')).rows.length,0); await assert.rejects(db.query("update user_profiles set plan_code='agency' where user_id=$1",[b]),/permission denied/); await assert.rejects(db.query("select kivai_set_access($1,'agency',now()+interval '1 day','admin_manual')",[b]),/permission denied/); }
 finally { await db.exec('reset role'); }
});
test('Instagram database limit enforced independently of browser',async()=>{
 const id=await user(); await assert.rejects(db.query('insert into social_accounts(user_id) values($1)',[id]),/Plano pago/); await grant(id);
 for(let i=0;i<5;i++)await db.query('insert into social_accounts(user_id) values($1)',[id]); await assert.rejects(db.query('insert into social_accounts(user_id) values($1)',[id]),/Limite de perfis/);
});
test('Plans and explanatory service registered in CMS',async()=>{
 assert.equal((await db.query("select * from site_contents where path='/planos' and status='published'")).rows.length,1);
 assert.equal((await db.query("select * from site_services where slug='planos-kivai'")).rows.length,1);
});
test('Expired trials and manual courtesies have no access before cron runs',async()=>{
 for(const provider of ['admin_test','admin_grace']) {
  const id=await user(); await db.query("select kivai_set_access($1,'pro',now()+interval '1 day',$2)",[id,provider]);
  await db.query("update user_subscriptions set current_period_end=now()-interval '1 second' where user_id=$1",[id]);
  assert.equal(await access(id),'free'); await assert.rejects(save(id),/Plano pago/);
 }
});
test('Agency client quota and downgraded read-only projects',async()=>{
 const id=await user();await grant(id,'agency');let first;
 for(let i=0;i<20;i++){const p=await save(id,`Cliente ${i}`);first??=p;}
 await assert.rejects(save(id,'Cliente 21'),/20 clientes/);
 await grant(id,'pro');await assert.rejects(save(id,'',first.id,first.revision),/Renove o Agency/);
 assert.equal((await db.query('select count(*)::int n from saved_tool_projects where user_id=$1',[id])).rows[0].n,20);
 await save(id); // Personal copy remains possible within the Pro quota.
});
test('Automatic grace cannot overwrite a newer admin grant or pending payment',async()=>{
 const id=await user();await confirm(await request(id));
 await db.query("update user_subscriptions set status='past_due',current_period_end=now()-interval '8 days' where user_id=$1",[id]);
 const sub=(await db.query('select id from user_subscriptions where user_id=$1',[id])).rows[0].id;
 await request(id,'agency');assert.equal((await db.query('select kivai_automatic_grace($1) result',[sub])).rows[0].result,null);
 await grant(id,'agency');assert.equal((await db.query('select kivai_automatic_grace($1) result',[sub])).rows[0].result,null);assert.equal(await access(id),'agency');
});
