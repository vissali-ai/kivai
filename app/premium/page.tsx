import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Coins,
  CreditCard,
  Sparkles,
  Zap,
} from "lucide-react";

const freeFeatures = [
  "Acesso às ferramentas gratuitas",
  "Uso simples direto pelo navegador",
  "Novas ferramentas ao longo do tempo",
  "Experiência gratuita com anúncios",
];

const premiumFeatures = [
  "Experiência sem anúncios",
  "Acesso a benefícios e recursos Premium",
  "Conta preparada para saldo de créditos",
  "Mais controle sobre uso e consumo",
];

export default function PremiumPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <section
        id="premium"
        className="relative overflow-hidden border-t border-white/5 py-24 sm:py-28 lg:py-32"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
        >
          <div className="absolute left-0 top-1/3 h-[420px] w-[420px] rounded-full bg-primary/[0.06] blur-[130px]" />
          <div className="absolute right-0 top-1/4 h-[420px] w-[420px] rounded-full bg-cyan-400/[0.04] blur-[130px]" />
        </div>

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
              <Coins className="size-4" />
              Flexível para cada momento
            </div>

            <h1 className="mt-6 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Comece grátis.{" "}
              <span className="bg-gradient-to-r from-primary via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                Evolua quando fizer sentido.
              </span>
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              Use ferramentas gratuitas com anúncios ou escolha uma experiência
              Premium sem anúncios e com benefícios adicionais.
            </p>
          </div>

          <div className="mx-auto mt-14 grid max-w-5xl gap-6 lg:mt-16 lg:grid-cols-2">
            <article className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025] p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div className="flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-foreground">
                  <Zap className="size-5" />
                </div>

                <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-medium text-muted-foreground">
                  Para começar
                </span>
              </div>

              <div className="mt-8">
                <p className="text-sm font-medium text-muted-foreground">
                  Acesso gratuito
                </p>

                <h3 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                  Grátis
                </h3>

                <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
                  Use ferramentas gratuitas para resolver tarefas do dia a dia
                  com praticidade.
                </p>
              </div>

              <div className="mt-8 space-y-4 border-t border-white/10 pt-7">
                {freeFeatures.map((feature) => (
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

              <Link
                href="/#ferramentas"
                className="mt-9 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3.5 text-sm font-semibold text-foreground transition hover:border-primary/30 hover:bg-primary/10"
              >
                Explorar ferramentas grátis
                <ArrowRight className="size-4" />
              </Link>
            </article>

            <article className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-b from-primary/[0.12] via-white/[0.035] to-cyan-400/[0.04] p-6 shadow-[0_0_70px_rgba(99,102,241,0.08)] sm:p-8">
              <div
                aria-hidden="true"
                className="absolute -right-16 -top-16 size-48 rounded-full bg-primary/10 blur-3xl"
              />

              <div className="relative">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_0_35px_rgba(99,102,241,0.25)]">
                    <Sparkles className="size-5" />
                  </div>

                  <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    Experiência completa
                  </span>
                </div>

                <div className="mt-8">
                  <p className="text-sm font-medium text-primary">
                    Mais conforto e controle
                  </p>

                  <h3 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                    Premium
                  </h3>

                  <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
                    Tenha uma experiência sem anúncios e acesse benefícios
                    adicionais dentro do ecossistema.
                  </p>
                </div>

                <div className="mt-8 space-y-4 border-t border-primary/20 pt-7">
                  {premiumFeatures.map((feature) => (
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

                <Link
                  href="/cadastro"
                  className="mt-9 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-[0_0_35px_rgba(99,102,241,0.18)] transition hover:brightness-110"
                >
                  Conhecer o Premium
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </article>
          </div>
                    <div className="mx-auto mt-6 flex max-w-5xl flex-col items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4 sm:flex-row">
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-primary">
                <CreditCard className="size-4" />
              </div>

              <p className="text-sm leading-6 text-muted-foreground">
                Na modalidade Premium, o consumo de recursos é feito com base no
                plano escolhido e na quantidade de uso.
              </p>
            </div>

            <span className="shrink-0 text-xs font-medium text-foreground/70">
              Simples • Flexível • Escalável
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}