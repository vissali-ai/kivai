"use client";

import { useState } from "react";
import { ExternalLink, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ManagedSiteContent, SiteHub, SitePublicationStatus } from "@/lib/site-cms/types";

const fieldClass = "block space-y-1.5 text-sm";
const textareaClass = "min-h-24 w-full rounded-md border border-input bg-background p-3 text-sm";

export function InstagramAnalyzerPublicationSettings({
  initialContent,
  hubs,
}: {
  initialContent: ManagedSiteContent;
  hubs: SiteHub[];
}) {
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

  async function save() {
    setBusy(true);
    setMessage("Salvando configurações gerais...");
    try {
      const published = meta.status === "published";
      const payload = {
        ...initialContent,
        seoTitle: meta.seoTitle,
        seoDescription: meta.seoDescription,
        canonicalUrl: meta.canonicalUrl,
        hubId: meta.hubId,
        status: meta.status,
        indexable: published && meta.indexable,
        includeInSitemap: published && meta.indexable && meta.includeInSitemap,
      };
      const response = await fetch(`/api/admin/site-content/${encodeURIComponent(initialContent.id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Não foi possível salvar as configurações gerais.");
      setMessage("Configurações gerais salvas.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível salvar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Analisador de Seguidores do Instagram</p>
          <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">Configuração geral e conteúdo por plano</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            SEO, publicação e sitemap são únicos para a URL. Os textos, blocos e imagens são editados separadamente nas abas Grátis e Pro abaixo.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild type="button" variant="outline">
            <a href="/ferramentas/analisador-de-seguidores-instagram" target="_blank" rel="noreferrer"><ExternalLink />Abrir página</a>
          </Button>
          <Button type="button" onClick={save} disabled={busy}><Save />{busy ? "Salvando..." : "Salvar configuração geral"}</Button>
        </div>
      </header>

      {message ? <p role="status" className="border border-white/10 bg-muted/10 p-3 text-sm">{message}</p> : null}

      <section className="grid gap-4 rounded-xl border border-white/10 bg-card p-4 sm:grid-cols-2 sm:p-6">
        <div className="sm:col-span-2">
          <h2 className="font-semibold">Publicação e SEO da URL</h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">Estas configurações valem para a única URL pública e não mudam entre Grátis e Pro.</p>
        </div>
        <label className={fieldClass}>
          <span>Título SEO</span>
          <Input value={meta.seoTitle ?? ""} onChange={(e) => setMeta((current) => ({ ...current, seoTitle: e.target.value }))} />
        </label>
        <label className={fieldClass}>
          <span>URL canônica</span>
          <Input value={meta.canonicalUrl ?? ""} onChange={(e) => setMeta((current) => ({ ...current, canonicalUrl: e.target.value }))} />
        </label>
        <label className={`${fieldClass} sm:col-span-2`}>
          <span>Descrição SEO</span>
          <textarea className={textareaClass} value={meta.seoDescription ?? ""} onChange={(e) => setMeta((current) => ({ ...current, seoDescription: e.target.value }))} />
        </label>
        <label className={fieldClass}>
          <span>Hub</span>
          <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={meta.hubId ?? ""} onChange={(e) => setMeta((current) => ({ ...current, hubId: e.target.value || null }))}>
            <option value="">Sem hub</option>
            {hubs.map((hub) => <option key={hub.id} value={hub.id}>{hub.name}</option>)}
          </select>
        </label>
        <label className={fieldClass}>
          <span>Status</span>
          <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={meta.status} onChange={(e) => setMeta((current) => ({ ...current, status: e.target.value as SitePublicationStatus }))}>
            <option value="draft">Rascunho</option>
            <option value="published">Publicado</option>
            <option value="archived">Arquivado</option>
          </select>
        </label>
        <label className="flex items-center justify-between gap-3 border border-white/10 p-3 text-sm">
          <span>Permitir indexação no Google</span>
          <input type="checkbox" className="size-4" checked={meta.indexable} onChange={(e) => setMeta((current) => ({ ...current, indexable: e.target.checked }))} />
        </label>
        <label className="flex items-center justify-between gap-3 border border-white/10 p-3 text-sm">
          <span>Incluir no sitemap</span>
          <input type="checkbox" className="size-4" checked={meta.includeInSitemap} onChange={(e) => setMeta((current) => ({ ...current, includeInSitemap: e.target.checked }))} />
        </label>
      </section>
    </main>
  );
}
