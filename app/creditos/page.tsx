import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { CreditPacksClient } from "@/components/tools/credit-packs-client";
import { AiCreditBalance } from "@/components/tools/ai-credit-balance";
import { creditsContent } from "@/lib/billing/credits-content";
import { listStoredSiteContents } from "@/lib/site-cms/repository";
import { sanitizePostHtml } from "@/lib/blog/sanitize";
import { SITE_URL } from "@/lib/seo";

const getContent = cache(async () => {
  await connection();
  return (await listStoredSiteContents()).find(item => item.path === "/creditos") ?? creditsContent;
});
export async function generateMetadata(): Promise<Metadata> {
  const item = await getContent();
  return { title: { absolute: item.seoTitle || item.title }, description: item.seoDescription || item.shortDescription, alternates: { canonical: item.canonicalUrl || `${SITE_URL}/creditos` }, robots: { index: item.status === "published" && item.indexable, follow: item.indexable } };
}
export default async function CreditsPage() {
  const item = await getContent();
  if (item.status !== "published") notFound();
  return <main className="mx-auto min-h-[75vh] w-full max-w-5xl space-y-8 px-4 py-24 sm:px-6 lg:px-8">
    <Link href="/planos" className="text-sm text-primary underline">Ver planos Pro e Agency</Link>
    <header className="space-y-3"><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{item.title}</h1><p className="max-w-3xl text-muted-foreground">{item.shortDescription}</p></header>
    <AiCreditBalance />
    <CreditPacksClient />
    <article className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: sanitizePostHtml(item.contentHtml) }} />
  </main>;
}
