import Link from "next/link";
import { ArrowLeft, ArrowRight, BarChart3, Calculator, FileSearch, Target, TrendingUp } from "lucide-react";
import { AdSlot } from "@/components/ads/AdSlot";
import { getToolHref } from "@/lib/tools";

const sharedTools = [
  {
    title: "Calculadora de ROAS",
    description: "Avalie o retorno sobre o investimento em mídia e o ponto de equilíbrio.",
    href: getToolHref("calculadora-de-roas"),
    icon: TrendingUp,
    source: "Calculadoras",
  },
  {
    title: "Calculadora de ROI",
    description: "Compare ganhos e custos e entenda a rentabilidade do investimento.",
    href: getToolHref("calculadora-de-roi"),
    icon: Calculator,
    source: "Calculadoras",
  },
] as const;

export default function TrafegoPagoHub() {
  return (
    <main className="min-h-screen bg-background pb-14 pt-24 text-foreground">
      <section className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden="true" /> Voltar para o início
        </Link>
        <div className="mt-8 max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-wider text-primary">Marketing de performance</p>
          <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">Tráfego Pago</h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
            Organize metas de campanhas, simule cenários e revise o desempenho de anúncios.
            Um hub dedicado às decisões de quem gerencia tráfego pago, sem duplicar ferramentas já disponíveis no Kivai.
          </p>
        </div>

        <div className="mt-10 rounded-2xl border border-primary/25 bg-primary/[0.045] p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-primary">
            <BarChart3 className="size-4" aria-hidden="true" />
            Ferramenta principal
            <span className="rounded-full border border-primary/20 px-2 py-0.5 text-[10px]">Beta em desenvolvimento</span>
          </div>
          <h2 className="mt-4 text-2xl font-semibold">Analisador de Tráfego Pago Google Ads</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
            Planeje investimento e metas, importe relatórios gerais de qualquer tipo de campanha Google Ads e identifique pontos de atenção.
            A revisão de termos de pesquisa é um recurso complementar. Nesta fase beta, o processamento principal é local e o Gemini pode analisar dados autorizados. A conexão direta com contas Google Ads ainda está em desenvolvimento.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={getToolHref("analisador-de-trafego-pago-google-ads")} className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90">
              Abrir analisador <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              { icon: Target, label: "Planejamento mensal", text: "Metas e estimativas condicionadas aos dados informados." },
              { icon: FileSearch, label: "Campanhas Google Ads", text: "Resumo por tipo de campanha, incluindo Pesquisa e Performance Max." },
              { icon: BarChart3, label: "Diagnóstico progressivo", text: "Métricas gerais agora; auditorias específicas de cada tipo nas próximas etapas." },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-xl border border-white/10 bg-background/70 p-4">
                  <Icon className="size-5 text-primary" aria-hidden="true" />
                  <h3 className="mt-3 text-sm font-semibold">{item.label}</h3>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">{item.text}</p>
                </div>
              );
            })}
          </div>
        </div>

        <section aria-labelledby="ferramentas-relacionadas" className="mt-12">
          <h2 id="ferramentas-relacionadas" className="text-xl font-semibold">Ferramentas relacionadas</h2>
          <p className="mt-2 text-sm text-muted-foreground">Acesse os recursos originais sem retirar ou duplicar ferramentas de outros hubs.</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sharedTools.map((tool) => {
              const Icon = tool.icon;
              return (
                <Link href={tool.href} key={tool.href} className="group flex min-h-48 flex-col rounded-xl border border-white/10 bg-white/[0.035] p-5 transition hover:border-primary/35 hover:bg-white/[0.055]">
                  <div className="flex items-center justify-between">
                    <Icon className="size-5 text-primary" aria-hidden="true" />
                    <span className="text-[11px] text-muted-foreground">{tool.source}</span>
                  </div>
                  <h3 className="mt-4 text-base font-semibold">{tool.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{tool.description}</p>
                  <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-medium group-hover:text-primary">
                    Abrir ferramenta <ArrowRight className="size-4" aria-hidden="true" />
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
        <div className="mt-10"><AdSlot placement="page-footer" /></div>
      </section>
    </main>
  );
}
