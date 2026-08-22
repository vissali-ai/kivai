import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  ExternalLink,
  Megaphone,
  Music2,
  Play,
  Sparkles,
  Star,
  Video,
} from "lucide-react";
import { getPageMetadata } from "@/lib/seo";
import { PublicServicePage } from "@/components/site-cms/public-service-page";
import { getPublishedSiteService } from "@/lib/site-cms/service-repository";
import { getManagedServiceMetadata } from "@/lib/site-cms/service-metadata";
import {
  RelatedServiceArticles,
  ServiceFaqSection,
  ServiceSeoContent,
  ServiceStructuredData,
  type ServiceFaq,
} from "@/components/marketing/service-seo-content";

const fallbackMetadata = getPageMetadata({
  title: "Divulgação para Artistas e Bandas",
  description: "Divulgação para artistas e bandas em redes sociais e plataformas digitais. Promova músicas, clipes, shows, lançamentos e projetos musicais.",
  pathname: "/servicos/divulgacao-artistas",
});
export async function generateMetadata() { const item = await getPublishedSiteService("divulgacao-artistas"); return item ? getManagedServiceMetadata(item) : fallbackMetadata; }

const channels = [
  {
    name: "Instagram",
    audience: "60 mil",
    label: "seguidores",
    detail: "Média de 500 mil visualizações mensais",
    icon: Megaphone,
    href: "https://www.instagram.com/pdm_papodemusico/",
  },
  {
    name: "TikTok",
    audience: "20 mil",
    label: "seguidores",
    detail: "190 mil curtidas no perfil",
    icon: Play,
    href: "https://www.tiktok.com/@pdm_papodemusico",
  },
  {
    name: "Kwai",
    audience: "1,2 mil",
    label: "seguidores",
    detail: "Mais de 10 mil curtidas",
    icon: Video,
    href: "https://k.kwai.com/u/@pdm_papodemusico/CevA4zPH",
  },
  {
    name: "YouTube",
    audience: "8,91 mil",
    label: "inscritos",
    detail: "Canal com conteúdo musical e entretenimento",
    icon: Play,
    href: "https://www.youtube.com/@pdm_papodemusico",
  },
  {
    name: "@kivai_br",
    audience: "15,5 mil",
    label: "seguidores",
    detail: "Instagram oficial do Kivai · média de 3 mil visualizações por mês",
    icon: Megaphone,
    href: "https://www.instagram.com/kivai_br?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==",
  },
];

const artistFaqs: ServiceFaq[] = [
  {
    question: "Como funciona a divulgação para artistas e bandas?",
    answer:
      "O material do projeto é organizado e publicado nos perfis participantes da rede de divulgação. O formato contratado define os canais, a edição, o período de destaque e as entregas adicionais.",
  },
  {
    question: "Quais projetos musicais podem ser divulgados?",
    answer:
      "Podem ser divulgados singles, álbuns, EPs, clipes, shows, festivais, agendas, entrevistas, campanhas de financiamento, projetos autorais e outras iniciativas relacionadas à música.",
  },
  {
    question: "A divulgação garante um número de visualizações?",
    answer:
      "Não. Seguidores, visualizações, curtidas e alcance variam conforme plataforma, formato, interesse do público e desempenho do conteúdo. Os números dos perfis indicam o tamanho atual da rede, não uma garantia individual.",
  },
  {
    question: "O artista precisa enviar o material pronto?",
    answer:
      "Na opção de publicação direta, o material deve estar adequado para divulgação. No plano com mais destaque, o escopo pode incluir edição de vídeo e preparação adicional conforme as condições apresentadas na página.",
  },
  {
    question: "Existe impulsionamento pago na divulgação?",
    answer:
      "A modalidade Essencial não inclui impulsionamento. A modalidade Destaque informa separadamente quando existe valor de impulsionamento como bônus, mantendo essa entrega clara no plano contratado.",
  },
];

const artistSeoItems = [
  {
    title: "Para artistas independentes e bandas",
    description:
      "Uma opção para músicos, bandas, produtores, selos e projetos que precisam apresentar lançamentos e novidades a públicos conectados com conteúdo musical.",
  },
  {
    title: "Divulgação de músicas, clipes e shows",
    description:
      "A rede pode apoiar a circulação de singles, álbuns, videoclipes, agendas, apresentações, entrevistas e campanhas relacionadas à carreira artística.",
  },
  {
    title: "Mais pontos de contato para o projeto",
    description:
      "O serviço ajuda a reduzir a dependência de um único perfil e amplia a presença do material em plataformas e audiências diferentes, conforme o plano escolhido.",
  },
];

const simpleFeatures = [
  "Publicação nos perfis participantes",
  "Distribuição em diferentes plataformas",
  "Ideal para lançamentos e novidades",
  "Sem impulsionamento incluído",
  "Sem destaque fixado no perfil",
];

