"use client";
import { useState } from "react";
import { ToolAiPanel, imageForAi } from "./tool-ai-panel";
import { Button } from "@/components/ui/button";
export function CaptionAi({text,onApply,image="",compactNotice=false}:{text:string;onApply:(text:string)=>void;image?:string;compactNotice?:boolean}){
 const [action,setAction]=useState('Revisar português e clareza'),[limit,setLimit]=useState(2200),[feedback,setFeedback]=useState('');
 const fingerprint=JSON.stringify({text,action,limit,image});
 return <ToolAiPanel fingerprint={fingerprint} cost={image?2:1} compactNotice={compactNotice} disabled={!text.trim()||text.length>12000} prepare={async()=>({kind:'caption',consent:true,text,instruction:action,limit,...(image?{image:await imageForAi(image)}:{})})} render={result=>result.kind==='caption'&&<>
  <p className="text-sm">{result.feedback}</p>
  {result.variants.map((variant,i)=><div key={i} className="space-y-2 border p-3"><p className="whitespace-pre-wrap break-words">{variant}</p><p className="text-xs">{variant.length} caracteres</p><Button variant="outline" onClick={()=>onApply(variant)}>Usar legenda {i+1}</Button></div>)}
  {result.alt&&<div><h3 className="font-semibold">Descrição acessível da imagem</h3><p>{result.alt}</p><Button variant="outline" onClick={async()=>{try{await navigator.clipboard.writeText(result.alt);setFeedback('Descrição copiada.');}catch{setFeedback('Selecione a descrição e copie manualmente.');}}}>Copiar descrição</Button></div>}{feedback&&<p role="status">{feedback}</p>}
 </>}>
  <label className="block text-sm">O que melhorar<select value={action} onChange={e=>setAction(e.target.value)} className="mt-1 block w-full border bg-background p-2">{['Revisar português e clareza','Encurtar preservando a mensagem','Melhorar abertura e chamada para ação','Criar três variações preservando os fatos'].map(x=><option key={x}>{x}</option>)}</select></label>
  <label className="block text-sm">Limite desejado de caracteres<input type="number" min={80} max={5000} value={limit} onChange={e=>setLimit(Math.min(5000,Math.max(80,Number(e.target.value)||80)))} className="ml-2 w-24 border bg-background p-2"/></label>
  <p className="text-xs text-muted-foreground">{image?'Serão enviados a legenda e uma cópia reduzida da imagem do post. A foto e os dados do perfil não serão enviados.':'Somente a legenda será enviada. Até 12.000 caracteres de entrada.'} Escolher uma versão substitui a legenda atual.</p>
 </ToolAiPanel>;
}
