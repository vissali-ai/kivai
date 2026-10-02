import Link from "next/link";
import { ArrowLeft, RefreshCcw, Trash2 } from "lucide-react";
import { notFound } from "next/navigation";
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

export default async function SentMessagePage({ params }: { params: Promise<{ communicationId: string }> }) {
  const { communicationId } = await params;
  const [rows, users] = await Promise.all([
    supabaseRest<Communication[]>(
      `customer_communications?select=id,user_id,event_key,status,subject,message,scheduled_for,sent_at,error,created_at,metadata&id=eq.${encodeURIComponent(communicationId)}&channel=eq.email&discarded_at=is.null&limit=1`
    ),
    listAdminCustomers(),
  ]);
  const item = rows[0];
  if (!item) notFound();

  const user = users.find((candidate) => candidate.id === item.user_id);
  const canRetry = item.status === "ready" || item.status === "failed";

  return (
    <article className="border border-white/10 bg-card">
      <header className="border-b border-white/10 p-5">
        <Link href="/admin/marketing/fila/enviados" className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-primary">
          <ArrowLeft className="size-4" /> Voltar para enviados
        </Link>
        <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">{item.subject || item.event_key}</h2>
            <p className="mt-2 text-sm text-muted-foreground">Para: <span className="text-foreground">{user?.fullName || user?.email || item.user_id}</span></p>
            {user?.email ? <p className="mt-1 text-xs text-muted-foreground">{user.email}</p> : null}
            <p className="mt-1 text-xs text-muted-foreground">{new Date(item.sent_at || item.scheduled_for || item.created_at).toLocaleString("pt-BR")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {canRetry ? (
              <form action={retryCommunicationNow}>
                <input type="hidden" name="communicationId" value={item.id} />
                <button className="inline-flex h-9 items-center gap-2 border border-primary/30 bg-primary/10 px-3 text-xs font-semibold text-primary">
                  <RefreshCcw className="size-4" /> {item.status === "failed" ? "Tentar novamente" : "Enviar agora"}
                </button>
              </form>
            ) : null}
            <form action={discardCommunicationLog}>
              <input type="hidden" name="communicationId" value={item.id} />
              <button className="inline-flex h-9 items-center gap-2 border border-red-400/30 bg-red-500/10 px-3 text-xs font-semibold text-red-300">
                <Trash2 className="size-4" /> Descartar
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap gap-2 text-xs">
          <span className="border border-white/10 px-2 py-1 text-muted-foreground">Status: {item.status}</span>
          {item.error ? <span className="border border-red-400/20 bg-red-500/5 px-2 py-1 text-red-300">Erro registrado</span> : null}
        </div>
        <div className="whitespace-pre-wrap text-sm leading-7 text-foreground">{item.message}</div>
        {item.error ? <p className="mt-6 border border-red-400/20 bg-red-500/5 p-3 text-xs leading-5 text-red-300">{item.error}</p> : null}
      </div>
    </article>
  );
}
