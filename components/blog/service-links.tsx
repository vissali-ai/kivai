import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

const serviceLinks = [
  { name: "Social Media", href: "/servicos/social-media" },
  { name: "Gestão de Tráfego Pago", href: "/servicos/gestao-de-trafego" },
  { name: "Divulgação para Artistas", href: "/servicos/divulgacao-artistas" },
  { name: "Criação de Landing Pages", href: "/servicos/criacao-de-landing-pages" },
  { name: "Automação de Processos", href: "/servicos/automacao-de-processos" },
  { name: "Presença Local no Google", href: "/servicos/presenca-local-no-google" },
  { name: "Consultoria para E-commerce", href: "/servicos/consultoria-para-e-commerce" },
  { name: "Criação de Loja Virtual", href: "/servicos/criacao-de-loja-virtual" },
  { name: "SEO Local", href: "/servicos/seo-local" },
  { name: "Dashboards e Relatórios", href: "/servicos/dashboards-e-relatorios" },
  { name: "Sistemas e Automações Personalizadas", href: "/servicos/sistemas-e-automacoes-personalizadas" },
];

export function BlogServiceLinks() {
  return (
    <section aria-labelledby="services-heading" className="mt-14 border-t border-white/10 pt-10 sm:mt-16 sm:pt-12">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
          <Sparkles className="size-4" />
        </span>
        <div>
          <h2 id="services-heading" className="text-2xl font-semibold sm:text-3xl">Serviços relacionados aos conteúdos do Kivai</h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">
            Conheça soluções para aplicar estratégia, tecnologia, dados e presença digital no seu negócio.
          </p>
        </div>
      </div>

      <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {serviceLinks.map((service) => (
          <Link
            key={service.href}
            href={service.href}
            className="group flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.025] px-4 py-4 text-sm font-medium transition hover:border-primary/35 hover:bg-primary/[0.07]"
          >
            {service.name}
            <ArrowRight className="size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
          </Link>
        ))}
      </div>
    </section>
  );
}
