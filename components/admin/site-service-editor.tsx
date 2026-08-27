"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, ExternalLink, Save, Trash2 } from "lucide-react";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { slugify } from "@/lib/blog/slug";
import { formatSiteEditDate } from "@/lib/site-cms/date";
import type { ManagedSiteService, SitePublicationStatus } from "@/lib/site-cms/types";

type Draft = Omit<ManagedSiteService, "createdAt" | "updatedAt" | "publishedAt">;
const field = "block space-y-1.5 text-sm";
const area = "min-h-28 w-full rounded-md border border-input bg-background p-3 text-sm";
const publicBlocks = [
  ["hero", "Topo, título e selo"],
  ["summary", "Resumo do serviço"],
  ["audience", "Público indicado"],
  ["cta", "Botão principal"],
  ["cover", "Imagem de capa"],
  ["content", "Conteúdo completo"],
] as const;

export function SiteServiceEditor({ initialService }: { initialService: ManagedSiteService }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>({ ...initialService, blockVisibility: initialService.blockVisibility ?? {} });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const creating = draft.id === "new";
  const isVisible = (key: string) => draft.blockVisibility?.[key] !== false;
  const isDeleted = (key: string) => draft.blockVisibility?.[`__deleted_${key}`] === true;
  const setVisible = (key: string, visible: boolean) => setDraft((current) => ({ ...current, blockVisibility: { ...(current.blockVisibility ?? {}), [key]: visible } }));

  function deleteBlock(key: string, label: string) {
    if (!window.confirm(`Excluir definitivamente o bloco “${label}”? O conteúdo exclusivo deste bloco será apagado e não poderá ser reativado pelo seletor.`)) return;
    setDraft((current) => {
      const next: Draft = {
        ...current,
        blockVisibility: { ...(current.blockVisibility ?? {}), [key]: false, [`__deleted_${key}`]: true },
      };
      if (key === "summary") next.shortDescription = "";
      if (key === "audience") next.audience = "";
      if (key === "cta") { next.ctaLabel = ""; next.ctaUrl = ""; }
      if (key === "cover") next.coverImageUrl = "";
      if (key === "content") next.contentHtml = "";
      if (key === "hero") next.badge = "";
      return next;
    });
    setMessage(`Bloco “${label}” marcado para exclusão definitiva. Clique em Salvar alterações para confirmar no banco.`);
  }

  async function save(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("Salvando...");
    const response = await fetch(creating ? "/api/admin/site-services" : `/api/admin/site-services/${encodeURIComponent(draft.id)}`, { method: creating ? "POST" : "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft) });
    const data = await response.json(); setBusy(false);
    if (!response.ok) return setMessage(data.error ?? "Não foi possível salvar.");
    setDraft((current) => ({ ...current, ...data, blockVisibility: data.blockVisibility ?? current.blockVisibility }));
    setMessage("Serviço salvo. Blocos ocultos permanecem recuperáveis; blocos excluídos tiveram seus dados exclusivos removidos.");
    router.replace(`/admin/site/servicos/${encodeURIComponent(data.id)}`); router.refresh();
  }

  async function remove() {
    if (creating || draft.virtual || !window.confirm(`Excluir “${draft.title}”?`)) return;
    const response = await fetch(`/api/admin/site-services/${encodeURIComponent(draft.id)}`, { method: "DELETE" });
    if (!response.ok) return setMessage((await response.json()).error);
    router.push("/admin/site"); router.refresh();
  }

  return <form onSubmit={save} className="mx-auto max-w-6xl space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-4"><div><Button asChild type="button" variant="ghost" className="-ml-3 mb-2"><Link href="/admin/site"><ArrowLeft />Voltar</Link></Button><p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Serviços</p><h1 className="mt-1 text-2xl font-semibold sm:text-3xl">{draft.title || "Novo serviço"}</h1><p className="mt-2 text-xs text-muted-foreground"><strong>Última edição:</strong> {creating ? "Ainda não salvo" : formatSiteEditDate(initialService.updatedAt)}</p></div><div className="flex w-full flex-wrap gap-2 sm:w-auto">{draft.path ? <Button asChild type="button" variant="outline"><a href={draft.path} target="_blank" rel="noreferrer"><ExternalLink />Abrir página</a></Button> : null}<Button type="submit" disabled={busy}><Save />{busy ? "Salvando..." : "Salvar"}</Button></div></header>
    {message ? <p role="status" className="border border-white/10 bg-muted/10 p-3 text-sm">{message}</p> : null}
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]"><div className="min-w-0 space-y-6">
      <fieldset className="space-y-3 rounded-xl border border-primary/20 bg-card p-4 sm:p-6"><legend className="px-1 font-semibold">Blocos disponíveis no site público</legend><p className="text-xs leading-5 text-muted-foreground">Desmarque para ocultar sem apagar. Use Excluir para remover definitivamente os dados exclusivos do bloco.</p><div className="grid gap-3 sm:grid-cols-2">{publicBlocks.filter(([key]) => !isDeleted(key)).map(([key, label]) => <div key={key} className="flex items-center justify-between gap-3 border border-white/10 p-3 text-sm"><label className="flex min-w-0 flex-1 items-center justify-between gap-3"><span>{label}</span><input type="checkbox" className="size-4" checked={isVisible(key)} onChange={(e) => setVisible(key, e.target.checked)} /></label><Button type="button" variant="ghost" size="sm" className="shrink-0 text-destructive hover:text-destructive" onClick={() => deleteBlock(key, label)}><Trash2 className="size-4" />Excluir</Button></div>)}</div>{publicBlocks.some(([key]) => isDeleted(key)) ? <p className="text-xs text-muted-foreground">Blocos excluídos deixam de aparecer neste editor após salvar. A exclusão não remove os metadados técnicos necessários para identificar a publicação.</p> : null}</fieldset>
      <section className="grid gap-4 rounded-xl border border-white/10 bg-card p-4 sm:grid-cols-2 sm:p-6"><div className="sm:col-span-2"><h2 className="font-semibold">Identificação comercial</h2><p className="mt-1 text-xs text-muted-foreground">O editor já carrega os dados atuais; altere somente o necessário.</p></div><label className={field}><span>Título *</span><Input required value={draft.title} onChange={(e) => { const title = e.target.value; const slug = creating ? slugify(title) : draft.slug; setDraft({ ...draft, title, slug, path: `/servicos/${slug}` }); }} /></label><label className={field}><span>Slug *</span><Input required disabled={Boolean(draft.existingServiceSlug)} value={draft.slug} onChange={(e) => { const slug = slugify(e.target.value); setDraft({ ...draft, slug, path: `/servicos/${slug}` }); }} /><small className="break-all text-muted-foreground">URL: /servicos/{draft.slug || "slug"}</small></label>{!isDeleted("summary") ? <label className={`${field} sm:col-span-2`}><span>Resumo *</span><textarea required className={area} value={draft.shortDescription} onChange={(e) => setDraft({ ...draft, shortDescription: e.target.value })} /></label> : null}{!isDeleted("hero") ? <><label className={field}><span>Selo curto</span><Input value={draft.badge} onChange={(e) => setDraft({ ...draft, badge: e.target.value })} /></label><label className={field}><span>Tipo de serviço</span><Input value={draft.serviceType} onChange={(e) => setDraft({ ...draft, serviceType: e.target.value })} /></label></> : null}{!isDeleted("audience") ? <label className={`${field} sm:col-span-2`}><span>Público indicado</span><Input value={draft.audience} onChange={(e) => setDraft({ ...draft, audience: e.target.value })} /></label> : null}</section>
      {!isDeleted("content") ? <section className="min-w-0 rounded-xl border border-white/10 bg-card p-3 sm:p-6"><h2 className="font-semibold">Conteúdo completo do serviço</h2><p className="mb-4 mt-1 text-xs text-muted-foreground">Use seções para entregas, processo, limites, experiência e perguntas frequentes.</p><RichTextEditor value={draft.contentHtml} onChange={(contentHtml) => setDraft((current) => ({ ...current, contentHtml }))} /></section> : null}
      {!isDeleted("cta") || !isDeleted("cover") ? <section className="grid gap-4 rounded-xl border border-white/10 bg-card p-4 sm:grid-cols-2 sm:p-6"><div className="sm:col-span-2"><h2 className="font-semibold">Ação e imagem</h2></div>{!isDeleted("cta") ? <><label className={field}><span>Texto do botão</span><Input value={draft.ctaLabel} onChange={(e) => setDraft({ ...draft, ctaLabel: e.target.value })} /></label><label className={field}><span>Destino do botão</span><Input value={draft.ctaUrl} onChange={(e) => setDraft({ ...draft, ctaUrl: e.target.value })} /></label></> : null}{!isDeleted("cover") ? <label className={`${field} sm:col-span-2`}><span>URL da imagem de capa (opcional)</span><Input type="url" value={draft.coverImageUrl} onChange={(e) => setDraft({ ...draft, coverImageUrl: e.target.value })} /></label> : null}</section> : null}
      <section className="grid gap-4 rounded-xl border border-white/10 bg-card p-4 sm:grid-cols-2 sm:p-6"><div className="sm:col-span-2"><h2 className="font-semibold">SEO</h2></div><label className={field}><span>Título SEO *</span><Input required value={draft.seoTitle} onChange={(e) => setDraft({ ...draft, seoTitle: e.target.value })} /></label><label className={field}><span>URL canônica personalizada</span><Input type="url" value={draft.canonicalUrl} onChange={(e) => setDraft({ ...draft, canonicalUrl: e.target.value })} /></label><label className={`${field} sm:col-span-2`}><span>Descrição SEO *</span><textarea required className={area} value={draft.seoDescription} onChange={(e) => setDraft({ ...draft, seoDescription: e.target.value })} /></label></section>
    </div><aside className="space-y-5 lg:sticky lg:top-6 lg:h-fit"><fieldset className="space-y-4 rounded-xl border border-white/10 bg-card p-5"><legend className="px-1 font-semibold">Publicação e organização</legend><label className={field}><span>Status</span><select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as SitePublicationStatus })} className="h-10 w-full rounded-md border border-input bg-background px-3"><option value="draft">Rascunho</option><option value="published">Publicado</option><option value="archived">Arquivado</option></select></label><label className="flex items-start gap-3 text-sm"><input type="checkbox" className="mt-1 size-4" checked={draft.showInServicesIndex} onChange={(e) => setDraft({ ...draft, showInServicesIndex: e.target.checked })} /><span><strong>Mostrar em Serviços</strong><small className="block text-muted-foreground">Exibe o cartão em /servicos.</small></span></label><label className={field}><span>Ordem do cartão</span><Input type="number" min="0" max="9999" value={draft.displayOrder} onChange={(e) => setDraft({ ...draft, displayOrder: Number(e.target.value) || 100 })} /></label><label className="flex items-start gap-3 text-sm"><input type="checkbox" className="mt-1 size-4" disabled={draft.status !== "published"} checked={draft.status === "published" && draft.indexable} onChange={(e) => setDraft({ ...draft, indexable: e.target.checked, ...(e.target.checked ? {} : { includeInSitemap: false }) })} /><span><strong>Permitir indexação</strong></span></label><label className="flex items-start gap-3 text-sm"><input type="checkbox" className="mt-1 size-4" disabled={draft.status !== "published" || !draft.indexable} checked={draft.status === "published" && draft.indexable && draft.includeInSitemap} onChange={(e) => setDraft({ ...draft, includeInSitemap: e.target.checked })} /><span><strong>Incluir no sitemap</strong></span></label></fieldset><Button type="submit" className="w-full" disabled={busy}><Save />Salvar alterações</Button>{!creating && !draft.virtual ? <Button type="button" variant="destructive" className="w-full" onClick={remove}><Trash2 />Excluir do CMS</Button> : null}</aside></div>
  </form>;
}