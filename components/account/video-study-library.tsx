"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { getStoredSession } from "@/lib/user-auth";
import { GuestVideoStudyLibrary } from "@/components/account/guest-video-study-library";

type Project={id:string;title:string;payload:{source?:string;text?:string;mode?:string};updated_at:string};
type Audio={project_id:string;expires_at:string;size_bytes:number};
type Playlist={id:string;name:string};
type Entry={playlist_id:string;project_id:string;position:number};
type Library={projects:Project[];audios:Audio[];playlists:Playlist[];entries:Entry[];usage:Array<{summaries:number;audio:number}>};
const empty:Library={projects:[],audios:[],playlists:[],entries:[],usage:[]};
async function api(path:string,method="GET",body?:unknown){
 const session=getStoredSession();
 if(!session?.access_token)throw new Error("Entre na sua conta para acessar a biblioteca.");
 const r=await fetch(path,{method,headers:{"Authorization":`Bearer ${session.access_token}`,"Content-Type":"application/json"},...(body===undefined?{}:{body:JSON.stringify(body)}),cache:"no-store"});
 const data=await r.json();
 if(!r.ok)throw new Error(data.error??"Não foi possível concluir a operação.");
 return data;
}

export function VideoStudyLibrary({previewGuest=false}:{previewGuest?:boolean}){
 const [data,setData]=useState<Library>(empty);
 const [loaded,setLoaded]=useState(false);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const [name,setName]=useState("");
 const [busy,setBusy]=useState(false);
 const [selected,setSelected]=useState("");
 const [queue,setQueue]=useState<string[]>([]);
 const [currentIndex,setCurrentIndex]=useState(-1);
 const [currentUrl,setCurrentUrl]=useState("");
 const [playNotice,setPlayNotice]=useState("");
 const audioRef=useRef<HTMLAudioElement|null>(null);
 const playingRef=useRef(false);
 const currentId=queue[currentIndex];
 const current=data.projects.find(p=>p.id===currentId);
 const refresh=useCallback(async()=>{
  try{
   const next=await api("/api/account/video-studies") as Library;
   setData(next);setError("");
  }catch(cause){setError(cause instanceof Error?cause.message:"Biblioteca indisponível.");}
  finally{setLoaded(true);}
 },[]);
 useEffect(()=>{if(getStoredSession()?.access_token)void refresh();else setLoaded(true);},[refresh]);
 function hasAudio(projectId:string){return data.audios.some(a=>a.project_id===projectId&&Date.parse(a.expires_at)>Date.now());}
 async function mutate(path:string,method:string,body?:unknown){
  setBusy(true);setError("");setNotice("");
  try{await api(path,method,body);await refresh();setNotice("Biblioteca atualizada.");}
  catch(cause){setError(cause instanceof Error?cause.message:"Não foi possível atualizar.");}
  finally{setBusy(false);}
 }
 async function createList(){
  if(!name.trim()||busy)return;
  await mutate("/api/account/video-studies/playlists","POST",{name:name.trim()});setName("");
 }
 async function playAt(list:string[],index:number){
  if(index<0||index>=list.length)return;
  const projectId=list[index];
  setQueue(list);setCurrentIndex(index);setPlayNotice("");
  try{
   const result=await api(`/api/account/video-studies/audio?id=${encodeURIComponent(projectId)}`);
   setCurrentUrl(result.url);
   playingRef.current=true;
  }catch(cause){setPlayNotice(cause instanceof Error?cause.message:"Áudio indisponível.");playingRef.current=false;}
 }
 useEffect(()=>{
  if(!currentUrl||!playingRef.current)return;
  const audio=audioRef.current;
  if(!audio)return;
  audio.load();
  void audio.play().catch(()=>{
   setPlayNotice("Clique em reproduzir para continuar. O navegador bloqueou o início automático.");
  });
  if("mediaSession" in navigator&&current){
   try{navigator.mediaSession.metadata=new MediaMetadata({title:current.title,artist:"Kivai",album:"Minha Biblioteca"});}
   catch{/* Recurso opcional do dispositivo. */}
  }
 },[currentUrl,currentId,current?.title]);
 function onEnded(){
  const next=queue.findIndex((id,i)=>i>currentIndex&&hasAudio(id));
  if(next>=0)void playAt(queue,next);
  else{playingRef.current=false;setPlayNotice("Fim da playlist.");}
 }
 function startPlaylist(playlistId:string){
  const ordered=data.entries.filter(e=>e.playlist_id===playlistId).sort((a,b)=>a.position-b.position).map(e=>e.project_id).filter(hasAudio);
  if(!ordered.length){setPlayNotice("Esta playlist ainda não contém áudios disponíveis.");return;}
  void playAt(ordered,0);
 }
 if(previewGuest)return <GuestVideoStudyLibrary/>;
 if(!loaded)return <p className="text-sm text-muted-foreground">Carregando biblioteca de áudios...</p>;
 if(!getStoredSession()?.access_token)return <GuestVideoStudyLibrary/>;
 return <section className="space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-6" aria-label="Playlists e resumos narrados">
  <div>
   <h2 className="text-xl font-semibold">Estudos e playlists</h2>
   <p className="mt-1 text-sm text-muted-foreground">Organize os resumos salvos e escute uma playlist em sequência. Os vídeos originais permanecem apenas como links.</p>
  </div>
  {error&&<p role="alert" className="text-sm text-destructive">{error}</p>}
  {notice&&<p role="status" className="text-sm text-muted-foreground">{notice}</p>}
  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
   <span>{data.projects.length} resumos salvos</span><span>{data.audios.filter(a=>Date.parse(a.expires_at)>Date.now()).length} áudios disponíveis</span><span>{data.playlists.length} playlists</span>
   {data.usage[0]&&<span>Este mês: {data.usage[0].summaries} análises e {data.usage[0].audio} narrações</span>}
  </div>
  <div className="flex flex-wrap items-end gap-2">
   <label className="min-w-0 flex-1 text-sm">Nova playlist
    <input className="mt-1 w-full rounded-lg border border-border bg-background p-3 text-sm" value={name} maxLength={80} onChange={event=>setName(event.target.value)} placeholder="Ex.: Aprendizado sobre IA"/>
   </label>
   <Button variant="outline" disabled={busy||!name.trim()} onClick={()=>void createList()}>Criar playlist</Button>
  </div>
  {current&&<div className="space-y-2 rounded-lg border border-primary/30 p-3">
   <p className="text-sm font-medium">Ouvindo: {current.title}</p>
   <audio ref={audioRef} controls controlsList="nodownload" preload="metadata" src={currentUrl} onEnded={onEnded} className="w-full"/>
   <div className="flex flex-wrap gap-2">
    <Button size="sm" variant="outline" disabled={currentIndex<=0} onClick={()=>void playAt(queue,currentIndex-1)}>Anterior</Button>
    <Button size="sm" variant="outline" disabled={currentIndex>=queue.length-1} onClick={()=>void playAt(queue,currentIndex+1)}>Próximo</Button>
    <span className="self-center text-xs text-muted-foreground">{currentIndex+1}/{queue.length}</span>
   </div>
  </div>}
  {playNotice&&<p className="text-sm text-muted-foreground" role="status">{playNotice}</p>}
  {data.playlists.length===0?<p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">Crie sua primeira playlist para organizar os áudios por tema.</p>:
   <div className="space-y-3">{data.playlists.map(list=>{
    const entries=data.entries.filter(e=>e.playlist_id===list.id).sort((a,b)=>a.position-b.position);
    const available=data.projects.filter(p=>!entries.some(e=>e.project_id===p.id));
    return <div key={list.id} className="space-y-3 rounded-xl border border-border p-3">
     <div className="flex flex-wrap items-center justify-between gap-2">
      <div><h3 className="font-semibold">{list.name}</h3><p className="text-xs text-muted-foreground">{entries.length} resumos</p></div>
      <div className="flex gap-2">
       <Button size="sm" variant="outline" onClick={()=>startPlaylist(list.id)}>Ouvir sequência</Button>
       <Button size="sm" variant="outline" disabled={busy} onClick={()=>{
        if(window.confirm(`Excluir a playlist "${list.name}"? Os resumos serão preservados.`))void mutate(`/api/account/video-studies/playlists?id=${list.id}`,"DELETE");
       }}>Excluir lista</Button>
      </div>
     </div>
     {entries.map(entry=>{
      const p=data.projects.find(v=>v.id===entry.project_id);
      if(!p)return null;
      return <div key={entry.project_id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/40 p-2 text-sm">
       <div className="min-w-0 flex-1"><Link className="font-medium underline-offset-4 hover:underline" href={`/ferramentas/transcrever-resumir-video?project=${p.id}`}>{p.title}</Link><p className="text-xs text-muted-foreground">{hasAudio(p.id)?"Áudio disponível":"Sem áudio ou expirado"}</p></div>
       <div className="flex gap-1">
        <Button size="sm" variant="outline" disabled={!hasAudio(p.id)} onClick={()=>void playAt(entries.map(x=>x.project_id).filter(hasAudio),entries.map(x=>x.project_id).filter(hasAudio).indexOf(p.id))}>Ouvir</Button>
        <Button size="sm" variant="ghost" disabled={busy} onClick={()=>void mutate(`/api/account/video-studies/playlists?id=${list.id}&projectId=${p.id}`,"DELETE")}>Retirar</Button>
       </div>
      </div>;
     })}
     {available.length>0&&<div className="flex flex-wrap gap-2">
      <select className="min-w-0 flex-1 rounded-lg border border-border bg-background p-2 text-sm" aria-label={`Escolher resumo para ${list.name}`} value={selected} onChange={e=>setSelected(e.target.value)}>
       <option value="">Adicionar resumo salvo...</option>
       {available.map(p=><option key={p.id} value={p.id}>{p.title}</option>)}
      </select>
      <Button size="sm" variant="outline" disabled={busy||!selected||!available.some(p=>p.id===selected)} onClick={()=>void mutate("/api/account/video-studies/playlists","PUT",{playlistId:list.id,projectId:selected,position:entries.length}).then(()=>setSelected(""))}>Adicionar</Button>
     </div>}
    </div>;
   })}</div>}
  {data.projects.length>0&&<div className="space-y-2">
   <h3 className="text-sm font-semibold">Resumos recentes</h3>
   {data.projects.slice(0,8).map(p=><div key={p.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-2">
    <Link href={`/ferramentas/transcrever-resumir-video?project=${p.id}`} className="text-sm font-medium underline-offset-4 hover:underline">{p.title}</Link>
    {hasAudio(p.id)?<Button size="sm" variant="outline" onClick={()=>void playAt([p.id],0)}>Ouvir</Button>:<span className="text-xs text-muted-foreground">Somente texto</span>}
   </div>)}
  </div>}
 </section>;
}
