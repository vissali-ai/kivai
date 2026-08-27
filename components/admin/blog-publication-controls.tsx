"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BlogPublicationControls } from "@/lib/blog/publication-controls";

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
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function save() {
    setSaving(true);
    setMessage("Salvando...");
    const response = await fetch(`/api/admin/posts/${encodeURIComponent(postId)}/publication`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ indexable, includeInSitemap }),
    });
    const data = await response.json();
    setSaving(false);
    if (!response.ok) {
      setMessage(data.error ?? "Não foi possível salvar.");
      return;
    }
    setIndexable(Boolean(data.indexable));
    setIncludeInSitemap(Boolean(data.includeInSitemap));
    setMessage("Preferências de indexação salvas.");
  }

  return (
    <section className="mb-5 border border-white/10 bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Google e sitemap</p>
          <h2 className="mt-1 font-semibold">Indexação desta publicação</h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">Estas opções controlam de verdade o robots da matéria e a presença dela no sitemap.xml.</p>
        </div>
        <Button type="button" size="sm" onClick={save} disabled={saving}><Save />{saving ? "Salvando..." : "Salvar indexação"}</Button>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="flex items-start gap-3 border border-white/10 p-4 text-sm">
          <input
            type="checkbox"
            className="mt-1 size-4"
            checked={indexable}
            onChange={(event) => {
              const checked = event.target.checked;
              setIndexable(checked);
              if (!checked) setIncludeInSitemap(false);
            }}
          />
          <span><strong>Permitir indexação</strong><small className="mt-1 block text-muted-foreground">Marcado: index, follow. Desmarcado: noindex, nofollow.</small></span>
        </label>
        <label className="flex items-start gap-3 border border-white/10 p-4 text-sm">
          <input
            type="checkbox"
            className="mt-1 size-4"
            disabled={!indexable}
            checked={indexable && includeInSitemap}
            onChange={(event) => setIncludeInSitemap(event.target.checked)}
          />
          <span><strong>Incluir no sitemap</strong><small className="mt-1 block text-muted-foreground">Só pode entrar no sitemap se a publicação estiver indexável.</small></span>
        </label>
      </div>
      {!published ? <p className="mt-3 text-xs text-amber-300">A matéria ainda não está publicada. As preferências ficam salvas e passam a valer quando ela for publicada.</p> : null}
      {message ? <p className="mt-3 text-xs text-muted-foreground" role="status">{message}</p> : null}
    </section>
  );
}
