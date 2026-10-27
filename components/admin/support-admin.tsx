"use client";
import {useCallback,useEffect,useMemo,useState} from "react";
import {Headset,Paperclip,RefreshCw,Search,Send} from "lucide-react";
type Ticket={id:string;protocol:string;user_id:string;user_email:string;user_name:string|null;category:string;title:string;status:string;priority:string;source_url:string|null;browser_info:string|null;internal_note:string|null;created_at:string;updated_at:string};
type Msg={id:string;ticket_id:string;author_type:"usuario"|"admin";body:string;created_at:string};
type Attachment={id:string;ticket_id:string;message_id:string;file_name:string;mime_type:string;size_bytes:number};
type Detail={ticket:Ticket;messages:Msg[];attachments:Attachment[]};
const statusLabels:Record<string,string>={aberto:"Aberto",em_atendimento:"Em atendimento",aguardando_usuario:"Aguardando usuário",resolvido:"Resolvido",encerrado:"Encerrado"};
const statusKeys=Object.keys(statusLabels);
const selectClass="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";
async function api(url:string,opts:RequestInit={}){
 const response=await fetch(url,{...opts,headers:{...opts.headers},cache:"no-store"});
 if(!response.ok){const data=await response.json().catch(()=>({}));throw new Error((data as {error?:string}).error||"Falha ao consultar atendimento.")}
 return response.json();
}
export function SupportAdmin(){
 const [tickets,setTickets]=useState<Ticket[]>([]);
 const [detail,setDetail]=useState<Detail|null>(null);
 const [selected,setSelected]=useState<string|null>(null);
 const [statusFilter,setStatusFilter]=useState("todos");
 const [search,setSearch]=useState("");
 const [status,setStatus]=useState("aberto");
 const [priority,setPriority]=useState("normal");
 const [note,setNote]=useState("");
 const [reply,setReply]=useState("");
 const [busy,setBusy]=useState(false);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 const [info,setInfo]=useState("");
 const loadList=useCallback(async()=>{
  const data=await api(`/api/admin/support?status=${statusFilter}`) as {tickets:Ticket[]};
  setTickets(data.tickets);
 },[statusFilter]);
 const openTicket=useCallback(async(id:string)=>{
  setSelected(id);setError("");setInfo("");
  try{
   const response=await api(`/api/admin/support/${encodeURIComponent(id)}`) as Detail;
   setDetail(response);setStatus(response.ticket.status);setPriority(response.ticket.priority);setNote(response.ticket.internal_note??"");
   window.history.replaceState(null,"",`/admin/atendimento?ticket=${encodeURIComponent(id)}`);
  }catch(e){setError(e instanceof Error?e.message:"Falha ao abrir chamado.")}
 },[]);
 useEffect(()=>{let alive=true;
  async function init(){try{
   const data=await api(`/api/admin/support?status=${statusFilter}`) as {tickets:Ticket[]};
   if(!alive)return;setTickets(data.tickets);
   const id=new URLSearchParams(window.location.search).get("ticket");
   if(id&&data.tickets.some(t=>t.id===id))void openTicket(id);
  }catch(e){if(alive)setError(e instanceof Error?e.message:"Falha ao carregar.")}
  finally{if(alive)setLoading(false)}}
  void init();return()=>{alive=false};
 },[statusFilter,openTicket]);
 const filtered=useMemo(()=>tickets.filter(t=>(`${t.protocol} ${t.title} ${t.user_email} ${t.user_name||""}`).toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR"))),[tickets,search]);
 async function save(e:React.FormEvent){
  e.preventDefault();if(!detail||busy)return;setBusy(true);setError("");setInfo("");
  try{
   await api(`/api/admin/support/${detail.ticket.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status,priority,internal_note:note})});
   await openTicket(detail.ticket.id);await loadList();setInfo("Chamado atualizado.");
  }catch(e){setError(e instanceof Error?e.message:"Não foi possível salvar.")}
  finally{setBusy(false)}
 }
 async function sendReply(e:React.FormEvent){
  e.preventDefault();if(!detail||busy||reply.trim().length<2)return;setBusy(true);setError("");setInfo("");
  try{
   await api(`/api/admin/support/${detail.ticket.id}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:reply})});
   setReply("");await openTicket(detail.ticket.id);await loadList();setInfo("Resposta enviada e notificação registrada para o usuário.");
  }catch(e){setError(e instanceof Error?e.message:"Não foi possível responder.")}
  finally{setBusy(false)}
 }
 async function download(a:Attachment){
  try{
   const res=await fetch(`/api/support/attachments/${a.id}`,{cache:"no-store"});
   if(!res.ok)throw new Error("Não foi possível abrir o arquivo.");
   const url=URL.createObjectURL(await res.blob()),link=document.createElement("a");
   link.href=url;link.download=a.file_name;link.click();window.setTimeout(()=>URL.revokeObjectURL(url),1000);
  }catch(e){setError(e instanceof Error?e.message:"Falha ao baixar anexo.")}
 }
 const counts={abertos:tickets.filter(t=>t.status==="aberto").length,tratando:tickets.filter(t=>t.status==="em_atendimento"||t.status==="aguardando_usuario").length,resolvidos:tickets.filter(t=>t.status==="resolvido"||t.status==="encerrado").length};
 return <div className="space-y-5">
  <header className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-widest text-primary">Administração</p><h1 className="mt-1 flex items-center gap-2 text-3xl font-semibold"><Headset className="size-7 text-primary"/>Central de Atendimento</h1><p className="mt-2 text-sm text-muted-foreground">Gerencie protocolos, mensagens e solicitações dos usuários.</p></div><button onClick={()=>void loadList().catch(()=>setError("Erro ao atualizar chamados."))} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"><RefreshCw className="size-4"/>Atualizar</button></header>
  <div className="grid grid-cols-3 gap-3">{[{label:"Abertos",count:counts.abertos},{label:"Em atendimento",count:counts.tratando},{label:"Concluídos",count:counts.resolvidos}].map(x=><div key={x.label} className="rounded-xl border border-border bg-card p-4"><p className="text-2xl font-semibold">{x.count}</p><p className="text-xs text-muted-foreground">{x.label}</p></div>)}</div>
  {error?<p role="alert" className="border border-destructive/30 p-3 text-sm text-destructive">{error}</p>:null}
  {info?<p role="status" className="border border-primary/30 p-3 text-sm">{info}</p>:null}
  <div className="grid gap-5 xl:grid-cols-[minmax(270px,0.4fr)_minmax(0,1fr)]">
   <section className="min-w-0 rounded-xl border border-border bg-card">
    <div className="space-y-3 border-b border-border p-4">
     <label className="flex items-center gap-2"><Search className="size-4 text-muted-foreground"/><input aria-label="Pesquisar chamados" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Protocolo, usuário ou assunto" className="min-w-0 flex-1 bg-transparent text-sm outline-none"/></label>
     <select aria-label="Filtrar por status" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className={selectClass}><option value="todos">Todos os status</option>{statusKeys.map(k=><option key={k} value={k}>{statusLabels[k]}</option>)}</select>
    </div>
    <div className="max-h-[720px] overflow-auto">{loading?<p className="p-4 text-sm text-muted-foreground">Carregando...</p>:filtered.map(t=><button key={t.id} onClick={()=>void openTicket(t.id)} className={`block w-full border-b border-border p-4 text-left hover:bg-muted/60 ${selected===t.id?"bg-primary/10":""}`}><span className="flex justify-between gap-2 text-xs text-muted-foreground"><span>{t.protocol}</span><span>{statusLabels[t.status]??t.status}</span></span><strong className="mt-2 block truncate text-sm">{t.title}</strong><span className="mt-1 block truncate text-xs text-muted-foreground">{t.user_name||t.user_email}</span><span className="mt-1 block text-xs text-muted-foreground">{new Date(t.updated_at).toLocaleString("pt-BR")}</span></button>)}{!loading&&!filtered.length?<p className="p-4 text-sm text-muted-foreground">Nenhum chamado encontrado.</p>:null}</div>
   </section>
   <section className="min-w-0 space-y-5 rounded-xl border border-border bg-card p-4 sm:p-6">
    {detail?<><header className="space-y-2 border-b border-border pb-4"><p className="text-xs text-muted-foreground">{detail.ticket.protocol} · {statusLabels[detail.ticket.status]}</p><h2 className="text-xl font-semibold">{detail.ticket.title}</h2><p className="break-all text-sm">{detail.ticket.user_name||"Usuário Kivai"} · {detail.ticket.user_email}</p><p className="text-xs text-muted-foreground">Categoria: {detail.ticket.category} · Criado em {new Date(detail.ticket.created_at).toLocaleString("pt-BR")}</p>{detail.ticket.source_url?<p className="break-all text-xs text-muted-foreground">Origem: {detail.ticket.source_url}</p>:null}{detail.ticket.browser_info?<details className="text-xs text-muted-foreground"><summary className="cursor-pointer">Informações do navegador</summary><p className="break-all pt-2">{detail.ticket.browser_info}</p></details>:null}</header>
     <form onSubmit={save} className="grid gap-3 border-b border-border pb-5 sm:grid-cols-2">
      <label className="text-xs font-semibold">Status<select value={status} onChange={e=>setStatus(e.target.value)} className={`mt-2 ${selectClass}`}>{statusKeys.map(k=><option key={k} value={k}>{statusLabels[k]}</option>)}</select></label>
      <label className="text-xs font-semibold">Prioridade<select value={priority} onChange={e=>setPriority(e.target.value)} className={`mt-2 ${selectClass}`}><option value="baixa">Baixa</option><option value="normal">Normal</option><option value="alta">Alta</option></select></label>
      <label className="text-xs font-semibold sm:col-span-2">Observações internas (não aparecem para o usuário)<textarea value={note} onChange={e=>setNote(e.target.value)} maxLength={2500} rows={3} className={`mt-2 ${selectClass}`}/></label>
      <button disabled={busy} className="rounded-lg border border-primary/40 px-4 py-2 text-sm font-semibold text-primary disabled:opacity-60 sm:col-span-2">Salvar alterações</button>
     </form>
     <div className="max-h-[540px] space-y-3 overflow-auto" aria-label="Histórico do chamado">{detail.messages.map(m=><article key={m.id} className={`max-w-[95%] rounded-xl border border-border p-4 sm:max-w-[85%] ${m.author_type==="admin"?"ml-auto bg-primary/[0.06]":"bg-muted/50"}`}><p className="mb-2 text-xs font-semibold">{m.author_type==="admin"?"Você (Admin)":"Usuário"} <span className="font-normal text-muted-foreground">{new Date(m.created_at).toLocaleString("pt-BR")}</span></p><p className="whitespace-pre-wrap break-words text-sm leading-6">{m.body}</p>{detail.attachments.filter(a=>a.message_id===m.id).map(a=><button key={a.id} onClick={()=>void download(a)} className="mt-3 flex max-w-full items-center gap-2 text-xs text-primary hover:underline" type="button"><Paperclip className="size-4"/><span className="truncate">{a.file_name}</span></button>)}</article>)}</div>
     <form onSubmit={sendReply} className="space-y-3 border-t border-border pt-5"><label className="block text-sm font-semibold">Responder usuário<textarea required value={reply} onChange={e=>setReply(e.target.value)} rows={4} minLength={2} maxLength={3000} className={`mt-2 ${selectClass}`} placeholder="Escreva sua resposta..."/></label><button disabled={busy||reply.trim().length<2} className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"><Send className="size-4"/>Enviar resposta</button></form>
    </>:<div className="flex min-h-64 flex-col items-center justify-center gap-2 text-center"><Headset className="size-8 text-primary"/><p className="text-sm text-muted-foreground">Selecione um protocolo para visualizar e responder.</p></div>}
   </section>
  </div>
 </div>;
}
