import Link from "next/link";
import { Inbox, MailOpen, Trash2 } from "lucide-react";
import { listAdminCustomers } from "@/lib/admin/customer-users";
import { supabaseRest } from "@/lib/blog/supabase";
import { discardInboxMessage, markInboxMessageRead } from "@/app/admin/marketing/log-actions";

export const dynamic = "force-dynamic";

type InboxMessage = {
  id: string;
  user_id: string | null;
  from_email: string;
  from_name: string | null;
  subject: string;
  text_body: string;
  received_at: string;
  is_read: boolean;
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("pt-BR");
}

export default async function InboxPage() {
  const [users, inbox] = await Promise.all([
    listAdminCustomers(),
    supabaseRest<InboxMessage[]>(
      "customer_inbox_messages?select=id,user_id,from_email,from_name,subject,text_body,received_at,is_read&discarded_at=is.null&order=received_at.desc&limit=200"
    ),
  ]);
  const userMap = new Map(users.map((user) => [user.id, user]));

  return (
    <div className="border border-white/10 bg-card">
      <header className="flex items-start justify-between gap-4 border-b border-white/10 p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Caixa de entrada</p>
          <h2 className="mt-1 text-xl font-semibold">Mensagens recebidas</h2>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">Clique em uma mensagem para abrir o conteúdo completo.</p>
        </div>
        <Inbox className="size-6 text-primary" />
      </header>

      <div className="divide-y divide-white/10">
        {inbox.map((item) => {
          const user = item.user_id ? userMap.get(item.user_id) : null;
          const preview = item.text_body?.replace(/\s+/g, " ").trim() || "Mensagem recebida sem prévia de texto.";
          return (
            <article key={item.id} className={item.is_read ? "group" : "group bg-primary/[0.025]"}>
              <div className="grid items-center gap-3 p-4 sm:grid-cols-[minmax(0,220px)_minmax(0,1fr)_auto]">
                <Link href={`/admin/marketing/fila/entrada/${item.id}`} className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold">{item.from_name || user?.fullName || item.from_email}</p>
                    {!item.is_read ? <span className="shrink-0 border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold text-primary">NOVA</span> : null}
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{item.from_email}</p>
                </Link>

                <Link href={`/admin/marketing/fila/entrada/${item.id}`} className="min-w-0">
                  <p className={`truncate text-sm ${item.is_read ? "font-medium" : "font-semibold"}`}>{item.subject || "(sem assunto)"}</p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{preview}</p>
                </Link>

                <div className="flex items-center justify-between gap-2 sm:justify-end">
                  <span className="whitespace-nowrap text-[11px] text-muted-foreground">{formatDate(item.received_at)}</span>
                  {!item.is_read ? (
                    <form action={markInboxMessageRead}>
                      <input type="hidden" name="messageId" value={item.id} />
                      <button title="Marcar como lida" className="inline-flex size-8 items-center justify-center border border-white/10 text-muted-foreground hover:text-primary">
                        <MailOpen className="size-4" />
                      </button>
                    </form>
                  ) : null}
                  <form action={discardInboxMessage}>
                    <input type="hidden" name="messageId" value={item.id} />
                    <button title="Mover para descartados" className="inline-flex size-8 items-center justify-center border border-white/10 text-muted-foreground hover:text-red-300">
                      <Trash2 className="size-4" />
                    </button>
                  </form>
                </div>
              </div>
            </article>
          );
        })}
        {!inbox.length ? <p className="p-8 text-center text-sm text-muted-foreground">Nenhuma mensagem na caixa de entrada.</p> : null}
      </div>
    </div>
  );
}
