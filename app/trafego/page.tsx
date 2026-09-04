import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  Check,
  ChevronDown,
  Gauge,
  Globe2,
  LineChart,
  MousePointerClick,
  Search,
  Settings2,
  ShieldCheck,
  Target,
  Users,
} from "lucide-react";
import { getPublishedSiteService } from "@/lib/site-cms/service-repository";
import { TrafegoLeadForm } from "@/components/trafego/lead-form";

const HOST = "trafego.kivai.com.br";
const CANONICAL = `https://${HOST}`;

export async function generateMetadata(): Promise<Metadata> {
  const service = await getPublishedSiteService("trafego-kivai");
  return {
    title: service?.seoTitle || "Google Ads para gerar oportunidades reais | Kivai",
    description:
      service?.seoDescription ||
      "Gestão de Google Ads com landing page, mensuração, acompanhamento e estrutura digital para empresas que querem transformar buscas em oportunidades.",
    alternates: { canonical: service?.canonicalUrl || CANONICAL },
    robots: service?.indexable === false ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      title: service?.seoTitle || "Google Ads para gerar oportunidades reais | Kivai",
      description:
        service?.seoDescription ||
        "Google Ads, landing page, mensuração e acompanhamento em uma estrutura orientada a oportunidades comerciais.",
      url: service?.canonicalUrl || CANONICAL,
      type: "website",
    },
  };
}

const included = [
  [Search, "Google Ads Search", "Campanhas orientadas à intenção de busca e ao objetivo comercial."],
  [Globe2, "Landing page", "Página exclusiva para a campanha, com foco em clareza e conversão."],
  [Settings2, "Tag Manager", "Configuração da camada de mensuração e eventos."],
  [BarChart3, "Analytics", "Acompanhamento dos dados de comportamento e conversões."],
  [ShieldCheck, "Search Console", "Base técnica para acompanhar a presença do domínio no Google."],
  [Target, "Google Business Profile", "Configuração ou revisão da presença local quando aplicável."],
  [Gauge, "Domínio e estrutura", "Orientação para os elementos necessários ao projeto."],
  [Users, "Presença social", "Avaliação dos canais sociais e orientação inicial."],
];

const steps = [
  ["01", "Diagnóstico", "Entendemos o negócio, a oferta, a região, o público e o objetivo."],
  ["02", "Estrutura", "Organizamos campanha, página, domínio e mensuração antes de acelerar a mídia."],
  ["03", "Campanha", "Criamos a estrutura de Google Ads com palavras-chave, anúncios e orçamento coerentes."],
  ["04", "Mensuração", "Configuramos eventos e conversões para saber o que realmente está acontecendo."],
  ["05", "Otimização", "Acompanhamos os dados e ajustamos a operação com base no desempenho."],
  ["06", "Análise", "Os principais indicadores ficam organizados para facilitar decisões e próximos passos."],
];

const segments = [
  "Clínicas e saúde",
  "Imobiliárias e profissionais do mercado imobiliário",
  "Serviços profissionais",
  "Estética e beleza",
  "Educação e cursos",
  "Automotivo",
  "Construção e casa",
  "Serviços locais",
  "E-commerce",
  "Empresas B2B",
];

const faqs = [
  ["A verba dos anúncios está incluída?", "Não. A verba de mídia é separada do serviço de gestão. O orçamento de anúncios é definido de acordo com o objetivo, mercado e capacidade de atendimento do negócio."],
  ["Preciso ter um site?", "Não necessariamente. A estrutura pode incluir uma landing page exclusiva para a campanha. Quando já existe um site adequado, avaliamos se ele faz sentido para a estratégia."],
  ["Vocês prometem uma quantidade de leads?", "Não. Não seria responsável prometer um número de leads, vendas ou faturamento. O trabalho é estruturado para melhorar a qualidade da aquisição e permitir decisões baseadas em dados."],
  ["O Google Ads já é suficiente para qualquer empresa?", "Nem sempre. A análise considera intenção de busca, oferta, região, concorrência, orçamento e capacidade comercial. O foco inicial desta operação é Google Ads Search."],
  ["A gestão inclui Meta Ads?", "O foco desta oferta é Google Ads, especialmente Rede de Pesquisa. Outros canais podem ser avaliados separadamente quando houver justificativa estratégica."],
  ["Posso contratar somente a estrutura inicial?", "Sim. A estrutura inicial pode ser avaliada separadamente, com escopo definido após a análise do cenário atual."],
  ["Como acompanho o desempenho?", "A operação foi pensada para evoluir para um painel com os principais indicadores de campanhas e leads. Na fase inicial, o acompanhamento pode ser feito por relatórios e reuniões conforme o escopo contratado."],
];

