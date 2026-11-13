"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getStoredSession } from "@/lib/user-auth";
import { guestStudies, storeGuestStudies, putGuestAudio, getGuestAudio, deleteGuestAudio } from "@/lib/video-studies/guest-preview";

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
 return await accountRequest("/api/account/video-studies/audio/complete","POST",payload) as {expiresAt?:string};
}
export default function YoutubeVideoPreviewClient(){
 const [url,setUrl]=useState("");
 const urlInputRef=useRef<HTMLInputElement>(null);
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
 const running=useRef(false);
 async function importGuestStudy(guest:ReturnType<typeof guestStudies>[number]){
  try{
   const response=await accountRequest("/api/account/video-studies","POST",{
    id:guest.id,title:guest.title,revision:0,text:guest.text,source:guest.source,mode:"summary",partial:guest.partial
   });
   const project=response.project as {id:string;revision:number;title:string};
   const blob=await getGuestAudio(guest.id).catch(()=>null);
   let audioSaved=false;
   if(blob){
    const proofData=JSON.parse(localStorage.getItem(`kivai_video_audio_proof_${guest.id}`)||"null") as {proof?:string;sha?:string}|null;
    setAudioBlob(blob);
    setAudioUrl(current=>current||URL.createObjectURL(blob));
    if(proofData?.proof&&proofData.sha){
     setAudioProof(proofData.proof);setAudioSha(proofData.sha);
     try{
      const savedAudio=await uploadNarration(project.id,blob,proofData.proof,proofData.sha);
      setAudioStored(true);setAudioExpires(savedAudio.expiresAt||"");
      localStorage.removeItem(`kivai_video_audio_proof_${guest.id}`);
      await deleteGuestAudio(guest.id).catch(()=>{});
      audioSaved=true;
     }catch{
      setAudioStored(false);
     }
    }
   }
   storeGuestStudies(guestStudies().filter(x=>x.id!==guest.id));
   setSaved({id:project.id,revision:project.revision,title:project.title,guest:false});
   setNotice(blob
    ?audioSaved?"Resumo e áudio importados para sua conta.":"Resumo salvo na sua conta. O áudio permanece disponível nesta página e pode ser salvo novamente."
    :"Resumo salvo automaticamente na sua conta.");
   window.history.replaceState({}, "", "/ferramentas/resumir-video-youtube");
  }catch(e){
   setError(e instanceof Error?e.message:"Não foi possível transferir o resumo para sua conta.");
  }
 }
 useEffect(()=>{
  const session=Boolean(bearer());
  const id=new URLSearchParams(window.location.search).get("project");
  if(!id||!/^[a-f\d-]{36}$/i.test(id))return;
  let active=true;
  const guest=guestStudies().find(x=>x.id===id);
  if(guest){
   setSaved({id:guest.id,revision:0,title:guest.title,guest:true});
   setUrl(guest.source);
   setResult({text:guest.text,source:guest.source,mode:"summary",partial:guest.partial});
   void getGuestAudio(guest.id).then(blob=>{if(active&&blob){setAudioBlob(blob);setAudioUrl(URL.createObjectURL(blob));}}).catch(()=>{});
   if(session)void importGuestStudy(guest);
  }else if(session){
   void accountRequest("/api/account/video-studies").then(data=>{
    const p=(data.projects as AccountProject[]).find(x=>x.id===id);
    if(!p||!active||typeof p.payload.text!=="string"||typeof p.payload.source!=="string")return;
    setSaved({id:p.id,title:p.title,revision:p.revision,guest:false});
    setUrl(p.payload.source);
    setResult({text:p.payload.text,source:p.payload.source,mode:"summary",partial:p.payload.partial===true});
    if(!requestedId)setNotice("Último resumo recuperado da sua biblioteca.");
    const asset=(data.audios as {project_id:string;expires_at:string}[]).find(x=>x.project_id===p.id&&Date.parse(x.expires_at)>Date.now());
    if(asset)void accountRequest(`/api/account/video-studies/audio?id=${id}`).then(a=>{
     if(active){setAudioUrl(a.url);setAudioExpires(a.expiresAt);setAudioStored(true);}
    }).catch(()=>{});
    else void getGuestAudio(id).then(blob=>{
     if(active&&blob){
      setAudioBlob(blob);setAudioUrl(URL.createObjectURL(blob));
      const proofData=JSON.parse(localStorage.getItem(`kivai_video_audio_proof_${id}`)||"null") as {proof?:string;sha?:string}|null;
      if(proofData?.proof&&proofData.sha){setAudioProof(proofData.proof);setAudioSha(proofData.sha);}
     }
    }).catch(()=>{});
   }).catch(()=>{if(active)setError("Não foi possível abrir este resumo salvo.");});
  }
  return()=>{active=false;};
 },[]);
 async function pasteYoutubeLink(){
  setError("");setNotice("");
  try{
   if(!navigator.clipboard?.readText)throw new Error("clipboard-unavailable");
   const pasted=(await navigator.clipboard.readText()).trim();
   if(!pasted)throw new Error("clipboard-empty");
   setUrl(pasted);
   setNotice("Link colado. Agora você pode gerar o resumo.");
   urlInputRef.current?.focus();
  }catch{
   urlInputRef.current?.focus();
   setNotice("Toque no campo do link e escolha “Colar” no menu do aparelho. Se o navegador pedir permissão para acessar a área de transferência, autorize.");
  }
 }
 function handleLinkPaste(event:React.ClipboardEvent<HTMLInputElement>){
  const pasted=event.clipboardData.getData("text/plain").trim();
  if(!pasted)return;
  event.preventDefault();
  setUrl(pasted);
  setError("");setNotice("Link colado. Agora você pode gerar o resumo.");
 }
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
   const summary=data as Summary;
   setResult(summary);
   if(!bearer()){
    const id=crypto.randomUUID();
    const title=titleOf(summary.text);
    storeGuestStudies([{id,title,source:summary.source,text:summary.text,mode:"summary",partial:summary.partial,createdAt:new Date().toISOString()},...guestStudies().filter(x=>x.id!==id)]);
    setSaved({id,revision:0,title,guest:true});
   }
   setNotice("Resumo pronto. Você pode entrar para salvá-lo na sua conta ou continuar e gerar o áudio.");
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
    setNotice("Resumo mantido neste dispositivo. Entre na conta para guardá-lo na sua biblioteca.");
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
    await putGuestAudio(saved.id,blob);
    localStorage.setItem(`kivai_video_audio_proof_${saved.id}`,JSON.stringify({proof,sha}));
    setNotice("Áudio pronto e mantido nesta sessão. Entre para salvar o resumo e a narração na sua conta.");
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
   <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
    <input ref={urlInputRef} id="youtube-link" type="url" inputMode="url" value={url} onChange={e=>setUrl(e.target.value)} onPaste={handleLinkPaste} disabled={busy} autoComplete="url" autoCapitalize="none" autoCorrect="off" spellCheck={false} enterKeyHint="go" placeholder="https://www.youtube.com/watch?v=..." className="w-full min-w-0 rounded-lg border border-border bg-background px-3 py-3 text-base sm:text-sm" maxLength={300}/>
    <Button type="button" variant="outline" disabled={busy} onClick={()=>void pasteYoutubeLink()}>Colar link</Button>
   </div>
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
     {bearer()
      ?<Button disabled={saving} onClick={()=>void saveSummary()}>{saving?"Salvando...":saved&&!saved.guest?"Atualizar resumo salvo":"Salvar resumo"}</Button>
      :<Button asChild disabled={saving}><Link href="/conta/login?next=%2Fconta">Salvar resumo</Link></Button>}
     {saved&&!saved.guest&&<Button asChild variant="outline"><Link href="/conta/projetos">Minha Biblioteca</Link></Button>}
    </div>
    {saved?.guest&&<div className="rounded-xl border border-primary/25 bg-primary/[0.04] p-4">
     <p className="text-sm font-semibold">Quer guardar este resumo na sua conta?</p>
     <p className="mt-1 text-sm text-muted-foreground">Entre ou crie sua conta para manter este resumo na sua biblioteca e acessá-lo em outros dispositivos. Você também pode gerar o áudio antes de entrar.</p>
     <div className="mt-3 flex flex-wrap gap-2">
      <Button asChild><Link href="/conta/login?next=%2Fconta">Entrar para salvar</Link></Button>
      <Button asChild variant="outline"><Link href="/conta/cadastro?next=%2Fconta">Criar conta</Link></Button>
     </div>
    </div>}
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
     {audioUrl&&saved?.guest&&<div className="rounded-xl border border-primary/25 bg-primary/[0.04] p-4">
      <p className="text-sm font-semibold">Seu áudio está pronto!</p>
      <p className="mt-1 text-sm text-muted-foreground">Entre ou crie sua conta para salvar o resumo e esta narração na sua biblioteca.</p>
      <div className="mt-3 flex flex-wrap gap-2">
       <Button asChild><Link href="/conta/login?next=%2Fconta">Entrar para salvar</Link></Button>
       <Button asChild variant="outline"><Link href="/conta/cadastro?next=%2Fconta">Criar conta</Link></Button>
      </div>
     </div>}
     {audioUrl&&!audioStored&&saved&&!saved.guest&&audioBlob&&<Button variant="outline" disabled={saving} onClick={()=>void saveSummary()}>Salvar áudio na biblioteca</Button>}
     <p className="text-xs text-muted-foreground"><Link href="/conta/projetos" className="underline underline-offset-2">Organize seus resumos em playlists na Minha Biblioteca</Link>.</p>
    </>}
  </section>
 </div>;
}
