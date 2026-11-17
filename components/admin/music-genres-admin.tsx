"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MusicGenre } from "@/lib/music/types";

type Fields = { id?: string; name: string; slug: string; description: string; imageUrl: string; status: string };
const empty: Fields = { name: "", slug: "", description: "", imageUrl: "", status: "published" };

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
    setFields(genre ? { id: genre.id, name: genre.name, slug: genre.slug, description: genre.description, imageUrl: genre.imageUrl, status: genre.status } : empty);
    setMessage("");
  }

  async function upload(file?: File) {
    if (!file) return;
    setBusy(true);
    try {
      const prepared = await fetch("/api/admin/music", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "upload", uploadKind: "genre", mime: file.type, size: file.size }) });
      const signed = await prepared.json();
      if (!prepared.ok) throw new Error(signed.error ?? "Falha ao preparar o upload.");
      const sent = await fetch(signed.uploadUrl, { method: "PUT", headers: { "Content-Type": file.type, "x-upsert": "false" }, body: file });
      if (!sent.ok) throw new Error("O Storage não aceitou a imagem.");
      setFields(current => ({ ...current, imageUrl: signed.publicUrl }));
      setMessage("Imagem enviada. Salve o estilo para publicar.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha no upload.");
    } finally { setBusy(false); }
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const response = await fetch("/api/admin/music", { method: fields.id ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...fields, kind: "genre" }) });
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
    <section className="mt-8 space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-6">
      <div><p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Organização do catálogo</p><h2 className="mt-1 text-xl font-semibold">Estilos musicais</h2><p className="mt-1 text-sm text-muted-foreground">Crie uma categoria única para cada estilo, envie sua imagem e associe artistas no cadastro de cada artista.</p></div>
      {message ? <p role="status" className="rounded-lg border border-border p-3 text-sm">{message}</p> : null}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-2">
          {genres.map(genre => (
            <article key={genre.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
              <div className="size-16 shrink-0 overflow-hidden rounded-lg bg-muted">{genre.imageUrl ? <img src={genre.imageUrl} alt="" className="h-full w-full object-cover" /> : null}</div>
              <div className="min-w-0 flex-1"><p className="truncate font-medium">{genre.name}</p><p className="truncate text-xs text-muted-foreground">/{genre.slug} · {genre.status === "published" ? "Publicado" : genre.status === "draft" ? "Rascunho" : "Arquivado"}</p></div>
              <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => edit(genre)}>Editar</Button>
              <Button type="button" size="sm" variant="destructive" disabled={busy} onClick={() => void remove(genre)}>Excluir</Button>
            </article>
          ))}
          {!genres.length ? <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">Nenhum estilo cadastrado.</p> : null}
        </div>
        <form onSubmit={save} className="space-y-3 rounded-xl border border-border p-4">
          <h3 className="font-semibold">{fields.id ? "Editar estilo" : "Novo estilo"}</h3>
          <label className="block space-y-1 text-sm">Nome do estilo<Input value={fields.name} onChange={event => setFields(current => ({ ...current, name: event.target.value }))} placeholder="Ex.: Samba" required maxLength={80} /></label>
          <label className="block space-y-1 text-sm">Slug da página<Input value={fields.slug} onChange={event => setFields(current => ({ ...current, slug: event.target.value }))} placeholder="samba" maxLength={80} /></label>
          <label className="block space-y-1 text-sm">Descrição<textarea value={fields.description} onChange={event => setFields(current => ({ ...current, description: event.target.value }))} className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" maxLength={1200} /></label>
          <div className="space-y-2 text-sm"><span className="block font-medium">Imagem do estilo · proporção 1:1</span><div className="flex items-start gap-3"><div className="size-24 shrink-0 overflow-hidden rounded-lg border border-dashed border-border bg-muted">{fields.imageUrl ? <img src={fields.imageUrl} alt="Prévia do estilo" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-xs text-muted-foreground">1:1</div>}</div><div className="min-w-0 flex-1 space-y-2"><Input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={event => void upload(event.target.files?.[0])} /><p className="text-xs text-muted-foreground">JPG, PNG ou WebP · até 8 MB.</p></div></div></div>
          <label className="block space-y-1 text-sm">Publicação<select value={fields.status} onChange={event => setFields(current => ({ ...current, status: event.target.value }))} className="h-10 w-full rounded-md border border-input bg-background px-3"><option value="published">Publicado</option><option value="draft">Rascunho</option><option value="archived">Arquivado</option></select></label>
          <div className="flex gap-2"><Button type="submit" className="flex-1" disabled={busy}>{busy ? "Salvando..." : fields.id ? "Salvar alterações" : "Criar estilo"}</Button>{fields.id ? <Button type="button" variant="outline" disabled={busy} onClick={() => edit()}>Cancelar</Button> : null}</div>
          <p className="text-xs text-muted-foreground">Nomes e slugs são únicos. Se o estilo já existir, o sistema impede duplicação.</p>
        </form>
      </div>
    </section>
  );
}
