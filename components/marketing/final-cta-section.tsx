import {
  ArrowRight,
  Check,
  Sparkles,
  Zap,
} from "lucide-react";

export function FinalCtaSection() {
  return (
    <section className="relative overflow-hidden border-t border-white/5 py-24 sm:py-28 lg:py-32">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/[0.08] blur-[150px]" />
        <div className="absolute bottom-0 right-0 h-[320px] w-[320px] rounded-full bg-cyan-400/[0.05] blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[2rem] border border-primary/25 bg-gradient-to-br from-primary/[0.13] via-white/[0.035] to-cyan-400/[0.07] px-6 py-14 shadow-[0_0_90px_rgba(99,102,241,0.08)] sm:px-10 sm:py-16 lg:px-16 lg:py-20">
          <div
            aria-hidden="true"
            className="absolute -left-20 -top-20 size-64 rounded-full bg-primary/10 blur-3xl"
          />

          <div
            aria-hidden="true"
            className="absolute -bottom-24 -right-16 size-72 rounded-full bg-cyan-400/[0.08] blur-3xl"
          />

          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.35) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />

          <div className="relative mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
              <Sparkles className="size-4" />
              Seu próximo passo começa aqui
            </div>

            <h2 className="mt-6 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-6xl">
              Resolva mais tarefas em{" "}
              <span className="bg-gradient-to-r from-primary via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                menos tempo.
              </span>
            </h2>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              Acesse ferramentas para imagens, documentos, cálculos e mídia em
              uma experiência simples, rápida e preparada para diferentes
              necessidades.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href="#ferramentas"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-[0_0_40px_rgba(99,102,241,0.22)] transition hover:brightness-110 sm:w-auto"
              >
                Usar ferramentas grátis
                <ArrowRight className="size-4" />
              </a>

              <a
                href="#precos"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-6 py-3.5 text-sm font-semibold text-foreground transition hover:border-primary/30 hover:bg-primary/10 sm:w-auto"
              >
                Conhecer o Premium
              </a>
            </div>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 text-sm text-muted-foreground sm:flex-row sm:gap-6">
              <span className="inline-flex items-center gap-2">
                <Check className="size-4 text-primary" />
                Comece grátis
              </span>

              <span className="inline-flex items-center gap-2">
                <Check className="size-4 text-primary" />
                Ferramentas em um só lugar
              </span>

              <span className="inline-flex items-center gap-2">
                <Zap className="size-4 text-primary" />
                Premium sem anúncios
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}