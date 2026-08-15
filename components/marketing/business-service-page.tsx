import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Lightbulb,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  ServiceFaqSection,
  ServiceSeoContent,
  ServiceStructuredData,
  type ServiceFaq,
  type ServiceSeoItem,
} from "@/components/marketing/service-seo-content";

export type BusinessServiceConfig = {
  name: string;
  pathname: string;
  serviceType: string;
  audience: string;
  badge: string;
  headline: string;
  headlineHighlight: string;
  introduction: string;
  highlights: string[];
  whatsappMessage: string;
  deliverables: {
    eyebrow: string;
    title: string;
    titleHighlight: string;
    description: string;
    items: Array<{ title: string; description: string }>;
  };
  experience: {
    eyebrow: string;
    title: string;
    titleHighlight: string;
    paragraphs: string[];
    points: string[];
    note?: string;
  };
  process: Array<{ title: string; description: string }>;
  seo: {
    eyebrow: string;
    title: string;
    description: string;
    items: ServiceSeoItem[];
  };
  faqs: ServiceFaq[];
  cta: {
    eyebrow: string;
    title: string;
    titleHighlight: string;
    description: string;
  };
};

export function BusinessServicePage({ config }: { config: BusinessServiceConfig }) {
  const whatsappUrl = `https://wa.me/5531996205058?text=${encodeURIComponent(config.whatsappMessage)}`;

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <ServiceStructuredData
        name={config.name}
        description={config.introduction}
        pathname={config.pathname}
        serviceType={config.serviceType}
        audience={config.audience}
        faqs={config.faqs}
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

          <div className="mx-auto mt-16 max-w-5xl text-center sm:mt-20">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
              <Sparkles className="size-4" />
              {config.badge}
            </div>

            <h1 className="mt-7 text-4xl font-semibold tracking-[-0.04em] text-foreground sm:text-5xl lg:text-7xl lg:leading-[1.02]">
              {config.headline}{" "}
              <span className="bg-gradient-to-r from-primary via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                {config.headlineHighlight}
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-muted-foreground sm:text-lg">
              {config.introduction}
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-[0_0_40px_rgba(99,102,241,0.2)] transition hover:brightness-110 sm:w-auto"
              >
                Solicitar análise
                <ArrowRight className="size-4" />
              </a>
              <a
                href="#entregas"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-6 py-3.5 text-sm font-semibold text-foreground transition hover:border-primary/30 hover:bg-primary/10 sm:w-auto"
              >
                Conhecer o serviço
              </a>
            </div>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-x-6">
              {config.highlights.map((highlight) => (
                <span key={highlight} className="inline-flex items-center gap-2">
                  <Check className="size-4 text-primary" />
                  {highlight}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="entregas" className="relative border-b border-white/5 py-20 sm:py-24 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
              <ClipboardCheck className="size-4" />
              {config.deliverables.eyebrow}
            </div>
            <h2 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
              {config.deliverables.title}{" "}
              <span className="bg-gradient-to-r from-primary via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                {config.deliverables.titleHighlight}
              </span>
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              {config.deliverables.description}
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:mt-14 lg:grid-cols-3">
            {config.deliverables.items.map((item) => (
              <article
                key={item.title}
                className="group rounded-3xl border border-white/10 bg-white/[0.025] p-6 transition duration-300 hover:-translate-y-1 hover:border-primary/30 hover:bg-white/[0.045]"
              >
                <span className="flex size-11 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary">
                  <CheckCircle2 className="size-5" />
                </span>
                <h3 className="mt-6 text-lg font-semibold tracking-tight">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-b border-white/5 bg-[#07080d] py-20 sm:py-24 lg:py-28">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[760px] -translate-x-1/2 rounded-full bg-primary/[0.08] blur-[140px]"
        />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
              <Lightbulb className="size-4" />
              {config.experience.eyebrow}
            </div>
            <h2 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
              {config.experience.title}{" "}
              <span className="bg-gradient-to-r from-primary via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                {config.experience.titleHighlight}
              </span>
            </h2>
            {config.experience.paragraphs.map((paragraph) => (
              <p key={paragraph} className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground">
                {paragraph}
              </p>
            ))}
          </div>

          <aside className="rounded-[2rem] border border-primary/25 bg-gradient-to-br from-primary/[0.12] via-white/[0.035] to-cyan-400/[0.06] p-7 sm:p-8">
            <h3 className="text-xl font-semibold">Como essa experiência entra no projeto</h3>
            <ul className="mt-6 space-y-4">
              {config.experience.points.map((point) => (
                <li key={point} className="flex gap-3 text-sm leading-7 text-muted-foreground">
                  <CheckCircle2 className="mt-1 size-5 shrink-0 text-primary" />
                  {point}
                </li>
              ))}
            </ul>
            {config.experience.note ? (
              <p className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4 text-xs leading-6 text-muted-foreground">
                {config.experience.note}
              </p>
            ) : null}
          </aside>
        </div>
      </section>

      <section className="relative border-b border-white/5 py-20 sm:py-24 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
              <ShieldCheck className="size-4" />
              Processo de trabalho
            </div>
            <h2 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
              Da análise à entrega com um processo{" "}
              <span className="bg-gradient-to-r from-primary via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                claro e adaptado.
              </span>
            </h2>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:mt-14 lg:grid-cols-4">
            {config.process.map((step, index) => (
              <article key={step.title} className="rounded-3xl border border-white/10 bg-white/[0.025] p-6">
                <span className="text-4xl font-semibold tracking-tighter text-primary/25">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-6 text-lg font-semibold tracking-tight">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <ServiceSeoContent {...config.seo} />
      <ServiceFaqSection
        title={`Perguntas frequentes sobre ${config.name.toLocaleLowerCase("pt-BR")}`}
        description="Veja respostas sobre escopo, entregas, requisitos e como o serviço pode ser adaptado à realidade do seu negócio."
        faqs={config.faqs}
      />

      <section className="relative overflow-hidden py-20 sm:py-24 lg:py-28">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 h-[480px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/[0.08] blur-[150px]"
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-[2rem] border border-primary/25 bg-gradient-to-br from-primary/[0.13] via-white/[0.035] to-cyan-400/[0.07] px-6 py-14 text-center sm:px-10 sm:py-16 lg:px-16">
            <div className="mx-auto max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
                <Sparkles className="size-4" />
                {config.cta.eyebrow}
              </div>
              <h2 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
                {config.cta.title}{" "}
                <span className="bg-gradient-to-r from-primary via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                  {config.cta.titleHighlight}
                </span>
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                {config.cta.description}
              </p>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-[0_0_40px_rgba(99,102,241,0.2)] transition hover:brightness-110 sm:w-auto"
              >
                Falar sobre meu projeto no WhatsApp
                <ArrowRight className="size-4" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
