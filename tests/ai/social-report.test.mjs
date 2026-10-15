import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
function load(file, mocks = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  new Function('require', 'module', 'exports', code)(name => name in mocks ? mocks[name] : require(name), module, module.exports);
  return module.exports;
}
const schema = load('lib/ai/social-report.ts');
const importSchema = load('lib/ai/social-report-import.ts');
const input = {network:'Instagram',startDate:'',endDate:'',engagementMethod:'reach',previous:null,metrics:Object.fromEntries(['followersStart','followersEnd','reach','impressions','interactions','publications','clicks','investment','leads','revenue','engagementRate','ctr','roas'].map(k=>[k,k==='reach'?100:null]))};
const analysis = {summary:'O alcance informado foi de 100 contas.',strengths:[],attention:[],actions:['Compare o próximo período.']};
const importInput = {consent:true,source:'Instagram Insights',networkHint:'Instagram',files:[{kind:'text',content:'Alcance;100'}]};
const extracted = {network:'Instagram',startDate:'',endDate:'',metrics:[{key:'reach',value:100,evidence:'Alcance 100'}],warnings:[]};
for (const importing of [false,true]) {
 test(`${importing?'Import':'Analysis'}: auth, charge, validation and failed finalization refunds`, async()=>{
  for(const scenario of ['success','unauthorized','invalid','provider','finalization']){
   const finalizations=[];let charges=0;
   const route=load(`app/api/ai/social-report/${importing?'import/':''}route.ts`,{
    '@/lib/billing/sumup':{authenticateBillingUser:async()=>{if(scenario==='unauthorized')throw Error();return {id:'test'};}},
    '@/lib/ai/gemini':{GeminiRequestError:class extends Error{},requestGeminiJson:generate,requestGeminiJsonParts:generate},
    '@/lib/ai/limits':{reserveAiRequest:async()=>true},
    '@/lib/ai/credits':{reserveAiCredits:async({cost})=>{charges++;assert.equal(cost,1);return {allowed:true};},finalizeAiCredits:async(_user,_op,success)=>{finalizations.push(success);return !(scenario==='finalization'&&success);}},
    '@/lib/ai/social-report':schema,'@/lib/ai/social-report-import':importSchema,
   });
   async function generate(){if(scenario==='provider')throw Error();if(scenario==='invalid')return {};return importing?extracted:analysis;}
   const response=await route.POST(new Request('http://localhost/api',{method:'POST',body:JSON.stringify(importing?importInput:input)}));
   assert.equal(response.status,scenario==='success'?200:scenario==='unauthorized'?401:503);
   assert.equal(charges,scenario==='unauthorized'?0:1);
   assert.deepEqual(finalizations,scenario==='success'?[true]:scenario==='unauthorized'?[]:scenario==='finalization'?[true,false]:[false]);
  }
 });
}
