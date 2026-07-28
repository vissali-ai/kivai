"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { AdSlot } from "@/components/ads/AdSlot";

type ImageToolPageShellProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function ImageToolPageShell({ title, description, children }: ImageToolPageShellProps) {
  return (
    <section className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-6xl px-4 pb-12 pt-24 sm:px-6 sm:pt-24 lg:px-8 lg:pb-16">
        <div className="mb-8">
          <Link href="/ferramentas/imagens" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Voltar para Ferramentas de Imagem
          </Link>
        </div>

        <div className="mb-10 max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-wider text-primary">Ferramenta de imagem</p>
          <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">{title}</h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">{description}</p>
        </div>

        {children}

        <div className="mx-auto mt-8 max-w-5xl"><AdSlot variant="banner" /></div>
      </div>
    </section>
  );
}
