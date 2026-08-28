"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Check, Crown, ExternalLink, Loader2, ShieldCheck, UsersRound, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentUser, getStoredSession, supabaseUserFetch } from "@/lib/user-auth";

type PlanCode = "free" | "pro" | "agency";
type PaidPlanCode = Exclude<PlanCode, "free">;
type BillingCycle = "monthly" | "annual";

type Plan = {
  code: PlanCode;
  name: string;
  monthly: string;
  annual: string;
  annualNote?: string;
  description: string;
  features: readonly string[];
  highlighted: boolean;
};

type Customer = {
  id: string;
  email: string;
  fullName: string;
};

const paymentLinks: Record<PaidPlanCode, Record<BillingCycle, string>> = {
  pro: {
    monthly: "https://pay.sumup.com/b2c/QCQIWOP0",
    annual: "https://pay.sumup.com/b2c/Q4QPYZFA",
  },
  agency: {
    monthly: "https://pay.sumup.com/b2c/QYY1WQHF",
    annual: "https://pay.sumup.com/b2c/Q13MYNQA",
  },
};

const prices: Record<PaidPlanCode, Record<BillingCycle, number>> = {
  pro: { monthly: 19.9, annual: 199 },
  agency: { monthly: 59.9, annual: 599 },
};

const plans: readonly Plan[] = [
  {
    code: "free",
    name: "Grátis",
    monthly: "R$ 0",
    annual: "Grátis",
    description: "Para análises essenciais de uma conta do Instagram.",
    features: [
      "1 conta por análise",
      "Até 50 mil seguidores",
      "Quem não segue você de volta",
      "Quem você não segue de volta",
      "Seguidores mútuos",
      "Processamento local no navegador",
    ],
    highlighted: false,
  },
  {
    code: "pro",
    name: "Pro",
    monthly: "R$ 19,90/mês",
    annual: "R$ 199/ano",
    annualNote: "Economize R$ 39,80 no plano anual",
    description: "Para quem acompanha a evolução de perfis e precisa de histórico entre análises.",
    features: [
      "Até 5 contas",
      "Até 500 mil seguidores por perfil",
      "Histórico privado de análises",
      "Comparação automática entre exportações",
      "Novos seguidores e quem deixou de seguir por período",
      "Curtidas, comentários e interações com stories quando incluídos na exportação",
    ],
    highlighted: true,
  },
  {
    code: "agency",
    name: "Agency",
    monthly: "R$ 59,90/mês",
    annual: "R$ 599/ano",
    annualNote: "Economize R$ 119,80 no plano anual",
    description: "Para agências, social medias e profissionais que administram várias contas e clientes.",
    features: [
      "Até 20 contas/clientes",
      "Históricos separados por conta",
      "Comparações e acompanhamento contínuo",
      "Relatórios organizados por cliente",
      "Análise ampliada da exportação oficial da Meta",
      "Estrutura para operações com maior volume",
    ],
    highlighted: false,
  },
];