function ServiceStructuredData({ title, description }: { title: string; description: string }) {
  const json = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: title,
    description,
    provider: { "@type": "Organization", name: "Kivai", url: "https://kivai.com.br" },
    serviceType: "Gestão de Google Ads",
    areaServed: { "@type": "Country", name: "Brasil" },
    url: CANONICAL,
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} />;
}

export default async function TrafegoPage() {
  const host = (await headers()).get("host")?.split(":")[0]?.toLowerCase();
  const isVercelPreview = process.env.VERCEL_ENV === "preview";
  if (host && host !== HOST && host !== "localhost" && !isVercelPreview) redirect(CANONICAL);

  const service = await getPublishedSiteService("trafego-kivai");
  if (!service) return null;

  return (
    <main className="min-h-screen bg-[#07070b] text-white selection:bg-violet-500/30">
      <ServiceStructuredData title={service.title} description={service.shortDescription} />

      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#07070b]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <a href="#inicio" className="font-semibold tracking-[-0.04em] text-xl">kivai<span className="text-violet-400">.</span></a>
          <nav className="hidden items-center gap-7 text-sm text-white/65 md:flex">
            <a href="#estrutura" className="transition hover:text-white">Estrutura</a>
            <a href="#metodo" className="transition hover:text-white">Como funciona</a>
            <a href="#publico" className="transition hover:text-white">Para quem</a>
            <a href="#faq" className="transition hover:text-white">FAQ</a>
          </nav>
          <a href="#analise" className="inline-flex items-center gap-2 rounded-xl bg-violet-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-400">
            Solicitar análise <ArrowRight className="size-4" />
          </a>
        </div>
      </header>

      <section id="inicio" className="relative overflow-hidden border-b border-white/10">
        <div aria-hidden className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
        <div aria-hidden className="absolute -left-32 top-20 h-80 w-80 rounded-full bg-violet-600/20 blur-[120px]" />
        <div aria-hidden className="absolute right-0 top-0 h-[520px] w-[520px] rounded-full bg-cyan-500/10 blur-[150px]" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 pb-20 pt-20 sm:px-6 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:pb-28 lg:pt-28">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/25 bg-violet-400/10 px-3 py-1.5 text-xs font-medium text-violet-200">
              <MousePointerClick className="size-4" /> {service.badge || "Google Ads + estrutura de aquisição"}
            </div>
            <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-[-0.055em] sm:text-5xl lg:text-7xl lg:leading-[1.02]">
              Transforme buscas no Google em <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">oportunidades reais.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-white/65 sm:text-lg">
              Google Ads, landing page, mensuração e acompanhamento em uma estrutura pensada para transformar intenção de busca em oportunidades comerciais mensuráveis.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="#analise" className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-500 px-6 py-3.5 text-sm font-semibold transition hover:bg-violet-400">Solicitar análise <ArrowRight className="size-4" /></a>
              <a href="#estrutura" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-6 py-3.5 text-sm font-semibold text-white/85 transition hover:border-violet-400/30 hover:bg-white/[0.07]">Conhecer a estrutura</a>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/55">
              <span className="inline-flex items-center gap-2"><Check className="size-4 text-violet-300" /> Foco em Google Ads Search</span>
              <span className="inline-flex items-center gap-2"><Check className="size-4 text-violet-300" /> Mensuração desde a base</span>
              <span className="inline-flex items-center gap-2"><Check className="size-4 text-violet-300" /> Sem promessa de resultado garantido</span>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-[28px] border border-white/10 bg-white/[0.035] p-3 shadow-2xl shadow-violet-950/30">
              <div className="overflow-hidden rounded-[22px] border border-white/10 bg-[#0d0d13]">
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                  <div><p className="text-xs text-white/45">PAINEL DE PERFORMANCE</p><p className="mt-1 text-sm font-medium">Visão da aquisição</p></div>
                  <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] text-emerald-300">EXEMPLO VISUAL</span>
                </div>
                <div className="grid grid-cols-2 gap-px bg-white/10 sm:grid-cols-4">
                  {[["Investimento", "R$ 4.280"], ["Cliques", "1.284"], ["Leads", "86"], ["CPL", "R$ 49,77"]].map(([label, value]) => (
                    <div key={label} className="bg-[#0d0d13] p-4"><p className="text-[10px] uppercase tracking-wider text-white/40">{label}</p><p className="mt-2 text-lg font-semibold">{value}</p></div>
                  ))}
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between"><p className="text-xs font-medium text-white/70">Evolução de conversões</p><p className="text-xs text-white/35">Dados ilustrativos</p></div>
                  <div className="mt-5 flex h-32 items-end gap-2">
                    {[35, 48, 42, 66, 58, 76, 70, 92, 82, 100, 88, 108].map((height, index) => <div key={index} className="flex-1 rounded-t bg-gradient-to-t from-violet-500/20 to-violet-300/80" style={{ height: `${height}%` }} />)}
                  </div>
                  <div className="mt-5 grid gap-2 text-xs">
                    {["Pesquisa | Alta intenção", "Marca | Proteção de demanda", "Local | Região de atuação"].map((item, index) => <div key={item} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.025] px-3 py-2.5"><span className="text-white/60">{item}</span><span className="text-white/40">{[32, 21, 18][index]} leads</span></div>)}
                  </div>
                </div>
              </div>
            </div>
            <p className="mt-3 text-center text-[11px] text-white/35">Os números acima são apenas ilustrativos e não representam resultados de clientes.</p>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-violet-300/80">Anunciar é fácil. Fazer o investimento trabalhar é outra história.</p>
          <h2 className="mx-auto mt-5 max-w-3xl text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">O problema normalmente não está só no anúncio.</h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-white/55">Uma campanha pode perder eficiência quando a página não ajuda, a conversão não é medida ou o negócio não consegue acompanhar o que acontece depois do clique.</p>
          <div className="mt-10 grid gap-4 text-left sm:grid-cols-2 lg:grid-cols-4">
            {[["Campanha sem estratégia", "Anúncios e palavras-chave definidos sem relação clara com a oferta."], ["Página que não converte", "O clique chega a uma experiência que não conduz bem para o próximo passo."], ["Mensuração incompleta", "Fica difícil saber quais ações realmente geram oportunidades."], ["Leads sem processo", "O contato chega, mas não existe uma rotina simples para organizar e acompanhar." ]].map(([title, text]) => <article key={title} className="rounded-2xl border border-white/10 bg-white/[0.025] p-5"><h3 className="font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-white/50">{text}</p></article>)}
          </div>
        </div>
      </section>

      <section id="estrutura" className="border-b border-white/10 bg-[#09090e] py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl"><p className="text-sm font-medium text-violet-300">O QUE VOCÊ RECEBE</p><h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">Não entregamos apenas anúncios. Entregamos a estrutura para medir de onde as oportunidades estão vindo.</h2></div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {included.map(([Icon, title, text]) => { const Component = Icon as typeof Search; return <article key={title as string} className="group rounded-2xl border border-white/10 bg-white/[0.025] p-6 transition hover:-translate-y-1 hover:border-violet-400/30"><span className="flex size-11 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-400/10 text-violet-300"><Component className="size-5" /></span><h3 className="mt-5 font-semibold">{title as string}</h3><p className="mt-2 text-sm leading-6 text-white/50">{text as string}</p></article> })}
          </div>
        </div>
      </section>

      <section id="metodo" className="border-b border-white/10 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center"><p className="text-sm font-medium text-violet-300">MÉTODO</p><h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">Uma operação organizada em seis etapas.</h2><p className="mt-5 text-white/55">A ideia é construir a base certa antes de buscar escala.</p></div>
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {steps.map(([number, title, text]) => <article key={number} className="relative rounded-2xl border border-white/10 bg-white/[0.02] p-6"><span className="text-xs font-semibold tracking-[0.2em] text-violet-300">{number}</span><h3 className="mt-5 text-lg font-semibold">{title}</h3><p className="mt-2 text-sm leading-7 text-white/50">{text}</p></article>)}
          </div>
        </div>
      </section>

      <section id="publico" className="border-b border-white/10 bg-[#09090e] py-20 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[.8fr_1.2fr] lg:px-8">
          <div><p className="text-sm font-medium text-violet-300">PARA QUEM</p><h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">Para negócios que precisam transformar procura em oportunidade.</h2><p className="mt-5 leading-8 text-white/55">A estrutura pode ser adaptada a diferentes segmentos. A análise inicial define se Google Ads é realmente adequado ao cenário.</p></div>
          <div className="grid gap-3 sm:grid-cols-2"><div className="contents">{segments.map((segment) => <div key={segment} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3.5 text-sm text-white/70"><Check className="size-4 text-violet-300" />{segment}</div>)}</div></div>
        </div>
      </section>

      <section className="border-b border-white/10 py-20 sm:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div><p className="text-sm font-medium text-violet-300">ESTRUTURA DIGITAL</p><h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">O anúncio é só uma parte da aquisição.</h2><p className="mt-5 text-base leading-8 text-white/55">Antes de colocar verba para rodar, avaliamos os elementos que podem influenciar a conversão: domínio, página, presença local, redes sociais e mensuração.</p><div className="mt-7 grid gap-3 sm:grid-cols-2">{["Google Business Profile", "Google Tag Manager", "Google Analytics", "Search Console", "Landing page", "Presença social"].map((item) => <div key={item} className="flex items-center gap-3 text-sm text-white/65"><Check className="size-4 text-violet-300" />{item}</div>)}</div></div>
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-violet-500/10 via-white/[0.02] to-cyan-500/10 p-7"><LineChart className="size-7 text-violet-300" /><h3 className="mt-6 text-xl font-semibold">Mensuração como parte da estratégia</h3><p className="mt-3 text-sm leading-7 text-white/50">O objetivo é sair da lógica de “cliques” e construir uma leitura que ajude a responder: quanto foi investido, o que aconteceu, quantas oportunidades chegaram e onde estão os gargalos.</p></div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#09090e] py-20 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8"><p className="text-sm font-medium text-violet-300">EVOLUÇÃO</p><h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">Do acompanhamento inicial ao painel do cliente.</h2><p className="mx-auto mt-5 max-w-2xl leading-8 text-white/55">A operação foi desenhada para evoluir para um ambiente onde o cliente acompanhe campanhas e leads em um só lugar. O painel automático entra conforme a operação ganha volume.</p><div className="mt-10 rounded-3xl border border-white/10 bg-[#0d0d13] p-5 text-left"><div className="grid gap-3 sm:grid-cols-4">{[["Investimento", "R$ 4.280"], ["Cliques", "1.284"], ["Leads", "86"], ["CPL", "R$ 49,77"]].map(([label, value]) => <div key={label} className="rounded-xl border border-white/10 bg-white/[0.02] p-4"><p className="text-xs text-white/40">{label}</p><p className="mt-2 text-xl font-semibold">{value}</p></div>)}</div><div className="mt-4 rounded-xl border border-white/10 p-4"><div className="flex items-center justify-between text-xs"><span className="text-white/55">Leads recentes</span><span className="text-white/35">Interface ilustrativa</span></div><div className="mt-4 space-y-2">{["Novo contato • hoje", "Solicitação de orçamento • ontem", "Agendamento • ontem"].map((item) => <div key={item} className="rounded-lg bg-white/[0.025] px-3 py-2.5 text-sm text-white/55">{item}</div>)}</div></div></div></div>
      </section>

      <section className="border-b border-white/10 py-20 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8"><div className="rounded-3xl border border-violet-400/20 bg-violet-400/[0.06] p-8 sm:p-10"><p className="text-sm font-medium text-violet-300">AUTOMAÇÃO COMO PRÓXIMA ETAPA</p><h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Quando a operação estiver validada, podemos automatizar o pós-lead.</h2><p className="mt-4 max-w-3xl leading-8 text-white/55">A evolução prevista é simples: mensagem inicial fora do horário comercial, organização dos contatos em CRM e acompanhamento do status dos leads. A automação será adicionada ao escopo somente quando o fluxo estiver pronto para ser operado com segurança.</p></div></div>
      </section>

      <section id="analise" className="border-b border-white/10 bg-[#09090e] py-20 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[.8fr_1.2fr] lg:px-8">
          <div><p className="text-sm font-medium text-violet-300">PRÓXIMO PASSO</p><h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">Conte o que sua empresa precisa.</h2><p className="mt-5 leading-8 text-white/55">O formulário ajuda a entender o cenário antes de falar em proposta. Quanto mais contexto você enviar, melhor conseguimos avaliar a estrutura necessária.</p><div className="mt-7 space-y-3 text-sm text-white/60">{["Análise do cenário atual", "Definição do escopo adequado", "Orçamento de gestão e mídia separado", "Sem promessa artificial de resultados"].map((item) => <div key={item} className="flex items-center gap-3"><Check className="size-4 text-violet-300" />{item}</div>)}</div></div>
          <TrafegoLeadForm />
        </div>
      </section>

      <section id="faq" className="border-b border-white/10 py-20 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8"><div className="text-center"><p className="text-sm font-medium text-violet-300">FAQ</p><h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">Perguntas frequentes</h2></div><div className="mt-10 divide-y divide-white/10 rounded-2xl border border-white/10">{faqs.map(([question, answer]) => <details key={question} className="group p-5"><summary className="flex cursor-pointer list-none items-center justify-between gap-5 font-medium"><span>{question}</span><ChevronDown className="size-4 shrink-0 text-white/40 transition group-open:rotate-180" /></summary><p className="mt-3 max-w-3xl pr-8 text-sm leading-7 text-white/50">{answer}</p></details>)}</div></div>
      </section>

      <section className="relative overflow-hidden py-20 sm:py-28"><div aria-hidden className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/15 blur-[120px]" /><div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6"><h2 className="text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">Seu próximo cliente pode já estar procurando pelo que você oferece.</h2><p className="mx-auto mt-5 max-w-2xl leading-8 text-white/55">A primeira etapa é entender se existe uma oportunidade real e qual estrutura faz sentido para o seu negócio.</p><a href="#analise" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-violet-500 px-6 py-3.5 text-sm font-semibold transition hover:bg-violet-400">Solicitar análise <ArrowRight className="size-4" /></a></div></section>

      <footer className="border-t border-white/10 py-8"><div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 text-sm text-white/40 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8"><div><span className="font-semibold text-white/75">kivai.</span><span className="ml-2">Uma solução do ecossistema Kivai.</span></div><div className="flex flex-wrap gap-5"><a href="https://kivai.com.br" className="transition hover:text-white/70">Conheça o ecossistema Kivai</a><a href="https://kivai.com.br/privacidade" className="transition hover:text-white/70">Privacidade</a><a href="https://kivai.com.br/termos" className="transition hover:text-white/70">Termos</a></div></div></footer>
    </main>
  );
}
