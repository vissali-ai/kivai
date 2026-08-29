import Link from "next/link";
import { ArrowLeft, RefreshCcw, Trash2 } from "lucide-react";
import { listAdminCustomers } from "@/lib/admin/customer-users";
import { supabaseRest } from "@/lib/blog/supabase";
import { retryCommunicationNow } from "@/app/admin/marketing/actions";
import { deleteCommunicationLog } from "@/app/admin/marketing/log-actions";

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
};

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("pt-BR");
}

export default async function CommunicationQueuePage() {
  const [users, communications] = await Promise.all([
    listAdminCustomers(),
    supabaseRest<Communication[]>(
      "customer_communications?select=id,user_id,event_key,channel,status,subject,message,scheduled_for,sent_at,error,created_at&order=created_at.desc&limit=200",
    ),
  ]);
  const userMap = new Map(users.map((user) => [user.id, user]));

  return (
    <div className="space-y-6">
      <section className="border border-white/10 bg-card p-5 sm:p-6">
        <Link href="/admin/marketing" className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-primary">
          <ArrowLeft className="size-4" /> Voltar ao Marketing
        </Link>
        <h1 className="mt-4 text-3xl font-semibold">Fila de comunicações</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          Os registros permanecem por 15 dias. A manutenção diária do Kivai exclui definitivamente os registros mais antigos. Você também pode excluir qualquer log manualmente antes desse prazo.
        </p>
      </section>

      <section className="border border-white/10 bg-card p-5">
        <div className="divide-y divide-white/10 border-y border-white/10">
          {communications.map((item) => {
            const user = userMap.get(item.user_id);
            const canRetry = item.channel === "email" && (item.status === "ready" || item.status === "failed");
            return (
              <article key={item.id} className="grid gap-4 py-5 lg:grid-cols-[180px_minmax(0,1fr)_220px]">
                <div className="text-xs text-muted-foreground">
                  <p className="font-semibold text-foreground">{user?.email || item.user_id}</p>
                  <p className="mt-1">{item.channel === "email" ? "E-mail" : item.channel === "whatsapp" ? "WhatsApp" : "Painel"}</p>
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
