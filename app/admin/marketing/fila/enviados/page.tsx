import Link from "next/link";
import { RefreshCcw, Send, Trash2 } from "lucide-react";
import { listAdminCustomers } from "@/lib/admin/customer-users";
import { supabaseRest } from "@/lib/blog/supabase";
import { retryCommunicationNow } from "@/app/admin/marketing/actions";
import { discardCommunicationLog } from "@/app/admin/marketing/log-actions";

export const dynamic = "force-dynamic";

type Communication = {
  id: string;
  user_id: string;
  event_key: string;
  status: string;
  subject: string | null;
  message: string;
  scheduled_for: string;
  sent_at: string | null;
  error: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
};

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("pt-BR");
}

export default async function SentPage() {
  const [users, communications] = await Promise.all([
    listAdminCustomers(),
    supabaseRest<Communication[]>(
      "customer_communications?select=id,user_id,event_key,status,subject,message,scheduled_for,sent_at,error,created_at,metadata&channel=eq.email&discarded_at=is.null&order=created_at.desc&limit=200"
    ),
  ]);
  const userMap = new Map(users.map((user) => [user.id, user]));

  return (
    <div className="border border-white/10 bg-card">
      <header className="flex items-start justify-between gap-4 border-b border-white/10 p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Enviados</p>
          <h2 className="mt-1 text-xl font-semibold">E-mails enviados pelo Kivai</h2>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">Clique em um envio para abrir os detalhes completos.</p>
        </div>
        <Send className="size-6 text-primary" />
      </header>

      <div className="divide-y divide-white/10">
        {communications.map((item) => {
          const user = userMap.get(item.user_id);
          const canRetry = item.status === "ready" || item.status === "failed";
          const preview = item.message.replace(/\s+/g, " ").trim();
          return (
            <article key={item.id}>
              <div className="grid items-center gap-3 p-4 sm:grid-cols-[minmax(0,220px)_minmax(0,1fr)_auto]">
                <Link href={`/admin/marketing/fila/enviados/${item.id}`} className="min-w-0">
                  <p className="truncate text-sm font-semibold">{user?.fullName || user?.email || item.user_id}</p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{user?.email || "Destinatário não encontrado"}</p>
                </Link>

                <Link href={`/admin/marketing/fila/enviados/${item.id}`} className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">{item.subject || item.event_key}</p>
                    <span className="shrink-0 border border-white/10 px-1.5 py-0.5 text-[9px] text-muted-foreground">{item.status}</span>
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{preview}</p>
                </Link>

                <div className="flex items-center justify-between gap-2 sm:justify-end">
                  <span className="whitespace-nowrap text-[11px] text-muted-foreground">{formatDate(item.sent_at || item.scheduled_for || item.created_at)}</span>
                  {canRetry ? (
                    <form action={retryCommunicationNow}>
                      <input type="hidden" name="communicationId" value={item.id} />
                      <button title={item.status === "failed" ? "Tentar novamente" : "Enviar agora"} className="inline-flex size-8 items-center justify-center border border-white/10 text-muted-foreground hover:text-primary">
                        <RefreshCcw className="size-4" />
                      </button>
                    </form>
                  ) : null}
                  <form action={discardCommunicationLog}>
                    <input type="hidden" name="communicationId" value={item.id} />
                    <button title="Mover para descartados" className="inline-flex size-8 items-center justify-center border border-white/10 text-muted-foreground hover:text-red-300">
                      <Trash2 className="size-4" />
                    </button>
                  </form>
                </div>
              </div>
            </article>
          );
        })}
        {!communications.length ? <p className="p-8 text-center text-sm text-muted-foreground">Nenhum e-mail enviado registrado.</p> : null}
      </div>
    </div>
  );
}
