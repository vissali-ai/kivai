import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Zap } from "lucide-react";
import { InstagramFollowAnalyzer } from "@/components/tools/instagram-follow-analyzer";

export const metadata: Metadata = {
  title: "Instagram Follow Analyzer | Kivai",
  description: "Analise quem não segue você de volta, quem você não segue e seus seguidores mútuos usando a exportação oficial da Meta.",
  robots: { index: false, follow: false },
};

export default function InstagramFollowAnalyzerPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-20 pt-24 sm:px-6 lg:px-8">
      <Link href="/ferramentas/social-media" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground">
        <ArrowLeft className="size-4" /> Voltar para Social Media
      </Link>

      <section className="mt-8 max-w-4xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Kivai Social Intelligence</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">Instagram Follow Analyzer</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
          Descubra rapidamente quem não segue você de volta, quem você não segue e quais seguidores são mútuos. A versão gratuita analisa até 50 mil seguidores.
        </p>

        <div className="mt-6 flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-2 border border-white/10 px-3 py-2"><Zap className="size-4 text-primary" /> Análise rápida</span>
          <span className="inline-flex items-center gap-2 border border-white/10 px-3 py-2"><ShieldCheck className="size-4 text-primary" /> Exportação oficial da Meta</span>
        </div>
      </section>

      <div className="mt-10"><InstagramFollowAnalyzer /></div>

      <section className="mt-12 grid gap-4 md:grid-cols-3">
        <div className="border border-white/10 bg-card p-5"><h2 className="font-semibold">Grátis</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Até 50 mil seguidores, com as três análises essenciais.</p></div>
        <div className="border border-primary/25 bg-primary/[0.04] p-5"><h2 className="font-semibold">Pro</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Histórico, novos seguidores, unfollows, comparações e análises avançadas.</p></div>
        <div className="border border-white/10 bg-card p-5"><h2 className="font-semibold">Agency</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Múltiplas contas, clientes, relatórios e operação para agências.</p></div>
      </section>
    </main>
  );
}
