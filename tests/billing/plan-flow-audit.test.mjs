// Regression tests for the production server action; SQL is covered in database.test.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
function action({ denied=false, deliveryFails=false }={}) {
 const calls=[]; const invalidated=[];
 const mocks={
  'next/cache': {revalidatePath:p=>invalidated.push(p)},
  '@/lib/blog/auth': {assertAdminApi:async()=>{if(denied)throw Error('Unauthorized')}},
  '@/lib/blog/supabase': {supabaseRest:async(path,opts)=>{calls.push({path,body:JSON.parse(opts.body)});return {communicationId:'email-1'}}},
  '@/lib/marketing/email-delivery': {deliverCustomerEmail:async()=>{if(deliveryFails)throw Error('provider unavailable')}},
 };
 const module={exports:{}};
 const output=ts.transpileModule(fs.readFileSync(new URL('../../app/admin/assinaturas/actions.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 new Function('require','module','exports',output)(name=>{assert.ok(name in mocks,name);return mocks[name]},module,module.exports);
 const form=new FormData();form.set('requestId','request-1');
 return {calls,invalidated,form,...module.exports};
}
test('confirmation delegates to one atomic RPC',async()=>{const x=action();await x.confirmSubscriptionPayment(x.form);assert.deepEqual(x.calls,[{path:'rpc/kivai_confirm_payment',body:{p_request_id:'request-1'}}]);assert.ok(x.invalidated.includes('/conta/pro'));});
test('email provider failure does not fail completed activation',async()=>{const x=action({deliveryFails:true});await x.confirmSubscriptionPayment(x.form);assert.ok(x.invalidated.includes('/admin/assinaturas'));});
test('unauthorized admin cannot confirm or reject',async()=>{const x=action({denied:true});await assert.rejects(x.confirmSubscriptionPayment(x.form));await assert.rejects(x.rejectSubscriptionPayment(x.form));assert.equal(x.calls.length,0);});
test('rejection is restricted to pending requests',async()=>{const x=action();await x.rejectSubscriptionPayment(x.form);assert.match(x.calls[0].path,/status=in.\(awaiting_payment,payment_reported\)/);});
