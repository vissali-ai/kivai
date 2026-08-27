"use client";

import { useState } from "react";
import { ExternalLink, Save, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { InstagramAnalyzerConfig } from "@/lib/instagram-follow-analyzer-config";
import type { ManagedSiteContent, SiteHub, SitePublicationStatus } from "@/lib/site-cms/types";

const fieldClass = "block space-y-1.5 text-sm";
const textareaClass = "min-h-24 w-full rounded-md border border-input bg-background p-3 text-sm";

async function imageDimensions(file: File) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => { URL.revokeObjectURL(objectUrl); resolve({ width: image.naturalWidth, height: image.naturalHeight }); };
    image.onerror = reject;
    image.src = objectUrl;
  });
}

export function InstagramFollowAnalyzerEditor({ initialConfig, initialContent, hubs }: { initialConfig: InstagramAnalyzerConfig; initialContent: ManagedSiteContent; hubs: SiteHub[] }) {
  const [draft, setDraft] = useState(initialConfig);
  const [meta, setMeta] = useState({
    seoTitle: initialContent.seoTitle,
    seoDescription: initialContent.seoDescription,
    canonicalUrl: initialContent.canonicalUrl,
    hubId: initialContent.hubId,
    status: initialContent.status,
    indexable: initialContent.indexable,
    includeInSitemap: initialContent.includeInSitemap,
  });
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploadingStep, setUploadingStep] = useState<number | null>(null);

  function setField<K extends keyof InstagramAnalyzerConfig>(key: K, value: InstagramAnalyzerConfig[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function setStep(index: number, field: "title" | "description" | "imageUrl", value: string) {
    setDraft((current) => ({ ...current, tutorialSteps: current.tutorialSteps.map((step, i) => i === index ? { ...step, [field]: value } : step) }));
  }

  function setListItem(key: "freePlanDetail" | "proPlanDetail" | "agencyPlanDetail" | "privacyItems", index: number, value: string) {
    setDraft((current) => ({ ...current, [key]: current[key].map((item, i) => i === index ? value : item) }));
  }

  function setFaqItem(index: number, field: "question" | "answer", value: string) {
    setDraft((current) => ({ ...current, faqItems: current.faqItems.map((item, i) => i === index ? { ...item, [field]: value } : item) }));
  }

  async function uploadStepImage(index: number, file?: File) {
    if (!file) return;
    setUploadingStep(index); setMessage("");
    try {
      const dimensions = await imageDimensions(file);
      const data = new FormData();
      data.set("file", file); data.set("width", String(dimensions.width)); data.set("height", String(dimensions.height));
      data.set("alt", `Tutorial Instagram - passo ${index + 1}`); data.set("source", "own");
      const response = await fetch("/api/admin/media", { method: "POST", body: data });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Não foi possível enviar a imagem.");
      setStep(index, "imageUrl", result.url);
      setMessage(`Imagem do passo ${index + 1} enviada. Clique em Salvar alterações.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível enviar a imagem.");
    } finally { setUploadingStep(null); }
  }

  async function save() {
    setBusy(true); setMessage("Salvando...");
    try {
      const published = meta.status === "published";
      const contentPayload = {
        ...initialContent,
        title: draft.pageTitle,
        shortDescription: draft.heroDescription,
        contentHtml: "",
        seoTitle: meta.seoTitle,
        seoDescription: meta.seoDescription,
        canonicalUrl: meta.canonicalUrl,
        hubId: meta.hubId,
        status: meta.status,
        indexable: published && meta.indexable,
        includeInSitemap: published && meta.indexable && meta.includeInSitemap,
      };
      const contentResponse = await fetch(`/api/admin/site-content/${encodeURIComponent(initialContent.id)}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(contentPayload) });
      const contentResult = await contentResponse.json();
      if (!contentResponse.ok) throw new Error(contentResult.error || "Não foi possível salvar os dados da publicação.");

      const configResponse = await fetch("/api/admin/instagram-follow-analyzer-config", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft) });
      const configResult = await configResponse.json();
      if (!configResponse.ok) throw new Error(configResult.error || "Não foi possível salvar o conteúdo da ferramenta.");
      setDraft(configResult);
      setMessage("Alterações salvas. A página pública usa exatamente estes campos.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível salvar.");
    } finally { setBusy(false); }
  }

  return <main className="mx-auto max-w-6xl space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Edição completa da ferramenta</p><h1 className="mt-1 text-2xl font-semibold sm:text-3xl">{draft.pageTitle}</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Cada campo abaixo corresponde diretamente ao que aparece na publicação. Não existe texto automático de “Como usar” nesta edição.</p></div><div className="flex flex-wrap gap-2"><Button asChild type="button" variant="outline"><a href="/ferramentas/instagram-follow-analyzer" target="_blank" rel="noreferrer"><ExternalLink />Abrir página</a></Button><Button type="button" onClick={save} disabled={busy}><Save />{busy ? "Salvando..." : "Salvar alterações"}</Button></div></header>
    {message ? <p role="status" className="border border-white/10 bg-muted/10 p-3 text-sm">{message}</p> : null}

    <section className="grid gap-4 rounded-xl border border-white/10 bg-card p-4 sm:grid-cols-2 sm:p-6"><div className="sm:col-span-2"><h2 className="font-semibold">Topo da página</h2></div><label className={fieldClass}><span>Texto superior</span><Input value={draft.eyebrow} onChange={(e) => setField("eyebrow", e.target.value)} /></label><label className={fieldClass}><span>Título principal</span><Input value={draft.pageTitle} onChange={(e) => setField("pageTitle", e.target.value)} /></label><label className={`${fieldClass} sm:col-span-2`}><span>Descrição principal</span><textarea className={textareaClass} value={draft.heroDescription} onChange={(e) => setField("heroDescription", e.target.value)} /></label><label className={fieldClass}><span>Badge 1</span><Input value={draft.badgeOne} onChange={(e) => setField("badgeOne", e.target.value)} /></label><label className={fieldClass}><span>Badge 2</span><Input value={draft.badgeTwo} onChange={(e) => setField("badgeTwo", e.target.value)} /></label></section>

    <section className="space-y-5 rounded-xl border border-primary/20 bg-card p-4 sm:p-6"><div><h2 className="font-semibold">Bloco do passo a passo</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">Edite textos e imagens individualmente. O upload substitui a imagem daquele passo.</p></div><div className="grid gap-4 sm:grid-cols-2"><label className={fieldClass}><span>Chamada pequena</span><Input value={draft.tutorialKicker} onChange={(e) => setField("tutorialKicker", e.target.value)} /></label><label className={fieldClass}><span>Título do tutorial</span><Input value={draft.tutorialTitle} onChange={(e) => setField("tutorialTitle", e.target.value)} /></label><label className={`${fieldClass} sm:col-span-2`}><span>Descrição do tutorial</span><textarea className={textareaClass} value={draft.tutorialDescription} onChange={(e) => setField("tutorialDescription", e.target.value)} /></label><label className={fieldClass}><span>Texto do botão da Meta</span><Input value={draft.metaButtonLabel} onChange={(e) => setField("metaButtonLabel", e.target.value)} /></label><label className={fieldClass}><span>Link da Meta</span><Input type="url" value={draft.metaUrl} onChange={(e) => setField("metaUrl", e.target.value)} /></label></div>
      <div className="space-y-5">{draft.tutorialSteps.map((step, index) => <article key={index} className="grid gap-4 rounded-lg border border-white/10 bg-muted/5 p-4 lg:grid-cols-[minmax(0,1fr)_280px]"><div className="space-y-3"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Passo {index + 1}</p><label className={fieldClass}><span>Título</span><Input value={step.title} onChange={(e) => setStep(index, "title", e.target.value)} /></label><label className={fieldClass}><span>Descrição</span><textarea className={textareaClass} value={step.description} onChange={(e) => setStep(index, "description", e.target.value)} /></label><label className={fieldClass}><span>URL da imagem</span><Input value={step.imageUrl} onChange={(e) => setStep(index, "imageUrl", e.target.value)} placeholder="Envie uma imagem ou cole uma URL" /></label><label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input px-3 py-2 text-sm hover:bg-muted/20"><Upload className="size-4" />{uploadingStep === index ? "Enviando..." : "Enviar/substituir imagem"}<input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={uploadingStep === index} onChange={(e) => uploadStepImage(index, e.target.files?.[0])} /></label></div><div className="flex min-h-52 items-center justify-center border border-white/10 bg-black/20 p-3">{step.imageUrl ? <img src={step.imageUrl} alt={`Prévia passo ${index + 1}`} className="max-h-96 w-auto max-w-full object-contain" /> : <p className="text-center text-xs text-muted-foreground">Nenhuma imagem configurada.</p>}</div></article>)}</div>
      <label className={fieldClass}><span>Texto final abaixo do tutorial</span><Input value={draft.finalCta} onChange={(e) => setField("finalCta", e.target.value)} /></label>
    </section>

    <section className="grid gap-4 rounded-xl border border-white/10 bg-card p-4 sm:grid-cols-2 sm:p-6"><div className="sm:col-span-2"><h2 className="font-semibold">Área de upload</h2></div><label className={fieldClass}><span>Título</span><Input value={draft.uploadTitle} onChange={(e) => setField("uploadTitle", e.target.value)} /></label><label className={fieldClass}><span>Texto do seletor</span><Input value={draft.uploadLabel} onChange={(e) => setField("uploadLabel", e.target.value)} /></label><label className={`${fieldClass} sm:col-span-2`}><span>Descrição</span><textarea className={textareaClass} value={draft.uploadDescription} onChange={(e) => setField("uploadDescription", e.target.value)} /></label></section>

    <section className="grid gap-4 rounded-xl border border-white/10 bg-card p-4 sm:grid-cols-3 sm:p-6"><div className="sm:col-span-3"><h2 className="font-semibold">Cards resumidos de planos</h2></div>{(["free", "pro", "agency"] as const).map((plan) => { const titleKey = `${plan}Title` as "freeTitle" | "proTitle" | "agencyTitle"; const descriptionKey = `${plan}Description` as "freeDescription" | "proDescription" | "agencyDescription"; return <div key={plan} className="space-y-3 border border-white/10 p-4"><label className={fieldClass}><span>Título</span><Input value={draft[titleKey]} onChange={(e) => setField(titleKey, e.target.value)} /></label><label className={fieldClass}><span>Descrição</span><textarea className={textareaClass} value={draft[descriptionKey]} onChange={(e) => setField(descriptionKey, e.target.value)} /></label></div>; })}</section>

    <section className="space-y-5 rounded-xl border border-white/10 bg-card p-4 sm:p-6"><div><h2 className="font-semibold">Bloco final: para quem é</h2></div><label className={fieldClass}><span>Título</span><Input value={draft.audienceTitle} onChange={(e) => setField("audienceTitle", e.target.value)} /></label><label className={fieldClass}><span>Descrição</span><textarea className={textareaClass} value={draft.audienceDescription} onChange={(e) => setField("audienceDescription", e.target.value)} /></label></section>

    <section className="space-y-5 rounded-xl border border-white/10 bg-card p-4 sm:p-6"><label className={fieldClass}><span>Título da seção de planos</span><Input value={draft.plansTitle} onChange={(e) => setField("plansTitle", e.target.value)} /></label><div className="grid gap-5 lg:grid-cols-3">{(["freePlanDetail", "proPlanDetail", "agencyPlanDetail"] as const).map((key) => <div key={key} className="space-y-3 border border-white/10 p-4"><h3 className="font-semibold">{key === "freePlanDetail" ? draft.freeTitle : key === "proPlanDetail" ? draft.proTitle : draft.agencyTitle}</h3>{draft[key].map((item, index) => <label key={index} className={fieldClass}><span>Item {index + 1}</span><textarea className={textareaClass} value={item} onChange={(e) => setListItem(key, index, e.target.value)} /></label>)}</div>)}</div></section>

    <section className="space-y-5 rounded-xl border border-white/10 bg-card p-4 sm:p-6"><label className={fieldClass}><span>Título do FAQ</span><Input value={draft.faqTitle} onChange={(e) => setField("faqTitle", e.target.value)} /></label><div className="space-y-4">{draft.faqItems.map((item, index) => <div key={index} className="grid gap-3 border border-white/10 p-4 sm:grid-cols-2"><label className={fieldClass}><span>Pergunta {index + 1}</span><Input value={item.question} onChange={(e) => setFaqItem(index, "question", e.target.value)} /></label><label className={`${fieldClass} sm:col-span-2`}><span>Resposta</span><textarea className={textareaClass} value={item.answer} onChange={(e) => setFaqItem(index, "answer", e.target.value)} /></label></div>)}</div></section>

    <section className="space-y-5 rounded-xl border border-primary/20 bg-card p-4 sm:p-6"><label className={fieldClass}><span>Título de privacidade</span><Input value={draft.privacyTitle} onChange={(e) => setField("privacyTitle", e.target.value)} /></label><label className={fieldClass}><span>Descrição de privacidade</span><textarea className={textareaClass} value={draft.privacyDescription} onChange={(e) => setField("privacyDescription", e.target.value)} /></label><div className="grid gap-4 sm:grid-cols-2">{draft.privacyItems.map((item, index) => <label key={index} className={fieldClass}><span>Item {index + 1}</span><textarea className={textareaClass} value={item} onChange={(e) => setListItem("privacyItems", index, e.target.value)} /></label>)}</div><label className={fieldClass}><span>Texto do link para Política de Privacidade</span><Input value={draft.privacyLinkLabel} onChange={(e) => setField("privacyLinkLabel", e.target.value)} /></label></section>

    <section className="grid gap-4 rounded-xl border border-white/10 bg-card p-4 sm:grid-cols-2 sm:p-6"><div className="sm:col-span-2"><h2 className="font-semibold">SEO, Hub e publicação</h2></div><label className={fieldClass}><span>Hub</span><select value={meta.hubId ?? ""} onChange={(e) => setMeta({ ...meta, hubId: e.target.value || null })} className="h-10 w-full rounded-md border border-input bg-background px-3"><option value="">Sem hub</option>{hubs.map((hub) => <option key={hub.id} value={hub.id}>{hub.name}</option>)}</select></label><label className={fieldClass}><span>Status</span><select value={meta.status} onChange={(e) => setMeta({ ...meta, status: e.target.value as SitePublicationStatus })} className="h-10 w-full rounded-md border border-input bg-background px-3"><option value="draft">Rascunho</option><option value="published">Publicado</option><option value="archived">Arquivado</option></select></label><label className={fieldClass}><span>Título SEO</span><Input value={meta.seoTitle} onChange={(e) => setMeta({ ...meta, seoTitle: e.target.value })} /></label><label className={fieldClass}><span>URL canônica</span><Input value={meta.canonicalUrl} onChange={(e) => setMeta({ ...meta, canonicalUrl: e.target.value })} /></label><label className={`${fieldClass} sm:col-span-2`}><span>Descrição SEO</span><textarea className={textareaClass} value={meta.seoDescription} onChange={(e) => setMeta({ ...meta, seoDescription: e.target.value })} /></label><label className="flex items-start gap-3 text-sm"><input type="checkbox" className="mt-1 size-4" checked={meta.indexable} onChange={(e) => setMeta({ ...meta, indexable: e.target.checked, includeInSitemap: e.target.checked ? meta.includeInSitemap : false })} /><span><strong>Permitir indexação</strong></span></label><label className="flex items-start gap-3 text-sm"><input type="checkbox" className="mt-1 size-4" checked={meta.includeInSitemap} disabled={!meta.indexable} onChange={(e) => setMeta({ ...meta, includeInSitemap: e.target.checked })} /><span><strong>Incluir no sitemap</strong></span></label></section>

    <div className="flex justify-end"><Button type="button" onClick={save} disabled={busy}><Save />{busy ? "Salvando..." : "Salvar alterações"}</Button></div>
  </main>;
}
