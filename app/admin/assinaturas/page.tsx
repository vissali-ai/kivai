import { CheckCircle2, Clock3, CreditCard, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabaseRest } from "@/lib/blog/supabase";
import { confirmSubscriptionPayment, rejectSubscriptionPayment } from "./actions";

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

const statusLabel: Record<RequestRow["status"], string> = {
  awaiting_payment: "Aguardando pagamento",
  payment_reported: "Pagamento informado",
  active: "Ativo",
  rejected: "Rejeitado",
  canceled: "Cancelado",
};

export default async function AdminSubscriptionsPage() {
  const requests = await supabaseRest<RequestRow[]>("subscription_requests?select=id,user_id,customer_email,customer_name,plan_code,billing_cycle,amount_brl,status,payment_reported_at,confirmed_at,created_at&order=created_at.desc&limit=100");
  const pending = requests.filter((item) => ["awaiting_payment", "payment_reported"].includes(item.status));
  const reported = requests.filter((item) => item.status === "payment_reported").length;
  const active = requests.filter((item) => item.status === "active").length;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Assinaturas</p>
        <h1 className="mt-2 text-3xl font-semibold">Pagamentos e ativações</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Solicitações criadas antes do cliente abrir a SumUp. Confira o pagamento recebido e confirme a ativação do plano por aqui.</p>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="border border-white/10 bg-card p-4"><p className="text-xs text-muted-foreground">Pendentes</p><p className="mt-2 text-2xl font-semibold">{pending.length}</p></div>
        <div className="border border-primary/20 bg-primary/[0.04] p-4"><p className="text-xs text-muted-foreground">Cliente informou pagamento</p><p className="mt-2 text-2xl font-semibold text-primary">{reported}</p></div>
        <div className="border border-white/10 bg-card p-4"><p className="text-xs text-muted-foreground">Ativações confirmadas</p><p className="mt-2 text-2xl font-semibold">{active}</p></div>
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
