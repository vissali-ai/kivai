"use client";
import { useState } from "react";
import type { RadarItem } from "@/lib/news-radar/types";
import { ToolAiPanel } from "./tool-ai-panel";
import { Button } from "@/components/ui/button";
export function NewsAi({items}:{items:RadarItem[]}){
 const [index,setIndex]=useState(0),[segment,setSegment]=useState(''),[feedback,setFeedback]=useState('');const item=items[index]??items[0];
 return <ToolAiPanel fingerprint={JSON.stringify({item,segment})} cost={1} disabled={!item||!segment.trim()} prepare={async()=>({kind:'news',consent:true,title:item.title,excerpt:item.excerpt,source:item.sourceName,date:item.publishedAt,segment})} render={result=>result.kind==='news'&&<>
 <p className="text-sm">{result.caveat}</p>{result.ideas.map((idea,i)=><div key={i}><h3 className="font-semibold">{idea.title}</h3><p>{idea.angle}</p></div>)}
 <a className="block underline" href={item.url} target="_blank" rel="noopener noreferrer">Fonte: {item.sourceName} · {new Date(item.publishedAt).toLocaleDateString('pt-BR')}</a>
 <Button variant="outline" onClick={async()=>{try{await navigator.clipboard.writeText(result.ideas.map(x=>x.title+'\n'+x.angle).join('\n\n')+'\n\nFonte: '+item.url);setFeedback('Ideias copiadas.');}catch{setFeedback('Selecione as ideias e copie manualmente.');}}}>Copiar ideias e fonte</Button>{feedback&&<p role="status">{feedback}</p>}
 </>}>
 <label className="block text-sm">Notícia de referência<select value={index} onChange={e=>setIndex(Number(e.target.value))} className="block w-full border bg-background p-2">{items.map((item,i)=><option key={i} value={i}>{item.title}</option>)}</select></label>
 <label className="block text-sm">Seu segmento e público<input maxLength={400} value={segment} onChange={e=>setSegment(e.target.value)} placeholder="Ex.: loja de roupas para jovens" className="block w-full border bg-background p-2"/></label>
 <p className="text-xs">Usa somente o título e o trecho disponíveis no radar. As ideias não equivalem à leitura da matéria completa; confira a fonte antes de publicar.</p>
 </ToolAiPanel>;
}
