import Link from "next/link";
import { supabaseRest } from "@/lib/blog/supabase";
import { subscriptionFeedbackReasons, isSubscriptionFeedbackReason } from "@/lib/billing/subscription-feedback";

export const dynamic = "force-dynamic";
type FeedbackEvent = {
  created_at: string;
  description: string | null;
  metadata: { reason?: unknown; comment?: unknown; plan_code?: unknown; subscription_status_at_feedback?: unknown } | null;
};

export default async function SubscriptionFeedbackAdminPage() {
  const events = await supabaseRest<FeedbackEvent[]>(
    "customer_marketing_events?select=created_at,description,metadata&event_type=eq.subscription_feedback&order=created_at.desc&limit=100"
  );
  const counts = new Map<string, number>();
  for (const event of events) {
    const key = isSubscriptionFeedbackReason(event.metadata?.reason) ? event.metadata!.reason as string : "other";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const ranking = [...counts.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6">
      <header>
        <Link href="/admin/assinaturas" className="text-sm font-medium text-primary hover:underline">Voltar para assinaturas</Link>
        <h1 className="mt-3 text-3xl font-semibold">Feedback dos planos pagos</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Motivos informados espontaneamente por usuários com histórico Pro ou Agency. Uma resposta não significa cancelamento efetivo. Amostra recente limitada a 100 registros.</p>
      </header>
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-lg font-semibold">Principais motivos</h2>
        {ranking.length ? (
          <ul className="mt-3 space-y-2">
            {ranking.map(([key, count]) => (
              <li key={key} className="flex items-start justify-between gap-4 border-b border-border py-2 text-sm">
                <span>{isSubscriptionFeedbackReason(key) ? subscriptionFeedbackReasons[key] : "Outro motivo"}</span>
                <strong className="tabular-nums">{count}</strong>
              </li>
            ))}
          </ul>
        ) : <p className="mt-3 text-sm text-muted-foreground">Nenhuma resposta recebida ainda.</p>}
      </section>
      {events.length ? <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-lg font-semibold">Respostas recentes</h2>
        <div className="mt-4 space-y-3">
          {events.slice(0, 30).map((event, index) => {
            const reason = isSubscriptionFeedbackReason(event.metadata?.reason) ? subscriptionFeedbackReasons[event.metadata.reason] : (event.description || "Outro motivo");
            const note = typeof event.metadata?.comment === "string" ? event.metadata.comment : "";
            const plan = event.metadata?.plan_code === "agency" ? "Agency" : event.metadata?.plan_code === "pro" ? "Pro" : "Não informado";
            return <article key={event.created_at + index} className="rounded-lg border border-border p-3">
              <p className="text-sm font-medium">{reason}</p>
              <p className="mt-1 text-xs text-muted-foreground">{plan} · {new Date(event.created_at).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}</p>
              {note ? <p className="mt-2 whitespace-pre-wrap break-words text-sm text-muted-foreground">{note}</p> : null}
            </article>;
          })}
        </div>
      </section> : null}
    </div>
  );
}
