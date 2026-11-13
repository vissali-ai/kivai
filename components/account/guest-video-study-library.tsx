"use client";
import Link from "next/link";
import {useEffect,useRef,useState} from "react";
import {Button} from "@/components/ui/button";
import {guestStudies,guestLists,storeGuestLists,storeGuestStudies,getGuestAudio,deleteGuestAudio,type GuestStudy,type GuestPlaylist} from "@/lib/video-studies/guest-preview";

export function GuestVideoStudyLibrary(){
 const [studies,setStudies]=useState<GuestStudy[]>([]);
 const [lists,setLists]=useState<GuestPlaylist[]>([]);
 const [name,setName]=useState("");
 const [selected,setSelected]=useState<Record<string,string>>({});
 const [playing,setPlaying]=useState<{ids:string[];index:number}|null>(null);
 const [src,setSrc]=useState("");
 const [message,setMessage]=useState("");
 const [available,setAvailable]=useState<Record<string,boolean>>({});
 const audioRef=useRef<HTMLAudioElement|null>(null);
 useEffect(()=>{const s=guestStudies();setStudies(s);setLists(guestLists());void Promise.all(s.map(async x=>[x.id,Boolean(await getGuestAudio(x.id))] as const)).then(a=>setAvailable(Object.fromEntries(a))).catch(()=>{});},[]);
 const current=playing?studies.find(x=>x.id===playing.ids[playing.index]):undefined;
 function updateLists(next:GuestPlaylist[]){storeGuestLists(next);setLists(next);}
 function makeList(){
  const clean=name.trim();if(!clean)return;
  updateLists([...lists,{id:crypto.randomUUID(),name:clean.slice(0,80),ids:[]}]);
  setName("");setMessage("Playlist criada neste navegador.");
 }
 function addToList(listId:string,projectId:string){
  if(!projectId)return;
  updateLists(lists.map(list=>list.id===listId&&!list.ids.includes(projectId)?{...list,ids:[...list.ids,projectId]}:list));
  setSelected(v=>({...v,[listId]:""}));setMessage("Resumo adicionado à playlist.");
 }
 async function start(ids:string[],index:number){
  if(index<0||index>=ids.length)return;
  const id=ids[index];
  setPlaying({ids,index});setMessage("");
  try{
   const blob=await getGuestAudio(id);
   if(!blob){setMessage("Este resumo ainda não tem áudio. Abra-o na ferramenta e gere a narração.");return;}
   setSrc(URL.createObjectURL(blob));
  }catch{setMessage("Não foi possível carregar o áudio armazenado neste navegador.");}
 }
 function ended(){
  if(!playing)return;
  const next=playing.index+1;
  if(next<playing.ids.length)void start(playing.ids,next);
  else setMessage("Fim da playlist.");
 }
 useEffect(()=>{
  if(!src||!audioRef.current)return;
  const audio=audioRef.current;audio.load();void audio.play().catch(()=>setMessage("Clique em reproduzir para continuar a playlist."));
  if("mediaSession" in navigator&&current)try{
   navigator.mediaSession.metadata=new MediaMetadata({title:current.title,artist:"Kivai",album:"Prévia de estudos"});
  }catch{/* optional */}
  return()=>{URL.revokeObjectURL(src);};
 },[src,current?.title]);
 async function removeStudy(id:string){
  if(!window.confirm("Excluir este resumo e seu áudio do navegador?"))return;
  const next=studies.filter(x=>x.id!==id);
  storeGuestStudies(next);setStudies(next);
  updateLists(lists.map(x=>({...x,ids:x.ids.filter(v=>v!==id)})));
  await deleteGuestAudio(id);setAvailable(a=>({...a,[id]:false}));
 }
 return <section className="space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-6" aria-label="Biblioteca temporária de estudos">
  <div><h2 className="text-xl font-semibold">Estudos e playlists, modo de teste</h2>
   <p className="mt-1 text-sm text-muted-foreground">Sem login. Seus resumos, listas e áudios ficam neste navegador. Não são sincronizados entre dispositivos nem armazenados na conta Kivai.</p></div>
  {message&&<p role="status" className="text-sm text-muted-foreground">{message}</p>}
  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground"><span>{studies.length} resumos</span><span>{lists.length} playlists</span><span>{Object.values(available).filter(Boolean).length} áudios locais</span></div>
  <div className="flex flex-wrap gap-2">
   <label className="min-w-0 flex-1 text-sm">Criar playlist
    <input className="mt-1 w-full rounded-lg border border-border bg-background p-3" placeholder="Ex.: Aulas de programação" maxLength={80} value={name} onChange={e=>setName(e.target.value)}/>
   </label>
   <Button className="self-end" onClick={makeList} disabled={!name.trim()}>Criar lista</Button>
  </div>
  {current&&<div className="space-y-2 rounded-lg border border-primary/30 p-3">
   <h3 className="text-sm font-semibold">Ouvindo: {current.title}</h3>
   <audio ref={audioRef} src={src} controls controlsList="nodownload" className="w-full" preload="metadata" onEnded={ended}/>
   <div className="flex gap-2">
    <Button variant="outline" size="sm" disabled={!playing||playing.index===0} onClick={()=>playing&&void start(playing.ids,playing.index-1)}>Anterior</Button>
    <Button variant="outline" size="sm" disabled={!playing||playing.index>=playing.ids.length-1} onClick={()=>playing&&void start(playing.ids,playing.index+1)}>Próximo</Button>
   </div>
  </div>}
  {lists.map(list=>{
   const items=list.ids.map(id=>studies.find(s=>s.id===id)).filter((s):s is GuestStudy=>Boolean(s));
   const allAudio=items.filter(s=>available[s.id]).map(s=>s.id);
   return <div key={list.id} className="space-y-3 rounded-lg border border-border p-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
     <div><h3 className="font-medium">{list.name}</h3><p className="text-xs text-muted-foreground">{items.length} resumos</p></div>
     <div className="flex gap-2">
      <Button variant="outline" size="sm" disabled={!allAudio.length} onClick={()=>void start(allAudio,0)}>Ouvir em sequência</Button>
      <Button variant="outline" size="sm" onClick={()=>{if(window.confirm("Excluir playlist? Os resumos serão preservados."))updateLists(lists.filter(x=>x.id!==list.id));}}>Excluir lista</Button>
     </div>
    </div>
    {items.map(item=><div key={item.id} className="flex flex-wrap items-center gap-2 rounded-md bg-muted/40 p-2">
     <Link className="min-w-0 flex-1 text-sm underline-offset-4 hover:underline" href={`/ferramentas/transcrever-resumir-video?project=${item.id}`}>{item.title}</Link>
     <span className="text-xs text-muted-foreground">{available[item.id]?"Com áudio":"Somente texto"}</span>
     <Button variant="ghost" size="sm" onClick={()=>updateLists(lists.map(p=>p.id===list.id?{...p,ids:p.ids.filter(id=>id!==item.id)}:p))}>Retirar</Button>
    </div>)}
    <div className="flex flex-wrap gap-2">
     <select aria-label={`Adicionar estudo à playlist ${list.name}`} className="min-w-0 flex-1 rounded-lg border bg-background p-2 text-sm" value={selected[list.id]??""} onChange={e=>setSelected(v=>({...v,[list.id]:e.target.value}))}>
      <option value="">Escolher resumo...</option>
      {studies.filter(s=>!list.ids.includes(s.id)).map(s=><option key={s.id} value={s.id}>{s.title}</option>)}
     </select>
     <Button size="sm" variant="outline" disabled={!selected[list.id]} onClick={()=>addToList(list.id,selected[list.id])}>Adicionar</Button>
    </div>
   </div>;
  })}
  <div className="space-y-2">
   <h3 className="text-sm font-semibold">Resumos armazenados neste navegador</h3>
   {studies.length===0?<p className="rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">Ainda não há resumos. Gere um na ferramenta e clique em Salvar resumo.</p>:studies.map(study=>
    <div key={study.id} className="flex flex-wrap items-center gap-2 border-b border-border py-2">
     <Link href={`/ferramentas/transcrever-resumir-video?project=${study.id}`} className="min-w-0 flex-1 text-sm underline-offset-4 hover:underline">{study.title}</Link>
     {available[study.id]?<Button size="sm" variant="outline" onClick={()=>void start([study.id],0)}>Ouvir</Button>:<span className="text-xs text-muted-foreground">Sem áudio</span>}
     <Button variant="ghost" size="sm" onClick={()=>void removeStudy(study.id)}>Excluir</Button>
    </div>)}
  </div>
 </section>;
}
