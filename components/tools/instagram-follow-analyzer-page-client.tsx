"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, LockKeyhole, ShieldCheck, UsersRound, Zap } from "lucide-react";
import { InstagramFollowAnalyzer } from "@/components/tools/instagram-follow-analyzer";
import { getStoredSession } from "@/lib/user-auth";
import type { InstagramAnalyzerConfig } from "@/lib/instagram-follow-analyzer-config";

type Plan = "free" | "pro" | "agency";

type Props = {
  freeConfig: InstagramAnalyzerConfig;
};

export function InstagramFollowAnalyzerPageClient({ freeConfig }: Props) {
  const [plan, setPlan] = useState<Plan>("free");
  const [config, setConfig] = useState<InstagramAnalyzerConfig>(freeConfig);

  useEffect(() => {
    async function loadPaidExperience() {
      const session = getStoredSession();
      if (!session?.access_token) return;
      try {
        const response = await fetch("/api/account/instagram-analyzer-config", {
          headers: { Authorization: `Bearer ${session.access_token}` },
          cache: "no-store",
        });
        if (!response.ok) return;
        const payload = (await response.json()) as { plan?: Plan; config?: InstagramAnalyzerConfig };
        if (!payload.config || (payload.plan !== "pro" && payload.plan !== "agency")) return;
        setPlan(payload.plan);
        setConfig(payload.config);
      } catch {
        // O conteúdo público/grátis permanece como fallback seguro.
      }
    }
    loadPaidExperience();
  }, []);

  const show = (key: string) => config.sectionVisibility[key] !== false;
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

      {show("hero") ? <section className="mt-8 max-w-4xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{config.eyebrow}</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">{config.pageTitle}</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">{config.heroDescription}</p>
        <div className="mt-6 flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-2 border border-white/10 px-3 py-2"><Zap className="size-4 text-primary" /> {config.badgeOne}</span>
          <span className="inline-flex items-center gap-2 border border-white/10 px-3 py-2"><ShieldCheck className="size-4 text-primary" /> {config.badgeTwo}</span>
        </div>
      </section> : null}

      <div className={show("hero") ? "mt-10" : "mt-8"}><InstagramFollowAnalyzer config={config} /></div>

      {show("summaryPlans") ? <section className="mt-12 grid gap-4 md:grid-cols-3">
        <div className="border border-white/10 bg-card p-5"><h2 className="font-semibold">{config.freeTitle}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{config.freeDescription}</p></div>
        <div className="border border-primary/25 bg-primary/[0.04] p-5"><h2 className="font-semibold">{config.proTitle}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{config.proDescription}</p></div>
        <div className="border border-white/10 bg-card p-5"><h2 className="font-semibold">{config.agencyTitle}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{config.agencyDescription}</p></div>
      </section> : null}

      {show("audience") ? <section className="mt-16 border-t border-white/10 pt-12">
        <div className="max-w-3xl">
          <div className="flex items-center gap-3"><UsersRound className="size-5 text-primary" /><h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{config.audienceTitle}</h2></div>
          <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">{config.audienceDescription}</p>
        </div>
      </section> : null}

      {show("plans") ? <section className="mt-12">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{config.plansTitle}</h2>
        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          {plans.map((item) => <article key={item.title} className={`border p-5 sm:p-6 ${item.highlight ? "border-primary/30 bg-primary/[0.04]" : "border-white/10 bg-card"}`}>
            <h3 className="text-xl font-semibold">{item.title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.summary}</p>
            <ul className="mt-5 space-y-3">
              {item.items.map((text) => <li key={text} className="flex gap-3 text-sm leading-6 text-muted-foreground"><Check className="mt-1 size-4 shrink-0 text-primary" /><span>{text}</span></li>)}
            </ul>
          </article>)}
        </div>
        <div className="mt-6 flex flex-col items-start justify-between gap-4 border border-primary/25 bg-primary/[0.04] p-5 sm:flex-row sm:items-center sm:p-6">
          <div>
            <h3 className="text-lg font-semibold">Quer mais recursos para acompanhar seu Instagram?</h3>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">Compare os planos disponíveis e escolha a melhor opção para o seu uso.</p>
          </div>
          <Link href={plan === "free" ? "/planos" : plan === "pro" ? "/conta/pro" : "/conta"} className="inline-flex shrink-0 items-center justify-center bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90">
            {plan === "free" ? "Ver planos e assinar" : "Abrir meu painel"}
          </Link>
        </div>
      </section> : null}

      {show("faq") ? <section className="mt-14">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{config.faqTitle}</h2>
        <div className="mt-6 divide-y divide-white/10 border-y border-white/10">
          {config.faqItems.map((item) => <details key={item.question} className="group py-4">
            <summary className="cursor-pointer list-none pr-6 text-sm font-semibold marker:hidden sm:text-base">{item.question}</summary>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-muted-foreground">{item.answer}</p>
          </details>)}
        </div>
      </section> : null}

      {show("privacy") ? <section className="mt-14 border border-primary/20 bg-primary/[0.025] p-6 sm:p-8">
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
      </section> : null}
    </main>
  );
}
