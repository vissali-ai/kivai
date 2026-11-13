"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getStoredSession } from "@/lib/user-auth";
import { guestStudies,storeGuestStudies,putGuestAudio,getGuestAudio } from "@/lib/video-studies/guest-preview";

type Mode = "summary" | "transcript";
type Result = { text: string; mode: Mode; partial: boolean; source: string; model: string };
type Saved = { id: string; revision: number; title: string; guest?: boolean };
type SavedRecord = { id:string; title:string; revision:number; payload: {source?:string;text?:string;mode?:Mode;partial?:boolean} };
function token() { return getStoredSession()?.access_token ?? ""; }
async function accountRequest(path:string, method="GET", body?:unknown) {
 const bearer=token();
 if(!bearer)throw new Error("Entre na sua conta Kivai para salvar seu resumo e gerar áudio.");
 const res=await fetch(path,{
  method,headers:{"Authorization":`Bearer ${bearer}`,"Content-Type":"application/json"},
  ...(body!==undefined?{body:JSON.stringify(body)}:{}),cache:"no-store"
 });
 const data=await res.json();
 if(!res.ok)throw new Error(data.error||"Não foi possível concluir a operação.");
 return data;
}
function titleOf(result:Result) {
 const firstLine=result.text.split("\n").map(line=>line.replace(/^#+\s*/,"").trim()).find(Boolean)||"Resumo de vídeo";
 return firstLine.slice(0,120);
}
export default function YoutubeVideoPreviewClient() {
 const [url,setUrl]=useState("");
 const [mode,setMode]=useState<Mode>("summary");
 const [consent,setConsent]=useState(false);
 const [busy,setBusy]=useState(false);
 const [saving,setSaving]=useState(false);
 const [audioBusy,setAudioBusy]=useState(false);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const [result,setResult]=useState<Result|null>(null);
 const [saved,setSaved]=useState<Saved|null>(null);
 const [audioUrl,setAudioUrl]=useState("");
 const [audioExpiry,setAudioExpiry]=useState("");
 const lock=useRef(false);
 useEffect(()=>{
  const query=new URLSearchParams(window.location.search).get("project");
  if(!query||!/^[a-f\d-]{36}$/i.test(query))return;
  if(!token()){
   const guest=guestStudies().find(item=>item.id===query);
   if(!guest)return;
   setSaved({id:guest.id,revision:0,title:guest.title,guest:true});
   setUrl(guest.source);setMode(guest.mode);setConsent(true);
   setResult({text:guest.text,source:guest.source,mode:guest.mode,partial:guest.partial,model:"gemini-3.5-flash-lite"});
   void getGuestAudio(guest.id).then(blob=>{if(blob)setAudioUrl(URL.createObjectURL(blob));}).catch(()=>{});
   return;
  }
  let active=true;
  void accountRequest("/api/account/video-studies").then(data=>{
   const project=(data.projects as SavedRecord[]).find(item=>item.id===query);
   if(!project||!active)return;
   if(typeof project.payload.text!=="string"||typeof project.payload.source!=="string")return;
   setSaved({id:project.id,revision:project.revision,title:project.title});
   setUrl(project.payload.source);
   setMode(project.payload.mode==="transcript"?"transcript":"summary");
   setConsent(true);
   setResult({text:project.payload.text,source:project.payload.source,mode:project.payload.mode==="transcript"?"transcript":"summary",partial:project.payload.partial===true,model:"gemini-3.5-flash-lite"});
   if((data.audios as {project_id:string;expires_at:string}[]).some(x=>x.project_id===project.id&&Date.parse(x.expires_at)>Date.now())) {
    void accountRequest(`/api/account/video-studies/audio?id=${project.id}`).then(output=>{
     if(active){setAudioUrl(output.url);setAudioExpiry(output.expiresAt);}
    }).catch(()=>{});
   }
  }).catch(cause=>{if(active)setError(cause instanceof Error?cause.message:"Não foi possível abrir o resumo salvo.");});
  return()=>{active=false;};
 },[]);

 async function run(){
  if(lock.current)return;
  if(!consent){setError("Autorize o envio do link para o Gemini.");return;}
  lock.current=true;setBusy(true);setError("");setNotice("");setResult(null);setSaved(null);setAudioUrl("");
  try{
   const headers:Record<string,string>={"Content-Type":"application/json"};
   // Public preview deliberately runs without account entitlement.
   const response=await fetch("/api/ai/video-youtube-preview",{
    method:"POST",headers,body:JSON.stringify({url,mode,consent}),signal:AbortSignal.timeout(210000)
   });
   const json=await response.json();
   if(!response.ok)throw new Error(json.error||"Falha ao analisar o vídeo.");
   setResult(json as Result);
   setNotice("Texto pronto. Você pode parar aqui, salvar na conta ou gerar uma narração.");
  }catch(cause){setError(cause instanceof Error&&cause.name!=="TimeoutError"?cause.message:"O processamento excedeu o tempo de teste.");}
  finally{lock.current=false;setBusy(false);}
 }
 async function save(){
  if(!result||saving)return;
  setSaving(true);setError("");
  try{
   {
    const id=saved?.guest?saved.id:crypto.randomUUID();
    const title=saved?.title??titleOf(result);
    const studies=guestStudies();
    storeGuestStudies([{id,title,source:result.source,text:result.text,mode:result.mode,partial:result.partial,createdAt:new Date().toISOString()},...studies.filter(x=>x.id!==id)]);
    if(audioUrl.startsWith("blob:")){try{await putGuestAudio(id,await (await fetch(audioUrl)).blob());}catch{setNotice("Resumo salvo. O áudio não pôde ser armazenado, mas continua disponível nesta aba.");}}
    setSaved({id,revision:0,title,guest:true});
    setNotice("Resumo salvo no navegador de teste. Você já pode gerar o áudio e adicioná-lo a playlists.");
   }
  }catch(cause){setError(cause instanceof Error?cause.message:"Não foi possível salvar. Verifique se este navegador permite armazenamento local.");}
  finally{setSaving(false);}
 }
 async function generateAudio(){
  if(!result||result.mode!=="summary"||audioBusy)return;
  setAudioBusy(true);setError("");setNotice("");
  try{
    const response=await fetch("/api/ai/video-guest-audio-preview",{
     method:"POST",headers:{"Content-Type":"application/json"},
     body:JSON.stringify({text:result.text,consent:true}),signal:AbortSignal.timeout(210000)
    });
    if(!response.ok){const data=await response.json().catch(()=>({}));throw new Error(data.error??"Não foi possível gerar o áudio.");}
    const blob=await response.blob();
    if(saved?.guest)await putGuestAudio(saved.id,blob);
    setAudioUrl(URL.createObjectURL(blob));setAudioExpiry("");
    setNotice(saved?.guest?"Áudio criado e guardado neste navegador de teste.":"Áudio gerado. Salve o resumo no navegador para adicioná-lo a uma playlist.");
  }catch(cause){setError(cause instanceof Error?cause.message:"Falha ao gerar áudio.");}
  finally{setAudioBusy(false);}
 }
 async function copy(){
  if(!result)return;
  try{await navigator.clipboard.writeText(result.text);setNotice("Texto copiado.");}
  catch{setError("Não foi possível copiar o texto.");}
 }
 return <div className="space-y-5">
  <nav aria-label="Etapas de resumo e áudio" className="grid grid-cols-3 gap-2">
   {[
    ["1","Gerar resumo","Cole um link"],
    ["2","Resultado","Leia e salve"],
    ["3","Áudio do resumo","Opcional"]
   ].map(([n,label,sub],index)=><div key={n} className="rounded-xl border border-border bg-card p-3 text-center">
    <span className="mx-auto flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{n}</span>
    <p className="mt-2 text-xs font-semibold sm:text-sm">{label}</p>
    <p className="mt-1 text-[11px] text-muted-foreground">{sub}</p>
   </div>)}
  </nav>

  <section className="space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-6" aria-labelledby="video-step-one">
   <h2 id="video-step-one" className="text-lg font-semibold">1. Gerar resumo do vídeo</h2>
   <p className="text-sm text-muted-foreground">Cole um link público do YouTube. O resumo é gerado primeiro. Você decide depois se quer ouvir uma narração.</p>
   <label htmlFor="youtube-link" className="block text-sm font-medium">Link do YouTube</label>
   <input id="youtube-link" type="url" value={url} onChange={e=>setUrl(e.target.value)} disabled={busy} autoComplete="url" placeholder="https://www.youtube.com/watch?v=..." className="w-full min-w-0 rounded-lg border border-border bg-background px-3 py-3 text-sm" maxLength={300}/>
   <fieldset className="space-y-2" disabled={busy}>
    <legend className="text-sm font-medium">Tipo de análise</legend>
    <div className="grid gap-2 sm:grid-cols-2">
     {([["summary","Resumo inteligente","Organiza os principais conceitos"],["transcript","Transcrição","Texto das falas do vídeo"]] as const).map(([value,label,description])=>
      <label key={value} className={`flex cursor-pointer gap-3 rounded-lg border p-3 ${mode===value?"border-primary bg-primary/5":"border-border"}`}>
       <input type="radio" name="video-mode" checked={mode===value} onChange={()=>setMode(value)} className="mt-1 accent-primary"/>
       <span><strong className="block text-sm">{label}</strong><span className="text-xs text-muted-foreground">{description}</span></span>
      </label>)}
    </div>
   </fieldset>
   <label className="flex items-start gap-3 text-sm text-muted-foreground">
    <input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} disabled={busy} className="mt-1 accent-primary"/>
    Autorizo o envio do link para a IA processar o conteúdo público do vídeo.
   </label>
   <Button disabled={busy||!url.trim()||!consent} onClick={()=>void run()}>{busy?"Analisando vídeo...":mode==="summary"?"Gerar resumo":"Gerar transcrição"}</Button>
   {busy&&<p role="status" className="text-sm text-muted-foreground">O vídeo está sendo analisado. Mantenha esta aba aberta durante o processamento, que pode durar alguns minutos.</p>}
   <p className="text-xs text-muted-foreground">Homologação livre para experimentar o fluxo. Sem necessidade de login; o armazenamento local é provisório e restrito a este navegador. Permanecem proteções técnicas contra uso abusivo.</p>
  </section>

  {error&&<p role="alert" className="rounded-xl border border-destructive/40 bg-card p-4 text-sm">{error}</p>}
  {notice&&<p role="status" className="rounded-xl border border-border bg-card p-4 text-sm">{notice}</p>}

  <section className="space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-6" aria-labelledby="video-step-two">
   <div><h2 id="video-step-two" className="text-lg font-semibold">2. Resultado do resumo</h2>
    <p className="mt-1 text-sm text-muted-foreground">Leia o resultado e salve se quiser. Sem login, o resumo fica guardado somente neste navegador de teste.</p></div>
   {!result?<p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">O resultado aparecerá aqui depois da primeira etapa.</p>:
   <>
    <p className="break-all text-xs text-muted-foreground">Vídeo original: <a className="underline" href={result.source} target="_blank" rel="noopener noreferrer">{result.source}</a></p>
    {result.partial&&<p role="status" className="text-sm text-amber-700">O resultado pode estar incompleto. Não considere uma transcrição integral sem conferir.</p>}
    <div className="flex flex-wrap gap-2">
     <Button variant="outline" onClick={()=>void copy()}>Copiar texto</Button>
     <Button disabled={saving} onClick={()=>void save()}>{saving?"Salvando...":saved?"Atualizar resumo salvo":"Salvar resumo"}</Button>
     {saved&&<Button asChild variant="outline"><Link href="/conta/projetos">Abrir biblioteca e playlists</Link></Button>}
    </div>
    <div className="whitespace-pre-wrap break-words rounded-lg border border-border bg-background p-4 text-sm leading-7">{result.text}</div>
    <p className="text-xs text-muted-foreground">Conteúdo elaborado por IA. Confira fatos e citações importantes com o vídeo original.</p>
   </>}
  </section>

  <section className="space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-6" aria-labelledby="video-step-three">
   <div><h2 id="video-step-three" className="text-lg font-semibold">3. Áudio do resumo</h2>
    <p className="mt-1 text-sm text-muted-foreground">Opcional. Gere o áudio diretamente, sem login e sem precisar salvar o texto antes. Você também pode parar no resumo.</p></div>
   {result?.mode==="transcript"?<p className="text-sm text-muted-foreground">A narração está disponível para o modo Resumo inteligente. A transcrição pode ser lida e salva normalmente.</p>:
    !result?<p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">O botão de áudio aparece após a geração do resumo.</p>:
    <>
     <Button disabled={audioBusy||result.text.length>8000} onClick={()=>void generateAudio()}>{audioBusy?"Gerando narração...":audioUrl?"Ouvir narração existente":"Gerar áudio do resumo"}</Button>
     {!saved&&<p className="text-xs text-muted-foreground">Para guardar o áudio numa playlist, salve também o resumo. Não é necessário para ouvir agora.</p>}
     {result.text.length>8000&&<p className="text-xs text-amber-700">Esta narração excede 8.000 caracteres. Será necessário dividir o texto em blocos em uma atualização futura.</p>}
     {audioBusy&&<p role="status" className="text-sm text-muted-foreground">A narração está sendo preparada pelo Gemini. Aguarde com esta aba aberta.</p>}
     {audioUrl&&<div className="space-y-2"><audio key={audioUrl} controls preload="metadata" src={audioUrl} className="w-full" controlsList="nodownload"/><p className="text-xs text-muted-foreground">{audioExpiry?`Áudio salvo até ${new Date(audioExpiry).toLocaleDateString("pt-BR")}.`:"Áudio disponível neste navegador de teste."} Sem opção de download na ferramenta.</p></div>}
     <p className="text-xs text-muted-foreground">Ouça também seus áudios em sequência na Biblioteca de Projetos.</p>
    </>}
  </section>
 </div>;
}
