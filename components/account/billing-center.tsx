"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getStoredSession } from "@/lib/user-auth";

type Order = {
  id: string;
  pack_code: string;
  credits: number;
  amount_cents: number;
  status: string;
  created_at: string;
};
type Request = {
  id: string;
  plan_code: string;
  billing_cycle: string;
  status: string;
  created_at: string;
};
type Overview = {
  plan: "free" | "pro" | "agency";
  testMode?: boolean;
  subscription: {
    plan_code: string;
    status: string;
    current_period_end: string | null;
    billing_cycle: string | null;
    provider: string | null;
    test_access: boolean;
  } | null;
  creditOrders: Order[];
  planRequests: Request[];
  changeRequests: Array<{ id: string; action: string; state: string; requested_at: string; target_plan: string; target_cycle: string | null }>;
  recurringManagementReady: boolean;
  servicesBillingReady: boolean;
};
const planLabel = { free: "Grátis", pro: "Pro", agency: "Agency" };
function date(value: string | null | undefined) {
  if (!value) return "Não informada";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "Não informada" : parsed.toLocaleDateString("pt-BR");
}
function currency(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function BillingCenter() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    const session = getStoredSession();
    if (!session?.access_token) {
      window.location.replace("/conta/login?next=%2Fconta%2Fcobrancas");
      return () => controller.abort();
    }
    void fetch("/api/account/billing-overview", {
      headers: { Authorization: `Bearer ${session.access_token}` },
      cache: "no-store",
      signal: controller.signal,
    }).then(async response => {
      if (!response.ok) throw Error("Não foi possível consultar suas informações financeiras.");
      return await response.json() as Overview;
    }).then(data => {
      if (!controller.signal.aborted) setOverview(data);
    }).catch(() => {
      if (!controller.signal.aborted) setError("Não foi possível consultar suas informações financeiras.");
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  if (loading) return <p role="status" className="text-sm text-muted-foreground">Carregando cobranças...</p>;
  if (error || !overview) return <p role="alert" className="text-sm text-destructive">{error || "Dados indisponíveis."}</p>;

  async function requestChange(action: "cancel_renewal" | "upgrade" | "downgrade" | "change_cycle", targetCycle?: "monthly" | "annual") {
    if (working || !overview) return;
    const label = action === "cancel_renewal" ? "solicitar o cancelamento da renovação" : action === "upgrade" ? "solicitar upgrade para Agency" : action === "downgrade" ? "solicitar downgrade para Pro" : "solicitar a mudança da periodicidade";
    if (!window.confirm(`Deseja ${label}? Isto abre uma solicitação para análise. NÃO interrompe nem altera a cobrança no provedor neste momento.`)) return;
    const session = getStoredSession();
    if (!session?.access_token) { setNotice("Faça login novamente."); return; }
    setWorking(true); setNotice("");
    try {
      const response = await fetch("/api/account/subscription-change", {
        method: "POST", cache: "no-store",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ action, ...(targetCycle ? { targetCycle } : {}) }),
      });
      const data = await response.json() as { message?: string; error?: string };
      if (!response.ok) throw Error(data.error || "Solicitação indisponível.");
      setNotice(data.message || "Solicitação registrada, aguardando análise.");
      const refreshed = await fetch("/api/account/billing-overview",{
        headers: { Authorization: `Bearer ${session.access_token}` },cache:"no-store",
      });
      if (refreshed.ok) setOverview(await refreshed.json() as Overview);
    } catch(error) {
      setNotice(error instanceof Error ? error.message : "Falha ao registrar solicitação.");
    } finally { setWorking(false); }
  }

  const period = overview.subscription?.billing_cycle === "annual" ? "Anual" :
    overview.subscription?.billing_cycle === "monthly" ? "Mensal" : "Não informado";
  const isAsaas = overview.subscription?.provider === "asaas";
  return <div className="space-y-8">
    <header className="space-y-3">
      <Link className="text-sm text-primary underline" href="/conta">Voltar à minha conta</Link>
      <h1 className="text-3xl font-semibold">Minha assinatura e pagamentos</h1>
      <p className="text-sm text-muted-foreground">Acompanhe seu plano e compras avulsas de créditos. Pagamentos de serviços personalizados são tratados por orçamento.</p>
    </header>
    <section className="space-y-4 border border-border bg-card p-5 sm:p-7" aria-labelledby="billing-plan-title">
      <h2 id="billing-plan-title" className="text-xl font-semibold">Minha assinatura</h2>
      <dl className="grid gap-4 text-sm sm:grid-cols-3">
        <div><dt className="text-muted-foreground">Plano atual</dt><dd className="mt-1 font-semibold">{planLabel[overview.plan] ?? overview.plan}</dd></div>
        <div><dt className="text-muted-foreground">Periodicidade registrada</dt><dd className="mt-1 font-semibold">{period}</dd></div>
        <div><dt className="text-muted-foreground">Fim do período registrado</dt><dd className="mt-1 font-semibold">{date(overview.subscription?.current_period_end)}</dd></div>
      </dl>
      <p className="text-sm text-muted-foreground">{overview.testMode
        ? "Conta em modo de avaliação. O plano exibido simula os benefícios e não gera cobrança nem altera a assinatura real."
        : overview.plan === "free"
        ? "Você não possui um plano pago vigente."
        : overview.subscription?.test_access
          ? "Este acesso é de teste. Não gera cobrança automática."
          : isAsaas
            ? "A assinatura está vinculada ao Asaas. Alterações de cobrança exigem confirmação junto ao provedor."
            : "Seu plano atual foi registrado por um fluxo anterior. Não presuma que a cobrança recorrente foi cancelada ao mudar de plano no site."}</p>
      <div className="flex flex-wrap gap-3">
        <Link href="/planos" className="inline-flex min-h-10 items-center bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Ver opções de plano</Link>
        {!overview.testMode && overview.plan === "pro" && !overview.subscription?.test_access && <button type="button" disabled={working} onClick={() => void requestChange("upgrade")} className="min-h-10 border border-border px-4 py-2 text-sm font-medium disabled:opacity-50">Solicitar upgrade para Agency</button>}
        {!overview.testMode && overview.plan === "agency" && !overview.subscription?.test_access && <button type="button" disabled={working} onClick={() => void requestChange("downgrade")} className="min-h-10 border border-border px-4 py-2 text-sm font-medium disabled:opacity-50">Solicitar downgrade para Pro</button>}
        {!overview.testMode && overview.plan !== "free" && !overview.subscription?.test_access && <>
          <button type="button" disabled={working} onClick={() => void requestChange("cancel_renewal")} className="min-h-10 border border-border px-4 py-2 text-sm font-medium disabled:opacity-50">Solicitar cancelamento da renovação</button>
          <button type="button" disabled={working || !["monthly","annual"].includes(overview.subscription?.billing_cycle ?? "")} onClick={() => void requestChange("change_cycle", overview.subscription?.billing_cycle === "monthly" ? "annual" : "monthly")} className="min-h-10 border border-border px-4 py-2 text-sm font-medium disabled:opacity-50">Solicitar mudança para {period === "Mensal" ? "anual" : "mensal"}</button>
        </>}
        <Link href="/conta/atendimento" className="inline-flex min-h-10 items-center border border-border px-4 py-2 text-sm font-medium">Falar com atendimento</Link>
      </div>
      {notice && <p role="status" className="text-sm font-medium">{notice}</p>}
      {(overview.changeRequests?.length ?? 0) > 0 && <div className="space-y-2 text-sm">
        <h3 className="font-semibold">Solicitações recentes</h3>
        <ul className="space-y-1">
          {overview.changeRequests.slice(0,5).map(item => <li key={item.id}>{date(item.requested_at)} · {item.action === "cancel_renewal" ? "Cancelar renovação" : item.action === "upgrade" ? "Upgrade" : item.action === "downgrade" ? "Downgrade" : "Alterar periodicidade"} · {item.state === "pending_review" ? "Aguardando análise" : item.state === "completed" ? "Concluída" : item.state === "rejected" ? "Não aprovada" : "Em processamento"}</li>)}
        </ul>
      </div>}
      <p className="text-xs text-muted-foreground">Estas ações apenas registram solicitações. A cobrança no provedor NÃO é cancelada nem alterada automaticamente. O cancelamento só estará confirmado após a operação financeira e a atualização do status da solicitação.</p>
    </section>
    <section className="space-y-4 border border-border bg-card p-5 sm:p-7" aria-labelledby="billing-credits-title">
      <h2 id="billing-credits-title" className="text-xl font-semibold">Créditos de IA: compras avulsas</h2>
      <p className="text-sm text-muted-foreground">Pacotes de créditos são compras únicas, sem renovação automática.</p>
      {overview.creditOrders.length ? <ul className="divide-y divide-border border-y border-border">
        {overview.creditOrders.map(order => <li key={order.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
          <div><p className="font-medium">{order.credits} créditos</p><p className="text-muted-foreground">{date(order.created_at)} · {order.status === "paid" ? "Pago" : order.status === "pending" ? "Pendente" : "Cancelado"}</p></div>
          <span className="font-semibold">{currency(order.amount_cents)}</span>
        </li>)}
      </ul> : <p className="text-sm text-muted-foreground">Nenhuma compra avulsa registrada.</p>}
      <Link href="/creditos" className="inline-flex min-h-10 items-center border border-border px-4 py-2 text-sm font-medium">Ver pacotes e saldo de créditos</Link>
    </section>
    <section className="space-y-3 border border-border bg-card p-5 sm:p-7" aria-labelledby="billing-services-title">
      <h2 id="billing-services-title" className="text-xl font-semibold">Serviços personalizados</h2>
      <p className="text-sm text-muted-foreground">Gestão de tráfego, social media, SEO, automações, landing pages e outros serviços são contratados conforme proposta e escopo. Não há cobrança recorrente automática desses serviços nesta área.</p>
      <div className="flex flex-wrap gap-3">
        <Link href="/servicos" className="inline-flex min-h-10 items-center border border-border px-4 py-2 text-sm font-medium">Ver serviços</Link>
        <Link href="/conta/atendimento" className="inline-flex min-h-10 items-center border border-border px-4 py-2 text-sm font-medium">Falar sobre uma cobrança</Link>
      </div>
    </section>
  </div>;
}
