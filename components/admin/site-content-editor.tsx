"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft, Check, Copy, ExternalLink, Save, Trash2 } from "lucide-react";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { slugify } from "@/lib/blog/slug";
import type { ManagedSiteContent, SiteContentType, SiteDisplayLocation, SiteHub, SitePublicationStatus } from "@/lib/site-cms/types";
import { formatSiteEditDate } from "@/lib/site-cms/date";

type Draft = Omit<ManagedSiteContent, "createdAt" | "updatedAt" | "publishedAt">;
const fieldClass = "block space-y-1.5 text-sm";
const textareaClass = "min-h-28 w-full rounded-md border border-input bg-background p-3 text-sm";

export function SiteContentEditor({ initialContent, hubs }: { initialContent: ManagedSiteContent; hubs: SiteHub[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>({ ...initialContent });
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const creating = draft.id === "new";
  const awaitingImplementation = draft.contentType === "tool" && draft.technicalStatus === "pending";
  const pathFor = (type: SiteContentType, slug: string) => type === "tool" ? `/ferramentas/${slug}` : type === "resource" ? `/recursos/${slug}` : `/paginas/${slug}`;
  const completeness = useMemo(() => [
    [Boolean(draft.title), "Título"], [Boolean(draft.shortDescription), "Resumo"], [draft.contentHtml.length > 300, "Conteúdo editorial"],
    [Boolean(draft.seoTitle), "Título SEO"], [Boolean(draft.seoDescription), "Descrição SEO"], [draft.contentType !== "tool" || Boolean(draft.hubId), "Hub"],
  ] as Array<[boolean, string]>, [draft]);

  async function save(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("Salvando...");
    const endpoint = creating ? "/api/admin/site-content" : `/api/admin/site-content/${encodeURIComponent(draft.id)}`;
    const response = await fetch(endpoint, { method: creating ? "POST" : "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft) });
    const data = await response.json(); setBusy(false);
    if (!response.ok) return setMessage(data.error ?? "Não foi possível salvar.");
    setMessage(awaitingImplementation ? "Solicitação salva como rascunho. Termine a implementação técnica no Codex ou no ChatGPT antes de publicar." : "Conteúdo salvo. A página pública e o sitemap foram atualizados.");
    router.replace(`/admin/site/conteudos/${encodeURIComponent(data.id)}`); router.refresh();
  }

  async function copyImplementationRequest() {
    const hub = hubs.find((item) => item.id === draft.hubId)?.name ?? "Ainda não definido";
    const request = `Implemente e finalize esta nova ferramenta no projeto Kivai.\n\nFerramenta: ${draft.title || "Ainda sem título"}\nURL planejada: ${pathFor("tool", draft.slug || "slug")}\nHub: ${hub}\nResumo: ${draft.shortDescription || "Ainda não preenchido"}\n\nAnalise o funcionamento solicitado e escolha a arquitetura tecnicamente mais segura de acordo com o padrão real do projeto. Use o conteúdo editorial já salvo no CMS, implemente a função seguindo o padrão visual, de privacidade, responsividade e usabilidade das ferramentas atuais, faça os testes necessários e, somente depois de validar a operação, registre a arquitetura realmente utilizada e altere o status técnico desta ferramenta para ready no projeto/Supabase. Enquanto estiver pending, mantenha-a como rascunho, noindex e fora do sitemap.`;
    await navigator.clipboard.writeText(request);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function remove() {
    if (creating || draft.virtual) return;
    if (!window.confirm(`Excluir “${draft.title}”? Se for uma edição de ferramenta existente, o conteúdo original do código voltará a aparecer.`)) return;
    const response = await fetch(`/api/admin/site-content/${encodeURIComponent(draft.id)}`, { method: "DELETE" });
    if (!response.ok) return setMessage((await response.json()).error);
    router.push("/admin/site"); router.refresh();
  }

  return <form onSubmit={save} className="mx-auto max-w-6xl space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-4"><div><Button asChild type="button" variant="ghost" className="-ml-3 mb-2"><Link href="/admin/site"><ArrowLeft />Voltar para conteúdos</Link></Button><p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{creating ? "Novo conteúdo" : "Edição completa"}</p><h1 className="mt-1 text-2xl font-semibold sm:text-3xl">{draft.title || "Nova ferramenta, página ou recurso"}</h1><p className="mt-2 max-w-3xl text-sm text-muted-foreground">Todos os campos ficam nesta tela. Em ferramentas atuais, o editor já traz o conteúdo editorial que está no código.</p><p className="mt-2 text-xs text-muted-foreground"><strong>Última edição:</strong> {creating ? "Conteúdo ainda não salvo" : formatSiteEditDate(initialContent.updatedAt)}</p></div><div className="flex w-full flex-wrap gap-2 sm:w-auto">{draft.path ? <Button asChild type="button" variant="outline"><a href={draft.path} target="_blank" rel="noreferrer"><ExternalLink />Abrir página</a></Button> : null}<Button type="submit" disabled={busy}><Save />{busy ? "Salvando..." : "Salvar"}</Button></div></header>
    {message ? <p role="status" className="border border-white/10 bg-muted/10 p-3 text-sm">{message}</p> : null}

    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 space-y-6">
        <section className="grid gap-4 rounded-xl border border-white/10 bg-card p-4 sm:grid-cols-2 sm:p-6"><div className="sm:col-span-2"><h2 className="font-semibold">Identificação e endereço</h2><p className="mt-1 text-xs text-muted-foreground">Dados principais exibidos no painel e na página pública.</p></div>
          <label className={fieldClass}><span>Tipo *</span><select disabled={Boolean(draft.existingToolSlug)} value={draft.contentType} onChange={(e) => { const contentType = e.target.value as SiteContentType; setDraft({ ...draft, contentType, path: pathFor(contentType, draft.slug), hubId: contentType === "tool" ? draft.hubId : null, toolMode: contentType === "tool" ? "auto" : "informational", technicalStatus: contentType === "tool" ? draft.technicalStatus === "ready" ? "ready" : "pending" : "not_applicable", displayLocation: contentType === "resource" ? "resource_library" : "direct", showInMostUsed: contentType === "tool" ? draft.showInMostUsed : false }); }} className="h-10 w-full rounded-md border border-input bg-background px-3"><option value="tool">Ferramenta</option><option value="resource">Material ou guia</option><option value="page">Página</option></select></label>
          <label className={fieldClass}><span>Hub {draft.contentType === "tool" ? "*" : ""}</span><select disabled={draft.contentType !== "tool"} value={draft.hubId ?? ""} onChange={(e) => setDraft({ ...draft, hubId: e.target.value || null })} className="h-10 w-full rounded-md border border-input bg-background px-3"><option value="">Sem hub</option>{hubs.map((hub) => <option key={hub.id} value={hub.id}>{hub.name}</option>)}</select></label>
          <label className={fieldClass}><span>Título *</span><Input required value={draft.title} onChange={(e) => { const title = e.target.value; const slug = creating ? slugify(title) : draft.slug; setDraft({ ...draft, title, slug, path: pathFor(draft.contentType, slug) }); }} /></label>
          <label className={fieldClass}><span>Slug *</span><Input required disabled={Boolean(draft.existingToolSlug)} value={draft.slug} onChange={(e) => { const slug = slugify(e.target.value); setDraft({ ...draft, slug, path: pathFor(draft.contentType, slug) }); }} /><small className="break-all text-muted-foreground">URL: {pathFor(draft.contentType, draft.slug || "slug")}</small></label>
          <label className={`${fieldClass} sm:col-span-2`}><span>Resumo *</span><textarea required className={textareaClass} value={draft.shortDescription} onChange={(e) => setDraft({ ...draft, shortDescription: e.target.value })} /></label>
          {draft.contentType !== "tool" ? <label className={fieldClass}><span>Onde este conteúdo será exibido</span><select value={draft.displayLocation} onChange={(e) => setDraft({ ...draft, displayLocation: e.target.value as SiteDisplayLocation })} className="h-10 w-full rounded-md border border-input bg-background px-3"><option value="direct">Somente pela URL</option><option value="home">Página inicial</option><option value="help">Central de ajuda</option>{draft.contentType === "resource" ? <option value="resource_library">Biblioteca de materiais</option> : null}</select><small className="text-muted-foreground">Define exatamente onde o link será mostrado; a página continua acessível pela própria URL.</small></label> : null}
          {draft.contentType === "tool" ? <div className="space-y-3 rounded-lg border border-white/10 bg-muted/10 p-4 sm:col-span-2"><label className="flex items-start gap-3 text-sm"><input type="checkbox" className="mt-1 size-4" checked={draft.showInMostUsed} onChange={(e) => setDraft({ ...draft, showInMostUsed: e.target.checked })} /><span><strong>Exibir em “Mais Usadas”</strong><small className="block text-muted-foreground">A página inicial mostra até seis ferramentas, pela ordem abaixo. Ferramentas pendentes só aparecem depois de implementadas e publicadas.</small></span></label><label className={fieldClass}><span>Ordem de exibição</span><Input type="number" min="0" max="9999" value={draft.displayOrder} onChange={(e) => setDraft({ ...draft, displayOrder: Number(e.target.value) || 100 })} /></label></div> : null}
        </section>

        {awaitingImplementation ? <section className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 sm:p-6"><div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-300" /><div><h2 className="font-semibold text-amber-100">Próxima etapa: implementar a ferramenta</h2><p className="mt-1 text-xs leading-5 text-amber-100/80">O painel cria somente o caminho e o briefing. A arquitetura será escolhida e registrada conforme a implementação real no projeto; ela não pode ser alterada por esta tela.</p></div></div><Button type="button" variant="outline" size="sm" className="mt-4" onClick={copyImplementationRequest}>{copied ? <Check /> : <Copy />}{copied ? "Pedido copiado" : "Copiar pedido para Codex/ChatGPT"}</Button></section> : null}

        <section className="min-w-0 rounded-xl border border-white/10 bg-card p-3 sm:p-6"><h2 className="font-semibold">Conteúdo editorial completo</h2><p className="mb-4 mt-1 text-xs leading-5 text-muted-foreground">O modelo inclui sobre, como usar, casos de uso, formatos, privacidade, limitações, perguntas frequentes e ferramentas relacionadas. Revise todos os trechos antes de publicar.</p><RichTextEditor value={draft.contentHtml} onChange={(contentHtml) => setDraft((current) => ({ ...current, contentHtml }))} /></section>

        <section className="grid gap-4 rounded-xl border border-white/10 bg-card p-4 sm:grid-cols-2 sm:p-6"><div className="sm:col-span-2"><h2 className="font-semibold">SEO e compartilhamento</h2><p className="mt-1 text-xs text-muted-foreground">Campos usados pelo Google e por redes sociais.</p></div><label className={fieldClass}><span>Título SEO *</span><Input required value={draft.seoTitle} onChange={(e) => setDraft({ ...draft, seoTitle: e.target.value })} /></label><label className={fieldClass}><span>URL canônica personalizada</span><Input type="url" value={draft.canonicalUrl} onChange={(e) => setDraft({ ...draft, canonicalUrl: e.target.value })} placeholder="Deixe vazio para usar a URL do Kivai" /></label><label className={`${fieldClass} sm:col-span-2`}><span>Descrição SEO *</span><textarea required className={textareaClass} value={draft.seoDescription} onChange={(e) => setDraft({ ...draft, seoDescription: e.target.value })} /></label></section>
      </div>

      <aside className="space-y-5 lg:sticky lg:top-6 lg:h-fit"><fieldset className="space-y-4 rounded-xl border border-white/10 bg-card p-5"><legend className="px-1 font-semibold">Publicação e Google</legend>{awaitingImplementation ? <p className="rounded-md border border-amber-500/25 bg-amber-500/5 p-3 text-xs leading-5 text-amber-200">Publicação bloqueada até a implementação técnica ser concluída no projeto.</p> : null}<label className={fieldClass}><span>Status</span><select disabled={awaitingImplementation} value={awaitingImplementation ? "draft" : draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as SitePublicationStatus })} className="h-10 w-full rounded-md border border-input bg-background px-3"><option value="draft">Rascunho</option><option value="published">Publicado</option><option value="archived">Arquivado</option></select></label><label className="flex items-start gap-3 text-sm"><input type="checkbox" className="mt-1 size-4" disabled={awaitingImplementation || draft.status !== "published"} checked={!awaitingImplementation && draft.status === "published" && draft.indexable} onChange={(e) => setDraft({ ...draft, indexable: e.target.checked, ...(e.target.checked ? {} : { includeInSitemap: false }) })} /><span><strong>Permitir indexação</strong><small className="block text-muted-foreground">Desmarcado envia noindex.</small></span></label><label className="flex items-start gap-3 text-sm"><input type="checkbox" className="mt-1 size-4" disabled={awaitingImplementation || draft.status !== "published" || !draft.indexable} checked={!awaitingImplementation && draft.status === "published" && draft.indexable && draft.includeInSitemap} onChange={(e) => setDraft({ ...draft, includeInSitemap: e.target.checked })} /><span><strong>Incluir no sitemap</strong><small className="block text-muted-foreground">Disponível somente para publicação indexável.</small></span></label></fieldset>
        <section className="rounded-xl border border-white/10 bg-card p-5"><h2 className="font-semibold">Padrão do projeto</h2><ul className="mt-3 space-y-2 text-sm">{completeness.map(([ready, label]) => <li key={label} className={ready ? "text-emerald-300" : "text-amber-300"}>{ready ? "✓" : "○"} {label}</li>)}</ul><p className="mt-3 text-xs leading-5 text-muted-foreground">A publicação só deve ser indexada depois que todos os itens estiverem completos e a função técnica tiver sido testada.</p></section>
        <Button type="submit" className="w-full" disabled={busy}><Save />{busy ? "Salvando..." : "Salvar alterações"}</Button>{!creating && !draft.virtual ? <Button type="button" variant="destructive" className="w-full" onClick={remove}><Trash2 />Excluir conteúdo do CMS</Button> : null}
      </aside>
    </div>
  </form>;
}
