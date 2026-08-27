import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, ShieldCheck, UsersRound, Zap } from "lucide-react";
import { SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: { absolute: "Planos Kivai | Grátis, Pro e Agency" },
  description: "Compare os planos Grátis, Pro e Agency do Kivai para analisar e acompanhar contas do Instagram.",
  alternates: { canonical: `${SITE_URL}/planos` },
  robots: { index: true, follow: true },
};

const plans = [
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
] as const;

function checkoutHref(plan: string, billing: "monthly" | "annual") {
  return `/conta/checkout?plan=${encodeURIComponent(plan)}&billing=${billing}`;
}

export default function PlansPage() {
  return (
    <main className="min-h-screen bg-background pb-20 pt-24 text-foreground">
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Planos Kivai</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Escolha o plano ideal para sua análise</h1>
          <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg">Comece gratuitamente ou escolha um plano com histórico, múltiplas contas e recursos avançados. Na contratação de um plano pago, o Kivai confirma sua conta antes de abrir o pagamento seguro.</p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {plans.map((plan) => (
            <article key={plan.code} className={`flex flex-col border p-6 ${plan.highlighted ? "border-primary/40 bg-primary/[0.05]" : "border-white/10 bg-card"}`}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-2xl font-semibold">{plan.name}</h2>
                {plan.highlighted ? <span className="border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">Mais escolhido</span> : null}
              </div>
              <p className="mt-3 min-h-16 text-sm leading-6 text-muted-foreground">{plan.description}</p>
              <div className="mt-5 border-y border-white/10 py-5">
                <p className="text-2xl font-semibold">{plan.monthly}</p>
                <p className="mt-2 text-sm font-medium text-primary">{plan.annual}</p>
                {"annualNote" in plan ? <p className="mt-1 text-xs text-muted-foreground">{plan.annualNote}</p> : null}
              </div>
              <ul className="mt-5 flex-1 space-y-3">
                {plan.features.map((feature) => <li key={feature} className="flex gap-3 text-sm leading-6 text-muted-foreground"><Check className="mt-1 size-4 shrink-0 text-primary" /><span>{feature}</span></li>)}
              </ul>
              <div className="mt-6 space-y-2">
                {plan.code === "free" ? (
                  <Link href="/conta/cadastro?next=%2Fconta" className="inline-flex w-full items-center justify-center gap-2 bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90">Criar conta grátis<ArrowRight className="size-4" /></Link>
                ) : (
                  <>
                    <Link href={checkoutHref(plan.code, "monthly")} className="inline-flex w-full items-center justify-center gap-2 bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90">Assinar mensal<ArrowRight className="size-4" /></Link>
                    <Link href={checkoutHref(plan.code, "annual")} className="inline-flex w-full items-center justify-center gap-2 border border-primary/30 px-5 py-3 text-sm font-semibold text-primary transition hover:bg-primary/5">Assinar anual</Link>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>

        <section className="mt-14 grid gap-4 md:grid-cols-3">
          <div className="border border-white/10 bg-card p-5"><Zap className="size-5 text-primary" /><h2 className="mt-3 font-semibold">1. Escolha o plano</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Compare limites, recursos e periodicidade antes de continuar.</p></div>
          <div className="border border-white/10 bg-card p-5"><UsersRound className="size-5 text-primary" /><h2 className="mt-3 font-semibold">2. Confirme sua conta</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Se ainda não estiver conectado, o Kivai solicita o login e retorna automaticamente para o plano escolhido.</p></div>
          <div className="border border-white/10 bg-card p-5"><ShieldCheck className="size-5 text-primary" /><h2 className="mt-3 font-semibold">3. Finalize o pagamento</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">O pagamento é processado com segurança pela SumUp e o plano é ativado após a confirmação.</p></div>
        </section>
      </section>
    </main>
  );
}
