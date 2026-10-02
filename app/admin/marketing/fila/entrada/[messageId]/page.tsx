import Link from "next/link";
import { ArrowLeft, MailOpen, Trash2 } from "lucide-react";
import { notFound } from "next/navigation";
import { listAdminCustomers } from "@/lib/admin/customer-users";
import { supabaseRest } from "@/lib/blog/supabase";
import { discardInboxMessage, markInboxMessageRead } from "@/app/admin/marketing/log-actions";

export const dynamic = "force-dynamic";

type InboxMessage = {
  id: string;
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

export default async function InboxMessagePage({ params }: { params: Promise<{ messageId: string }> }) {
  const { messageId } = await params;
  const [rows, users] = await Promise.all([
    supabaseRest<InboxMessage[]>(
      `customer_inbox_messages?select=id,user_id,communication_id,from_email,from_name,to_emails,subject,text_body,message_id,in_reply_to,attachments,received_at,is_read&id=eq.${encodeURIComponent(messageId)}&discarded_at=is.null&limit=1`
    ),
    listAdminCustomers(),
  ]);
  const message = rows[0];
  if (!message) notFound();

  const user = message.user_id ? users.find((item) => item.id === message.user_id) : null;
  const attachmentNames = Array.isArray(message.attachments) ? message.attachments.map((item) => item.filename).filter(Boolean) : [];

  return (
    <article className="border border-white/10 bg-card">
      <header className="border-b border-white/10 p-5">
        <Link href="/admin/marketing/fila/entrada" className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-primary">
          <ArrowLeft className="size-4" /> Voltar para a caixa de entrada
        </Link>
        <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold">{message.subject || "(sem assunto)"}</h2>
            <p className="mt-2 text-sm text-muted-foreground">De: <span className="text-foreground">{message.from_name || user?.fullName || message.from_email}</span> &lt;{message.from_email}&gt;</p>
            <p className="mt-1 text-xs text-muted-foreground">Para: {message.to_emails.join(", ") || "contato@kivai.com.br"}</p>
            <p className="mt-1 text-xs text-muted-foreground">{new Date(message.received_at).toLocaleString("pt-BR")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {!message.is_read ? (
              <form action={markInboxMessageRead}>
                <input type="hidden" name="messageId" value={message.id} />
                <button className="inline-flex h-9 items-center gap-2 border border-primary/30 bg-primary/10 px-3 text-xs font-semibold text-primary">
                  <MailOpen className="size-4" /> Marcar como lida
                </button>
              </form>
            ) : null}
            <form action={discardInboxMessage}>
              <input type="hidden" name="messageId" value={message.id} />
              <button className="inline-flex h-9 items-center gap-2 border border-red-400/30 bg-red-500/10 px-3 text-xs font-semibold text-red-300">
                <Trash2 className="size-4" /> Descartar
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="p-5 sm:p-6">
        <div className="whitespace-pre-wrap text-sm leading-7 text-foreground">
          {message.text_body || "Mensagem recebida sem versão de texto disponível."}
        </div>
        {message.communication_id ? <p className="mt-6 inline-flex border border-primary/20 bg-primary/[0.05] px-2 py-1 text-[10px] font-semibold text-primary">Resposta vinculada a um envio do Kivai</p> : null}
        {attachmentNames.length ? <p className="mt-5 text-xs text-muted-foreground">Anexos: {attachmentNames.join(", ")}</p> : null}
      </div>
    </article>
  );
}
