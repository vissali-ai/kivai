"use client";
import { useState } from "react";
import { ToolAiPanel } from "./tool-ai-panel";
import { Button } from "@/components/ui/button";
import { downloadBlob } from "@/lib/image-tools/canvas";
import type { ToolAssistantResult } from "@/lib/ai/tool-assistant";
const escape = (s:string)=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export function DocumentAi({files,format}:{files:File[];format:'xlsx'|'docx'|'html'}){
 const [index,setIndex]=useState(0),[range,setRange]=useState('1'),[error,setError]=useState(''),[reviewed,setReviewed]=useState('');
 const file=files[index]??files[0];
 const fingerprint=JSON.stringify({name:file?.name,size:file?.size,modified:file?.lastModified,range,format});
 async function prepare(){
  if(!file)throw Error('Escolha um PDF no conversor acima.');
  const {PDFDocument}=await import('pdf-lib');const original=await PDFDocument.load(await file.arrayBuffer());
  if(!/^\d+(\s*[-,]\s*\d+)*$/.test(range.trim()))throw Error('Informe páginas como 1,3 ou 1-3.');
  const selected:number[]=[];
  for(const token of range.split(',')){const parts=token.trim().split('-').map(Number);const start=parts[0],end=parts[1]??start;if(!start||end<start||end>original.getPageCount()||end-start>2)throw Error('Escolha até 3 páginas existentes.');for(let n=start;n<=end;n++)selected.push(n-1);}
  const pages=[...new Set(selected)];if(pages.length>3)throw Error('A IA aceita até 3 páginas por geração.');
  const subset=await PDFDocument.create();for(const page of await subset.copyPages(original,pages))subset.addPage(page);
  const bytes=await subset.save();if(bytes.length>2_000_000)throw Error('As páginas ultrapassam 2 MB. Escolha menos páginas.');
  let raw='';for(let i=0;i<bytes.length;i+=8192)raw+=String.fromCharCode(...bytes.subarray(i,i+8192));
  return {kind:format==='xlsx'?'table' as const:'document' as const,consent:true as const,file:{mimeType:'application/pdf' as const,data:btoa(raw)}};
 }
 async function exportResult(result:ToolAssistantResult){
  setError('');try{
   const name=(file?.name??'documento').replace(/\.pdf$/i,'')+'-ia';
   if(result.kind==='table'){
    const {Workbook}=await import('exceljs');const book=new Workbook();
    result.tables.forEach((table,i)=>{const sheet=book.addWorksheet(`Tabela ${i+1}`);table.rows.forEach(row=>sheet.addRow(row));});
    downloadBlob(new Blob([await book.xlsx.writeBuffer()]),name+'.xlsx');
   }else if(result.kind==='document'&&format==='docx'){
    const {Document,Packer,Paragraph,HeadingLevel}=await import('docx');
    const doc=new Document({sections:[{children:result.blocks.map(block=>new Paragraph({text:block.text,...(block.type==='heading'?{heading:HeadingLevel.HEADING_1}:block.type==='list-item'?{bullet:{level:0}}:{})}))}]});
    downloadBlob(await Packer.toBlob(doc),name+'.docx');
   }else if(result.kind==='document'){
    const body=result.blocks.map(block=>{const tag=block.type==='heading'?'h2':'p';return `<${tag}>${block.type==='list-item'?'• ':''}${escape(block.text)}</${tag}>`;}).join('\n');
    downloadBlob(new Blob([`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Documento organizado</title><body>${body}</body></html>`],{type:'text/html;charset=utf-8'}),name+'.html');
   }
  }catch{setError('Não foi possível baixar. Tente novamente sem gerar outra vez.');}
 }
 return <ToolAiPanel fingerprint={fingerprint} cost={2} disabled={!file} prepare={prepare} render={result=>{
  if(result.kind!=='table'&&result.kind!=='document')return null;
  const version=fingerprint+JSON.stringify(result);
  return <>{result.warnings.map((w,i)=><p key={i} className="text-sm text-amber-600">{w}</p>)}
   <div className="max-h-96 overflow-auto border p-3">{result.kind==='table'?result.tables.map((table,i)=><div key={i}><h3>{table.title}</h3><table className="text-sm"><tbody>{table.rows.map((row,j)=><tr key={j}>{row.map((cell,k)=><td className="max-w-80 border p-2 break-words" key={k}>{cell}</td>)}</tr>)}</tbody></table></div>):result.blocks.map((block,i)=>block.type==='heading'?<h3 key={i} className="mt-3 font-semibold">{block.text}</h3>:<p key={i} className="whitespace-pre-wrap break-words">{block.type==='list-item'?'• ':''}{block.text}</p>)}</div>
   <label className="flex gap-2 text-sm"><input type="checkbox" checked={reviewed===version} onChange={e=>setReviewed(e.target.checked?version:'')}/>Conferi o conteúdo com o PDF original, inclusive números e possíveis omissões.</label>
   <Button disabled={reviewed!==version} onClick={()=>exportResult(result)}>Baixar {format.toUpperCase()} revisado</Button>{error&&<p role="alert">{error}</p>}
  </>;
 }}>
  <p className="text-sm">Modo opcional: até 3 páginas e 2 MB por geração. Envia apenas as páginas escolhidas. O arquivo gerado pela IA é separado da conversão normal; não preserva o layout original.</p>
  {files.length>1&&<label className="block text-sm">PDF para IA<select value={index} onChange={e=>setIndex(Number(e.target.value))} className="block w-full border bg-background p-2">{files.map((f,i)=><option key={i} value={i}>{f.name}</option>)}</select></label>}
  <label className="block text-sm">Páginas para IA<input value={range} onChange={e=>setRange(e.target.value)} placeholder="1-3 ou 1,3" className="ml-2 w-40 border bg-background p-2"/></label>
 </ToolAiPanel>;
}
