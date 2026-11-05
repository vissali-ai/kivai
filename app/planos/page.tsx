import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PlansClient } from "@/components/account/plans-client";
import { plansContent } from "@/lib/billing/plans-content";
import { listStoredSiteContents } from "@/lib/site-cms/repository";
import { sanitizePostHtml } from "@/lib/blog/sanitize";
import { SITE_URL } from "@/lib/seo";
import { cache } from "react";
import { connection } from "next/server";
const getContent = cache(async () => {
  await connection();
  return (await listStoredSiteContents()).find(item => item.path === "/planos") ?? plansContent;
});
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
    {item.contentHtml.trim() ? (
      <details className="group mt-10 overflow-hidden rounded-xl border border-border bg-card">
        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 text-sm font-semibold text-foreground marker:hidden sm:px-6 [&::-webkit-details-marker]:hidden">
          <span>Informações adicionais e regras dos planos</span>
          <span aria-hidden="true" className="shrink-0 text-lg font-normal text-primary transition-transform group-open:rotate-45">+</span>
        </summary>
        <div className="border-t border-border px-4 py-5 sm:px-6">
          <p className="mb-5 text-sm leading-6 text-muted-foreground">Consulte aqui os detalhes de créditos, pagamentos, limites e condições de uso.</p>
          <article
            className="max-w-3xl space-y-4 break-words text-sm leading-7 text-muted-foreground [&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_h2]:mt-7 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:leading-6 [&_h2]:text-foreground [&_h3]:mt-5 [&_h3]:font-semibold [&_h3]:text-foreground [&_li]:ml-5 [&_ol]:list-decimal [&_p]:mt-2 [&_ul]:list-disc"
            dangerouslySetInnerHTML={{ __html: sanitizePostHtml(item.contentHtml) }}
          />
        </div>
      </details>
    ) : null}
    {/^https?:\/\//.test(tutorial) ? <a className="mt-4 inline-block text-primary underline" href={tutorial} target="_blank" rel="noopener noreferrer">Ver tutorial dos planos</a> : null}
  </section></main>;
}
