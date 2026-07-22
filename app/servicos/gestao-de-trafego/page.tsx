import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Check,
  Crosshair,
  LineChart,
  Search,
  ShieldCheck,
  Target,
  Zap,
} from "lucide-react";

const whatsappUrl =
  "https://wa.me/5531996205058?text=fiquei%20interessado%28a%29%20em%20saber%20mais%20sobre%20os%20servi%C3%A7os%20de%20tr%C3%A1fego%20pago.";

const services = [
  {
    icon: Search,
    title: "Google Ads",
    description:
      "Campanhas estruturadas para alcançar pessoas que já estão pesquisando por produtos, serviços e soluções.",
  },
  {
    icon: Target,
    title: "Rede de Pesquisa",
    description:
      "Estratégias com foco em intenção de busca, palavras-chave, anúncios e direcionamento para oportunidades mais qualificadas.",
  },
  {
    icon: Crosshair,
    title: "Meta Ads",
    description:
      "Campanhas no ecossistema Meta para ampliar presença, gerar demanda e conectar ofertas a públicos estratégicos.",
  },
  {
    icon: LineChart,
    title: "Análise e otimização",
    description:
      "Acompanhamento contínuo para identificar desperdícios, oportunidades e caminhos de melhoria nas campanhas.",
  },
];

const processSteps = [
  {
    number: "01",
    title: "Entendimento do negócio",
    description:
      "Análise do serviço, público, objetivos, região de atuação e cenário atual da operação.",
  },
  {
    number: "02",
    title: "Planejamento da estratégia",
    description:
      "Definição dos canais, campanhas, segmentações e estrutura mais adequada para o objetivo.",
  },
  {
    number: "03",
    title: "Criação e configuração",
    description:
      "Estruturação das campanhas, anúncios e principais elementos necessários para iniciar a operação.",
  },
  {
    number: "04",
    title: "Acompanhamento e evolução",
    description:
      "Leitura dos dados e otimizações com foco em decisões mais eficientes ao longo do tempo.",
  },
];