export function PlansClient() {
  const [currentPlan, setCurrentPlan] = useState<PlanCode | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [checkedSession, setCheckedSession] = useState(false);
  const [starting, setStarting] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCurrentPlan() {
      const session = getStoredSession();
      if (!session?.access_token) {
        setCheckedSession(true);
        return;
      }

      try {
        const user = await getCurrentUser(session);
        if (!user?.id) {
          setCheckedSession(true);
          return;
        }

        const response = await supabaseUserFetch(`/rest/v1/user_profiles?select=plan_code,full_name&user_id=eq.${encodeURIComponent(user.id)}&limit=1`);
        const rows = response.ok ? await response.json() as Array<{ plan_code?: PlanCode; full_name?: string | null }> : [];
        setCurrentPlan(rows[0]?.plan_code ?? "free");
        setCustomer({
          id: user.id,
          email: user.email ?? "",
          fullName: rows[0]?.full_name?.trim() || String(user.user_metadata?.full_name ?? user.user_metadata?.name ?? "").trim(),
        });
      } catch {
        setCurrentPlan("free");
      } finally {
        setCheckedSession(true);
      }
    }

    loadCurrentPlan();
  }, []);

  async function startExternalPayment(plan: PaidPlanCode, billing: BillingCycle) {
    if (!customer) {
      window.location.assign(`/conta/login?next=${encodeURIComponent("/planos")}`);
      return;
    }

    const key = `${plan}-${billing}`;
    setStarting(key);
    setError("");
    const paymentLink = paymentLinks[plan][billing];

    try {
      const existingResponse = await supabaseUserFetch(`/rest/v1/subscription_requests?select=id&plan_code=eq.${plan}&billing_cycle=eq.${billing}&status=in.(awaiting_payment,payment_reported)&order=created_at.desc&limit=1`);
      const existing = existingResponse.ok ? await existingResponse.json() as Array<{ id: string }> : [];

      if (!existing.length) {
        const response = await supabaseUserFetch("/rest/v1/subscription_requests", {
          method: "POST",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify({
            user_id: customer.id,
            customer_email: customer.email,
            customer_name: customer.fullName || null,
            plan_code: plan,
            billing_cycle: billing,
            amount_brl: prices[plan][billing],
            payment_provider: "sumup",
            payment_link: paymentLink,
            status: "awaiting_payment",
          }),
        });
        if (!response.ok) throw new Error("Não foi possível registrar sua solicitação de contratação.");
      }

      window.open(paymentLink, "_blank", "noopener,noreferrer");
      window.setTimeout(() => window.location.assign("/conta?pagamento=pendente"), 350);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível iniciar a contratação.");
    } finally {
      setStarting(null);
    }
  }

  return (
    <>
      {error ? <div className="mx-auto mt-8 max-w-2xl border border-red-500/30 bg-red-500/10 p-4 text-center text-sm text-red-200">{error}</div> : null}

      <div className="mt-12 grid gap-5 lg:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = checkedSession && currentPlan === plan.code;
          return (
            <article key={plan.code} className={`relative flex flex-col border p-6 ${isCurrent ? "border-primary bg-primary/[0.08] ring-1 ring-primary/30" : plan.highlighted ? "border-primary/40 bg-primary/[0.05]" : "border-white/10 bg-card"}`}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-2xl font-semibold">{plan.name}</h2>
                {isCurrent ? (
                  <span className="inline-flex items-center gap-1.5 border border-primary/40 bg-primary/15 px-3 py-1 text-xs font-semibold text-primary"><Crown className="size-3.5" /> Plano atual</span>
                ) : plan.highlighted ? (
                  <span className="border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">Mais escolhido</span>
                ) : null}
              </div>

              <p className="mt-3 min-h-16 text-sm leading-6 text-muted-foreground">{plan.description}</p>
              <div className="mt-5 border-y border-white/10 py-5">
                <p className="text-2xl font-semibold">{plan.monthly}</p>
                <p className="mt-2 text-sm font-medium text-primary">{plan.annual}</p>
                {plan.annualNote ? <p className="mt-1 text-xs text-muted-foreground">{plan.annualNote}</p> : null}
              </div>

              <ul className="mt-5 flex-1 space-y-3">
                {plan.features.map((feature) => <li key={feature} className="flex gap-3 text-sm leading-6 text-muted-foreground"><Check className="mt-1 size-4 shrink-0 text-primary" /><span>{feature}</span></li>)}
              </ul>

              <div className="mt-6 space-y-2">
                {isCurrent ? (
                  <div className="flex min-h-12 w-full items-center justify-center border border-primary/30 bg-primary/10 px-5 py-3 text-sm font-semibold text-primary">Este é o seu plano atual</div>
                ) : plan.code === "free" ? (
                  currentPlan ? (
                    <Link href="/conta" className="inline-flex w-full items-center justify-center gap-2 border border-white/10 px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-white/[0.04]">Voltar ao meu painel</Link>
                  ) : (
                    <Link href="/conta/cadastro?next=%2Fconta" className="inline-flex w-full items-center justify-center gap-2 bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90">Criar conta grátis <ArrowRight className="size-4" /></Link>
                  )
                ) : customer ? (
                  <div className="space-y-2">
                    <Button className="h-12 w-full" disabled={starting !== null} onClick={() => startExternalPayment(plan.code as PaidPlanCode, "monthly")}>
                      {starting === `${plan.code}-monthly` ? <Loader2 className="animate-spin" /> : <ExternalLink />} Contratar mensal
                    </Button>
                    <Button variant="outline" className="h-12 w-full border-primary/30 text-primary" disabled={starting !== null} onClick={() => startExternalPayment(plan.code as PaidPlanCode, "annual")}>
                      {starting === `${plan.code}-annual` ? <Loader2 className="animate-spin" /> : <ExternalLink />} Contratar anual
                    </Button>
                    <p className="pt-1 text-center text-xs leading-5 text-muted-foreground">Antes de abrir a SumUp, o Kivai registra a solicitação no seu painel. A ativação acontece depois da confirmação do pagamento pelo administrador.</p>
                  </div>
                ) : (
                  <Link href={`/conta/login?next=${encodeURIComponent("/planos")}`} className="inline-flex w-full items-center justify-center gap-2 bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90">Entrar para contratar <ArrowRight className="size-4" /></Link>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <section className="mt-14 grid gap-4 md:grid-cols-3">
        <div className="border border-white/10 bg-card p-5"><Zap className="size-5 text-primary" /><h2 className="mt-3 font-semibold">1. Escolha o plano</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Compare limites, recursos e periodicidade. Se você já tiver um plano, ele será identificado como Plano atual.</p></div>
        <div className="border border-white/10 bg-card p-5"><UsersRound className="size-5 text-primary" /><h2 className="mt-3 font-semibold">2. Solicitação registrada</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Antes do pagamento, o Kivai registra plano, valor e periodicidade vinculados à sua conta.</p></div>
        <div className="border border-white/10 bg-card p-5"><ShieldCheck className="size-5 text-primary" /><h2 className="mt-3 font-semibold">3. Finalize pela SumUp</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">O pagamento abre na SumUp. Depois, informe no painel que pagou e aguarde a confirmação para ativação.</p></div>
      </section>
    </>
  );
}
