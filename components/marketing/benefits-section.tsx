import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  LayoutTemplate,
  Megaphone,
  Sparkles,
} from "lucide-react";

const services = [
  {
    icon: BarChart3,
    title: "Gestão de Tráfego Pago",
    description:
      "Estratégias em Google Ads e Meta Ads para gerar oportunidades, vendas e crescimento para o seu negócio.",
    href: "/servicos/gestao-de-trafego",
    action: "Conhecer o serviço",
  },
  {
    icon: Megaphone,
    title: "Divulgação para Artistas e Bandas",
    description:
      "Amplie o alcance de lançamentos, shows e projetos musicais em diferentes redes sociais.",
    href: "/servicos/divulgacao-artistas",
    action: "Ver opções de divulgação",
  },
  {
    icon: LayoutTemplate,
    title: "Criação de Landing Pages",
    description:
      "Páginas modernas, rápidas e personalizadas para negócios, profissionais, eventos, artistas e projetos.",
    href: "/servicos/criacao-de-landing-pages",
    action: "Conhecer",
    badge: "Serviço Premium",
  },
];

export function BenefitsSection() {
  return (
    <section
      id="servicos"
      className="relative overflow-hidden border-y border-white/5 bg-[#07080d] py-20 sm:py-24 lg:py-28"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-primary/10 blur-[140px]"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
            <Sparkles className="size-4" />
            Serviços profissionais
          </div>

          <h2 className="mt-6 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Serviços para ampliar seus{" "}
            <span className="bg-gradient-to-r from-primary via-violet-400 to-cyan-400 bg-clip-text text-transparent">
              resultados digitais.
            </span>
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            Conheça soluções profissionais para atrair oportunidades, fortalecer
            sua presença digital e alcançar novos públicos.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-7xl gap-5 md:grid-cols-2 lg:mt-14 lg:grid-cols-3">
          {services.map((service) => {
            const Icon = service.icon;

            return (
              <Link
                key={service.title}
                href={service.href}
                className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025] p-6 transition duration-300 hover:-translate-y-1 hover:border-primary/35 hover:bg-white/[0.045] sm:p-7"
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-primary/10 blur-3xl opacity-0 transition duration-300 group-hover:opacity-100"
                />

                <div className="relative flex h-full flex-col">
                  <div className="flex items-start justify-between gap-4">
                    <span className="flex size-12 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary transition duration-300 group-hover:scale-105">
                      <Icon className="size-5" />
                    </span>

                    <div className="flex items-center gap-2">
                      {service.badge && (
                        <span className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
                          {service.badge}
                        </span>
                      )}

                      <span className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-muted-foreground transition duration-300 group-hover:border-primary/30 group-hover:bg-primary/10 group-hover:text-primary">
                        <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </div>

                  <h3 className="mt-8 text-xl font-semibold tracking-tight text-foreground">
                    {service.title}
                  </h3>

                  <p className="mt-3 flex-1 text-sm leading-7 text-muted-foreground">
                    {service.description}
                  </p>

                  <div className="mt-7 border-t border-white/10 pt-5">
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-foreground transition group-hover:text-primary">
                      {service.action}
                      <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}