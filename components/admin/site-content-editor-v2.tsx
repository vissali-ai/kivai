"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, ExternalLink, Plus, Save, Trash2, Upload, X } from "lucide-react";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { slugify } from "@/lib/blog/slug";
import type { ManagedSiteContent, SiteContentType, SiteDisplayLocation, SiteHub, SiteOriginalField, SiteOriginalFieldType, SitePublicationStatus } from "@/lib/site-cms/types";

const fieldClass = "block space-y-1.5 text-sm";
const textareaClass = "min-h-24 w-full rounded-md border border-input bg-background p-3 text-sm";
const originalFieldTypes: Array<{ value: SiteOriginalFieldType; label: string }> = [
  { value: "text", label: "Texto" },
  { value: "textarea", label: "Texto longo" },
  { value: "url", label: "URL" },
  { value: "image", label: "Imagem" },
  { value: "number", label: "Número" },
  { value: "boolean", label: "Sim/Não" },
];
const publicBlocks = [
  { key: "hero", label: "Topo / título da publicação" },
  { key: "summary", label: "Resumo / descrição curta" },
  { key: "originalFields", label: "Campos específicos da publicação" },
  { key: "content", label: "Conteúdo principal" },
] as const;

type Draft = Omit<ManagedSiteContent, "createdAt" | "updatedAt" | "publishedAt">;

async function imageDimensions(file: File) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => { URL.revokeObjectURL(objectUrl); resolve({ width: image.naturalWidth, height: image.naturalHeight }); };
    image.onerror = reject;
    image.src = objectUrl;
  });
}

