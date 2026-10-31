"use client";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { AiCreditBalance } from "./ai-credit-balance";
import { useToolAiCopy } from "./tool-ai-provider";
import { getStoredSession } from "@/lib/user-auth";
import type { ToolAssistantInput, ToolAssistantResult } from "@/lib/ai/tool-assistant";

export function ToolAiPanel({fingerprint,cost,disabled,compactNotice=false,prepare,children,render}:{fingerprint:string;cost:1|2;disabled?:boolean;compactNotice?:boolean;prepare:()=>Promise<ToolAssistantInput>;children?:React.ReactNode;render:(result:ToolAssistantResult)=>React.ReactNode}) {
 const copy=useToolAiCopy(); const lock=useRef(false);
 const [loading,setLoading]=useState(false),[error,setError]=useState("");
 const [result,setResult]=useState<{fingerprint:string;data:ToolAssistantResult}|null>(null);
 async function generate(){
  if(lock.current||disabled)return;
  const session=getStoredSession();if(!session?.access_token){setError("Entre na sua conta para usar a IA.");return;}
  lock.current=true;setLoading(true);setError("");
  try{const input=await prepare();const response=await fetch('/api/ai/tool-assistant',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${session.access_token}`},body:JSON.stringify(input)});const data=await response.json();if(!response.ok)throw Error(data.error||'Falha na geração.');setResult({fingerprint,data});}
  catch(e){setError(e instanceof Error?e.message:'Não foi possível concluir.');}
  finally{lock.current=false;setLoading(false);window.dispatchEvent(new Event('kivai:ai-credit-update'));}
 }
 return <section aria-label={copy.title} className="my-6 space-y-4 border border-primary/30 bg-card p-4 sm:p-6" data-print-hide>
  <h2 className="text-lg font-semibold">{copy.title}</h2><p className="text-sm text-muted-foreground">{copy.description}</p>
  {children}<AiCreditBalance/>
  {compactNotice ? <p className="text-sm text-muted-foreground">A revisão com IA custa {cost} {cost === 1 ? "crédito" : "créditos"}. Confira as sugestões antes de aplicar.</p> : <><p className="text-sm text-muted-foreground">Ao clicar em Gerar com IA, os dados selecionados serão enviados a um provedor externo. Não envie informações pessoais ou confidenciais. O provedor gratuito pode utilizar os dados para melhorar seus produtos.</p><p className="text-xs text-muted-foreground">A IA pode errar: confira os resultados. Cada geração custa {cost} crédito(s); revisar, aplicar e baixar não cobra novamente.</p></>}
  <Button onClick={generate} disabled={loading||disabled}>{loading?'Gerando…':`Gerar com IA · ${cost} crédito(s)`}</Button>
  {/^https:\/\//.test(copy.tutorialUrl)&&<a href={copy.tutorialUrl} target="_blank" rel="noopener noreferrer" className="ml-3 underline">Ver tutorial</a>}
  {error&&<p role="alert" className="text-sm text-destructive">{error}{error.startsWith('Entre')&&<> <a href="/conta/login" className="underline">Entrar na conta</a></>}</p>}
  {result?.fingerprint===fingerprint&&<div className="space-y-3 border-t pt-4" aria-live="polite">{render(result.data)}</div>}
 </section>;
}

export async function imageForAi(url:string){
 const blob=await (await fetch(url)).blob();const bitmap=await createImageBitmap(blob);
 try{const scale=Math.min(1,1200/Math.max(bitmap.width,bitmap.height));const canvas=document.createElement('canvas');canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);const context=canvas.getContext('2d');if(!context)throw Error('Não foi possível preparar a imagem.');context.fillStyle='#ffffff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(bitmap,0,0,canvas.width,canvas.height);return {mimeType:'image/jpeg' as const,data:canvas.toDataURL('image/jpeg',0.8).split(',')[1]};}finally{bitmap.close();}
}
export async function copyAiText(text:string){await navigator.clipboard.writeText(text);}
