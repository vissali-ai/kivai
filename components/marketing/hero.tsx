import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { GlobalSearch } from "@/components/marketing/global-search";

export function Hero() {
  return (
    <section className="border-b border-border bg-background pt-16">
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-10 sm:px-6 sm:pb-12 sm:pt-12 lg:px-8 lg:pb-14">
        <div className="max-w-3xl">
          <div aria-hidden="true" className="mb-5 h-1 w-9 -skew-x-[24deg] rounded-sm bg-primary" />
          <h1 className="text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Ferramentas e soluções digitais
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
            Ferramentas e serviços para criar, otimizar e acelerar seus resultados no digital.
          </p>
          <div className="mt-7 max-w-2xl">
            <GlobalSearch prominent />
          </div>
          <nav aria-label="Acesso rápido" className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm">
            <Link href="#mais-usadas" className="inline-flex items-center gap-1.5 font-medium text-foreground hover:text-primary">
              Mais usadas <ArrowRight aria-hidden="true" className="size-3.5" />
            </Link>
            <Link href="/ferramentas/imagens" className="text-muted-foreground hover:text-foreground">Imagens</Link>
            <Link href="/ferramentas/pdfs" className="text-muted-foreground hover:text-foreground">PDFs</Link>
            <Link href="#ferramentas" className="text-muted-foreground hover:text-foreground">Todas as categorias</Link>
          </nav>
        </div>
      </div>
    </section>
  );
}
