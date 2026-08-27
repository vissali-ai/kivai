import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Check, LockKeyhole, LogIn, ShieldCheck, UsersRound, Zap } from "lucide-react";
import { InstagramFollowAnalyzer } from "@/components/tools/instagram-follow-analyzer";
import { getInstagramAnalyzerConfig } from "@/lib/instagram-follow-analyzer-config";
import { getToolOverride } from "@/lib/site-cms/repository";

export async function generateMetadata(): Promise<Metadata> {
  const content = await getToolOverride("instagram-follow-analyzer");
  const seoTitle = content?.seoTitle || "Quem deixou de seguir no Instagram | Kivai";
  return {
    title: { absolute: seoTitle },
    description: content?.seoDescription || "Descubra quem não segue você de volta no Instagram usando a exportação oficial da Meta, sem informar sua senha.",
    alternates: { canonical: content?.canonicalUrl || "/ferramentas/instagram-follow-analyzer" },
    robots: content?.status === "published" && content.indexable ? { index: true, follow: true } : { index: false, follow: false },
  };
}

export default async function InstagramFollowAnalyzerPage() {
  const config = await getInstagramAnalyzerConfig();
  const plans = [
    { title: config.freeTitle, summary: config.freeDescription, items: config.freePlanDetail, highlight: false },
    { title: config.proTitle, summary: config.proDescription, items: config.proPlanDetail, highlight: true },
    { title: config.agencyTitle, summary: config.agencyDescription, items: config.agencyPlanDetail, highlight: false },
  ];

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

      <section className="mt-16 border-t border-white/10 pt-12">
        <div className="max-w-3xl">
          <div className="flex items-center gap-3"><UsersRound className="size-5 text-primary" /><h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{config.audienceTitle}</h2></div>
          <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">{config.audienceDescription}</p>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{config.plansTitle}</h2>
        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          {plans.map((plan) => <article key={plan.title} className={`border p-5 sm:p-6 ${plan.highlight ? "border-primary/30 bg-primary/[0.04]" : "border-white/10 bg-card"}`}>
            <h3 className="text-xl font-semibold">{plan.title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{plan.summary}</p>
            <ul className="mt-5 space-y-3">
              {plan.items.map((item) => <li key={item} className="flex gap-3 text-sm leading-6 text-muted-foreground"><Check className="mt-1 size-4 shrink-0 text-primary" /><span>{item}</span></li>)}
            </ul>
          </article>)}
        </div>
        <div className="mt-6 flex flex-col items-start justify-between gap-4 border border-primary/25 bg-primary/[0.04] p-5 sm:flex-row sm:items-center sm:p-6">
          <div>
            <h3 className="text-lg font-semibold">Acesse sua conta Kivai</h3>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">Faça login para acessar sua conta, acompanhar suas análises e gerenciar seu plano.</p>
          </div>
          <Link href="/conta/login" className="inline-flex shrink-0 items-center justify-center gap-2 bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90"><LogIn className="size-4" />Fazer login</Link>
        </div>
      </section>

      <section className="mt-14">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{config.faqTitle}</h2>
        <div className="mt-6 divide-y divide-white/10 border-y border-white/10">
          {config.faqItems.map((item) => <details key={item.question} className="group py-4">
            <summary className="cursor-pointer list-none pr-6 text-sm font-semibold marker:hidden sm:text-base">{item.question}</summary>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-muted-foreground">{item.answer}</p>
          </details>)}
        </div>
      </section>

      <section className="mt-14 border border-primary/20 bg-primary/[0.025] p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center border border-primary/30 bg-primary/10 text-primary"><LockKeyhole className="size-5" /></div>
          <div className="max-w-4xl">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{config.privacyTitle}</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">{config.privacyDescription}</p>
          </div>
        </div>
        <ul className="mt-6 grid gap-3 md:grid-cols-2">
          {config.privacyItems.map((item) => <li key={item} className="flex gap-3 border border-white/10 bg-card/60 p-4 text-sm leading-6 text-muted-foreground"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" /><span>{item}</span></li>)}
        </ul>
        <Link href="/privacidade" className="mt-6 inline-flex text-sm font-medium text-primary hover:underline">{config.privacyLinkLabel}</Link>
      </section>
    </main>
  );
}
