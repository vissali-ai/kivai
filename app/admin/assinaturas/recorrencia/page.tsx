import Link from "next/link";
import { linkAsaasSubscription, reconcileAsaasPayment } from "./actions";
import { isAsaasSyncConfigured } from "@/lib/billing/asaas";
import { supabaseRest } from "@/lib/blog/supabase";

export const dynamic = "force-dynamic";
type LinkRow = { user_id: string; provider_subscription_id: string; plan_code: string; billing_cycle: string; state: string; created_at: string };
type InboxRow = { provider_event_id: string; event_type: string; provider_payment_id: string | null; provider_subscription_id: string | null; processing_status: string; last_error: string | null; created_at: string };

export default async function RecurringSubscriptionsAdmin({
  searchParams,
}: { searchParams: Promise<{ linked?: string; reconciled?: string }> }) {
  const configured = isAsaasSyncConfigured();
  if (!configured) {
    return <div className="space-y-4">
      <Link href="/admin/assinaturas" className="text-sm text-primary hover:underline">Voltar para assinaturas</Link>
      <h1 className="text-3xl font-semibold">Sincronização de recorrências</h1>
      <p className="rounded-xl border border-border bg-card p-5 text-sm leading-6 text-muted-foreground">
        Integração ainda desativada. Configure o Asaas e aplique a migração de banco somente em ambiente de teste.
        Nenhuma assinatura atual da InfinitePay é modificada.
      </p>
    </div>;
  }
  const [bindings, events] = await Promise.all([
    supabaseRest<LinkRow[]>("kivai_recurring_provider_links?select=user_id,provider_subscription_id,plan_code,billing_cycle,state,created_at&order=created_at.desc&limit=50"),
    supabaseRest<InboxRow[]>("kivai_recurring_webhook_inbox?select=provider_event_id,event_type,provider_payment_id,provider_subscription_id,processing_status,last_error,created_at&processing_status=in.(pending,manual_review)&order=created_at.desc&limit=40"),
  ]);
  const query = await searchParams;
  const linked = query.linked === "1";
  const reconciled = query.reconciled === "1";

  return (
    <div className="space-y-6">
      <header>
        <Link href="/admin/assinaturas" className="text-sm text-primary hover:underline">Voltar para assinaturas</Link>
        <h1 className="mt-3 text-3xl font-semibold">Sincronização de recorrências</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          Integração Asaas separada dos planos InfinitePay. Vincular uma assinatura não ativa nenhum plano:
          o acesso só é concedido quando uma cobrança é confirmada pela API do provedor.
        </p>
      </header>
      <div className="rounded-xl border border-border bg-card p-4 text-sm">
        <strong>{configured ? "Integração Asaas configurada" : "Integração Asaas desativada"}</strong>
        <p className="mt-1 text-muted-foreground">
          {configured ? "Webhooks recebidos podem ser conciliados após validação na API." : "É necessário configurar ambiente, chave de API, token do webhook e liberar a integração antes de vincular assinaturas."}
        </p>
      </div>
      {linked ? <p role="status" className="rounded-lg border border-border p-3 text-sm">Assinatura vinculada para verificação de pagamentos futuros.</p> : null}
      {reconciled ? <p role="status" className="rounded-lg border border-border p-3 text-sm">Cobrança conciliada com a API Asaas.</p> : null}
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-lg font-semibold">Vincular assinatura existente no Asaas</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Use somente para uma conta sem contrato ativo em outro provedor.
          A operação confere valor, periodicidade e igualdade do e-mail do pagador no Asaas.
        </p>
        <form action={linkAsaasSubscription} className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">ID do usuário Kivai
            <input name="userId" required autoComplete="off" placeholder="UUID da conta" className="min-h-11 rounded-md border border-border bg-background px-3" />
          </label>
          <label className="grid gap-1 text-sm">ID da assinatura Asaas
            <input name="providerSubscriptionId" required autoComplete="off" placeholder="sub_..." className="min-h-11 rounded-md border border-border bg-background px-3" />
          </label>
          <label className="grid gap-1 text-sm">Plano
            <select name="plan" required className="min-h-11 rounded-md border border-border bg-background px-3">
              <option value="pro">Pro</option><option value="agency">Agency</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm">Ciclo
            <select name="cycle" required className="min-h-11 rounded-md border border-border bg-background px-3">
              <option value="monthly">Mensal</option><option value="annual">Anual</option>
            </select>
          </label>
          <button type="submit" disabled={!configured} className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50 sm:col-span-2">
            Validar no Asaas e vincular
          </button>
        </form>
      </section>
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-lg font-semibold">Assinaturas vinculadas ({bindings.length})</h2>
        <div className="mt-3 space-y-2">
          {bindings.length ? bindings.map(row => (
            <div key={row.provider_subscription_id} className="rounded-lg border border-border p-3 text-sm">
              <strong>{row.plan_code.toUpperCase()} · {row.billing_cycle === "annual" ? "Anual" : "Mensal"}</strong>
              <p className="mt-1 break-all text-xs text-muted-foreground">{row.provider_subscription_id} · {row.user_id} · {row.state}</p>
            </div>
          )) : <p className="text-sm text-muted-foreground">Nenhum vínculo cadastrado.</p>}
        </div>
      </section>
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-lg font-semibold">Eventos que exigem conferência ({events.length})</h2>
        <p className="mt-2 text-xs text-muted-foreground">Inclui estornos, chargebacks, divergências e cobranças sem vínculo. Eles não ativam acesso automaticamente.</p>
        <div className="mt-3 space-y-2">
          {events.length ? events.map(row => (
            <div key={row.provider_event_id} className="rounded-lg border border-border p-3 text-sm">
              <strong>{row.event_type}</strong>
              <p className="mt-1 break-all text-xs text-muted-foreground">{row.provider_event_id} · {row.processing_status}</p>
              {row.last_error ? <p className="mt-1 text-xs text-muted-foreground">{row.last_error}</p> : null}
              {row.provider_payment_id && ["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED"].includes(row.event_type) ? (
                <form action={reconcileAsaasPayment} className="mt-2">
                  <input type="hidden" name="eventId" value={row.provider_event_id} />
                  <input type="hidden" name="paymentId" value={row.provider_payment_id} />
                  <button type="submit" className="min-h-9 rounded-md border border-border px-3 py-2 text-xs font-medium text-primary">
                    Conferir novamente na API
                  </button>
                </form>
              ) : null}
            </div>
          )) : <p className="text-sm text-muted-foreground">Nenhum evento pendente de conferência.</p>}
        </div>
      </section>
    </div>
  );
}
