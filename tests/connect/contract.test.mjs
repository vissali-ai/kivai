import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
function load(file, mocks = {}) {
  const compiled = {exports:{}};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  new Function('require','module','exports',code)(name => name in mocks ? mocks[name] : require(name),compiled,compiled.exports);
  return compiled.exports;
}
const contract = load('lib/kivai-connect/report.ts');
const fixture = {schemaVersion:1,collectedAt:'2026-10-24T12:00:00.000Z',manufacturer:'Teste',model:'TV teste',androidVersion:'14',sdk:34,storageRaw:'Filesystem 1K-blocks Used Available Use% Mounted on\n/dev/block/dm-1 10000 8000 2000 80% /data',memoryRaw:'MemTotal: 2000000 kB\nMemAvailable: 500000 kB',apps:['com.example.video'],warnings:[]};
test('report rejects injection, wrong schema and oversized data',()=>{
  assert.throws(()=>contract.parseReport(JSON.stringify({...fixture,apps:['com.app; reboot']})));
  assert.throws(()=>contract.parseReport(JSON.stringify({...fixture,schemaVersion:2})));
  assert.throws(()=>contract.parseReport(' '.repeat(600001)));
  const parsed=contract.parseReport(JSON.stringify({...fixture,ip:'private',pairCode:'secret'}));
  assert.equal(parsed.ip,undefined);assert.equal(parsed.pairCode,undefined);
});
test('summary parses df and memory, does not substitute missing values with zero',()=>{
  const summary=contract.summarize(fixture);
  assert.equal(summary.storageTotal,10240000);assert.equal(summary.storageAvailable,2048000);
  assert.equal(summary.memoryAvailable,512000000);assert.equal(summary.apps,undefined);
  assert.equal(contract.summarize({...fixture,storageRaw:'permission denied',memoryRaw:''}).storageAvailable,null);
});
test('AI output cannot carry commands or unknown operations',()=>{
  assert.equal(contract.aiResultSchema.safeParse({actions:['reboot']}).success,false);
  assert.equal(contract.aiResultSchema.safeParse({actions:['apps'],command:'pm disable-user'}).success,false);
  assert.equal(contract.aiResultSchema.safeParse({actions:['storage','support']}).success,true);
});
function api({authenticated=true,allowed=true,rate=true,providerFails=false,output={actions:['storage']}}={}) {
  const events=[];
  const route=load('app/api/ai/kivai-connect/route.ts',{
    '@/lib/billing/sumup':{authenticateBillingUser:async()=>{if(!authenticated)throw Error();return{id:'test-user'};}},
    '@/lib/ai/credits':{reserveAiCredits:async args=>{events.push(['reserve',args.cost]);return{allowed};},finalizeAiCredits:async(_u,_id,ok)=>{events.push(['finalize',ok]);return true;}},
    '@/lib/ai/limits':{reserveAiRequest:async()=>rate},
    '@/lib/ai/gemini':{requestGeminiJson:async(_prompt,payload)=>{events.push(['provider',payload]);if(providerFails)throw Error();return output;}},
    '@/lib/kivai-connect/report':contract,
  });
  return {events,post:(body={consent:true,goal:'entender',summary:contract.summarize(fixture)})=>route.POST(new Request('https://www.kivai.com.br/api/ai/kivai-connect',{method:'POST',body:JSON.stringify(body)}))};
}
test('authentication and consent fail before credit reservation',async()=>{
  let context=api({authenticated:false});assert.equal((await context.post()).status,401);assert.deepEqual(context.events,[]);
  context=api();assert.equal((await context.post({consent:false})).status,400);assert.deepEqual(context.events,[]);
});
test('insufficient balance never calls AI',async()=>{const a=api({allowed:false});assert.equal((await a.post()).status,402);assert.deepEqual(a.events,[['reserve',1]]);});
test('success charges existing one-credit insight and sends only summary',async()=>{const a=api();assert.equal((await a.post()).status,200);assert.deepEqual(a.events.at(-1),['finalize',true]);assert.equal(a.events[1][1].summary.apps,undefined);});
test('rate limit, provider failure and invalid model output refund',async()=>{
  for(const options of [{rate:false},{providerFails:true},{output:{actions:['delete-system']}}]){const a=api(options);assert.ok((await a.post()).status>=400);assert.deepEqual(a.events.at(-1),['finalize',false]);}
});
