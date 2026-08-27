import Link from "next/link";
import type { SiteContent, SiteHub } from "@/lib/site-cms/types";

function visible(map: Record<string, boolean> | undefined, key: string) {
  return map?.[key] !== false;
}

export function PublicContentPage({ content, hub }: { content: SiteContent; hub?: SiteHub | null }) {
  const kind = content.contentType === "tool" ? "Ferramenta" : content.contentType === "resource" ? "Material ou guia" : "Conteúdo";
  const visibility = content.customData.blockVisibility;
  const originalFields = content.customData.originalFields ?? [];
  return <main className="min-h-screen bg-background pb-16 pt-24 text-foreground"><section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8"><nav className="text-sm text-muted-foreground"><Link href="/">Início</Link><span className="px-2">/</span>{content.contentType === "tool" ? <Link href="/ferramentas">Ferramentas</Link> : <span>{kind}</span>}{hub ? <><span className="px-2">/</span><Link href={hub.path}>{hub.name}</Link></> : null}</nav>{visible(visibility, "hero") ? <><p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-primary">{kind}</p><h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">{content.title}</h1></> : null}{visible(visibility, "summary") && content.shortDescription ? <p className="mt-5 text-lg leading-8 text-muted-foreground">{content.shortDescription}</p> : null}
    {content.contentType === "tool" && !content.existingToolSlug ? <div className="mt-8 border border-amber-500/30 bg-amber-500/5 p-4 text-sm leading-6 text-amber-100"><strong>Recurso editorial.</strong> Esta página foi criada manualmente no painel. A operação técnica da ferramenta precisa ser implementada no projeto antes de ser apresentada como funcional.</div> : null}
    {visible(visibility, "originalFields") && originalFields.length ? <section className="mt-10 grid gap-4 sm:grid-cols-2">{originalFields.filter((field) => visible(visibility, `field:${field.key}`)).map((field) => <div key={field.key} className="border border-border bg-card p-4"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{field.label}</p>{field.type === "image" && String(field.value || "") ? <img src={String(field.value)} alt={field.label} className="mt-3 h-auto max-w-full" /> : field.type === "boolean" ? <p className="mt-2 text-sm">{field.value ? "Sim" : "Não"}</p> : <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{String(field.value ?? "")}</p>}</div>)}</section> : null}
    {visible(visibility, "content") ? (content.contentHtml ? <article className="cms-public-content mt-10 border-t border-border pt-8" dangerouslySetInnerHTML={{ __html: content.contentHtml }} /> : <p className="mt-10 border-t border-border pt-8 text-muted-foreground">O conteúdo desta página ainda está sendo preparado.</p>) : null}
  </section></main>;
}

export function PublicHubPage({ hub, contents }: { hub: SiteHub; contents: SiteContent[] }) {
  const visibility = hub.blockVisibility ?? {};
  return <main className="min-h-screen bg-background pb-16 pt-24 text-foreground"><section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">{visible(visibility, "hero") ? <><p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Hub Kivai</p><h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">{hub.name}</h1></> : null}{visible(visibility, "description") && hub.description ? <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">{hub.description}</p> : null}{visible(visibility, "content") && hub.contentHtml ? <article className="cms-public-content mt-10 border-t border-border pt-8" dangerouslySetInnerHTML={{ __html: hub.contentHtml }} /> : null}{visible(visibility, "items") ? <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{contents.map((item) => <Link key={item.id} href={item.path} className="rounded-xl border border-border bg-card p-5 transition hover:border-primary/50"><h2 className="font-semibold">{item.title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{item.shortDescription}</p></Link>)}</div> : null}{visible(visibility, "items") && !contents.length ? <p className="mt-10 border border-dashed border-border p-8 text-center text-muted-foreground">Nenhum conteúdo publicado neste hub.</p> : null}</section></main>;
}
