import { CheckCircle2, Clock3, CreditCard, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabaseRest } from "@/lib/blog/supabase";
import { confirmSubscriptionPayment, rejectSubscriptionPayment } from "./actions";

export const dynamic = "force-dynamic";

type RequestRow = {
  id: string;
  user_id: string;
  customer_email: string;
  customer_name: string | null;
  plan_code: "pro" | "agency";
  billing_cycle: "monthly" | "annual";
  amount_brl: number | string;
  status: "awaiting_payment" | "payment_reported" | "active" | "rejected" | "canceled";
  payment_reported_at: string | null;
  confirmed_at: string | null;
  created_at: string;
};
type CapacityMetrics = { databaseBytes: number; storageBytes: number; snapshotStorageBytes: number; projectCount: number; projectPayloadBytes: number; snapshotCount: number; activeSubscribers: number };

const FREE_DATABASE_BYTES = 500 * 1024 * 1024;
const FREE_STORAGE_BYTES = 1024 * 1024 * 1024;
function formatBytes(value: number) { return `${(value / 1024 / 1024).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} MB`; }
async function listPendingRequests() {
  const all: RequestRow[] = [];
  for (let offset = 0; ; offset += 1000) {
    const page = await supabaseRest<RequestRow[]>(`subscription_requests?select=id,user_id,customer_email,customer_name,plan_code,billing_cycle,amount_brl,status,payment_reported_at,confirmed_at,created_at&status=in.(awaiting_payment,payment_reported)&order=created_at.desc&limit=1000&offset=${offset}`);
    all.push(...page);
    if (page.length < 1000) return all;
  }
}

const statusLabel: Record<RequestRow["status"], string> = {
  awaiting_payment: "Aguardando pagamento",
  payment_reported: "Pagamento informado",
  active: "Ativo",
  rejected: "Rejeitado",
  canceled: "Cancelado",
};

