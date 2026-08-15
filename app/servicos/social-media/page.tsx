import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  CalendarDays,
  Check,
  CircleCheck,
  FileText,
  Gift,
  Images,
  LayoutGrid,
  Megaphone,
  MessageSquareQuote,
  MessageSquareText,
  Quote,
  Share2,
  Sparkles,
  Target,
  Video,
  Zap,
} from "lucide-react";
import { getPageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...getPageMetadata({
    title: "Social Media para Empresas",
    description:
      "Planejamento, criação e publicação de conteúdo para redes sociais. Organize a presença digital da sua empresa com estratégia e consistência.",
    pathname: "/servicos/social-media",
  }),
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

const whatsappUrl =
  "https://wa.me/5531996205058?text=Quero%20mais%20informa%C3%A7%C3%B5es%20sobre%20o%20servi%C3%A7o%20de%20Social%20Media.";

const deliveries = [
  {
    icon: CalendarDays,
    title: "Planejamento de 30 dias",
    description:
      "Organização mensal de temas, formatos, pautas e publicações de acordo com os objetivos e prioridades do negócio.",
  },
  {
    icon: Images,
    title: "Criação de conteúdo",
    description:
      "Desenvolvimento de artes, textos, legendas, carrosséis, Stories e conteúdos adaptados à comunicação da empresa.",
  },
  {
    icon: LayoutGrid,
    title: "Calendário editorial",
    description:
      "Planejamento das publicações para manter consistência, variedade de assuntos e uma linha de comunicação organizada.",
  },
  {
    icon: BarChart3,
    title: "Publicação e acompanhamento",
    description:
      "Programação das publicações e acompanhamento das principais métricas para orientar os próximos conteúdos.",
  },
];

const processSteps = [
  {
    number: "01",
    title: "Entendimento do negócio",
    description:
      "Levantamento das informações sobre a empresa, público, produtos, serviços, posicionamento e objetivos.",
  },
  {
    number: "02",
    title: "Planejamento do conteúdo",
    description:
      "Definição de temas, pautas, formatos, calendário editorial e planejamento dos próximos 30 dias.",
  },
  {
    number: "03",
    title: "Criação das publicações",
    description:
      "Produção das artes, textos, legendas e demais conteúdos previstos no planejamento.",
  },
  {
    number: "04",
    title: "Publicação e acompanhamento",
    description:
      "Programação das publicações e acompanhamento das principais métricas para orientar os próximos ciclos.",
  },
];

const contentFormats = [
  { icon: Images, label: "Feed" },
  { icon: LayoutGrid, label: "Carrosséis" },
  { icon: MessageSquareText, label: "Stories" },
  { icon: Video, label: "Reels com materiais do cliente" },
  { icon: FileText, label: "Conteúdos institucionais e educativos" },
  { icon: Megaphone, label: "Conteúdos comerciais" },
  { icon: Target, label: "Produtos e serviços" },
  { icon: Sparkles, label: "Autoridade e relacionamento" },
];

const testimonials = [
  {
    initials: "PE",
    name: "Paulo Eduardo",
    company: "MeiasPrime",
    quote:
      "Uso os serviços do Kivai há mais de quatro anos. Nesse período, nossas redes sociais evoluíram muito e passaram a apresentar a empresa de forma mais profissional.",
  },
  {
    initials: "M",
    name: "Matheus",
    company: "Panela de Ferro Mineira",
    quote:
      "Somos um e-commerce e estamos muito satisfeitos com o trabalho. Nossas redes sociais e nossa comunicação de vendas alcançaram um novo nível profissional, e o engajamento melhorou muito.",
  },
  {
    initials: "CP",
    name: "Coimbra Produtos de Limpeza",
    company: "Cliente Kivai",
    quote:
      "Antes do Kivai, não tínhamos presença nas redes sociais nem e-commerce. Com a construção da nossa presença digital, nossas vendas cresceram cerca de 10%.",
  },
  {
    initials: "PM",
    name: "Papo de Músico",
    company: "Rede social sobre música",
    quote:
      "O serviço é excelente. Começamos do zero e alcançamos 60 mil seguidores com uma estratégia muito bem construída. Hoje, o engajamento da comunidade nos ajuda a fechar parcerias com diversas marcas.",
  },
];

function TestimonialCard({
  testimonial,
}: {
  testimonial: (typeof testimonials)[number];
}) {
  return (
    <article className="flex w-[min(22rem,calc(100vw-3rem))] shrink-0 flex-col rounded-3xl border border-white/10 bg-white/[0.035] p-6 sm:w-[23rem] sm:p-7">
      <Quote className="size-6 text-primary/70" aria-hidden="true" />
      <blockquote className="mt-5 flex-1 text-sm leading-7 text-foreground/90 sm:text-base">
        “{testimonial.quote}”
      </blockquote>
      <footer className="mt-7 flex items-center gap-3 border-t border-white/10 pt-5">
        <span
          aria-hidden="true"
          className="flex size-11 shrink-0 items-center justify-center rounded-full border border-primary/35 bg-gradient-to-br from-primary/25 to-cyan-400/10 text-xs font-semibold text-primary"
        >
          {testimonial.initials}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">
            {testimonial.name}
          </p>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {testimonial.company}
          </p>
        </div>
      </footer>
    </article>
  );
}

export default function SocialMediaPage() {
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

        <div className="mx-auto max-w-7xl px-4 pb-20 pt-24 sm:px-6 sm:pb-24 lg:px-8 lg:pb-28">
          <Link
            href="/servicos"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Voltar para Serviços
          </Link>

          <div className="mx-auto mt-16 max-w-5xl text-center sm:mt-20">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
              <Share2 className="size-4" />
              Social Media para empresas
            </div>

            <h1 className="mt-7 text-4xl font-semibold tracking-[-0.04em] text-foreground sm:text-5xl lg:text-7xl lg:leading-[1.02]">
              Conteúdo com estratégia para fortalecer sua presença nas{" "}
              <span className="bg-gradient-to-r from-primary via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                redes sociais.
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-muted-foreground sm:text-lg">
              Planejamento, criação e publicação de conteúdos para empresas que
              querem manter uma presença profissional, consistente e alinhada aos
              objetivos do negócio.
            </p>

            <div className="mx-auto mt-7 flex max-w-xl items-center justify-center gap-3 rounded-2xl border border-primary/35 bg-primary/10 px-5 py-4 text-left shadow-[0_0_50px_rgba(99,102,241,0.12)]">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Gift className="size-5" />
              </span>
              <p className="text-sm leading-6 text-foreground sm:text-base">
                <strong>Comece com um período de teste grátis</strong> do serviço de
                Social Media.
              </p>
            </div>

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
                href="#entregas"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-6 py-3.5 text-sm font-semibold text-foreground transition hover:border-primary/30 hover:bg-primary/10 sm:w-auto"
              >
                Conhecer o serviço
              </a>
            </div>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 text-sm text-muted-foreground sm:flex-row sm:gap-6">
              {["Planejamento para 30 dias", "Criação de conteúdo", "Publicação nas redes sociais"].map(
                (item) => (
                  <span key={item} className="inline-flex items-center gap-2">
                    <Check className="size-4 text-primary" />
                    {item}
                  </span>
                ),
              )}
            </div>
          </div>
        </div>
      </section>

      <section id="entregas" className="relative border-b border-white/5 py-20 sm:py-24 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
              <Target className="size-4" />
              Conteúdo planejado com estratégia
            </div>
            <h2 className="mt-6 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Muito mais do que{" "}
              <span className="bg-gradient-to-r from-primary via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                simplesmente postar.
              </span>
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              O trabalho de Social Media organiza a comunicação da empresa para que
              cada publicação tenha um objetivo, mantenha consistência e fortaleça o
              posicionamento da marca.
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:mt-14 lg:grid-cols-4">
            {deliveries.map((delivery) => {
              const Icon = delivery.icon;
              return (
                <article
                  key={delivery.title}
                  className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025] p-6 transition duration-300 hover:-translate-y-1 hover:border-primary/30 hover:bg-white/[0.045]"
                >
                  <span className="flex size-12 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-7 text-lg font-semibold tracking-tight">{delivery.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">{delivery.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-b border-white/5 bg-[#07080d] py-20 sm:py-24 lg:py-28">
        <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[760px] -translate-x-1/2 rounded-full bg-primary/[0.08] blur-[140px]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
                <BadgeCheck className="size-4" />
                Estratégia aplicada ao conteúdo
              </div>
              <h2 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
                Mais do que preencher{" "}
                <span className="bg-gradient-to-r from-primary via-violet-400 to-cyan-400 bg-clip-text text-transparent">o feed.</span>
              </h2>
              <p className="mt-6 text-base leading-8 text-muted-foreground sm:text-lg">
                O conteúdo precisa ter função dentro da estratégia da empresa. Por isso,
                o planejamento considera posicionamento, público, produtos, serviços,
                objetivos comerciais e os assuntos que fazem sentido para cada momento.
              </p>
              <p className="mt-4 text-base leading-8 text-muted-foreground">
                A experiência com planejamento de marketing, produção de conteúdo,
                campanhas, copywriting, e-commerce, Google Ads e Meta Ads ajuda a
                desenvolver publicações com uma visão mais ampla de comunicação e resultado.
              </p>
            </div>

            <div className="rounded-3xl border border-primary/25 bg-gradient-to-br from-primary/[0.11] via-white/[0.03] to-cyan-400/[0.05] p-6 sm:p-8">
              <div className="flex items-start gap-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                  <Share2 className="size-5" />
                </span>
                <div>
                  <p className="text-xl font-semibold tracking-tight">Conteúdo alinhado ao negócio</p>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">
                    Planejamento desenvolvido considerando comunicação, posicionamento,
                    produtos, serviços, público e oportunidades comerciais.
                  </p>
                </div>
              </div>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                  <p className="text-sm font-semibold">Planejamento</p>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">Organização dos temas e objetivos do conteúdo.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                  <p className="text-sm font-semibold">Conteúdo</p>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">Desenvolvimento das publicações e mensagens da marca.</p>
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
            <h2 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
              Um processo organizado do planejamento à{" "}
              <span className="bg-gradient-to-r from-primary via-violet-400 to-cyan-400 bg-clip-text text-transparent">publicação.</span>
            </h2>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:mt-14 lg:grid-cols-4">
            {processSteps.map((step) => (
              <article key={step.number} className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025] p-6">
                <span className="text-4xl font-semibold tracking-tighter text-primary/25">{step.number}</span>
                <h3 className="mt-6 text-lg font-semibold tracking-tight">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        aria-labelledby="depoimentos-title"
        className="relative overflow-hidden border-b border-white/5 bg-[#07080d] py-20 sm:py-24 lg:py-28"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[760px] -translate-x-1/2 rounded-full bg-primary/[0.07] blur-[140px]"
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
              <MessageSquareQuote className="size-4" />
              Quem já usou nossos serviços
            </div>
            <h2
              id="depoimentos-title"
              className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl"
            >
              Resultados construídos com{" "}
              <span className="bg-gradient-to-r from-primary via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                parceria e estratégia.
              </span>
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              Conheça a experiência de empresas e projetos que já contam com o
              trabalho do Kivai.
            </p>
          </div>
        </div>

        <div className="testimonial-marquee relative mt-12">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-[#07080d] to-transparent sm:w-20"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-[#07080d] to-transparent sm:w-20"
          />

          <div className="testimonial-marquee-track flex gap-4 px-4">
            <div className="testimonial-marquee-group flex gap-4">
              {testimonials.map((testimonial) => (
                <TestimonialCard
                  key={testimonial.name}
                  testimonial={testimonial}
                />
              ))}
            </div>
            <div
              aria-hidden="true"
              className="testimonial-marquee-copy testimonial-marquee-group flex gap-4"
            >
              {testimonials.map((testimonial) => (
                <TestimonialCard
                  key={`copy-${testimonial.name}`}
                  testimonial={testimonial}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="relative mx-auto mt-10 max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-sm text-muted-foreground">
            Quer construir uma presença digital mais profissional para sua empresa?
          </p>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-primary/15 sm:w-auto"
          >
            Conversar sobre meu projeto
            <ArrowRight className="size-4" />
          </a>
        </div>
      </section>

      <section className="relative border-b border-white/5 bg-[#07080d] py-20 sm:py-24 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
              <LayoutGrid className="size-4" />
              Formatos de conteúdo
            </div>
            <h2 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
              Conteúdos adaptados à comunicação da{" "}
              <span className="bg-gradient-to-r from-primary via-violet-400 to-cyan-400 bg-clip-text text-transparent">sua empresa.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              Os formatos são definidos conforme o planejamento, os canais e os objetivos de cada ciclo de conteúdo.
            </p>
          </div>
          <div className="mx-auto mt-12 grid max-w-5xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {contentFormats.map((format) => {
              const Icon = format.icon;
              return (
                <div key={format.label} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="size-4" /></span>
                  <span className="text-sm font-medium leading-5">{format.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative border-b border-white/5 py-20 sm:py-24 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
            <article className="rounded-3xl border border-primary/25 bg-gradient-to-br from-primary/[0.11] via-white/[0.03] to-cyan-400/[0.05] p-6 sm:p-8">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><Megaphone className="size-5" /></span>
              <h2 className="mt-7 text-2xl font-semibold tracking-tight sm:text-3xl">Quer ampliar o alcance dos seus conteúdos?</h2>
              <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">
                Além do trabalho de Social Media, o Kivai também oferece gestão de tráfego pago. As campanhas podem ampliar o alcance da marca, divulgar produtos e serviços, alcançar novos públicos e gerar oportunidades comerciais.
              </p>
              <p className="mt-5 rounded-2xl border border-primary/20 bg-primary/10 p-4 text-sm font-semibold leading-6">
                Social Media e Gestão de Tráfego são serviços independentes e podem ser contratados separadamente ou de forma complementar.
              </p>
              <Link href="/servicos/gestao-de-trafego" className="mt-6 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold transition hover:border-primary/30 hover:bg-primary/10">
                Conhecer Gestão de Tráfego <ArrowRight className="size-4" />
              </Link>
            </article>

            <aside className="rounded-3xl border border-white/10 bg-white/[0.025] p-6 sm:p-8">
              <span className="flex size-12 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary"><Images className="size-5" /></span>
              <h2 className="mt-7 text-2xl font-semibold tracking-tight">Sobre fotos e vídeos</h2>
              <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">
                O serviço de Social Media não contempla captação presencial de fotos ou vídeos. Quando determinado conteúdo exigir materiais específicos da empresa, as imagens, vídeos e informações deverão ser fornecidos pelo cliente para o desenvolvimento das publicações.
              </p>
            </aside>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden py-20 sm:py-24 lg:py-28">
        <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 h-[480px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/[0.08] blur-[150px]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[2rem] border border-primary/25 bg-gradient-to-br from-primary/[0.13] via-white/[0.035] to-cyan-400/[0.07] px-6 py-14 text-center sm:px-10 sm:py-16 lg:px-16">
            <div className="mx-auto max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
                <CircleCheck className="size-4" />
                Vamos planejar seu conteúdo
              </div>
              <h2 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
                Quer fortalecer a presença da sua empresa nas{" "}
                <span className="bg-gradient-to-r from-primary via-violet-400 to-cyan-400 bg-clip-text text-transparent">redes sociais?</span>
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                Entre em contato para entender como o serviço de Social Media pode ser estruturado de acordo com o momento, objetivos e necessidades da sua empresa.
              </p>
              <div className="mx-auto mt-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                <Gift className="size-4" /> Período de teste grátis incluído
              </div>
              <div>
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-[0_0_40px_rgba(99,102,241,0.2)] transition hover:brightness-110 sm:w-auto">
                  Pedir orçamento pelo WhatsApp <ArrowRight className="size-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
