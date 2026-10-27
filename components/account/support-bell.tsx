"use client";
import Link from "next/link";
import {useCallback,useEffect,useRef,useState} from "react";
import {Bell,Check,MessageSquare} from "lucide-react";
import {getStoredSession} from "@/lib/user-auth";
type Notice={id:string;ticket_id:string;kind:string;title:string;read_at:string|null;created_at:string};
export function SupportBell(){
 const [notices,setNotices]=useState<Notice[]>([]);
 const [open,setOpen]=useState(false);
 const [busy,setBusy]=useState(false);
 const box=useRef<HTMLDivElement>(null);
 const refresh=useCallback(async()=>{
  const token=getStoredSession()?.access_token;if(!token)return;
  try{
   const res=await fetch("/api/account/support/notifications",{headers:{Authorization:`Bearer ${token}`},cache:"no-store"});
   if(res.ok){const data=await res.json() as {notifications:Notice[]};setNotices(data.notifications)}
  }catch{/* Keep previous state when offline. */}
 },[]);
 useEffect(()=>{
  void refresh();
  const id=window.setInterval(()=>{if(document.visibilityState==="visible")void refresh()},30000);
  const update=()=>{if(document.visibilityState==="visible")void refresh()};
  window.addEventListener("focus",update);document.addEventListener("visibilitychange",update);
  return ()=>{window.clearInterval(id);window.removeEventListener("focus",update);document.removeEventListener("visibilitychange",update)};
 },[refresh]);
 useEffect(()=>{
  if(!open)return;
  const close=(e:MouseEvent)=>{if(box.current&&!box.current.contains(e.target as Node))setOpen(false)};
  document.addEventListener("mousedown",close);
  return ()=>document.removeEventListener("mousedown",close);
 },[open]);
 async function mark(ids:string[],all=false){
  const token=getStoredSession()?.access_token;
  if(!token)return;
  setBusy(true);
  try{
   const res=await fetch("/api/account/support/notifications",{method:"PATCH",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify(all?{all:true}:{ids})});
   if(res.ok)setNotices(current=>current.map(n=>all||ids.includes(n.id)?{...n,read_at:n.read_at||new Date().toISOString()}:n));
  }finally{setBusy(false)}
 }
 const unread=notices.filter(n=>!n.read_at).length;
 return <div ref={box} className="relative">
  <button type="button" onClick={()=>{setOpen(v=>!v);void refresh()}} aria-label={`Notificações de atendimento: ${unread} não lidas`} aria-expanded={open} title="Notificações" className="relative inline-flex size-10 items-center justify-center rounded-lg border border-border text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary">
   <Bell className="size-5"/>
   {unread>0?<span className="absolute -right-1.5 -top-1.5 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">{unread>9?"9+":unread}</span>:null}
  </button>
  {open?<section role="region" aria-label="Notificações de atendimento" className="absolute right-0 z-50 mt-2 w-[min(340px,calc(100vw-2rem))] rounded-xl border border-border bg-card p-3 shadow-xl">
   <div className="mb-2 flex items-center justify-between gap-2"><p className="font-semibold">Notificações</p>{unread?<button type="button" disabled={busy} onClick={()=>void mark([],true)} className="inline-flex items-center gap-1 text-xs text-primary hover:underline"><Check className="size-3.5"/>Marcar lidas</button>:null}</div>
   <div className="max-h-72 space-y-1 overflow-auto">
    {notices.length?notices.slice(0,15).map(n=><Link key={n.id} href={`/conta/atendimento?ticket=${encodeURIComponent(n.ticket_id)}`} onClick={()=>{setOpen(false);if(!n.read_at)void mark([n.id])}} className={`block rounded-lg border border-transparent p-3 text-sm hover:border-border hover:bg-muted/60 ${n.read_at?"":"bg-primary/10"}`}><span className="flex items-center gap-2"><MessageSquare className="size-4 shrink-0 text-primary"/><span className="font-medium">{n.title}</span>{!n.read_at?<span className="ml-auto size-2 shrink-0 rounded-full bg-red-600"/>:null}</span><span className="ml-6 mt-1 block text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString("pt-BR")}</span></Link>):<p className="p-4 text-sm text-muted-foreground">Nenhuma notificação de atendimento.</p>}
   </div>
   <Link href="/conta/atendimento" onClick={()=>setOpen(false)} className="mt-2 block border-t border-border pt-3 text-center text-sm font-medium text-primary hover:underline">Abrir Central de Atendimento</Link>
  </section>:null}
 </div>
}