export default async function AdminSubscriptionsPage() {
  const [recent, allPending, communications, capacity] = await Promise.all([
    supabaseRest<RequestRow[]>("subscription_requests?select=id,user_id,customer_email,customer_name,plan_code,billing_cycle,amount_brl,status,payment_reported_at,confirmed_at,created_at&order=created_at.desc&limit=100"),
    listPendingRequests(),
    supabaseRest<Array<{ status: string; metadata: { request_id?: string } }>>("customer_communications?select=status,metadata&metadata->>kind=eq.subscription_activation&order=created_at.desc&limit=200"),
    supabaseRest<CapacityMetrics>("rpc/kivai_admin_capacity_metrics", { method: "POST", body: "{}" }),
  ]);
  const requests = [...new Map([...allPending, ...recent].map((item) => [item.id, item])).values()].sort((a, b) => b.created_at.localeCompare(a.created_at));
  const pending = requests.filter((item) => ["awaiting_payment", "payment_reported"].includes(item.status));
  const reported = requests.filter((item) => item.status === "payment_reported").length;
  const delivery = new Map(communications.map(item => [item.metadata?.request_id, item.status]));

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Assinaturas</p>
        <h1 className="mt-2 text-3xl font-semibold">Pagamentos e ativações</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Confira o pagamento recebido e confirme a ativação por aqui. Perfil, assinatura e solicitação são atualizados juntos. Uma falha no e-mail não desfaz a ativação; a comunicação fica disponível para nova tentativa. Na renovação do mesmo plano, o período é somado ao vencimento atual. Na troca entre Pro e Agency, o novo período começa na confirmação.</p>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="border border-white/10 bg-card p-4"><p className="text-xs text-muted-foreground">Pendentes</p><p className="mt-2 text-2xl font-semibold">{pending.length}</p></div>
        <div className="border border-primary/20 bg-primary/[0.04] p-4"><p className="text-xs text-muted-foreground">Cliente informou pagamento</p><p className="mt-2 text-2xl font-semibold text-primary">{reported}</p></div>
        <div className="border border-white/10 bg-card p-4"><p className="text-xs text-muted-foreground">Assinantes ativos</p><p className="mt-2 text-2xl font-semibold">{capacity.activeSubscribers}</p></div>
      </section>

      <section className="space-y-3 border border-white/10 bg-card p-5" aria-label="Capacidade de armazenamento">
        <div><h2 className="text-lg font-semibold">Capacidade de armazenamento</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">Medição atual do banco e dos arquivos no Supabase. Referência do plano Free: 500 MB de banco e 1 GB de arquivos. Confira o plano contratado no Supabase antes de usar esses limites como alerta.</p></div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="border border-white/10 p-3"><p className="text-xs text-muted-foreground">Banco de dados</p><p className="mt-1 text-xl font-semibold">{formatBytes(capacity.databaseBytes)}</p><p className="text-xs text-muted-foreground">{Math.round(capacity.databaseBytes / FREE_DATABASE_BYTES * 100)}% da referência Free</p></div>
          <div className="border border-white/10 p-3"><p className="text-xs text-muted-foreground">Arquivos armazenados</p><p className="mt-1 text-xl font-semibold">{formatBytes(capacity.storageBytes)}</p><p className="text-xs text-muted-foreground">{Math.round(capacity.storageBytes / FREE_STORAGE_BYTES * 100)}% da referência Free</p></div>
          <div className="border border-white/10 p-3"><p className="text-xs text-muted-foreground">Projetos pagos</p><p className="mt-1 text-xl font-semibold">{capacity.projectCount}</p><p className="text-xs text-muted-foreground">{formatBytes(capacity.projectPayloadBytes)} em conteúdo salvo</p></div>
          <div className="border border-white/10 p-3"><p className="text-xs text-muted-foreground">Históricos do Instagram</p><p className="mt-1 text-xl font-semibold">{capacity.snapshotCount}</p><p className="text-xs text-muted-foreground">{formatBytes(capacity.snapshotStorageBytes)} em arquivos privados</p></div>
        </div>
        {capacity.databaseBytes >= FREE_DATABASE_BYTES * 0.7 || capacity.storageBytes >= FREE_STORAGE_BYTES * 0.7 ? <p role="status" className="text-sm text-amber-300">Uso acima de 70% de uma cota gratuita de referência. Confira o consumo e planeje a ampliação antes de atingir o limite.</p> : null}
      </section>

      <section className="space-y-3">
        {requests.length === 0 ? (
          <div className="border border-white/10 bg-card p-8 text-center text-sm text-muted-foreground">Nenhuma solicitação de contratação registrada ainda.</div>
        ) : requests.map((request) => {
          const canConfirm = request.status === "awaiting_payment" || request.status === "payment_reported";
          return (
            <article key={request.id} className={`border p-5 ${request.status === "payment_reported" ? "border-primary/30 bg-primary/[0.04]" : "border-white/10 bg-card"}`}>
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold">{request.customer_name || request.customer_email}</h2>
                    <span className="border border-white/10 px-2 py-1 text-[11px] text-muted-foreground">{statusLabel[request.status]}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{request.customer_email}</p>
                  <div className="mt-4 grid gap-3 text-sm sm:grid-cols-4">
                    <div><span className="block text-xs text-muted-foreground">Plano</span>{request.plan_code === "pro" ? "Pro" : "Agency"}</div>
                    <div><span className="block text-xs text-muted-foreground">Periodicidade</span>{request.billing_cycle === "monthly" ? "Mensal" : "Anual"}</div>
                    <div><span className="block text-xs text-muted-foreground">Valor</span>R$ {Number(request.amount_brl).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
                    <div><span className="block text-xs text-muted-foreground">Solicitado em</span>{new Date(request.created_at).toLocaleString("pt-BR")}</div>
                  </div>
                  {request.payment_reported_at ? <p className="mt-3 flex items-center gap-2 text-xs text-primary"><CreditCard className="size-3.5" /> Cliente informou o pagamento em {new Date(request.payment_reported_at).toLocaleString("pt-BR")}</p> : null}
                  {request.confirmed_at ? <p className="mt-3 flex items-center gap-2 text-xs text-emerald-400"><CheckCircle2 className="size-3.5" /> Ativado em {new Date(request.confirmed_at).toLocaleString("pt-BR")}</p> : null}
                  {request.status === "active" && delivery.has(request.id) ? <p className="mt-2 text-xs text-muted-foreground">{delivery.get(request.id) === "sent" ? "E-mail de confirmação enviado." : "Plano ativado. E-mail pendente; a rotina automática tentará o envio novamente."}</p> : null}
                </div>

                <div className="flex min-w-[220px] flex-col gap-2">
                  {canConfirm ? (
                    <>
                      <form action={confirmSubscriptionPayment}>
                        <input type="hidden" name="requestId" value={request.id} />
                        <Button className="w-full"><CheckCircle2 /> Confirmar pagamento e ativar plano</Button>
                      </form>
                      <form action={rejectSubscriptionPayment}>
                        <input type="hidden" name="requestId" value={request.id} />
                        <Button variant="outline" className="w-full"><XCircle /> Rejeitar solicitação</Button>
                      </form>
                    </>
                  ) : request.status === "active" ? (
                    <div className="flex items-center justify-center gap-2 border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-300"><CheckCircle2 className="size-4" /> Plano ativado</div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 border border-white/10 px-4 py-3 text-sm text-muted-foreground"><Clock3 className="size-4" /> Solicitação encerrada</div>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
