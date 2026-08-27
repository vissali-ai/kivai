"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BlogPublicationControls } from "@/lib/blog/publication-controls";

const blocks = [
  ["header", "Cabeçalho, categoria, autor, data e título"],
  ["subtitle", "Subtítulo"],
  ["cover", "Imagem de capa e créditos"],
  ["content", "Conteúdo principal"],
  ["source", "Bloco de fonte"],
  ["tags", "Tags"],
  ["relatedTools", "Ferramentas relacionadas"],
  ["share", "Compartilhamento"],
] as const;

export function BlogPublicationControls({
  postId,
  published,
  initialControls,
}: {
  postId: string;
  published: boolean;
  initialControls: BlogPublicationControls;
}) {
  const [indexable, setIndexable] = useState(initialControls.indexable);
  const [includeInSitemap, setIncludeInSitemap] = useState(initialControls.includeInSitemap);
  const [blockVisibility, setBlockVisibility] = useState(initialControls.blockVisibility ?? {});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function save() {
    setSaving(true);
    setMessage("Salvando...");
    const response = await fetch(`/api/admin/posts/${encodeURIComponent(postId)}/publication`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ indexable, includeInSitemap, blockVisibility }),
    });
    const data = await response.json();
    setSaving(false);
    if (!response.ok) {
      setMessage(data.error ?? "Não foi possível salvar.");
      return;
    }
    setIndexable(Boolean(data.indexable));
    setIncludeInSitemap(Boolean(data.includeInSitemap));
    setBlockVisibility(data.blockVisibility ?? {});
    setMessage("Preferências da publicação salvas.");
  }

  return (
    <section className="mb-5 space-y-5 border border-white/10 bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Publicação pública</p>
          <h2 className="mt-1 font-semibold">Visibilidade, Google e sitemap</h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">Controle quais blocos aparecem na matéria e como esta URL é tratada pelo Google.</p>
        </div>
        <Button type="button" size="sm" onClick={save} disabled={saving}><Save />{saving ? "Salvando..." : "Salvar preferências"}</Button>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold">Blocos disponíveis no site público</legend>
        <p className="text-xs text-muted-foreground">Desmarque para ocultar um bloco sem apagar o conteúdo da publicação.</p>
        <div className="grid gap-3 md:grid-cols-2">{blocks.map(([key, label]) => <label key={key} className="flex items-center justify-between gap-4 border border-white/10 p-4 text-sm"><span>{label}</span><input type="checkbox" className="size-4" checked={blockVisibility[key] !== false} onChange={(event) => setBlockVisibility((current) => ({ ...current, [key]: event.target.checked }))} /></label>)}</div>
      </fieldset>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="flex items-start gap-3 border border-white/10 p-4 text-sm">
          <input type="checkbox" className="mt-1 size-4" checked={indexable} onChange={(event) => { const checked = event.target.checked; setIndexable(checked); if (!checked) setIncludeInSitemap(false); }} />
          <span><strong>Permitir indexação</strong><small className="mt-1 block text-muted-foreground">Marcado: index, follow. Desmarcado: noindex, nofollow.</small></span>
        </label>
        <label className="flex items-start gap-3 border border-white/10 p-4 text-sm">
          <input type="checkbox" className="mt-1 size-4" disabled={!indexable} checked={indexable && includeInSitemap} onChange={(event) => setIncludeInSitemap(event.target.checked)} />
          <span><strong>Incluir no sitemap</strong><small className="mt-1 block text-muted-foreground">Só pode entrar no sitemap se a publicação estiver indexável.</small></span>
        </label>
      </div>
      {!published ? <p className="text-xs text-amber-300">A matéria ainda não está publicada. As preferências ficam salvas e passam a valer quando ela for publicada.</p> : null}
      {message ? <p className="text-xs text-muted-foreground" role="status">{message}</p> : null}
    </section>
  );
}