export default function GestaoDeTrafegoPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <section className="relative isolate overflow-hidden border-b border-white/5">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-20 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:linear-gradient(to_bottom,black,transparent_90%)]"
        />

        <div
          aria-hidden="true"
          className="absolute left-1/2 top-0 -z-10 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-primary/15 blur-[150px]"
        />

        <div className="mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6 sm:pb-24 lg:px-8 lg:pb-28">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Voltar para o início
          </Link>

          <div className="mx-auto mt-16 max-w-5xl text-center sm:mt-20">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
              <BarChart3 className="size-4" />
              Gestão profissional de tráfego pago
            </div>

            <h1 className="mt-7 text-4xl font-semibold tracking-[-0.04em] text-foreground sm:text-5xl lg:text-7xl lg:leading-[1.02]">
              Tráfego pago com estratégia para{" "}
              <span className="bg-gradient-to-r from-primary via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                gerar oportunidades reais.
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-muted-foreground sm:text-lg">
              Planejamento, criação e otimização de campanhas para empresas que
              querem transformar investimento em mídia em uma operação mais
              estratégica, mensurável e orientada aos objetivos do negócio.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-[0_0_40px_rgba(99,102,241,0.2)] transition hover:brightness-110 sm:w-auto"
              >
                Pedir orçamento pelo WhatsApp
                <ArrowRight className="size-4" />
              </a>

              <a
                href="#servicos"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-6 py-3.5 text-sm font-semibold text-foreground transition hover:border-primary/30 hover:bg-primary/10 sm:w-auto"
              >
                Conhecer a gestão
              </a>
            </div>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 text-sm text-muted-foreground sm:flex-row sm:gap-6">
              <span className="inline-flex items-center gap-2">
                <Check className="size-4 text-primary" />
                Especialização em Google Ads
              </span>

              <span className="inline-flex items-center gap-2">
                <Check className="size-4 text-primary" />
                Atuação com Meta Ads
              </span>

              <span className="inline-flex items-center gap-2">
                <BadgeCheck className="size-4 text-primary" />
                Certificação Google
              </span>
            </div>
          </div>
        </div>
      </section>

      <section
        id="servicos"
        className="relative border-b border-white/5 py-20 sm:py-24 lg:py-28"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
              <Target className="size-4" />
              Estratégia aplicada ao negócio
            </div>

            <h2 className="mt-6 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Campanhas pensadas para cada{" "}
              <span className="bg-gradient-to-r from-primary via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                objetivo e momento.
              </span>
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              A gestão considera intenção de busca, público, oferta, região,
              investimento disponível e os objetivos reais da empresa.
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:mt-14 lg:grid-cols-4">
            {services.map((service) => {
              const Icon = service.icon;

              return (
                <article
                  key={service.title}
                  className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025] p-6 transition duration-300 hover:-translate-y-1 hover:border-primary/30 hover:bg-white/[0.045]"
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
                      {service.title}
                    </h3>

                    <p className="mt-3 text-sm leading-7 text-muted-foreground">
                      {service.description}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-b border-white/5 bg-[#07080d] py-20 sm:py-24 lg:py-28">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[760px] -translate-x-1/2 rounded-full bg-primary/[0.08] blur-[140px]"
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
                <ShieldCheck className="size-4" />
                Especialização e visão estratégica
              </div>

              <h2 className="mt-6 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                Mais do que colocar{" "}
                <span className="bg-gradient-to-r from-primary via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                  campanhas no ar.
                </span>
              </h2>

              <p className="mt-6 text-base leading-8 text-muted-foreground sm:text-lg">
                Minha principal especialização está no Google Ads, com forte
                atuação em campanhas de Rede de Pesquisa. Esse formato permite
                trabalhar a intenção de pessoas que já procuram por uma solução,
                produto ou serviço.
              </p>

              <p className="mt-4 text-base leading-8 text-muted-foreground">
                Também atuo com outros formatos de campanha no Google e com
                Meta Ads, avaliando qual combinação faz mais sentido para o
                objetivo, público e momento de cada negócio.
              </p>
            </div>

            <div className="rounded-3xl border border-primary/25 bg-gradient-to-br from-primary/[0.11] via-white/[0.03] to-cyan-400/[0.05] p-6 sm:p-8">
              <div className="flex items-start gap-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                  <BadgeCheck className="size-5" />
                </span>

                <div>
                  <p className="text-xl font-semibold tracking-tight text-foreground">
                    Profissional certificado pelo Google
                  </p>

                  <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">
                    Conhecimento técnico aliado à experiência prática em
                    marketing digital, análise de campanhas, e-commerce e
                    estratégias orientadas à conversão.
                  </p>
                </div>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                  <p className="text-sm font-semibold text-foreground">
                    Google Ads
                  </p>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    Pesquisa e outros formatos conforme a estratégia.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                  <p className="text-sm font-semibold text-foreground">
                    Meta Ads
                  </p>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    Campanhas para alcance, demanda e oportunidades.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative border-b border-white/5 py-20 sm:py-24 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
              <Zap className="size-4" />
              Como funciona
            </div>

            <h2 className="mt-6 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Uma gestão construída com{" "}
              <span className="bg-gradient-to-r from-primary via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                método e acompanhamento.
              </span>
            </h2>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:mt-14 lg:grid-cols-4">
            {processSteps.map((step) => (
              <article
                key={step.number}
                className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025] p-6"
              >
                <span className="text-4xl font-semibold tracking-tighter text-primary/25">
                  {step.number}
                </span>

                <h3 className="mt-6 text-lg font-semibold tracking-tight text-foreground">
                  {step.title}
                </h3>

                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden py-20 sm:py-24 lg:py-28">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 h-[480px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/[0.08] blur-[150px]"
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[2rem] border border-primary/25 bg-gradient-to-br from-primary/[0.13] via-white/[0.035] to-cyan-400/[0.07] px-6 py-14 text-center sm:px-10 sm:py-16 lg:px-16">
            <div className="mx-auto max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
                <BarChart3 className="size-4" />
                Vamos analisar seu cenário
              </div>

              <h2 className="mt-6 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                Quer entender como o tráfego pago pode{" "}
                <span className="bg-gradient-to-r from-primary via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                  ajudar seu negócio?
                </span>
              </h2>

              <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                Entre em contato para conversar sobre seus objetivos, cenário
                atual e possibilidades de estratégia para Google Ads e Meta Ads.
              </p>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-[0_0_40px_rgba(99,102,241,0.2)] transition hover:brightness-110 sm:w-auto"
              >
                Pedir orçamento pelo WhatsApp
                <ArrowRight className="size-4" />
              </a>

              <p className="mt-4 text-xs leading-5 text-muted-foreground">
                O contato inicial não representa garantia de resultados ou
                aprovação imediata de uma estratégia.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}