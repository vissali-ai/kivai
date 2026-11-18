"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getMusicGenreIcon } from "@/lib/music/genre-icon";
import type { MusicGenre } from "@/lib/music/types";

type Fields = { id?: string; name: string; slug: string; description: string; status: string };
const empty: Fields = { name: "", slug: "", description: "", status: "published" };

export function MusicGenresAdmin() {
  const [genres, setGenres] = useState<MusicGenre[]>([]);
  const [fields, setFields] = useState<Fields>(empty);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function refresh() {
    const response = await fetch("/api/admin/music", { cache: "no-store" });
    if (!response.ok) throw new Error("Não foi possível carregar os estilos.");
    const data = await response.json();
    setGenres(data.genres ?? []);
  }
  useEffect(() => { void refresh().catch(error => setMessage(error.message)); }, []);

  function edit(genre?: MusicGenre) {
    setFields(genre ? { id: genre.id, name: genre.name, slug: genre.slug, description: genre.description, status: genre.status } : empty);
    setMessage("");
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const response = await fetch("/api/admin/music", {
        method: fields.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...fields, imageUrl: "", kind: "genre" }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Não foi possível salvar. Verifique se já existe um estilo com esse nome.");
      setFields(empty);
      await refresh();
      setMessage("Estilo salvo. Ele já está disponível no catálogo público.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao salvar.");
    } finally { setBusy(false); }
  }

  async function remove(genre: MusicGenre) {
    if (!window.confirm("Excluir o estilo " + genre.name + "? Os artistas permanecerão cadastrados, mas ficarão sem estilo associado.")) return;
    setBusy(true);
    try {
      const response = await fetch("/api/admin/music", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "genre", id: genre.id, confirm: "EXCLUIR DEFINITIVAMENTE" }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Falha ao excluir.");
      if (fields.id === genre.id) setFields(empty);
      await refresh();
      setMessage("Estilo excluído. Os artistas foram preservados.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao excluir.");
    } finally { setBusy(false); }
  }

  return (
    <section className="mt-8 space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div><p className="text-[11px] font-medium uppercase tracking-[.16em] text-muted-foreground">Catálogo musical</p><h2 className="mt-1 text-lg font-semibold">Estilos musicais</h2><p className="mt-1 text-xs text-muted-foreground">Cada estilo recebe um ícone discreto automaticamente.</p></div>
        <span className="rounded-lg border border-border bg-muted/40 p-2 text-muted-foreground"><Plus className="size-4" /></span>
      </div>
      {message ? <p role="status" className="rounded-lg border border-border bg-muted/30 p-3 text-sm">{message}</p> : null}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="grid content-start gap-2 sm:grid-cols-2">
          {genres.map(genre => {
            const GenreIcon = getMusicGenreIcon(genre.name);
            return <article key={genre.id} className="flex min-w-0 items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2.5">
              <span className="grid size-9 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground"><GenreIcon className="size-[18px]" strokeWidth={1.7} /></span>
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{genre.name}</p><p className="truncate text-[11px] text-muted-foreground">{genre.status === "published" ? "Publicado" : genre.status === "draft" ? "Rascunho" : "Arquivado"}</p></div>
              <Button type="button" size="icon" variant="ghost" className="size-8" aria-label={"Editar " + genre.name} disabled={busy} onClick={() => edit(genre)}><Pencil className="size-3.5" /></Button>
              <Button type="button" size="icon" variant="ghost" className="size-8 text-muted-foreground hover:text-destructive" aria-label={"Excluir " + genre.name} disabled={busy} onClick={() => void remove(genre)}><Trash2 className="size-3.5" /></Button>
            </article>;
          })}
          {!genres.length ? <p className="rounded-lg border border-dashed p-5 text-center text-sm text-muted-foreground sm:col-span-2">Nenhum estilo cadastrado.</p> : null}
        </div>
        <form onSubmit={save} className="space-y-3 rounded-lg border border-border bg-background p-3.5">
          <h3 className="text-sm font-semibold">{fields.id ? "Editar estilo" : "Novo estilo"}</h3>
          <label className="block space-y-1 text-xs font-medium">Nome do estilo<Input value={fields.name} onChange={event => setFields(current => ({ ...current, name: event.target.value, ...(!current.id && !current.slug ? { slug: event.target.value.normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") } : {}) }))} placeholder="Ex.: Samba" required maxLength={80} /></label>
          <label className="block space-y-1 text-xs font-medium">Slug da página<Input value={fields.slug} onChange={event => setFields(current => ({ ...current, slug: event.target.value }))} placeholder="samba" maxLength={80} /></label>
          <label className="block space-y-1 text-xs font-medium">Descrição <span className="font-normal text-muted-foreground">(opcional)</span><textarea value={fields.description} onChange={event => setFields(current => ({ ...current, description: event.target.value }))} className="min-h-16 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-normal" maxLength={1200} /></label>
          <div className="flex items-center gap-2 rounded-md bg-muted/40 px-3 py-2"><span className="grid size-8 place-items-center rounded-md border border-border bg-background text-muted-foreground">{(() => { const PreviewIcon = getMusicGenreIcon(fields.name || "Música"); return <PreviewIcon className="size-4" strokeWidth={1.7} />; })()}</span><p className="text-[11px] text-muted-foreground">Prévia do ícone aplicado automaticamente</p></div>
          <label className="block space-y-1 text-xs font-medium">Publicação<select value={fields.status} onChange={event => setFields(current => ({ ...current, status: event.target.value }))} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm font-normal"><option value="published">Publicado</option><option value="draft">Rascunho</option><option value="archived">Arquivado</option></select></label>
          <div className="flex gap-2"><Button type="submit" size="sm" className="flex-1" disabled={busy}>{busy ? "Salvando..." : fields.id ? "Salvar alterações" : "Criar estilo"}</Button>{fields.id ? <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => edit()}>Cancelar</Button> : null}</div>
          <p className="text-[11px] text-muted-foreground">Nomes e slugs são únicos. Não é necessário enviar imagens.</p>
        </form>
      </div>
    </section>
  );
}
