import {
  ArrowRight,
  Check,
  LayoutGrid,
  Play,
  Sparkles,
} from "lucide-react";

const steps = [
  {
    number: "01",
    icon: LayoutGrid,
    title: "Escolha uma ferramenta",
    description:
      "Encontre recursos para imagens, documentos, cálculos, mídia e outras tarefas digitais.",
    detail: "Tudo em uma única experiência",
  },
  {
    number: "02",
    icon: Play,
    title: "Execute sua tarefa",
    description:
      "Use a ferramenta escolhida de forma simples e avance sem processos desnecessários.",
    detail: "Mais praticidade no dia a dia",
  },
  {
    number: "03",
    icon: Sparkles,
    title: "Evolua quando precisar",
    description:
      "Continue no acesso gratuito ou escolha recursos Premium, créditos e uma experiência sem anúncios.",
    detail: "Mais controle sobre seu uso",
  },
];

export function HowItWorksSection() {
  return (
    <section
      id="como-funciona"
      className="relative overflow-hidden border-t border-white/5 py-24 sm:py-28 lg:py-32"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute left-1/2 top-0 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-primary/5 blur-[140px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
            <Sparkles className="size-4" />
            Simples para começar
          </div>

          <h2 className="mt-6 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Da necessidade ao resultado em{" "}
            <span className="bg-gradient-to-r from-primary via-violet-400 to-cyan-400 bg-clip-text text-transparent">
              poucos passos.
            </span>
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            Encontre a ferramenta certa, execute sua tarefa e escolha como
            deseja continuar dentro do ecossistema.
          </p>
        </div>

        <div className="relative mt-14 grid gap-5 lg:mt-16 lg:grid-cols-3">
          <div
            aria-hidden="true"
            className="absolute left-[16.66%] right-[16.66%] top-12 hidden h-px bg-gradient-to-r from-transparent via-primary/35 to-transparent lg:block"
          />

          {steps.map((step) => {
            const Icon = step.icon;

            return (
              <article
                key={step.number}
                className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025] p-6 transition duration-300 hover:-translate-y-1 hover:border-primary/30 hover:bg-white/[0.04] sm:p-7"
              >
                <div className="absolute right-5 top-4 text-5xl font-semibold tracking-tighter text-white/[0.035] sm:text-6xl">
                  {step.number}
                </div>

                <div className="relative">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex size-12 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary shadow-[0_0_30px_rgba(99,102,241,0.08)]">
                      <Icon className="size-5" />
                    </div>

                    <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-medium text-muted-foreground">
                      Passo {step.number}
                    </span>
                  </div>

                  <h3 className="mt-8 text-xl font-semibold tracking-tight text-foreground">
                    {step.title}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
                    {step.description}
                  </p>

                  <div className="mt-7 flex items-center gap-2 border-t border-white/10 pt-5 text-sm font-medium text-foreground/90">
                    <span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Check className="size-3.5" />
                    </span>
                    {step.detail}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-5 rounded-3xl border border-white/10 bg-gradient-to-r from-primary/[0.07] via-white/[0.025] to-cyan-400/[0.05] p-5 sm:flex-row sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_0_35px_rgba(99,102,241,0.2)]">
              <Sparkles className="size-5" />
            </div>

            <div>
              <p className="font-semibold text-foreground">
                Comece com o que você precisa hoje.
              </p>

              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Explore ferramentas gratuitas e evolua dentro do ecossistema no
                seu ritmo.
              </p>
            </div>
          </div>

          <a
            href="#ferramentas"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-foreground transition hover:border-primary/30 hover:bg-primary/10 sm:w-auto"
          >
            Explorar ferramentas
            <ArrowRight className="size-4" />
          </a>
        </div>
      </div>
    </section>
  );
}