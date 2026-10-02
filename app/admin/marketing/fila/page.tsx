import Link from "next/link";
import { ArrowLeft, Inbox, MailOpen, RefreshCcw, Trash2, UserMinus } from "lucide-react";
import { listAdminCustomers } from "@/lib/admin/customer-users";
import { supabaseRest } from "@/lib/blog/supabase";
import { retryCommunicationNow } from "@/app/admin/marketing/actions";
import { deleteCommunicationLog, deleteInboxMessage, markInboxMessageRead } from "@/app/admin/marketing/log-actions";

export const dynamic = "force-dynamic";

type Communication = {
  id: string;
  user_id: string;
  event_key: string;
  channel: "email" | "whatsapp" | "internal";
  status: string;
  subject: string | null;
  message: string;
  scheduled_for: string;
  sent_at: string | null;
  error: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
};

type InboxMessage = {
  id: string;
  resend_email_id: string;
  user_id: string | null;
  communication_id: string | null;
  from_email: string;
  from_name: string | null;
  to_emails: string[];
  subject: string;
  text_body: string;
  message_id: string | null;
  in_reply_to: string | null;
  attachments: Array<{ filename?: string; content_type?: string }> | null;
  received_at: string;
  is_read: boolean;
};

type EmailPreference = {
  user_id: string;
  marketing_opt_out: boolean;
  unsubscribed_at: string | null;
};

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("pt-BR");
}

