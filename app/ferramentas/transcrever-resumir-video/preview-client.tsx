"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getStoredSession } from "@/lib/user-auth";
import { guestStudies, storeGuestStudies, putGuestAudio, getGuestAudio } from "@/lib/video-studies/guest-preview";

type Summary={text:string;source:string;mode:"summary";partial:boolean};
type Saved={id:string;revision:number;title:string;guest:boolean};
type AccountProject={id:string;revision:number;title:string;payload:{text?:string;source?:string;mode?:string;partial?:boolean}};
function bearer(){return getStoredSession()?.access_token??"";}
async function accountRequest(path:string,method="GET",body?:unknown){
 const token=bearer();
 if(!token)throw new Error("Entre na sua conta para salvar na biblioteca.");
 const result=await fetch(path,{method,cache:"no-store",headers:{"Authorization":`Bearer ${token}`,"Content-Type":"application/json"},...(body===undefined?{}:{body:JSON.stringify(body)})});
 const payload=await result.json().catch(()=>({}));
 if(!result.ok)throw new Error(payload.error||"Não foi possível concluir a solicitação.");
 return payload;
}
function titleOf(text:string){
 const line=text.split("\n").map(x=>x.trim().replace(/^#+\s*/,"")).find(Boolean)||"Resumo do vídeo";
 return line.slice(0,120);
}
async function uploadNarration(id:string,blob:Blob,proof:string,sha:string){
 if(!proof||!sha)throw new Error("Gere a narração novamente para salvá-la.");
 const size=blob.size;
 const payload={id,proof,sha,size};
 const first=await accountRequest("/api/account/video-studies/audio/stage","POST",payload);
 const upload=await fetch(first.url,{method:"PUT",body:blob,headers:{"Content-Type":"audio/wav"},cache:"no-store"});
 if(!upload.ok)throw new Error("Não foi possível guardar o áudio. Tente novamente.");
 await accountRequest("/api/account/video-studies/audio/complete","POST",payload);
}
export default function YoutubeVideoPreviewClient(){
 const [url,setUrl]=useState("");
 const [result,setResult]=useState<Summary|null>(null);
 const [saved,setSaved]=useState<Saved|null>(null);
 const [busy,setBusy]=useState(false);
 const [saving,setSaving]=useState(false);
 const [audioBusy,setAudioBusy]=useState(false);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const [audioUrl,setAudioUrl]=useState("");
 const [audioExpires,setAudioExpires]=useState("");
 const [audioBlob,setAudioBlob]=useState<Blob|null>(null);
 const [audioProof,setAudioProof]=useState("");
 const [audioSha,setAudioSha]=useState("");
 const [audioStored,setAudioStored]=useState(false);
 const [loggedIn,setLoggedIn]=useState(false);
 const running=useRef(false);
 useEffect(()=>{
  const session=Boolean(bearer());setLoggedIn(session);
  const id=new URLSearchParams(window.location.search).get("project");
  if(!id||!/^[a-f\d-]{36}$/i.test(id))return;
  let active=true;
  const guest=guestStudies().find(x=>x.id===id);
  if(guest){
   setSaved({id:guest.id,revision:0,title:guest.title,guest:true});
   setUrl(guest.source);
   setResult({text:guest.text,source:guest.source,mode:"summary",partial:guest.partial});
   void getGuestAudio(guest.id).then(blob=>{if(active&&blob){setAudioBlob(blob);setAudioUrl(URL.createObjectURL(blob));}}).catch(()=>{});
  }else if(session){
   void accountRequest("/api/account/video-studies").then(data=>{
    const p=(data.projects as AccountProject[]).find(x=>x.id===id);
    if(!p||!active||typeof p.payload.text!=="string"||typeof p.payload.source!=="string")return;
    setSaved({id:p.id,title:p.title,revision:p.revision,guest:false});
    setUrl(p.payload.source);
    setResult({text:p.payload.text,source:p.payload.source,mode:"summary",partial:p.payload.partial===true});
    const asset=(data.audios as {project_id:string;expires_at:string}[]).find(x=>x.project_id===p.id&&Date.parse(x.expires_at)>Date.now());
    if(asset)void accountRequest(`/api/account/video-studies/audio?id=${id}`).then(a=>{
     if(active){setAudioUrl(a.url);setAudioExpires(a.expiresAt);setAudioStored(true);}
    }).catch(()=>{});
   }).catch(()=>{if(active)setError("Não foi possível abrir este resumo salvo.");});
  }
  return()=>{active=false;};
 },[]);
 async function generateSummary(){
  if(running.current||!url.trim())return;
  running.current=true;setBusy(true);setError("");setNotice("");setResult(null);setSaved(null);
  setAudioUrl("");setAudioBlob(null);setAudioStored(false);setAudioProof("");setAudioSha("");setAudioExpires("");
  try{
   const token=bearer();
   const response=await fetch("/api/ai/video-youtube-preview",{
    method:"POST",cache:"no-store",headers:{"Content-Type":"application/json",...(token?{"Authorization":`Bearer ${token}`}:{})},
    body:JSON.stringify({url}),signal:AbortSignal.timeout(210000)
   });
   const data=await response.json().catch(()=>({}));
   if(!response.ok)throw new Error(data.error||"Não foi possível gerar o resumo.");
   setResult(data as Summary);
   setNotice("Resumo pronto. Você pode ler, salvar ou gerar o áudio.");
  }catch(e){setError(e instanceof Error?e.message:"Não foi possível gerar o resumo.");}
  finally{setBusy(false);running.current=false;}
 }
 async function saveSummary(){
  if(!result||saving)return;
  setSaving(true);setError("");setNotice("");
  try{
   const title=saved?.title||titleOf(result.text);
   if(bearer()){
    const response=await accountRequest("/api/account/video-studies","POST",{
     id:saved&&!saved.guest?saved.id:undefined,title,revision:saved&&!saved.guest?saved.revision:0,
     text:result.text,source:result.source,mode:"summary",partial:result.partial
    });
    const p=response.project as {id:string;revision:number;title:string};
    setSaved({id:p.id,revision:p.revision,title:p.title,guest:false});
    if(audioBlob&&!audioStored){
     try{await uploadNarration(p.id,audioBlob,audioProof,audioSha);setAudioStored(true);setNotice("Resumo e áudio salvos na sua biblioteca.");}
     catch{setNotice("Resumo salvo. Não foi possível adicionar o áudio agora. Você pode continuar ouvindo nesta página.");}
    }else setNotice("Resumo salvo na sua biblioteca.");
   }else{
    const id=saved?.guest?saved.id:crypto.randomUUID();
    const studies=guestStudies();
    storeGuestStudies([{id,title,source:result.source,text:result.text,mode:"summary",partial:result.partial,createdAt:new Date().toISOString()},...studies.filter(x=>x.id!==id)]);
    if(audioBlob)await putGuestAudio(id,audioBlob);
    setSaved({id,revision:0,title,guest:true});
    setNotice("Resumo salvo neste dispositivo. Entre na conta para manter seus estudos disponíveis em outros aparelhos.");
   }
  }catch(e){setError(e instanceof Error?e.message:"Não foi possível salvar o resumo.");}
  finally{setSaving(false);}
 }
 async function generateAudio(){
  if(!result||audioBusy||audioUrl)return;
  setAudioBusy(true);setError("");setNotice("");
  try{
   const token=bearer();
   const response=await fetch("/api/ai/video-guest-audio-preview",{
    method:"POST",cache:"no-store",
    headers:{"Content-Type":"application/json",...(token?{"Authorization":`Bearer ${token}`}:{})},
    body:JSON.stringify({text:result.text}),signal:AbortSignal.timeout(210000)
   });
   if(!response.ok){
    const err=await response.json().catch(()=>({}));
    throw new Error(err.error||"Não foi possível preparar o áudio.");
   }
   const proof=response.headers.get("X-Kivai-Audio-Proof")||"";
   const sha=response.headers.get("X-Kivai-Audio-SHA256")||"";
   const blob=await response.blob();
   setAudioProof(proof);setAudioSha(sha);setAudioBlob(blob);
   setAudioUrl(URL.createObjectURL(blob));setAudioExpires("");
   if(saved?.guest){
    await putGuestAudio(saved.id,blob);setNotice("Áudio pronto e salvo neste dispositivo.");
   }else if(saved&&!saved.guest){
    try{await uploadNarration(saved.id,blob,proof,sha);setAudioStored(true);setNotice("Áudio pronto e salvo na sua biblioteca.");}
    catch{setNotice("Áudio pronto para ouvir. Salve novamente o resumo para tentar guardá-lo na biblioteca.");}
   }else setNotice("Áudio pronto. Aperte reproduzir para ouvir.");
  }catch(e){setError(e instanceof Error?e.message:"Não foi possível gerar o áudio.");}
  finally{setAudioBusy(false);}
 }
 async function copyText(){
  if(!result)return;
  try{await navigator.clipboard.writeText(result.text);setNotice("Resumo copiado.");}
  catch{setError("Não foi possível copiar o resumo.");}
 }
 return <div className="space-y-5">
  <nav aria-label="Etapas" className="grid grid-cols-3 gap-2">
   {([["1","Gerar resumo"],["2","Resultado"],["3","Ouvir o resumo"]] as const).map(([number,title])=>
    <div key={number} className="rounded-xl border border-border bg-card p-3 text-center">
     <span className="mx-auto flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{number}</span>
     <p className="mt-2 text-xs font-semibold sm:text-sm">{title}</p>
    </div>)}
  </nav>
  <section className="space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-6" aria-labelledby="step-one">
   <h2 id="step-one" className="text-lg font-semibold">1. Gerar resumo</h2>
   <p className="text-sm text-muted-foreground">Cole um link público do YouTube.</p>
   <label htmlFor="youtube-link" className="sr-only">Link do YouTube</label>
   <input id="youtube-link" type="url" value={url} onChange={e=>setUrl(e.target.value)} disabled={busy} autoComplete="url" placeholder="https://www.youtube.com/watch?v=..." className="w-full min-w-0 rounded-lg border border-border bg-background px-3 py-3 text-sm" maxLength={300}/>
   <Button disabled={busy||!url.trim()} onClick={()=>void generateSummary()}>{busy?"Gerando resumo...":"Gerar resumo inteligente"}</Button>
   {busy&&<p role="status" className="text-sm text-muted-foreground">Estamos preparando seu resumo. Mantenha esta página aberta.</p>}
  </section>
  {error&&<p role="alert" className="rounded-xl border border-destructive/40 bg-card p-4 text-sm">{error}</p>}
  {notice&&<p role="status" className="rounded-xl border border-border bg-card p-4 text-sm">{notice}</p>}
  <section className="space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-6" aria-labelledby="step-two">
   <div><h2 id="step-two" className="text-lg font-semibold">2. Resultado</h2>
    <p className="mt-1 text-sm text-muted-foreground">Leia o resumo e salve na sua biblioteca quando quiser.</p></div>
   {!result?<p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">Seu resumo aparecerá aqui.</p>:
   <>
    <p className="break-all text-xs text-muted-foreground">Vídeo original: <a className="underline" href={result.source} target="_blank" rel="noopener noreferrer">{result.source}</a></p>
    {result.partial&&<p role="status" className="text-sm text-muted-foreground">Alguns trechos podem não estar incluídos no resumo.</p>}
    <div className="flex flex-wrap gap-2">
     <Button variant="outline" onClick={()=>void copyText()}>Copiar resumo</Button>
     <Button disabled={saving} onClick={()=>void saveSummary()}>{saving?"Salvando...":saved?"Atualizar resumo salvo":"Salvar resumo"}</Button>
     {saved&&<Button asChild variant="outline"><Link href="/conta/projetos">Minha Biblioteca</Link></Button>}
    </div>
    <div className="whitespace-pre-wrap break-words rounded-lg border border-border bg-background p-4 text-sm leading-7">{result.text}</div>
    <p className="text-xs text-muted-foreground">Confira as informações importantes com o vídeo original.</p>
   </>}
  </section>
  <section className="space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-6" aria-labelledby="step-three">
   <div><h2 id="step-three" className="text-lg font-semibold">3. Ouvir o resumo</h2>
    <p className="mt-1 text-sm text-muted-foreground">Transforme o resumo em áudio e ouça quando quiser.</p></div>
   {!result?<p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">O áudio estará disponível após o resumo.</p>:
    <>
     <Button disabled={audioBusy||Boolean(audioUrl)||result.text.length>8000} onClick={()=>void generateAudio()}>{audioBusy?"Preparando áudio...":audioUrl?"Áudio pronto":"Gerar áudio do resumo"}</Button>
     {result.text.length>8000&&<p className="text-xs text-muted-foreground">Este resumo é muito longo para ser narrado de uma só vez.</p>}
     {audioBusy&&<p className="text-sm text-muted-foreground" role="status">Preparando sua narração. Mantenha esta página aberta.</p>}
     {audioUrl&&<div className="space-y-2"><audio src={audioUrl} controls controlsList="nodownload" preload="metadata" className="w-full"/>
      {audioExpires&&<p className="text-xs text-muted-foreground">Áudio disponível na sua biblioteca até {new Date(audioExpires).toLocaleDateString("pt-BR")}.</p>}
     </div>}
     {audioUrl&&!audioStored&&saved&&!saved.guest&&audioBlob&&<Button variant="outline" disabled={saving} onClick={()=>void saveSummary()}>Salvar áudio na biblioteca</Button>}
     <p className="text-xs text-muted-foreground"><Link href="/conta/projetos" className="underline underline-offset-2">Organize seus resumos em playlists na Minha Biblioteca</Link>.</p>
    </>}
  </section>
 </div>;
}