const highlightFeatures = [
  "Edição do vídeo incluída",
  "Publicação nos perfis participantes",
  "Distribuição multiplataforma",
  "Destaque por até 30 dias onde houver suporte",
  "R$ 10 em impulsionamento como bônus",
];

export default async function DivulgacaoArtistasPage() {
  const override = await getPublishedSiteService("divulgacao-artistas");
  if (override) return <PublicServicePage service={override} />;
  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <ServiceStructuredData
        name="Divulgação para Artistas e Bandas"
        description="Serviço de divulgação digital para músicas, clipes, shows, lançamentos e projetos musicais."
        pathname="/servicos/divulgacao-artistas"
        serviceType="Divulgação digital para artistas e bandas"
        audience="Artistas, bandas, músicos, produtores e projetos musicais"
        faqs={artistFaqs}
      />
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

          <div className="mx-auto mt-16 max-w-4xl text-center sm:mt-20">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
              <Music2 className="size-4" />
              Divulgação para artistas e bandas
            </div>

            <h1 className="mt-7 text-4xl font-semibold tracking-[-0.04em] text-foreground sm:text-5xl lg:text-7xl lg:leading-[1.02]">
              Divulgação para artistas e bandas: sua música pode{" "}
              <span className="bg-gradient-to-r from-primary via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                chegar mais longe.
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-muted-foreground sm:text-lg">
              Divulgue lançamentos, clipes, shows e projetos musicais em uma
              rede de perfis com presença em diferentes plataformas digitais.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href="#planos"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-[0_0_40px_rgba(99,102,241,0.2)] transition hover:brightness-110 sm:w-auto"
              >
                Ver opções de divulgação
                <ArrowRight className="size-4" />
              </a>

              <a
                href="#audiencia"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-6 py-3.5 text-sm font-semibold text-foreground transition hover:border-primary/30 hover:bg-primary/10 sm:w-auto"
              >
                Conhecer os canais
              </a>
            </div>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 text-sm text-muted-foreground sm:flex-row sm:gap-6">
              <span className="inline-flex items-center gap-2">
                <Check className="size-4 text-primary" />
                Presença multiplataforma
              </span>

              <span className="inline-flex items-center gap-2">
                <Check className="size-4 text-primary" />
                Opções a partir de R$ 10
              </span>

              <span className="inline-flex items-center gap-2">
                <Check className="size-4 text-primary" />
                Plano com edição disponível
              </span>
            </div>
          </div>
        </div>
      </section>

      <section
        id="audiencia"
        className="relative border-b border-white/5 py-20 sm:py-24"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
              <BadgeCheck className="size-4" />
              Presença digital
            </div>

            <h2 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
              Uma rede de divulgação em{" "}
              <span className="bg-gradient-to-r from-primary via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                diferentes plataformas.
              </span>
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              Seu conteúdo pode circular por canais com públicos e formatos
              diferentes, ampliando os pontos de contato com novas audiências.
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
       {channels.map((channel) => {
  const Icon = channel.icon;

  return (
    <a
      key={channel.name}
      href={channel.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Abrir ${channel.name} em nova aba`}
      className="group rounded-3xl border border-white/10 bg-white/[0.025] p-5 transition duration-300 hover:-translate-y-1 hover:border-primary/30 hover:bg-white/[0.045]"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex size-11 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary">
          <Icon className="size-5" />
        </span>

        <ExternalLink
          className="size-3.5 text-muted-foreground/50 transition duration-300 group-hover:text-primary"
          aria-hidden="true"
        />
      </div>

      <p className="mt-6 text-sm font-medium text-muted-foreground">
        {channel.name}
      </p>

      <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
        {channel.audience}
      </p>

      <p className="mt-1 text-xs text-muted-foreground">
        {channel.label}
      </p>

      <div className="mt-5 border-t border-white/10 pt-4">
        <p className="text-xs leading-5 text-muted-foreground">
          {channel.detail}
        </p>
      </div>
    </a>
  );
})}
          </div>

          <p className="mx-auto mt-6 max-w-3xl text-center text-xs leading-5 text-muted-foreground">
            Os números apresentados refletem dados observados nos perfis e podem
            variar ao longo do tempo. Seguidores, inscritos, visualizações e
            curtidas não representam garantia de alcance individual para uma
            publicação.
          </p>
        </div>
      </section>

      <section
        id="planos"
        className="relative overflow-hidden border-b border-white/5 py-20 sm:py-24 lg:py-28"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/[0.07] blur-[150px]"
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
              <Sparkles className="size-4" />
              Escolha sua divulgação
            </div>

            <h2 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
              Duas formas de colocar seu{" "}
              <span className="bg-gradient-to-r from-primary via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                projeto em circulação.
              </span>
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              Escolha uma publicação direta ou uma divulgação com mais destaque,
              edição e distribuição adicional.
            </p>
          </div>

          <div className="mx-auto mt-14 grid max-w-5xl gap-6 lg:grid-cols-2">
            <article className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025] p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <span className="flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                  <Megaphone className="size-5" />
                </span>

                <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-medium text-muted-foreground">
                  Publicação direta
                </span>
              </div>

              <div className="mt-8">
                <p className="text-sm font-medium text-muted-foreground">
                  Divulgação Essencial
                </p>

                <div className="mt-3 flex items-end gap-2">
                  <span className="text-4xl font-semibold tracking-tight">
                    R$ 10
                  </span>
                  <span className="pb-1 text-sm text-muted-foreground">
                    por divulgação
                  </span>
                </div>

                <p className="mt-5 text-sm leading-7 text-muted-foreground sm:text-base">
                  Uma opção acessível para publicar seu material nos perfis
                  participantes da rede de divulgação.
                </p>
              </div>

              <div className="mt-8 space-y-4 border-t border-white/10 pt-7">
                {simpleFeatures.map((feature) => (
                  <div
                    key={feature}
                    className="flex items-start gap-3 text-sm text-foreground/90"
                  >
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-white/[0.05] text-primary">
                      <Check className="size-3.5" />
                    </span>

                    <span className="leading-6">{feature}</span>
                  </div>
                ))}
              </div>

              <a
  href="https://pay.sumup.com/b2c/QWA5MLJ4"
  target="_blank"
  rel="noopener noreferrer"
  className="mt-9 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3.5 text-sm font-semibold transition hover:border-primary/30 hover:bg-primary/10"
>
  Quero divulgar por R$ 10
  <ArrowRight className="size-4" />
</a>
            </article>

            <article className="relative overflow-hidden rounded-3xl border border-primary/35 bg-gradient-to-b from-primary/[0.14] via-white/[0.035] to-cyan-400/[0.05] p-6 shadow-[0_0_80px_rgba(99,102,241,0.09)] sm:p-8">
              <div
                aria-hidden="true"
                className="absolute -right-16 -top-16 size-52 rounded-full bg-primary/15 blur-3xl"
              />

              <div className="relative">
                <div className="flex items-start justify-between gap-4">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_0_35px_rgba(99,102,241,0.25)]">
                    <Star className="size-5" />
                  </span>

                  <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    Mais destaque
                  </span>
                </div>

                <div className="mt-8">
                  <p className="text-sm font-medium text-primary">
                    Divulgação Destaque
                  </p>

                  <div className="mt-3 flex items-end gap-2">
                    <span className="text-4xl font-semibold tracking-tight">
                      R$ 99
                    </span>
                    <span className="pb-1 text-sm text-muted-foreground">
                      por campanha
                    </span>
                  </div>

                  <p className="mt-5 text-sm leading-7 text-muted-foreground sm:text-base">
                    Uma divulgação completa para quem busca apresentação mais
                    profissional, permanência em destaque e distribuição
                    adicional.
                  </p>
                </div>

                <div className="mt-8 space-y-4 border-t border-primary/20 pt-7">
                  {highlightFeatures.map((feature) => (
                    <div
                      key={feature}
                      className="flex items-start gap-3 text-sm text-foreground/90"
                    >
                      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                        <Check className="size-3.5" />
                      </span>

                      <span className="leading-6">{feature}</span>
                    </div>
                  ))}
                </div>

                <a
  href="https://pay.sumup.com/b2c/QA4P3SPX"
  target="_blank"
  rel="noopener noreferrer"
  className="mt-9 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-[0_0_35px_rgba(99,102,241,0.2)] transition hover:brightness-110"
>
  Quero a Divulgação Destaque
  <ArrowRight className="size-4" />
</a>
              </div>
            </article>
          </div>
        </div>
      </section>

      <ServiceSeoContent
        eyebrow="Divulgação de projetos musicais"
        title="Leve músicas, clipes, shows e lançamentos a novos pontos de contato."
        description="A divulgação para artistas e bandas ajuda projetos musicais a circularem em uma rede de perfis e plataformas, criando novas oportunidades de descoberta e relacionamento com o público."
        items={artistSeoItems}
      />

      <ServiceFaqSection
        title="Dúvidas sobre divulgação para artistas"
        description="Entenda quais materiais podem ser divulgados, como funcionam os planos e quais resultados dependem do desempenho de cada conteúdo."
        faqs={artistFaqs}
      />

      <RelatedServiceArticles
        articles={[
          {
            title: "Divulgação para artistas e bandas: como ampliar o alcance",
            description: "Veja como preparar lançamentos e escolher canais para colocar um projeto musical em circulação.",
            slug: "divulgacao-para-artistas-e-bandas",
          },
        ]}
      />
    </main>
  );
}
