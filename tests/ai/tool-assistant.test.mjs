import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import {createRequire} from 'node:module';
import {PDFDocument} from 'pdf-lib';
const require=createRequire(import.meta.url);
function load(file,mocks={}){const module={exports:{}};const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;new Function('require','module','exports',code)(name=>name in mocks?mocks[name]:require(name),module,module.exports);return module.exports;}
const schema=load('lib/ai/tool-assistant.ts');
const caption={kind:'caption',consent:true,text:'Café da casa',instruction:'Revisar',limit:100};
const image={mimeType:'image/jpeg',data:Buffer.from([255,216,255,1,2,3]).toString('base64')};
const samplePdf=await PDFDocument.create();samplePdf.addPage();
const file={mimeType:'application/pdf',data:Buffer.from(await samplePdf.save()).toString('base64')};
const output={variants:['Conheça o café da casa.'],feedback:'Confira a legenda.',alt:'Uma imagem'};
test('Consent, inputs, path names and output size are bounded',()=>{
 for(const input of [{...caption,consent:false},{...caption,text:'a'.repeat(12001)},{kind:'rename',consent:true,instruction:'renomear',names:['../secret.txt']}])assert.equal(schema.toolAssistantInput.safeParse(input).success,false);
 assert.throws(()=>schema.validateToolOutput(caption,{...output,variants:['a'.repeat(101)]}));
 assert.equal(schema.validateToolOutput(caption,output).alt,'');
 assert.throws(()=>schema.validateToolOutput({kind:'table'},{tables:[],warnings:[]}));
});
test('Renaming preserves extension and ordering, rejects missing entries and prevents unsafe names',()=>{
 const input={kind:'rename',consent:true,names:['foto.JPG','tabela.xlsx','documento.txt'],instruction:'organizar'};
 const result=schema.validateToolOutput(input,{names:['../foto','CON','<script>']});
 assert.deepEqual(result.names,['..-foto-01.JPG','arquivo-02.xlsx','-script--03.txt']);
 assert.ok(result.names.every(name=>!/[<>:"/\\|?*]/.test(name)));
 assert.throws(()=>schema.validateToolOutput(input,{names:['um']}));
});
test('All seven tools expose title, description and tutorial in Admin',()=>{
 const copy=load('lib/ai/content-assistant-copy.ts');
 for(const slug of ['contador-de-caracteres-instagram','preview-de-post-redes-sociais','radar-de-tendencias','pdf-para-excel','pdf-para-word','pdf-para-html','renomear-arquivos-em-lote'])assert.deepEqual(copy.assistantFields(slug).map(x=>x.key),['ai-title','ai-description','ai-tutorial-url']);
});
test('API authenticates before charges, uses fixed costs and refunds failures',async()=>{
 for(const scenario of ['success','image','pdf','unauthorized','no-credit','quota','invalid','provider','finalization','bad-file']){
  const calls=[];let cost;
  const route=load('app/api/ai/tool-assistant/route.ts',{
   '@/lib/ai/tool-assistant':schema,
   '@/lib/billing/sumup':{authenticateBillingUser:async()=>{if(scenario==='unauthorized')throw Error();return{id:'test'};}},
   '@/lib/ai/credits':{reserveAiCredits:async p=>{cost=p.cost;return{allowed:scenario!=='no-credit'};},finalizeAiCredits:async(_u,_o,ok)=>{calls.push(ok);return !(scenario==='finalization'&&ok);}},
   '@/lib/ai/limits':{reserveAiRequest:async()=>scenario!=='quota'},
   '@/lib/ai/gemini':{requestGeminiJsonParts:async()=>{if(scenario==='provider')throw Error();return scenario==='invalid'?{}:scenario==='pdf'?{blocks:[{type:'paragraph',text:'Documento'}],warnings:[]}:output;}},
  });
  const input=scenario==='pdf'?{kind:'document',consent:true,file}:scenario==='image'?{...caption,image}:scenario==='bad-file'?{...caption,image:{...image,data:'aGVsbG8='}}:caption;
  const response=await route.POST(new Request('http://localhost/api',{method:'POST',body:JSON.stringify(input)}));
  const success=['success','image','pdf'].includes(scenario);
  assert.equal(response.status,success?200:scenario==='unauthorized'?401:scenario==='bad-file'?400:scenario==='no-credit'?402:scenario==='quota'?429:503);
  assert.equal(cost,['unauthorized','bad-file'].includes(scenario)?undefined:['image','pdf'].includes(scenario)?2:1);
  assert.deepEqual(calls,success?[true]:['unauthorized','bad-file','no-credit'].includes(scenario)?[]:scenario==='finalization'?[true,false]:[false]);
 }
});
