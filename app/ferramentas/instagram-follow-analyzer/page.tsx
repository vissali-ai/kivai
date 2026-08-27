import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Zap } from "lucide-react";
import { InstagramFollowAnalyzer } from "@/components/tools/instagram-follow-analyzer";
import { getInstagramAnalyzerConfig } from "@/lib/instagram-follow-analyzer-config";
import { getToolOverride } from "@/lib/site-cms/repository";

export async function generateMetadata(): Promise<Metadata> {
  const content = await getToolOverride("instagram-follow-analyzer");
  return {
    title: content?.seoTitle || "Instagram Follow Analyzer | Kivai",
    description: content?.seoDescription || "Analise quem não segue você de volta, quem você não segue e seus seguidores mútuos usando a exportação oficial da Meta.",
    alternates: { canonical: content?.canonicalUrl || "/ferramentas/instagram-follow-analyzer" },
    robots: content?.status === "published" && content.indexable ? { index: true, follow: true } : { index: false, follow: false },
  };
}

export default async function InstagramFollowAnalyzerPage() {
  const config = await getInstagramAnalyzerConfig();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-20 pt-24 sm:px-6 lg:px-8">
      <Link href="/ferramentas/social-media" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground">
        <ArrowLeft className="size-4" /> Voltar para Social Media
      </Link>

      <section className="mt-8 max-w-4xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{config.eyebrow}</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">{config.pageTitle}</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">{config.heroDescription}</p>
        <div className="mt-6 flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-2 border border-white/10 px-3 py-2"><Zap className="size-4 text-primary" /> {config.badgeOne}</span>
          <span className="inline-flex items-center gap-2 border border-white/10 px-3 py-2"><ShieldCheck className="size-4 text-primary" /> {config.badgeTwo}</span>
        </div>
      </section>

      <div className="mt-10"><InstagramFollowAnalyzer config={config} /></div>

      <section className="mt-12 grid gap-4 md:grid-cols-3">
        <div className="border border-white/10 bg-card p-5"><h2 className="font-semibold">{config.freeTitle}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{config.freeDescription}</p></div>
        <div className="border border-primary/25 bg-primary/[0.04] p-5"><h2 className="font-semibold">{config.proTitle}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{config.proDescription}</p></div>
        <div className="border border-white/10 bg-card p-5"><h2 className="font-semibold">{config.agencyTitle}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{config.agencyDescription}</p></div>
      </section>
    </main>
  );
}
