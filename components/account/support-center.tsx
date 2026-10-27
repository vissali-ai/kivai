"use client";
import Link from "next/link";
import {useCallback,useEffect,useState} from "react";
import {ArrowLeft,Headset,MessageSquarePlus,Paperclip,RefreshCw,Send} from "lucide-react";
import {getStoredSession} from "@/lib/user-auth";
import {SupportBell} from "@/components/account/support-bell";

type Ticket={id:string;protocol:string;category:string;title:string;status:string;created_at:string;updated_at:string;source_url:string|null};
type Msg={id:string;ticket_id:string;author_type:"usuario"|"admin";body:string;created_at:string};
type Attachment={id:string;ticket_id:string;message_id:string;file_name:string;mime_type:string;size_bytes:number};
type Conversation={ticket:Ticket;messages:Msg[];attachments:Attachment[]};
const categories=[{value:"erro",label:"Reportar erro"},{value:"duvida",label:"Dúvida sobre ferramenta"},{value:"financeiro",label:"Planos e pagamentos"},{value:"sugestao",label:"Sugestão ou melhoria"},{value:"outros",label:"Outros assuntos"}];
const statusLabels:Record<string,string>={aberto:"Aberto",em_atendimento:"Em atendimento",aguardando_usuario:"Aguardando usuário",resolvido:"Resolvido",encerrado:"Encerrado"};
const inputClass="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/30";
async function request(path:string,options:RequestInit={}){
 const token=getStoredSession()?.access_token;
 if(!token)throw new Error("Faça login para continuar.");
 const response=await fetch(path,{...options,headers:{...options.headers,Authorization:`Bearer ${token}`},cache:"no-store"});
 if(!response.ok){const body=await response.json().catch(()=>({}));throw new Error((body as {error?:string}).error||"Não foi possível concluir a operação.")}
 return response.json();
}
async function uploadAttachment(ticketId:string,messageId:string,file:File){
 const data=new FormData();data.set("ticketId",ticketId);data.set("messageId",messageId);data.set("file",file);
 return request("/api/account/support/attachments",{method:"POST",body:data});
}
export function SupportCenter(){
 const [tickets,setTickets]=useState<Ticket[]>([]);
 const [conversation,setConversation]=useState<Conversation|null>(null);
 const [selected,setSelected]=useState<string|null>(null);
 const [formOpen,setFormOpen]=useState(false);
 const [category,setCategory]=useState("erro");
 const [title,setTitle]=useState("");
 const [message,setMessage]=useState("");
 const [file,setFile]=useState<File|null>(null);
 const [reply,setReply]=useState("");
 const [replyFile,setReplyFile]=useState<File|null>(null);
 const [error,setError]=useState("");
 const [info,setInfo]=useState("");
 const [busy,setBusy]=useState(false);
 const [loading,setLoading]=useState(true);

 const loadList=useCallback(async()=>{
  const result=await request("/api/account/support") as {tickets:Ticket[]};
  setTickets(result.tickets);
 },[]);
 const openTicket=useCallback(async(id:string)=>{
  setSelected(id);setFormOpen(false);setError("");
  try{
   const result=await request(`/api/account/support/${encodeURIComponent(id)}`) as Conversation;
   setConversation(result);
   const token=getStoredSession()?.access_token;
   if(token){
    const n=await request("/api/account/support/notifications") as {notifications:Array<{id:string;ticket_id:string;read_at:string|null}>};
    const ids=n.notifications.filter(x=>x.ticket_id===id&&!x.read_at).map(x=>x.id);
    if(ids.length)await request("/api/account/support/notifications",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({ids})});
   }
   window.history.replaceState(null,"",`/conta/atendimento?ticket=${encodeURIComponent(id)}`);
  }catch(e){setError(e instanceof Error?e.message:"Não foi possível abrir protocolo.")}
 },[]);
 useEffect(()=>{
  let alive=true;
  async function init(){
   try{
    const r=await request("/api/account/support") as {tickets:Ticket[]};
    if(!alive)return;
    setTickets(r.tickets);
    const id=new URLSearchParams(window.location.search).get("ticket");
    if(id&&r.tickets.some(t=>t.id===id))void openTicket(id);
   }catch(e){if(alive)setError(e instanceof Error?e.message:"Não foi possível carregar os chamados.")}
   finally{if(alive)setLoading(false)}
  }
  void init();return ()=>{alive=false};
 },[openTicket]);

 function checkImage(value:File|null){
  if(!value)return true;
  if(!["image/png","image/jpeg","image/webp"].includes(value.type)||value.size>5242880){setError("Envie PNG, JPG ou WebP com até 5 MB.");return false}
  return true;
 }
 async function create(e:React.FormEvent){
  e.preventDefault();if(busy||!checkImage(file))return;
  setError("");setInfo("");setBusy(true);
  try{
   const result=await request("/api/account/support",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
    category,title,message,sourceUrl:window.location.pathname,browser:navigator.userAgent.slice(0,350)
   })}) as {ticket:Ticket;message:Msg};
   setTitle("");setMessage("");setFile(null);
   if(file){try{await uploadAttachment(result.ticket.id,result.message.id,file)}catch{setInfo("Protocolo criado, mas não foi possível anexar a imagem. Tente enviá-la em uma resposta.")}}
   await loadList();await openTicket(result.ticket.id);
   if(!file)setInfo(`Protocolo ${result.ticket.protocol} criado com sucesso.`);
  }catch(e){setError(e instanceof Error?e.message:"Não foi possível criar protocolo.")}
  finally{setBusy(false)}
 }
 async function sendReply(e:React.FormEvent){
  e.preventDefault();if(!conversation||busy||!reply.trim()||!checkImage(replyFile))return;
  setError("");setInfo("");setBusy(true);
  try{
   const result=await request(`/api/account/support/${conversation.ticket.id}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:reply})}) as {message:Msg};
   setReply("");setReplyFile(null);
   if(replyFile){try{await uploadAttachment(conversation.ticket.id,result.message.id,replyFile)}catch{setInfo("Mensagem enviada, mas houve um problema ao anexar a imagem.")}}
   await openTicket(conversation.ticket.id);await loadList();
  }catch(e){setError(e instanceof Error?e.message:"Não foi possível responder.")}
  finally{setBusy(false)}
 }
 async function reopen(){
  if(!conversation||busy)return;setBusy(true);setError("");
  try{await request(`/api/account/support/${conversation.ticket.id}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"reopen"})});await openTicket(conversation.ticket.id);await loadList();}
  catch(e){setError(e instanceof Error?e.message:"Não foi possível reabrir.")}
  finally{setBusy(false)}
 }
 async function download(a:Attachment){
  try{
   const token=getStoredSession()?.access_token;if(!token)throw new Error("Faça login.");
   const res=await fetch(`/api/support/attachments/${a.id}`,{headers:{Authorization:`Bearer ${token}`}});
   if(!res.ok)throw new Error("Não foi possível abrir o arquivo.");
   const url=URL.createObjectURL(await res.blob()),link=document.createElement("a");
   link.href=url;link.download=a.file_name;link.click();window.setTimeout(()=>URL.revokeObjectURL(url),1000);
  }catch(e){setError(e instanceof Error?e.message:"Falha ao baixar anexo.")}
 }
 return <div className="space-y-6">
  <header className="flex flex-wrap items-start justify-between gap-3">
   <div><Link href="/conta" className="mb-3 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"><ArrowLeft className="size-4"/>Meu Kivai</Link><h1 className="flex items-center gap-2 text-3xl font-semibold"><Headset className="size-7 text-primary"/>Central de Atendimento</h1><p className="mt-2 text-sm text-muted-foreground">Abra solicitações e acompanhe as respostas da equipe Kivai.</p></div>
   <div className="flex items-center gap-2"><SupportBell/><button type="button" onClick={()=>{setFormOpen(true);setSelected(null);setConversation(null);setInfo("");setError("");window.history.replaceState(null,"","/conta/atendimento")}} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"><MessageSquarePlus className="size-4"/>Novo chamado</button></div>
  </header>
  {error?<p role="alert" className="rounded-lg border border-destructive/30 p-3 text-sm text-destructive">{error}</p>:null}
  {info?<p role="status" className="rounded-lg border border-primary/30 p-3 text-sm">{info}</p>:null}
  <div className="grid gap-5 lg:grid-cols-[minmax(230px,0.35fr)_minmax(0,1fr)]">
   <aside className="min-w-0 overflow-hidden rounded-xl border border-border bg-card">
    <div className="flex items-center justify-between border-b border-border p-4"><h2 className="font-semibold">Meus protocolos</h2><button title="Atualizar" aria-label="Atualizar protocolos" onClick={()=>void loadList().catch(()=>setError("Não foi possível atualizar."))} className="text-muted-foreground hover:text-primary"><RefreshCw className="size-4"/></button></div>
    <div className="max-h-[560px] overflow-y-auto">{loading?<p className="p-4 text-sm text-muted-foreground">Carregando...</p>:tickets.length?tickets.map(t=><button type="button" key={t.id} onClick={()=>void openTicket(t.id)} className={`block w-full border-b border-border p-4 text-left hover:bg-muted/60 ${selected===t.id?"bg-primary/10":""}`}><span className="block text-xs text-muted-foreground">{t.protocol} · {statusLabels[t.status]??t.status}</span><strong className="mt-1 block truncate text-sm">{t.title}</strong><span className="mt-1 block text-xs text-muted-foreground">{new Date(t.updated_at).toLocaleString("pt-BR")}</span></button>):<p className="p-4 text-sm text-muted-foreground">Você ainda não possui chamados.</p>}</div>
   </aside>
   <section className="min-w-0 rounded-xl border border-border bg-card p-4 sm:p-6">
    {formOpen?<form onSubmit={create} className="space-y-4"><h2 className="text-xl font-semibold">Abrir solicitação</h2><label className="block space-y-1 text-sm font-medium">Tipo de solicitação<select className={inputClass} value={category} onChange={e=>setCategory(e.target.value)}>{categories.map(c=><option key={c.value} value={c.value}>{c.label}</option>)}</select></label><label className="block space-y-1 text-sm font-medium">Assunto<input required minLength={5} maxLength={140} value={title} onChange={e=>setTitle(e.target.value)} placeholder="Resuma sua solicitação" className={inputClass}/></label><label className="block space-y-1 text-sm font-medium">Descreva sua solicitação<textarea required minLength={10} maxLength={3000} rows={6} value={message} onChange={e=>setMessage(e.target.value)} className={inputClass} placeholder="Explique o ocorrido ou sua dúvida..."/></label><label className="block space-y-2 text-sm font-medium"><span className="inline-flex items-center gap-2"><Paperclip className="size-4"/>Imagem (opcional, até 5 MB)</span><input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>setFile(e.target.files?.[0]??null)} className="block w-full text-xs"/></label><button disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"><Send className="size-4"/>{busy?"Enviando...":"Enviar solicitação"}</button></form>:
     conversation?<div className="space-y-5">
      <header className="border-b border-border pb-4"><p className="text-xs text-muted-foreground">{conversation.ticket.protocol} · {statusLabels[conversation.ticket.status]??conversation.ticket.status}</p><h2 className="mt-2 text-xl font-semibold">{conversation.ticket.title}</h2><p className="mt-1 text-xs text-muted-foreground">Aberto em {new Date(conversation.ticket.created_at).toLocaleString("pt-BR")}</p></header>
      <div className="max-h-[590px] space-y-3 overflow-y-auto" aria-label="Histórico de mensagens">{conversation.messages.map(m=><article key={m.id} className={`max-w-[95%] rounded-xl border border-border p-4 sm:max-w-[85%] ${m.author_type==="usuario"?"ml-auto bg-primary/[0.06]":"bg-muted/50"}`}><p className="mb-2 text-xs font-semibold">{m.author_type==="admin"?"Atendimento Kivai":"Você"} <span className="font-normal text-muted-foreground">{new Date(m.created_at).toLocaleString("pt-BR")}</span></p><p className="whitespace-pre-wrap break-words text-sm leading-6">{m.body}</p>{conversation.attachments.filter(a=>a.message_id===m.id).map(a=><button key={a.id} type="button" onClick={()=>void download(a)} className="mt-3 flex max-w-full items-center gap-2 text-xs text-primary hover:underline"><Paperclip className="size-4"/><span className="truncate">{a.file_name}</span></button>)}</article>)}</div>
      {["resolvido","encerrado"].includes(conversation.ticket.status)?<div className="rounded-lg border border-border p-4 text-sm"><p>Este protocolo está {statusLabels[conversation.ticket.status]?.toLowerCase()}. Você pode reabri-lo para enviar novas informações.</p><button type="button" disabled={busy} onClick={()=>void reopen()} className="mt-3 rounded-lg border border-primary px-3 py-2 font-medium text-primary">Reabrir chamado</button></div>:<form onSubmit={sendReply} className="space-y-3 border-t border-border pt-4"><label className="block text-sm font-medium">Enviar resposta<textarea required minLength={2} maxLength={3000} rows={4} value={reply} onChange={e=>setReply(e.target.value)} className={`mt-1 ${inputClass}`} placeholder="Escreva sua mensagem..."/></label><label className="flex items-center gap-2 text-xs"><Paperclip className="size-4"/>Anexar imagem<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>setReplyFile(e.target.files?.[0]??null)} className="min-w-0 text-xs"/></label><button disabled={busy||reply.trim().length<2} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"><Send className="size-4"/>{busy?"Enviando...":"Responder"}</button></form>}
     </div>:<div className="flex min-h-64 flex-col items-center justify-center gap-3 text-center"><Headset className="size-9 text-primary"/><p className="text-sm text-muted-foreground">Selecione um protocolo ou abra uma nova solicitação.</p><button onClick={()=>setFormOpen(true)} className="rounded-lg border border-primary px-4 py-2 text-sm font-medium text-primary">Abrir novo chamado</button></div>}
   </section>
  </div>
 </div>;
}
