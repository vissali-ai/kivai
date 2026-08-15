import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  MapPin,
  LayoutTemplate,
  Megaphone,
  PieChart,
  Search,
  Settings2,
  Share2,
  ShoppingCart,
  Sparkles,
  Store,
  Workflow,
} from "lucide-react";
import { getPageMetadata } from "@/lib/seo";

export const metadata = getPageMetadata({
  title: "Serviços Digitais",
  description: "Serviços de marketing, e-commerce, SEO local, presença no Google, automação de processos, dashboards, sistemas, Social Media e tráfego pago.",
  pathname: "/servicos",
});

const services = [
  {
    icon: Share2,
    title: "Social Media",
    description:
      "Planejamento, criação e publicação de conteúdos para empresas que querem fortalecer sua presença nas redes sociais.",
    href: "/servicos/social-media",
    action: "Conhecer serviço",
    badge: "Período de teste grátis",
  },
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
  {
    icon: Workflow,
    title: "Automação de Processos",
    description:
      "Integre ferramentas, automatize tarefas, relatórios e notificações e organize fluxos operacionais.",
    href: "/servicos/automacao-de-processos",
    action: "Conhecer o serviço",
  },
  {
    icon: MapPin,
    title: "Presença Local no Google",
    description:
      "Criação e otimização do Perfil da Empresa com serviços, fotos, avaliações, conteúdo e acompanhamento.",
    href: "/servicos/presenca-local-no-google",
    action: "Fortalecer presença local",
  },
  {
    icon: ShoppingCart,
    title: "Consultoria para E-commerce",
    description:
      "Análise de operação, catálogo, margem, conversão, marketplaces, estoque, marketing e indicadores.",
    href: "/servicos/consultoria-para-e-commerce",
    action: "Conhecer a consultoria",
  },
  {
    icon: Store,
    title: "Criação de Loja Virtual",
    description:
      "Implantação de e-commerce com catálogo, pagamentos, integrações, Analytics, pixels e Merchant Center.",
    href: "/servicos/criacao-de-loja-virtual",
    action: "Planejar minha loja",
  },
  {
    icon: Search,
    title: "SEO Local",
    description:
      "Estrutura de páginas, palavras-chave locais, presença no Google, reputação e acompanhamento de posições.",
    href: "/servicos/seo-local",
    action: "Conhecer o serviço",
  },
  {
    icon: PieChart,
    title: "Dashboards e Relatórios",
    description:
      "Indicadores personalizados para marketing, vendas, financeiro e operação, com fontes integradas.",
    href: "/servicos/dashboards-e-relatorios",
    action: "Organizar meus dados",
  },
  {
    icon: Settings2,
    title: "Sistemas e Automações Personalizadas",
    description:
      "Ferramentas web para CRM, estoque, pedidos, leads, orçamentos, agendas e rotinas internas.",
    href: "/servicos/sistemas-e-automacoes-personalizadas",
    action: "Avaliar meu projeto",
  },
];

export default function ServicosPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <section
        id="servicos"
        className="relative overflow-hidden border-y border-white/5 bg-[#07080d] py-20 sm:py-24 lg:py-28"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-primary/10 blur-[140px]"
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Voltar para a Home
          </Link>

          <div className="mx-auto mt-12 max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
              <Sparkles className="size-4" />
              Serviços profissionais
            </div>

            <h1 className="mt-6 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Serviços para ampliar seus{" "}
              <span className="bg-gradient-to-r from-primary via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                resultados digitais.
              </span>
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              Conheça soluções para atrair oportunidades, organizar sua
              operação, acompanhar dados e fortalecer sua presença digital.
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
    </main>
  );
}
