"use client";

import { useState } from "react";
import { Save, Trash2 } from "lucide-react";
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
  const [deletedBlocks, setDeletedBlocks] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const isDeleted = (key: string) => blockVisibility[`__deleted_${key}`] === true || deletedBlocks.includes(key);

  function deleteBlock(key: string, label: string) {
    if (!window.confirm(`Excluir definitivamente o bloco “${label}”? Os dados exclusivos deste bloco serão apagados da matéria.`)) return;
    setDeletedBlocks((current) => [...new Set([...current, key])]);
    setBlockVisibility((current) => ({ ...current, [key]: false, [`__deleted_${key}`]: true }));
    setMessage(`Bloco “${label}” marcado para exclusão definitiva. Salve as preferências para concluir.`);
  }

  async function save() {
    setSaving(true);
    setMessage("Salvando...");
    const response = await fetch(`/api/admin/posts/${encodeURIComponent(postId)}/publication`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ indexable, includeInSitemap, blockVisibility, deletedBlocks }),
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
    setDeletedBlocks([]);
    setMessage("Preferências salvas. Blocos excluídos tiveram seus dados próprios removidos da matéria.");
  }

  return (
    <section className="mb-5 space-y-5 border border-white/10 bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Publicação pública</p>
          <h2 className="mt-1 font-semibold">Visibilidade, Google e sitemap</h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">Ocultar preserva o conteúdo. Excluir remove os dados próprios daquele bloco da matéria.</p>
        </div>
        <Button type="button" size="sm" onClick={save} disabled={saving}><Save />{saving ? "Salvando..." : "Salvar preferências"}</Button>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold">Blocos disponíveis no site público</legend>
        <p className="text-xs text-muted-foreground">Desmarque para ocultar sem apagar. Use Excluir para remover definitivamente.</p>
        <div className="grid gap-3 md:grid-cols-2">{blocks.filter(([key]) => !isDeleted(key)).map(([key, label]) => <div key={key} className="flex items-center justify-between gap-3 border border-white/10 p-4 text-sm"><label className="flex min-w-0 flex-1 items-center justify-between gap-3"><span>{label}</span><input type="checkbox" className="size-4" checked={blockVisibility[key] !== false} onChange={(event) => setBlockVisibility((current) => ({ ...current, [key]: event.target.checked }))} /></label><Button type="button" variant="ghost" size="sm" className="shrink-0 text-destructive hover:text-destructive" onClick={() => deleteBlock(key, label)}><Trash2 className="size-4" />Excluir</Button></div>)}</div>
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