import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Tv } from "lucide-react";
import { getCmsHubMetadata } from "@/lib/seo";
import { getSiteHubBySlug, listPublishedSiteContentsByHub } from "@/lib/site-cms/repository";
export const dynamic = "force-dynamic";
export const generateMetadata = () => getCmsHubMetadata("smart-tv-tv-box");
export default async function Page() {
  const hub = await getSiteHubBySlug("smart-tv-tv-box");
  if (!hub || hub.status !== "published") notFound();
  const contents = (await listPublishedSiteContentsByHub(hub.id)).filter(item => item.technicalStatus !== "pending");
  return <main className="min-h-screen bg-background px-4 pb-16 pt-24 text-foreground sm:px-6"><div className="mx-auto max-w-6xl">
    <Link href="/ferramentas" className="text-sm text-muted-foreground hover:text-primary">Ferramentas</Link>
    <h1 className="mt-6 text-3xl font-semibold tracking-tight sm:text-5xl">{hub.name}</h1>{hub.blockVisibility?.summary !== false && <p className="mt-4 max-w-3xl text-lg leading-8 text-muted-foreground">{hub.description}</p>}
    <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{contents.map(item => <Link key={item.id} href={item.path} className="group rounded-xl border border-border bg-card p-6 transition hover:border-primary/50"><Tv className="size-6 text-primary" /><h2 className="mt-5 text-xl font-semibold">{item.title}</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">{item.shortDescription}</p><span className="mt-6 flex items-center gap-2 text-sm text-primary">Abrir ferramenta <ArrowRight className="size-4" /></span></Link>)}</div>
    {!contents.length && <p className="mt-8 text-muted-foreground">Nenhuma ferramenta publicada neste hub no momento.</p>}
    {hub.blockVisibility?.content !== false && <article className="mt-12 max-w-4xl space-y-4 leading-7 text-muted-foreground [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground" dangerouslySetInnerHTML={{ __html: hub.contentHtml }} />}
  </div></main>;
}
