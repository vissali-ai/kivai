import Link from "next/link";
import { ArrowRight, Check, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden pt-16">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-20 bg-[linear-gradient(to_right,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:56px_56px] sm:bg-[size:72px_72px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]"
      />

      <div
        aria-hidden="true"
        className="absolute left-1/2 top-0 -z-10 h-[24rem] w-[24rem] -translate-x-1/2 rounded-full bg-primary/15 blur-[110px] sm:h-[30rem] sm:w-[50rem] sm:blur-[140px]"
      />
      <div className="mx-auto flex max-w-7xl flex-col items-center px-4 py-12 text-center sm:px-6 sm:py-16 lg:px-8 lg:py-20">

        <h1 className="max-w-5xl text-[2.45rem] font-semibold leading-[1.04] tracking-[-0.045em] text-foreground min-[430px]:text-5xl sm:text-6xl lg:text-7xl lg:leading-[1.02]">
          Ferramentas e{" "}
          <span className="bg-gradient-to-r from-primary via-violet-400 to-cyan-400 bg-clip-text text-transparent">
            soluções digitais
          </span>
        </h1>

        <p className="mt-5 max-w-3xl text-[15px] leading-7 text-muted-foreground sm:mt-6 sm:text-lg sm:leading-8">
          Ferramentas e serviços para criar, otimizar e acelerar seus resultados no digital.
        </p>

        <div className="mt-7 flex w-full flex-col items-center justify-center gap-3 sm:mt-8 sm:w-auto sm:flex-row">
          <Button
            size="lg"
            asChild
            className="group w-full rounded-xl sm:w-auto"
          >
            <Link href="#ferramentas">
              Usar ferramentas grátis
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </Button>

          <Button
            size="lg"
            variant="outline"
            asChild
            className="w-full rounded-xl border-white/10 bg-white/[0.03] sm:w-auto"
          >
            <Link href="#precos">Conhecer o Premium</Link>
          </Button>
        </div>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 text-sm text-muted-foreground sm:mt-7 sm:flex-row sm:flex-wrap sm:gap-x-6 sm:gap-y-2">
          <span className="flex items-center gap-2">
            <Check className="size-4 shrink-0 text-primary" />
            Comece grátis
          </span>

          <span className="flex items-center gap-2">
            <Check className="size-4 shrink-0 text-primary" />
            Ferramentas em um só lugar
          </span>

          <span className="flex items-center gap-2">
            <Check className="size-4 shrink-0 text-primary" />
            Premium com recursos avançados
          </span>
        </div>
      </div>
    </section>
  );
}