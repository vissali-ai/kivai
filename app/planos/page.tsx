import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PlansClient } from "@/components/account/plans-client";
import { plansContent } from "@/lib/billing/plans-content";
import { listStoredSiteContents } from "@/lib/site-cms/repository";
import { sanitizePostHtml } from "@/lib/blog/sanitize";
import { SITE_URL } from "@/lib/seo";
import { cache } from "react";
const getContent = cache(async () => (await listStoredSiteContents()).find(item => item.path === "/planos") ?? plansContent);
export async function generateMetadata(): Promise<Metadata> {
  const item = await getContent();
  return { title: { absolute: item.seoTitle || item.title }, description: item.seoDescription || item.shortDescription, alternates: { canonical: item.canonicalUrl || `${SITE_URL}/planos` }, robots: { index: item.status === "published" && item.indexable, follow: item.indexable } };
}
export default async function PlansPage() {
  const item = await getContent();
  if (item.status !== "published") notFound();
  const tutorial = String(item.customData.originalFields?.find(f => f.key === "tutorial-url")?.value ?? "");
  return <main className="min-h-screen bg-background pb-20 pt-24 text-foreground"><section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
    <div className="mx-auto max-w-3xl text-center"><p className="text-xs font-semibold uppercase tracking-widest text-primary">Planos Kivai</p><h1 className="mt-3 text-4xl font-semibold">{item.title}</h1><p className="mt-5 text-base leading-7 text-muted-foreground">{item.shortDescription}</p></div>
    <PlansClient fields={item.customData.originalFields} />
    <article className="prose prose-invert mt-12 max-w-none" dangerouslySetInnerHTML={{ __html: sanitizePostHtml(item.contentHtml) }} />
    {/^https?:\/\//.test(tutorial) ? <a className="mt-4 inline-block text-primary underline" href={tutorial} target="_blank" rel="noopener noreferrer">Ver tutorial dos planos</a> : null}
  </section></main>;
}