export default async function CommunicationQueuePage() {
  const [users, communications, inbox, preferences] = await Promise.all([
    listAdminCustomers(),
    supabaseRest<Communication[]>(
      "customer_communications?select=id,user_id,event_key,channel,status,subject,message,scheduled_for,sent_at,error,created_at,metadata&order=created_at.desc&limit=200",
    ),
    supabaseRest<InboxMessage[]>(
      "customer_inbox_messages?select=id,resend_email_id,user_id,communication_id,from_email,from_name,to_emails,subject,text_body,message_id,in_reply_to,attachments,received_at,is_read&order=received_at.desc&limit=200",
    ),
    supabaseRest<EmailPreference[]>(
      "customer_email_preferences?select=user_id,marketing_opt_out,unsubscribed_at&marketing_opt_out=eq.true&order=unsubscribed_at.desc.nullslast&limit=200",
    ),
  ]);
  const userMap = new Map(users.map((user) => [user.id, user]));
  const unread = inbox.filter((item) => !item.is_read).length;

  return (
    <div className="space-y-6">
      <section className="border border-white/10 bg-card p-5 sm:p-6">
        <Link href="/admin/marketing" className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-primary">
          <ArrowLeft className="size-4" /> Voltar ao Marketing
        </Link>
        <h1 className="mt-4 text-3xl font-semibold">Fila de comunicações</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          Central de mensagens do Kivai: acompanhe respostas recebidas, descadastros de marketing e o histórico de envios.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="border border-white/10 p-4"><p className="text-xs text-muted-foreground">Caixa de entrada</p><p className="mt-1 text-2xl font-semibold">{inbox.length}</p><p className="mt-1 text-[11px] text-muted-foreground">{unread} não lida(s)</p></div>
          <div className="border border-white/10 p-4"><p className="text-xs text-muted-foreground">Descadastros</p><p className="mt-1 text-2xl font-semibold">{preferences.length}</p><p className="mt-1 text-[11px] text-muted-foreground">não recebem marketing</p></div>
          <div className="border border-white/10 p-4"><p className="text-xs text-muted-foreground">Envios registrados</p><p className="mt-1 text-2xl font-semibold">{communications.length}</p><p className="mt-1 text-[11px] text-muted-foreground">últimos registros disponíveis</p></div>
        </div>
      </section>

      <section className="border border-primary/25 bg-primary/[0.035] p-5">
        <div className="flex items-start justify-between gap-4">
          <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Caixa de entrada</p><h2 className="mt-1 text-xl font-semibold">Respostas dos usuários</h2><p className="mt-2 text-xs leading-5 text-muted-foreground">As respostas recebidas pelo endereço configurado no Resend aparecem aqui e, quando possível, são vinculadas ao usuário e ao e-mail original.</p></div>
          <Inbox className="size-6 text-primary" />
        </div>
        <div className="mt-4 divide-y divide-white/10 border-y border-white/10">
          {inbox.map((item) => {
            const user = item.user_id ? userMap.get(item.user_id) : null;
            const attachmentNames = Array.isArray(item.attachments) ? item.attachments.map((a) => a.filename).filter(Boolean) : [];
            return <article key={item.id} className={`grid gap-4 py-5 lg:grid-cols-[220px_minmax(0,1fr)_180px] ${item.is_read ? "" : "bg-primary/[0.025]"}`}>
              <div className="text-xs text-muted-foreground">
                <div className="flex items-center gap-2"><p className="font-semibold text-foreground">{item.from_name || user?.fullName || item.from_email}</p>{!item.is_read ? <span className="border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">NOVA</span> : null}</div>
                <p className="mt-1 break-all">{item.from_email}</p>
                {user ? <p className="mt-2">Usuário: {user.planCode.toUpperCase()}</p> : <p className="mt-2">Remetente não vinculado</p>}
                <p className="mt-2">{formatDate(item.received_at)}</p>
              </div>
              <div>
                <p className="text-sm font-semibold">{item.subject || "(sem assunto)"}</p>
                <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-muted-foreground">{item.text_body || "Mensagem recebida sem versão de texto. O conteúdo integral permanece disponível no Resend."}</p>
                {item.communication_id ? <p className="mt-3 inline-flex border border-primary/20 bg-primary/[0.05] px-2 py-1 text-[10px] font-semibold text-primary">Resposta vinculada a um envio do Kivai</p> : null}
                {attachmentNames.length ? <p className="mt-3 text-xs text-muted-foreground">Anexos: {attachmentNames.join(", ")}</p> : null}
              </div>
              <div className="flex flex-wrap content-start gap-2">
                {!item.is_read ? <form action={markInboxMessageRead}><input type="hidden" name="messageId" value={item.id} /><button className="inline-flex h-8 items-center gap-1.5 border border-primary/30 bg-primary/10 px-2 text-xs font-semibold text-primary"><MailOpen className="size-3.5" /> Marcar como lida</button></form> : null}
                <form action={deleteInboxMessage}><input type="hidden" name="messageId" value={item.id} /><button className="inline-flex h-8 items-center gap-1.5 border border-red-400/30 bg-red-500/10 px-2 text-xs font-semibold text-red-300"><Trash2 className="size-3.5" /> Excluir</button></form>
              </div>
            </article>;
          })}
          {!inbox.length ? <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma resposta recebida ainda.</p> : null}
        </div>
      </section>

      <section className="border border-white/10 bg-card p-5">
        <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Preferências</p><h2 className="mt-1 text-xl font-semibold">Descadastros de marketing</h2><p className="mt-2 text-xs leading-5 text-muted-foreground">Quem usa o link de cancelamento do e-mail entra automaticamente nesta lista e deixa de receber campanhas e news. Comunicações essenciais de conta continuam permitidas.</p></div><UserMinus className="size-6 text-primary" /></div>
        <div className="mt-4 overflow-x-auto border border-white/10">
          <table className="w-full min-w-[560px] text-left text-sm"><thead className="bg-white/[0.03] text-xs text-muted-foreground"><tr><th className="px-3 py-2">Nome</th><th className="px-3 py-2">E-mail</th><th className="px-3 py-2">Descadastro</th></tr></thead><tbody className="divide-y divide-white/10">{preferences.map((item) => { const user = userMap.get(item.user_id); return <tr key={item.user_id}><td className="px-3 py-2">{user?.fullName || "Sem nome"}</td><td className="px-3 py-2 text-muted-foreground">{user?.email || item.user_id}</td><td className="px-3 py-2 text-muted-foreground">{formatDate(item.unsubscribed_at)}</td></tr>; })}</tbody></table>
          {!preferences.length ? <p className="p-5 text-center text-sm text-muted-foreground">Nenhum descadastro registrado.</p> : null}
        </div>
      </section>

      <section className="border border-white/10 bg-card p-5">
        <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Saída</p><h2 className="mt-1 text-xl font-semibold">Histórico de envios</h2><p className="mt-2 text-xs leading-5 text-muted-foreground">Os registros de saída permanecem por 15 dias. A manutenção diária do Kivai exclui definitivamente os mais antigos.</p></div>
        <div className="mt-4 divide-y divide-white/10 border-y border-white/10">
          {communications.map((item) => {
            const user = userMap.get(item.user_id);
            const canRetry = item.channel === "email" && (item.status === "ready" || item.status === "failed");
            const flowKey = typeof item.metadata?.flow_key === "string" ? item.metadata.flow_key : "";
            const flowLabel = flowKey === "new_post" ? "News · Blog" : flowKey === "blog_digest" ? "News · Resumo do blog" : flowKey === "new_tool" ? "News · Nova ferramenta" : "";
            return (
              <article key={item.id} className="grid gap-4 py-5 lg:grid-cols-[180px_minmax(0,1fr)_220px]">
                <div className="text-xs text-muted-foreground">
                  <p className="font-semibold text-foreground">{user?.email || item.user_id}</p>
                  <p className="mt-1">{item.channel === "email" ? "E-mail" : item.channel === "whatsapp" ? "WhatsApp" : "Painel"}</p>{flowLabel ? <p className="mt-2 inline-flex border border-primary/20 bg-primary/[0.05] px-2 py-1 text-[10px] font-semibold text-primary">{flowLabel}</p> : null}
                  <p className="mt-2">Criado em {formatDate(item.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">{item.subject || item.event_key}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.message}</p>
                  {item.error ? <p className="mt-2 text-xs font-medium text-red-300">Erro: {item.error}</p> : null}
                </div>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div><span className="inline-flex border border-white/10 px-2 py-1">{item.status}</span></div>
                  <p>{formatDate(item.sent_at || item.scheduled_for)}</p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {canRetry ? (
                      <form action={retryCommunicationNow}>
                        <input type="hidden" name="communicationId" value={item.id} />
                        <button className="inline-flex h-8 items-center gap-1.5 border border-primary/30 bg-primary/10 px-2 font-semibold text-primary">
                          <RefreshCcw className="size-3.5" /> {item.status === "failed" ? "Tentar novamente" : "Enviar agora"}
                        </button>
                      </form>
                    ) : null}
                    <form action={deleteCommunicationLog}>
                      <input type="hidden" name="communicationId" value={item.id} />
                      <button className="inline-flex h-8 items-center gap-1.5 border border-red-400/30 bg-red-500/10 px-2 font-semibold text-red-300">
                        <Trash2 className="size-3.5" /> Excluir definitivamente
                      </button>
                    </form>
                  </div>
                </div>
              </article>
            );
          })}
          {!communications.length ? <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma comunicação registrada.</p> : null}
        </div>
      </section>
    </div>
  );
}
