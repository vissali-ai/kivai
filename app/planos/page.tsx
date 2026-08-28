import type { Metadata } from "next";
import { PlansClient } from "@/components/account/plans-client";
import { SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: { absolute: "Planos Kivai | Grátis, Pro e Agency" },
  description: "Compare os planos Grátis, Pro e Agency do Kivai para analisar e acompanhar contas do Instagram.",
  alternates: { canonical: `${SITE_URL}/planos` },
  robots: { index: true, follow: true },
};

export default function PlansPage() {
  return (
    <main className="min-h-screen bg-background pb-20 pt-24 text-foreground">
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Planos Kivai</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Escolha o plano ideal para sua análise</h1>
          <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg">Comece gratuitamente ou evolua sua conta quando precisar. Se você já estiver conectado, o Kivai identifica automaticamente o seu plano atual e mostra as demais opções disponíveis para mudança.</p>
        </div>

        <PlansClient />
      </section>
    </main>
  );
}
