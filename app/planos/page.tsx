import type { Metadata } from "next";
import { PlansClient } from "@/components/account/plans-client";
import { SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: { absolute: "Planos Kivai | Grátis, Pro e Agency" },
  description: "Compare os planos Grátis, Pro e Agency do Kivai para analisar contas do Instagram, salvar histórico, comparar períodos e acompanhar múltiplos perfis.",
  alternates: { canonical: `${SITE_URL}/planos` },
  robots: { index: true, follow: true },
};

export default function PlansPage() {
  return (
    <main className="min-h-screen bg-background pb-20 pt-24 text-foreground">
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Planos Kivai</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Escolha entre analisar agora ou acompanhar a evolução dos seus perfis</h1>
          <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg">O plano Grátis é ideal para consultas pontuais. Com o Pro ou Agency, você passa a salvar histórico, comparar exportações, identificar novos seguidores e unfollows por período e acompanhar vários perfis em uma área exclusiva.</p>
        </div>

        <PlansClient />
      </section>
    </main>
  );
}
