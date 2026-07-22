import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  Globe2,
  Heart,
  LayoutTemplate,
  Megaphone,
  MonitorSmartphone,
  Music2,
  Rocket,
  ShieldCheck,
  Sparkles,
  Store,
  UserRound,
  Zap,
} from "lucide-react";

const whatsappUrl =
  "https://wa.me/5531996205058?text=Fiquei%20interessado%28a%29%20em%20saber%20mais%20sobre%20a%20cria%C3%A7%C3%A3o%20de%20Landing%20Pages.";

const audiences = [
  {
    icon: BriefcaseBusiness,
    title: "Empresas e profissionais",
    description:
      "Páginas para apresentar serviços, gerar contatos e fortalecer a presença digital.",
  },
  {
    icon: Music2,
    title: "Artistas e bandas",
    description:
      "Páginas para lançamentos, agenda, projetos musicais, shows e divulgação.",
  },
  {
    icon: CalendarDays,
    title: "Eventos e festivais",
    description:
      "Centralize informações, programação, localização, ingressos e chamadas para ação.",
  },
  {
    icon: Heart,
    title: "Casamentos e celebrações",
    description:
      "Experiências digitais personalizadas para compartilhar informações e momentos especiais.",
  },
  {
    icon: Store,
    title: "Produtos e negócios",
    description:
      "Páginas focadas em apresentar ofertas, diferenciais e direcionar o visitante para a próxima ação.",
  },
  {
    icon: Megaphone,
    title: "Campanhas e projetos",
    description:
      "Estruturas para iniciativas solidárias, lançamentos, ações especiais e projetos digitais.",
  },
];

const benefits = [
  {
    icon: Zap,
    title: "Páginas rápidas",
    description:
      "Estruturas leves e pensadas para reduzir distrações e facilitar a navegação.",
  },
  {
    icon: MonitorSmartphone,
    title: "Experiência responsiva",
    description:
      "Layout preparado para funcionar bem em celulares, tablets e computadores.",
  },
  {
    icon: LayoutTemplate,
    title: "Projeto personalizado",
    description:
      "Conteúdo e estrutura adaptados ao objetivo, público e identidade de cada projeto.",
  },
  {
    icon: Globe2,
    title: "Presença digital própria",
    description:
      "Uma página profissional para concentrar informações, campanhas e chamadas para ação.",
  },
];

const process = [
  {
    number: "01",
    title: "Entendimento do projeto",
    description:
      "Conversamos sobre objetivo, público, conteúdo, referências e resultado esperado.",
  },
  {
    number: "02",
    title: "Definição da estrutura",
    description:
      "Organizamos seções, mensagens, botões e o caminho que o visitante deve percorrer.",
  },
  {
    number: "03",
    title: "Criação da página",
    description:
      "A página é desenvolvida com foco em clareza, identidade visual e experiência de navegação.",
  },
  {
    number: "04",
    title: "Revisão e publicação",
    description:
      "Validamos o projeto, realizamos os ajustes combinados e preparamos a publicação.",
  },
];

