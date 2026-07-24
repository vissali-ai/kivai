import {
  ArrowRight,
  BarChart3,
  Check,
  Crosshair,
  LineChart,
  Search,
  Target,
} from "lucide-react";

const serviceBenefits = [
  {
    icon: Target,
    title: "Campanhas orientadas a objetivos",
    description:
      "Estratégias planejadas conforme metas de vendas, geração de contatos e crescimento do negócio.",
  },
  {
    icon: Search,
    title: "Google Ads",
    description:
      "Campanhas para alcançar pessoas que já estão pesquisando por produtos, serviços e soluções.",
  },
  {
    icon: Crosshair,
    title: "Meta Ads",
    description:
      "Campanhas para ampliar alcance, gerar demanda e conectar sua oferta ao público certo.",
  },
  {
    icon: LineChart,
    title: "Análise e otimização",
    description:
      "Acompanhamento de desempenho para identificar oportunidades e melhorar decisões ao longo das campanhas.",
  },
];

export function PaidTrafficSection() {
  return (
   <section
  id="servicos"
  className="relative overflow-hidden border-t border-white/5 bg-[#07080d] py-20 sm:py-24 lg:py-32"
>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute left-0 top-1/4 h-[420px] w-[420px] rounded-full bg-primary/[0.07] blur-[140px]" />
        <div className="absolute bottom-0 right-0 h-[360px] w-[360px] rounded-full bg-cyan-400/[0.05] blur-[130px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
              <BarChart3 className="size-4" />
              Serviço profissional
            </div>

            <h2 className="mt-6 max-w-2xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Gestão de tráfego pago para{" "}
              <span className="bg-gradient-to-r from-primary via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                transformar investimento em crescimento.
              </span>
            </h2>

            <p className="mt-6 max-w-xl text-base leading-8 text-muted-foreground sm:text-lg">
              Planejamento, criação, acompanhamento e otimização de campanhas
              para empresas que buscam mais oportunidades, vendas e presença
              digital.
            </p>

            <div className="mt-7 space-y-3">
              <div className="flex items-start gap-3 text-sm text-foreground/90">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Check className="size-3.5" />
                </span>
                Estratégia alinhada aos objetivos do negócio
              </div>

              <div className="flex items-start gap-3 text-sm text-foreground/90">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Check className="size-3.5" />
                </span>
                Campanhas em Google Ads e Meta Ads
              </div>

              <div className="flex items-start gap-3 text-sm text-foreground/90">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Check className="size-3.5" />
                </span>
                Acompanhamento focado em desempenho
              </div>
            </div>

            <a
              href="#contato"
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-[0_0_35px_rgba(99,102,241,0.18)] transition hover:brightness-110 sm:w-auto"
            >
              Solicitar uma análise
              <ArrowRight className="size-4" />
            </a>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {serviceBenefits.map((benefit) => {
              const Icon = benefit.icon;

              return (
                <article
                  key={benefit.title}
                  className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition duration-300 hover:-translate-y-1 hover:border-primary/30 hover:bg-white/[0.05]"
                >
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-16 -top-16 size-40 rounded-full bg-primary/10 blur-3xl opacity-0 transition duration-300 group-hover:opacity-100"
                  />

                  <div className="relative">
                    <span className="flex size-12 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </span>

                    <h3 className="mt-7 text-lg font-semibold tracking-tight text-foreground">
                      {benefit.title}
                    </h3>

                    <p className="mt-3 text-sm leading-7 text-muted-foreground">
                      {benefit.description}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}