"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type Summary={id:string;user_id:string;title:string;payload:{source?:string;text?:string;mode?:string};updated_at:string};
type Audio={project_id:string;user_id:string;size_bytes:number;expires_at:string};
type Playlist={id:string;user_id:string;name:string};
type Snapshot={projects:Summary[];audios:Audio[];playlists:Playlist[];totals:{projects:number;audios:number;playlists:number;audioBytes:number;textBytes:number}};
const fmt=(bytes:number)=>bytes>=1048576?`${(bytes/1048576).toFixed(1)} MB`:`${(bytes/1024).toFixed(0)} KB`;
export function VideoStudyStorageAdmin(){
 const [data,setData]=useState<Snapshot|null>(null);
 const [loading,setLoading]=useState(false);
 const [message,setMessage]=useState("");
 const [search,setSearch]=useState("");
 const [selected,setSelected]=useState<Summary|null>(null);
 const [pending,setPending]=useState<{action:"audio"|"project"|"playlist";id:string;label:string}|null>(null);
 const [confirm,setConfirm]=useState("");
 async function load(){
  setLoading(true);setMessage("");
  try{
   const r=await fetch("/api/admin/video-study-storage",{cache:"no-store"});
   const j=await r.json();
   if(!r.ok)throw new Error(j.error??"Dados indisponíveis.");
   setData(j);
  }catch(e){setMessage(e instanceof Error?e.message:"Não foi possível consultar os dados.");}
  finally{setLoading(false);}
 }
 async function action(path:string,method:string,body:unknown){
  setLoading(true);setMessage("");
  try{
   const r=await fetch(path,{method,headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
   const j=await r.json();
   if(!r.ok)throw new Error(j.error??"Falha na operação.");
   setPending(null);setConfirm("");setSelected(null);
   setMessage(method==="POST"?`Limpeza concluída: ${j.removed} arquivos removidos.`:"Exclusão definitiva concluída.");
   const updated=await fetch("/api/admin/video-study-storage",{cache:"no-store"});
   if(updated.ok)setData(await updated.json());
  }catch(e){setMessage(e instanceof Error?e.message:"Erro inesperado.");}
  finally{setLoading(false);}
 }
 const normalized=search.toLowerCase();
 const summaries=data?.projects.filter(p=>`${p.title} ${p.user_id} ${p.payload.source??""}`.toLowerCase().includes(normalized))??[];
 return <section className="space-y-4 border border-border bg-card p-5" aria-label="Armazenamento de estudos dos usuários">
  <div className="flex flex-wrap items-center justify-between gap-3">
   <div><h2 className="text-xl font-semibold">Armazenamento de estudos</h2><p className="mt-1 text-sm text-muted-foreground">Inventário e remoção administrativa de resumos, áudios e playlists. Acesso restrito.</p></div>
   <Button variant="outline" disabled={loading} onClick={()=>void load()}>{loading?"Consultando...":"Atualizar dados"}</Button>
  </div>
  {message&&<p className="text-sm text-muted-foreground" role="status">{message}</p>}
  {data&&<>
   <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
    {[["Resumos",String(data.totals.projects)],["Áudios",String(data.totals.audios)],["Playlists",String(data.totals.playlists)],["Arquivos",fmt(data.totals.audioBytes)],["Texto",fmt(data.totals.textBytes)]].map(([k,v])=>
     <div key={k} className="border border-border p-3"><p className="text-xs text-muted-foreground">{k}</p><p className="mt-1 text-lg font-semibold">{v}</p></div>)}
   </div>
   <Button variant="outline" size="sm" disabled={loading} onClick={()=>{
    if(window.confirm("Remover áudios cujo período de retenção terminou? Os resumos serão preservados."))void action("/api/admin/video-study-storage","POST",{action:"cleanup_expired"});
   }}>Limpar áudios expirados (até 50 por lote)</Button>
   <label className="block text-sm">Buscar conteúdo ou identificador da conta
    <input type="search" className="mt-1 w-full rounded border border-border bg-background p-3" placeholder="Título, link ou ID do usuário" value={search} onChange={e=>setSearch(e.target.value)}/>
   </label>
   <div className="max-h-[440px] space-y-2 overflow-y-auto">
    {summaries.map(p=>{
     const audio=data.audios.find(a=>a.project_id===p.id);
     return <div key={p.id} className="flex flex-wrap items-center gap-2 border border-border p-3">
      <div className="min-w-0 flex-1"><p className="text-sm font-semibold">{p.title}</p><p className="break-all text-xs text-muted-foreground">Conta {p.user_id} · {p.updated_at.slice(0,10)} · {audio?fmt(audio.size_bytes):"Sem áudio"}</p></div>
      <Button size="sm" variant="outline" onClick={()=>setSelected(p)}>Ver texto</Button>
      {audio&&<Button size="sm" variant="outline" onClick={()=>{setPending({action:"audio",id:p.id,label:"o áudio de "+p.title});setConfirm("");}}>Excluir áudio</Button>}
      <Button size="sm" variant="destructive" onClick={()=>{setPending({action:"project",id:p.id,label:"o resumo "+p.title+" e seu áudio"});setConfirm("");}}>Excluir projeto</Button>
     </div>;
    })}
   </div>
   {data.playlists.length>0&&<details className="border border-border p-3"><summary className="cursor-pointer text-sm font-semibold">Playlists armazenadas ({data.playlists.length})</summary>
    <div className="mt-3 space-y-2">{data.playlists.map(p=><div key={p.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-border p-2 text-sm">
     <span>{p.name} <small className="block text-muted-foreground">Conta {p.user_id}</small></span>
     <Button size="sm" variant="destructive" onClick={()=>{setPending({action:"playlist",id:p.id,label:"a playlist "+p.name});setConfirm("");}}>Excluir playlist</Button>
    </div>)}</div>
   </details>}
  </>}
  {selected&&<div className="space-y-2 rounded-lg border border-border p-3">
   <div className="flex items-center justify-between gap-2"><h3 className="text-sm font-semibold">{selected.title}</h3><Button size="sm" variant="outline" onClick={()=>setSelected(null)}>Fechar</Button></div>
   <p className="break-all text-xs text-muted-foreground">Fonte: {selected.payload.source}</p>
   <p className="max-h-48 overflow-auto whitespace-pre-wrap text-sm">{selected.payload.text}</p>
  </div>}
  {pending&&<div className="space-y-3 rounded-lg border border-destructive/40 p-4" role="group" aria-label="Confirmar exclusão irreversível">
   <p className="text-sm font-semibold">Excluir definitivamente {pending.label}?</p>
   <p className="text-xs text-muted-foreground">Essa ação remove os registros e o arquivo armazenado, quando aplicável. Não é possível desfazer.</p>
   <label className="block text-sm">Digite EXCLUIR DEFINITIVAMENTE
    <input value={confirm} onChange={e=>setConfirm(e.target.value)} className="mt-1 w-full rounded border border-border bg-background p-2"/>
   </label>
   <div className="flex gap-2">
    <Button variant="destructive" disabled={loading||confirm!=="EXCLUIR DEFINITIVAMENTE"} onClick={()=>void action("/api/admin/video-study-storage","DELETE",{...pending,confirm})}>Excluir permanentemente</Button>
    <Button variant="outline" onClick={()=>{setPending(null);setConfirm("");}}>Cancelar</Button>
   </div>
  </div>}
 </section>;
}