export default function CriacaoDeLandingPagesPage() {
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
              <Sparkles className="size-4" />
              Serviço Premium
            </div>

            <h1 className="mt-7 text-4xl font-semibold tracking-[-0.04em] text-foreground sm:text-5xl lg:text-7xl lg:leading-[1.02]">
              Sua ideia merece uma página que{" "}
              <span className="bg-gradient-to-r from-primary via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                conecte e gere ação.
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-muted-foreground sm:text-lg">
              Landing pages e mini sites personalizados para negócios,
              profissionais, eventos, artistas e projetos que precisam de uma
              presença digital moderna, rápida e objetiva.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-[0_0_40px_rgba(99,102,241,0.2)] transition hover:brightness-110 sm:w-auto"
              >
                Pedir orçamento
                <ArrowRight className="size-4" />
              </a>

              <a
                href="#para-quem"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-6 py-3.5 text-sm font-semibold text-foreground transition hover:border-primary/30 hover:bg-primary/10 sm:w-auto"
              >
                Conhecer possibilidades
              </a>
            </div>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 text-sm text-muted-foreground sm:flex-row sm:gap-6">
              <span className="inline-flex items-center gap-2">
                <Check className="size-4 text-primary" />
                Design responsivo
              </span>

              <span className="inline-flex items-center gap-2">
                <Check className="size-4 text-primary" />
                Projeto personalizado
              </span>

              <span className="inline-flex items-center gap-2">
                <Check className="size-4 text-primary" />
                Foco no objetivo da página
              </span>
            </div>
          </div>
        </div>
      </section>

      <section
        id="para-quem"
        className="relative border-b border-white/5 py-20 sm:py-24 lg:py-28"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
              <UserRound className="size-4" />
              Para diferentes projetos
            </div>

            <h2 className="mt-6 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Uma página pensada para o seu{" "}
              <span className="bg-gradient-to-r from-primary via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                objetivo real.
              </span>
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              Cada projeto pode exigir uma estrutura diferente. A proposta é
              criar uma experiência adequada ao público e à ação desejada.
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:mt-14 lg:grid-cols-3">
            {audiences.map((audience) => {
              const Icon = audience.icon;

              return (
                <article
                  key={audience.title}
                  className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025] p-6 transition duration-300 hover:-translate-y-1 hover:border-primary/30 hover:bg-white/[0.045]"
                >
                  <span className="flex size-12 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </span>

                  <h3 className="mt-7 text-lg font-semibold tracking-tight text-foreground">
                    {audience.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    {audience.description}
                  </p>
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
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
              <Rocket className="size-4" />
              Presença digital com propósito
            </div>

            <h2 className="mt-6 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Mais do que estar online.{" "}
              <span className="bg-gradient-to-r from-primary via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                Direcione o próximo passo.
              </span>
            </h2>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:mt-14 lg:grid-cols-4">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;

              return (
                <article
                  key={benefit.title}
                  className="rounded-3xl border border-white/10 bg-white/[0.025] p-6"
                >
                  <span className="flex size-12 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </span>

                  <h3 className="mt-7 text-lg font-semibold tracking-tight text-foreground">
                    {benefit.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    {benefit.description}
                  </p>
                </article>
              );
            })}
          </div>

          <div className="mt-8 rounded-3xl border border-primary/25 bg-gradient-to-r from-primary/[0.1] via-white/[0.025] to-cyan-400/[0.05] p-6 sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                  <Globe2 className="size-5" />
                </span>

                <div>
                  <p className="text-lg font-semibold text-foreground">
                    Um endereço para apresentar seu projeto
                  </p>

                  <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
                    A estrutura de publicação pode ser definida conforme a
                    necessidade do projeto, incluindo opções de endereço
                    personalizado e domínio próprio.
                  </p>
                </div>
              </div>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-5 py-3 text-sm font-semibold text-primary transition hover:bg-primary/15"
              >
                Consultar possibilidades
                <ArrowRight className="size-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="relative border-b border-white/5 py-20 sm:py-24 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
              <ShieldCheck className="size-4" />
              Como funciona
            </div>

            <h2 className="mt-6 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Da ideia à publicação com um{" "}
              <span className="bg-gradient-to-r from-primary via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                processo claro.
              </span>
            </h2>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:mt-14 lg:grid-cols-4">
            {process.map((step) => (
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
                <Sparkles className="size-4" />
                Página personalizada para seu projeto
              </div>

              <h2 className="mt-6 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                Vamos transformar sua ideia em uma{" "}
                <span className="bg-gradient-to-r from-primary via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                  presença digital profissional?
                </span>
              </h2>

              <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                Conte um pouco sobre seu negócio, evento, projeto ou objetivo e
                solicite uma análise inicial para criação da sua página.
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
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}