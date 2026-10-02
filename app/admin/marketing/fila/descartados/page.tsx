import { ArchiveRestore, Trash2 } from "lucide-react";
import { listAdminCustomers } from "@/lib/admin/customer-users";
import { supabaseRest } from "@/lib/blog/supabase";
import { deleteCommunicationLog, deleteInboxMessage, restoreCommunicationLog, restoreInboxMessage } from "@/app/admin/marketing/log-actions";

export const dynamic = "force-dynamic";

type InboxMessage = {
  id: string;
  user_id: string | null;
  from_email: string;
  from_name: string | null;
  subject: string;
  received_at: string;
  discarded_at: string;
};

type Communication = {
  id: string;
  user_id: string;
  subject: string | null;
  event_key: string;
  created_at: string;
  sent_at: string | null;
  discarded_at: string;
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("pt-BR");
}

export default async function DiscardedPage() {
  const [users, inbox, sent] = await Promise.all([
    listAdminCustomers(),
    supabaseRest<InboxMessage[]>(
      "customer_inbox_messages?select=id,user_id,from_email,from_name,subject,received_at,discarded_at&discarded_at=not.is.null&order=discarded_at.desc&limit=200"
    ),
    supabaseRest<Communication[]>(
      "customer_communications?select=id,user_id,subject,event_key,created_at,sent_at,discarded_at&channel=eq.email&discarded_at=not.is.null&order=discarded_at.desc&limit=200"
    ),
  ]);
  const userMap = new Map(users.map((user) => [user.id, user]));

  const items = [
    ...inbox.map((item) => ({ kind: "inbox" as const, id: item.id, title: item.subject || "(sem assunto)", party: item.from_name || item.from_email, originalAt: item.received_at, discardedAt: item.discarded_at })),
    ...sent.map((item) => ({ kind: "sent" as const, id: item.id, title: item.subject || item.event_key, party: userMap.get(item.user_id)?.email || item.user_id, originalAt: item.sent_at || item.created_at, discardedAt: item.discarded_at })),
  ].sort((a, b) => new Date(b.discardedAt).getTime() - new Date(a.discardedAt).getTime());

  return (
    <div className="border border-white/10 bg-card">
      <header className="border-b border-white/10 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Descartados</p>
        <h2 className="mt-1 text-xl font-semibold">Itens removidos das caixas principais</h2>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">Restaure um item para a caixa original ou exclua definitivamente.</p>
      </header>

      <div className="divide-y divide-white/10">
        {items.map((item) => (
          <article key={`${item.kind}-${item.id}`} className="grid items-center gap-3 p-4 sm:grid-cols-[110px_minmax(0,1fr)_auto]">
            <div>
              <span className="border border-white/10 px-2 py-1 text-[10px] font-semibold uppercase text-muted-foreground">
                {item.kind === "inbox" ? "Recebido" : "Enviado"}
              </span>
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{item.title}</p>
              <p className="mt-1 truncate text-xs text-muted-foreground">{item.party}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">Descartado em {formatDate(item.discardedAt)}</p>
            </div>
            <div className="flex gap-2">
              {item.kind === "inbox" ? (
                <>
                  <form action={restoreInboxMessage}><input type="hidden" name="messageId" value={item.id} /><button title="Restaurar" className="inline-flex size-8 items-center justify-center border border-primary/30 bg-primary/10 text-primary"><ArchiveRestore className="size-4" /></button></form>
                  <form action={deleteInboxMessage}><input type="hidden" name="messageId" value={item.id} /><button title="Excluir definitivamente" className="inline-flex size-8 items-center justify-center border border-red-400/30 bg-red-500/10 text-red-300"><Trash2 className="size-4" /></button></form>
                </>
              ) : (
                <>
                  <form action={restoreCommunicationLog}><input type="hidden" name="communicationId" value={item.id} /><button title="Restaurar" className="inline-flex size-8 items-center justify-center border border-primary/30 bg-primary/10 text-primary"><ArchiveRestore className="size-4" /></button></form>
                  <form action={deleteCommunicationLog}><input type="hidden" name="communicationId" value={item.id} /><button title="Excluir definitivamente" className="inline-flex size-8 items-center justify-center border border-red-400/30 bg-red-500/10 text-red-300"><Trash2 className="size-4" /></button></form>
                </>
              )}
            </div>
          </article>
        ))}
        {!items.length ? <p className="p-8 text-center text-sm text-muted-foreground">Nenhum item descartado.</p> : null}
      </div>
    </div>
  );
}
