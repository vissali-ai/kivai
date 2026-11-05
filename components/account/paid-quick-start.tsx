"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import type { PlanCode } from "@/lib/billing/plan-benefits";

type PaidPlan = Extract<PlanCode, "pro" | "agency">;

const journeys: Record<PaidPlan, { title: string; description: string; steps: { label: string; detail: string; href: string }[] }> = {
  pro: {
    title: "Comece a aproveitar seu Pro",
    description: "Três ações para usar os recursos que já fazem parte da sua assinatura.",
    steps: [
      { label: "Crie um planejamento e salve na conta", detail: "Retome o trabalho em outro dispositivo e reutilize seu projeto.", href: "/ferramentas/planejador-de-conteudo-social-media" },
      { label: "Explore suas ferramentas com IA", detail: "O Pro inclui 100 créditos de IA por mês.", href: "/creditos" },
      { label: "Acompanhe a evolução do Instagram", detail: "Importe exportações da Meta em períodos diferentes para comparar resultados.", href: "/conta/pro" },
    ],
  },
  agency: {
    title: "Coloque seu Agency para trabalhar",
    description: "Organize uma entrega real para um cliente usando recursos já disponíveis.",
    steps: [
      { label: "Salve um planejamento por cliente", detail: "Organize seus projetos com o nome do cliente.", href: "/ferramentas/planejador-de-conteudo-social-media" },
      { label: "Envie a primeira publicação para aprovação", detail: "No Kivai Aprova, seu cliente responde por link privado, sem criar conta.", href: "/conta/pro" },
      { label: "Reaproveite relatórios e análises", detail: "Mantenha informações e projetos de cada cliente organizados.", href: "/ferramentas/gerador-de-relatorio-social-media" },
    ],
  },
};

export function PaidQuickStart({ plan }: { plan: PaidPlan }) {
  const journey = journeys[plan];
  return (
    <section aria-labelledby="paid-quick-start-title" className="rounded-2xl border border-primary/30 bg-primary/[0.035] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">Primeiros resultados · {plan === "agency" ? "Agency" : "Pro"}</p>
      <h2 id="paid-quick-start-title" className="mt-2 text-xl font-semibold">{journey.title}</h2>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{journey.description}</p>
      <ol className="mt-4 grid gap-3 md:grid-cols-3">
        {journey.steps.map((step, index) => (
          <li key={step.href + index} className="flex flex-col rounded-xl border border-border bg-card p-4">
            <span className="flex items-center gap-2 text-xs text-primary"><CheckCircle2 className="size-4" aria-hidden="true" /> Sugestão {index + 1}</span>
            <h3 className="mt-2 text-sm font-semibold">{step.label}</h3>
            <p className="mt-1 flex-1 text-xs leading-5 text-muted-foreground">{step.detail}</p>
            <Link href={step.href} className="mt-3 inline-flex min-h-9 items-center gap-2 self-start text-sm font-medium text-primary hover:underline">Começar <ArrowRight className="size-4" aria-hidden="true" /></Link>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-xs text-muted-foreground">Estas são sugestões de uso, não tarefas obrigatórias nem progresso monitorado.</p>
    </section>
  );
}