export function SiteContentEditorV2({ initialContent, hubs }: { initialContent: ManagedSiteContent; hubs: SiteHub[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>({ ...initialContent, customData: initialContent.customData ?? {} });
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const creating = draft.id === "new";
  const awaitingImplementation = draft.contentType === "tool" && draft.technicalStatus === "pending";
  const originalFields = draft.customData.originalFields ?? [];
  const blockVisibility = draft.customData.blockVisibility ?? {};

  const pathFor = (type: SiteContentType, slug: string) => type === "tool" ? `/ferramentas/${slug}` : type === "resource" ? `/recursos/${slug}` : `/paginas/${slug}`;
  const isBlockVisible = (key: string) => blockVisibility[key] !== false;

  function setBlockVisible(key: string, visible: boolean) {
    setDraft((current) => ({ ...current, customData: { ...current.customData, blockVisibility: { ...(current.customData.blockVisibility ?? {}), [key]: visible } } }));
  }

  function setOriginalFields(fields: SiteOriginalField[]) {
    setDraft((current) => ({ ...current, customData: { ...current.customData, originalFields: fields } }));
  }

  function updateOriginalField(index: number, patch: Partial<SiteOriginalField>) {
    setOriginalFields(originalFields.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  }

  function addOriginalField() {
    const index = originalFields.length + 1;
    setOriginalFields([...originalFields, { key: `campo-${index}`, label: `Campo ${index}`, type: "text", value: "" }]);
  }

  async function uploadImage(index: number, file?: File) {
    if (!file) return;
    setUploadingIndex(index);
    setMessage("");
    try {
      const dimensions = await imageDimensions(file);
      const data = new FormData();
      data.set("file", file);
      data.set("width", String(dimensions.width));
      data.set("height", String(dimensions.height));
      data.set("alt", originalFields[index]?.label || draft.title);
      data.set("source", "own");
      const response = await fetch("/api/admin/media", { method: "POST", body: data });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Não foi possível enviar a imagem.");
      updateOriginalField(index, { value: result.url });
      setMessage("Imagem enviada. Salve as alterações para aplicar na publicação.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível enviar a imagem.");
    } finally {
      setUploadingIndex(null);
    }
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("Salvando...");
    const endpoint = creating ? "/api/admin/site-content" : `/api/admin/site-content/${encodeURIComponent(draft.id)}`;
    const response = await fetch(endpoint, { method: creating ? "POST" : "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft) });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) return setMessage(data.error ?? "Não foi possível salvar.");
    setMessage("Conteúdo salvo.");
    router.replace(`/admin/site/conteudos/${encodeURIComponent(data.id)}`);
    router.refresh();
  }

  async function remove() {
    if (creating || draft.virtual) return;
    if (!window.confirm(`Excluir “${draft.title}”?`)) return;
    const response = await fetch(`/api/admin/site-content/${encodeURIComponent(draft.id)}`, { method: "DELETE" });
    if (!response.ok) return setMessage((await response.json()).error);
    router.push("/admin/site");
    router.refresh();
  }

  return (
    <form onSubmit={save} className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Button asChild type="button" variant="ghost" className="-ml-3 mb-2"><Link href="/admin/site"><ArrowLeft />Voltar para conteúdos</Link></Button>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Edição completa</p>
          <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">{draft.title || "Novo conteúdo"}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Edite os campos que pertencem à publicação e escolha quais blocos ficam visíveis no site público.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {draft.path ? <Button asChild type="button" variant="outline"><a href={draft.path} target="_blank" rel="noreferrer"><ExternalLink />Abrir página</a></Button> : null}
          <Button type="submit" disabled={busy}><Save />{busy ? "Salvando..." : "Salvar"}</Button>
        </div>
      </header>

      {message ? <p role="status" className="border border-white/10 bg-muted/10 p-3 text-sm">{message}</p> : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
          <section className="grid gap-4 rounded-xl border border-white/10 bg-card p-4 sm:grid-cols-2 sm:p-6">
            <div className="sm:col-span-2"><h2 className="font-semibold">Identificação e endereço</h2></div>
            <label className={fieldClass}><span>Tipo</span><select disabled={Boolean(draft.existingToolSlug)} value={draft.contentType} onChange={(e) => { const contentType = e.target.value as SiteContentType; setDraft({ ...draft, contentType, path: pathFor(contentType, draft.slug), hubId: contentType === "tool" ? draft.hubId : null }); }} className="h-10 w-full rounded-md border border-input bg-background px-3"><option value="tool">Ferramenta</option><option value="resource">Material ou guia</option><option value="page">Página</option></select></label>
            <label className={fieldClass}><span>Hub</span><select disabled={draft.contentType !== "tool"} value={draft.hubId ?? ""} onChange={(e) => setDraft({ ...draft, hubId: e.target.value || null })} className="h-10 w-full rounded-md border border-input bg-background px-3"><option value="">Sem hub</option>{hubs.map((hub) => <option key={hub.id} value={hub.id}>{hub.name}</option>)}</select></label>
            <label className={fieldClass}><span>Título</span><Input required value={draft.title} onChange={(e) => { const title = e.target.value; const slug = creating ? slugify(title) : draft.slug; setDraft({ ...draft, title, slug, path: pathFor(draft.contentType, slug) }); }} /></label>
            <label className={fieldClass}><span>Slug</span><Input required disabled={Boolean(draft.existingToolSlug)} value={draft.slug} onChange={(e) => { const slug = slugify(e.target.value); setDraft({ ...draft, slug, path: pathFor(draft.contentType, slug) }); }} /></label>
            <label className={`${fieldClass} sm:col-span-2`}><span>Resumo / descrição curta</span><textarea className={textareaClass} value={draft.shortDescription} onChange={(e) => setDraft({ ...draft, shortDescription: e.target.value })} /></label>
          </section>

          <fieldset className="space-y-3 rounded-xl border border-primary/20 bg-card p-4 sm:p-6">
            <legend className="px-1 font-semibold">Visibilidade dos blocos no site público</legend>
            <p className="text-xs leading-5 text-muted-foreground">Desative um bloco para mantê-lo salvo no Admin sem exibi-lo na página pública.</p>
            <div className="grid gap-3 sm:grid-cols-2">{publicBlocks.map((block) => <label key={block.key} className="flex items-center justify-between gap-4 border border-white/10 p-3 text-sm"><span>{block.label}</span><input type="checkbox" className="size-4" checked={isBlockVisible(block.key)} onChange={(e) => setBlockVisible(block.key, e.target.checked)} /></label>)}</div>
          </fieldset>

          <section className="space-y-5 rounded-xl border border-primary/20 bg-card p-4 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><h2 className="font-semibold">Campos originais da publicação</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">Use esta área para os campos específicos que realmente existem nesta publicação.</p></div>
              <Button type="button" size="sm" variant="outline" onClick={addOriginalField}><Plus />Adicionar campo</Button>
            </div>

            {originalFields.length ? <div className="space-y-4">{originalFields.map((item, index) => (
              <article key={`${item.key}-${index}`} className="grid gap-3 rounded-lg border border-white/10 bg-muted/5 p-4 sm:grid-cols-2">
                <div className="sm:col-span-2 flex items-center justify-between gap-4 border-b border-white/10 pb-3"><span className="text-sm font-medium">Exibir este campo no site público</span><input type="checkbox" className="size-4" checked={isBlockVisible(`field:${item.key}`)} onChange={(e) => setBlockVisible(`field:${item.key}`, e.target.checked)} /></div>
                <label className={fieldClass}><span>Nome do campo</span><Input value={item.label} onChange={(e) => updateOriginalField(index, { label: e.target.value })} /></label>
                <label className={fieldClass}><span>Identificador</span><Input value={item.key} onChange={(e) => updateOriginalField(index, { key: slugify(e.target.value) })} /></label>
                <label className={fieldClass}><span>Tipo</span><select value={item.type} onChange={(e) => updateOriginalField(index, { type: e.target.value as SiteOriginalFieldType })} className="h-10 w-full rounded-md border border-input bg-background px-3">{originalFieldTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}</select></label>
                <label className={fieldClass}><span>Ajuda no Admin</span><Input value={item.helpText ?? ""} onChange={(e) => updateOriginalField(index, { helpText: e.target.value })} /></label>
                <div className="sm:col-span-2">
                  {item.type === "textarea" ? <label className={fieldClass}><span>Valor</span><textarea className={textareaClass} value={String(item.value ?? "")} onChange={(e) => updateOriginalField(index, { value: e.target.value })} /></label> : null}
                  {item.type === "boolean" ? <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={Boolean(item.value)} onChange={(e) => updateOriginalField(index, { value: e.target.checked })} /><span>{item.label}</span></label> : null}
                  {item.type === "number" ? <label className={fieldClass}><span>Valor</span><Input type="number" value={Number(item.value) || 0} onChange={(e) => updateOriginalField(index, { value: Number(e.target.value) })} /></label> : null}
                  {item.type === "text" || item.type === "url" ? <label className={fieldClass}><span>Valor</span><Input type={item.type === "url" ? "url" : "text"} value={String(item.value ?? "")} onChange={(e) => updateOriginalField(index, { value: e.target.value })} /></label> : null}
                  {item.type === "image" ? <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px]"><div className="space-y-3"><label className={fieldClass}><span>URL da imagem</span><Input value={String(item.value ?? "")} onChange={(e) => updateOriginalField(index, { value: e.target.value })} /></label><label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input px-3 py-2 text-sm hover:bg-muted/20"><Upload className="size-4" />{uploadingIndex === index ? "Enviando..." : "Enviar/substituir imagem"}<input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={uploadingIndex === index} onChange={(e) => uploadImage(index, e.target.files?.[0])} /></label></div><div className="flex min-h-32 items-center justify-center border border-white/10 bg-black/20 p-2">{String(item.value ?? "") ? <img src={String(item.value)} alt={item.label} className="max-h-48 max-w-full object-contain" /> : <span className="text-xs text-muted-foreground">Sem imagem</span>}</div></div> : null}
                </div>
                <div className="sm:col-span-2 flex justify-end"><Button type="button" size="sm" variant="ghost" onClick={() => setOriginalFields(originalFields.filter((_, itemIndex) => itemIndex !== index))}><X />Remover campo</Button></div>
              </article>
            ))}</div> : <p className="border border-dashed border-white/10 p-6 text-center text-sm text-muted-foreground">Esta publicação ainda não possui campos específicos cadastrados.</p>}
          </section>

          <section className="min-w-0 rounded-xl border border-white/10 bg-card p-3 sm:p-6"><h2 className="font-semibold">Conteúdo original da publicação</h2><p className="mb-4 mt-1 text-xs leading-5 text-muted-foreground">Edite somente o conteúdo que realmente pertence à página.</p><RichTextEditor value={draft.contentHtml} onChange={(contentHtml) => setDraft((current) => ({ ...current, contentHtml }))} /></section>

          <section className="grid gap-4 rounded-xl border border-white/10 bg-card p-4 sm:grid-cols-2 sm:p-6">
            <div className="sm:col-span-2"><h2 className="font-semibold">SEO</h2></div>
            <label className={fieldClass}><span>Título SEO</span><Input value={draft.seoTitle} onChange={(e) => setDraft({ ...draft, seoTitle: e.target.value })} /></label>
            <label className={fieldClass}><span>URL canônica</span><Input type="url" value={draft.canonicalUrl} onChange={(e) => setDraft({ ...draft, canonicalUrl: e.target.value })} /></label>
            <label className={`${fieldClass} sm:col-span-2`}><span>Descrição SEO</span><textarea className={textareaClass} value={draft.seoDescription} onChange={(e) => setDraft({ ...draft, seoDescription: e.target.value })} /></label>
          </section>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-6 lg:h-fit">
          <fieldset className="space-y-4 rounded-xl border border-white/10 bg-card p-5">
            <legend className="px-1 font-semibold">Publicação</legend>
            {awaitingImplementation ? <p className="text-xs text-amber-200">Publicação bloqueada enquanto a implementação técnica estiver pendente.</p> : null}
            <label className={fieldClass}><span>Status</span><select disabled={awaitingImplementation} value={awaitingImplementation ? "draft" : draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as SitePublicationStatus })} className="h-10 w-full rounded-md border border-input bg-background px-3"><option value="draft">Rascunho</option><option value="published">Publicado</option><option value="archived">Arquivado</option></select></label>
            <label className={fieldClass}><span>Onde exibir</span><select value={draft.displayLocation} onChange={(e) => setDraft({ ...draft, displayLocation: e.target.value as SiteDisplayLocation })} className="h-10 w-full rounded-md border border-input bg-background px-3"><option value="direct">Somente URL</option><option value="home">Página inicial</option><option value="help">Central de ajuda</option><option value="main_nav">Menu principal</option><option value="footer">Rodapé</option><option value="resource_library">Biblioteca de materiais</option></select></label>
            {draft.contentType === "tool" ? <><label className="flex items-start gap-3 text-sm"><input type="checkbox" className="mt-1 size-4" checked={draft.showInMostUsed} onChange={(e) => setDraft({ ...draft, showInMostUsed: e.target.checked })} /><span>Exibir em Mais Usadas</span></label><label className={fieldClass}><span>Ordem</span><Input type="number" value={draft.displayOrder} onChange={(e) => setDraft({ ...draft, displayOrder: Number(e.target.value) || 100 })} /></label></> : null}
            <label className="flex items-start gap-3 text-sm"><input type="checkbox" className="mt-1 size-4" disabled={draft.status !== "published"} checked={draft.status === "published" && draft.indexable} onChange={(e) => setDraft({ ...draft, indexable: e.target.checked, ...(e.target.checked ? {} : { includeInSitemap: false }) })} /><span>Permitir indexação</span></label>
            <label className="flex items-start gap-3 text-sm"><input type="checkbox" className="mt-1 size-4" disabled={draft.status !== "published" || !draft.indexable} checked={draft.status === "published" && draft.indexable && draft.includeInSitemap} onChange={(e) => setDraft({ ...draft, includeInSitemap: e.target.checked })} /><span>Incluir no sitemap</span></label>
          </fieldset>
          <Button type="submit" className="w-full" disabled={busy}><Save />Salvar alterações</Button>
          {!creating && !draft.virtual ? <Button type="button" variant="destructive" className="w-full" onClick={remove}><Trash2 />Excluir do CMS</Button> : null}
        </aside>
      </div>
    </form>
  );
}
