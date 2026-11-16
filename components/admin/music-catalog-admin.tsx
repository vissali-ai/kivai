"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MusicAlbum, MusicArtist, MusicTrack } from "@/lib/music/types";

type MusicKind = "artist" | "album" | "track";
type MusicRow = MusicArtist | MusicAlbum | MusicTrack;
type Catalog = { artists: MusicArtist[]; albums: MusicAlbum[]; tracks: MusicTrack[] };
type PendingDelete = { kind: MusicKind; id: string; label: string; impact: string };

const blank: Catalog = { artists: [], albums: [], tracks: [] };
const statusLabels = { draft: "Rascunho", published: "Publicado", archived: "Arquivado" };
const kindLabels: Record<MusicKind, string> = { artist: "artista", album: "álbum", track: "faixa" };

export function MusicCatalogAdmin() {
  const [data, setData] = useState(blank);
  const [message, setMessage] = useState("");
  const [kind, setKind] = useState<MusicKind>("artist");
  const [id, setId] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({ status: "draft" });
  const [busy, setBusy] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [confirm, setConfirm] = useState("");

  async function refresh() {
    const response = await fetch("/api/admin/music", { cache: "no-store" });
    if (response.ok) setData(await response.json());
    else setMessage("Não foi possível carregar o catálogo. A migração precisa estar aplicada.");
  }

  useEffect(() => { void refresh(); }, []);

  function edit(type: MusicKind, row?: MusicRow) {
    setKind(type);
    setId(row?.id ?? "");
    setPendingDelete(null);
    setConfirm("");
    if (!row) {
      setFields({ status: "draft", ...(type === "track" ? { trackNumber: String(data.tracks.length + 1) } : {}) });
      return;
    }
    const values = row as unknown as Record<string, unknown>;
    setFields(Object.fromEntries(Object.entries(values).filter(([, value]) => value !== null && value !== undefined).map(([key, value]) => [key, String(value)])));
  }

  function askDelete(type: MusicKind, row: MusicRow) {
    let label: string;
    let impact: string;
    if (type === "artist") {
      const artist = row as MusicArtist;
      const albums = data.albums.filter(album => album.artistId === artist.id);
      const trackCount = data.tracks.filter(track => albums.some(album => album.id === track.albumId)).length;
      label = artist.name;
      impact = `Também excluirá ${albums.length} ${albums.length === 1 ? "álbum" : "álbuns"} e ${trackCount} ${trackCount === 1 ? "faixa" : "faixas"}.`;
    } else if (type === "album") {
      const album = row as MusicAlbum;
      const artist = data.artists.find(item => item.id === album.artistId);
      const trackCount = data.tracks.filter(track => track.albumId === album.id).length;
      label = album.title;
      impact = `Artista: ${artist?.name ?? "não identificado"}. Também excluirá ${trackCount} ${trackCount === 1 ? "faixa" : "faixas"}.`;
    } else {
      const track = row as MusicTrack;
      const album = data.albums.find(item => item.id === track.albumId);
      label = track.title;
      impact = `${album?.title ?? "Álbum não identificado"} · faixa ${track.trackNumber}.`;
    }
    setPendingDelete({ kind: type, id: row.id, label, impact });
    setConfirm("");
    setMessage("");
  }

  async function upload(file?: File, uploadKind = "image") {
    if (!file) return;
    setBusy(true);
    try {
      const prepared = await fetch("/api/admin/music", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "upload", uploadKind, mime: file.type, size: file.size }),
      });
      const signed = await prepared.json();
      if (!prepared.ok) throw new Error(signed.error);
      const sent = await fetch(signed.uploadUrl, { method: "PUT", headers: { "Content-Type": file.type, "x-upsert": "false" }, body: file });
      if (!sent.ok) throw new Error("O Storage não aceitou o arquivo. Tente novamente.");
      const key = uploadKind === "audio" ? "audioUrl" : uploadKind === "photo" ? "photoUrl" : "coverUrl";
      setFields(current => ({ ...current, [key]: signed.publicUrl }));
      setMessage("Upload concluído. Salve o cadastro para aplicar.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha no upload.");
    } finally {
      setBusy(false);
    }
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("Salvando...");
    try {
      const response = await fetch("/api/admin/music", {
        method: id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...fields, id, kind }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Falha ao salvar.");
      setId("");
      setFields({ status: "draft" });
      await refresh();
      setMessage("Cadastro salvo.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao salvar.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!pendingDelete || confirm !== "EXCLUIR DEFINITIVAMENTE") return;
    setBusy(true);
    setMessage("Excluindo cadastro e mídias...");
    try {
      const response = await fetch("/api/admin/music", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: pendingDelete.kind, id: pendingDelete.id, confirm }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Falha ao excluir.");
      if (id === pendingDelete.id) {
        setId("");
        setFields({ status: "draft" });
      }
      setPendingDelete(null);
      setConfirm("");
      await refresh();
      setMessage(result.failedFiles
        ? `Cadastro excluído. ${result.removedFiles} arquivo(s) removido(s); ${result.failedFiles} arquivo(s) não foi possível remover do Storage.`
        : `Cadastro excluído. ${result.removedFiles} arquivo(s) removido(s) do Storage.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao excluir.");
    } finally {
      setBusy(false);
    }
  }

  const label = (key: string, title: string, type = "text") => (
    <label className="block space-y-1 text-sm"><span>{title}</span><Input type={type} value={fields[key] ?? ""} onChange={event => setFields(current => ({ ...current, [key]: event.target.value }))} /></label>
  );

  const uploadField = (key: string, title: string, accept: string, uploadKind: string) => (
    <label className="block space-y-1 text-sm"><span>{title} · {fields[key] ? "arquivo definido" : "sem arquivo"}</span><Input type="file" accept={accept} disabled={busy} onChange={event => void upload(event.target.files?.[0], uploadKind)} /><small className="block break-all text-muted-foreground">{fields[key]}</small></label>
  );

  const rows: MusicRow[] = kind === "artist" ? data.artists : kind === "album" ? data.albums : data.tracks;

  function rowDetails(row: MusicRow) {
    if (kind === "artist") {
      const artist = row as MusicArtist;
      const count = data.albums.filter(album => album.artistId === artist.id).length;
      return `${statusLabels[artist.status]} · ${artist.slug} · ${count} ${count === 1 ? "álbum" : "álbuns"}`;
    }
    if (kind === "album") {
      const album = row as MusicAlbum;
      const artist = data.artists.find(item => item.id === album.artistId);
      const count = data.tracks.filter(track => track.albumId === album.id).length;
      return `${statusLabels[album.status]} · ${artist?.name ?? "Artista não identificado"} · ${count} ${count === 1 ? "faixa" : "faixas"}`;
    }
    const track = row as MusicTrack;
    const album = data.albums.find(item => item.id === track.albumId);
    return `${statusLabels[track.status]} · ${album?.title ?? "Álbum não identificado"} · faixa ${track.trackNumber}`;
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <section className="space-y-4" aria-label="Cadastros do catálogo de música">
        <div className="grid grid-cols-3 gap-2">
          {(["artist", "album", "track"] as const).map(type => (
            <Button key={type} type="button" variant={kind === type ? "default" : "outline"} onClick={() => edit(type)}>
              {type === "artist" ? `Artistas (${data.artists.length})` : type === "album" ? `Álbuns (${data.albums.length})` : `Faixas (${data.tracks.length})`}
            </Button>
          ))}
        </div>
        <div className="flex justify-end"><Button type="button" variant="outline" onClick={() => edit(kind)}>Novo cadastro</Button></div>
        {message && <p role="status" className="rounded-lg border border-border p-3 text-sm">{message}</p>}
        <div className="space-y-2">
          {rows.map(row => (
            <article key={row.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
              <div className="min-w-0 flex-1"><p className="font-medium">{"name" in row ? row.name : row.title}</p><p className="text-xs text-muted-foreground">{rowDetails(row)}</p></div>
              <div className="flex gap-2"><Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => edit(kind, row)}>Editar</Button><Button type="button" size="sm" variant="destructive" disabled={busy} onClick={() => askDelete(kind, row)}>Excluir</Button></div>
            </article>
          ))}
          {!rows.length && <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">Nenhum cadastro ainda.</p>}
        </div>
        {pendingDelete && (
          <div className="space-y-3 rounded-lg border border-destructive/40 p-4" role="group" aria-label="Confirmar exclusão definitiva">
            <p className="text-sm font-semibold">Excluir definitivamente “{pendingDelete.label}”?</p>
            <p className="text-sm">{pendingDelete.impact}</p>
            <p className="text-xs text-muted-foreground">O cadastro e os registros dependentes serão removidos. Os arquivos Kivai vinculados também serão apagados; links externos não são removidos.</p>
            <label className="block text-sm">Digite EXCLUIR DEFINITIVAMENTE<input value={confirm} onChange={event => setConfirm(event.target.value)} className="mt-1 w-full rounded border border-border bg-background p-2" /></label>
            <div className="flex flex-wrap gap-2"><Button type="button" variant="destructive" disabled={busy || confirm !== "EXCLUIR DEFINITIVAMENTE"} onClick={() => void remove()}>Excluir permanentemente</Button><Button type="button" variant="outline" disabled={busy} onClick={() => { setPendingDelete(null); setConfirm(""); }}>Cancelar</Button></div>
          </div>
        )}
      </section>

      <form onSubmit={save} className="h-fit space-y-4 rounded-xl border border-border bg-card p-4 sm:p-5 xl:sticky xl:top-6">
        <h2 className="font-semibold">{id ? "Editar" : "Novo"} {kindLabels[kind]}</h2>
        {kind === "artist" ? <>{label("name", "Nome")}{label("slug", "Slug")}{label("bio", "Biografia")}{label("contactWhatsapp", "WhatsApp para contratação")}{label("contactEmail", "E-mail comercial", "email")}{label("contactMessage", "Mensagem inicial para WhatsApp")}{uploadField("photoUrl", "Foto do artista", "image/jpeg,image/png,image/webp", "photo")}{uploadField("coverUrl", "Capa do artista", "image/jpeg,image/png,image/webp", "cover")}</> : null}
        {kind === "album" ? <>
          <label className="block space-y-1 text-sm">Artista<select className="h-10 w-full rounded-md border border-input bg-background px-3" value={fields.artistId ?? ""} onChange={event => setFields(current => ({ ...current, artistId: event.target.value }))}><option value="">Selecione...</option>{data.artists.map(artist => <option key={artist.id} value={artist.id}>{artist.name}</option>)}</select></label>
          {label("title", "Título")}{label("slug", "Slug")}{label("description", "Descrição")}{label("releaseDate", "Data de lançamento", "date")}{uploadField("coverUrl", "Capa do álbum", "image/jpeg,image/png,image/webp", "cover")}
        </> : null}
        {kind === "track" ? <>
          <label className="block space-y-1 text-sm">Álbum<select className="h-10 w-full rounded-md border border-input bg-background px-3" value={fields.albumId ?? ""} onChange={event => setFields(current => ({ ...current, albumId: event.target.value }))}><option value="">Selecione...</option>{data.albums.map(album => <option key={album.id} value={album.id}>{data.artists.find(artist => artist.id === album.artistId)?.name ?? "Artista"} · {album.title}</option>)}</select></label>
          {label("title", "Título da faixa")}{label("trackNumber", "Ordem da faixa", "number")}{label("durationSeconds", "Duração (segundos)", "number")}{uploadField("audioUrl", "Arquivo MP3 · até 100 MB", "audio/mpeg,.mp3", "audio")}
        </> : null}
        <label className="block space-y-1 text-sm">Publicação<select className="h-10 w-full rounded-md border border-input bg-background px-3" value={fields.status ?? "draft"} onChange={event => setFields(current => ({ ...current, status: event.target.value }))}><option value="draft">Rascunho</option><option value="published">Publicado</option><option value="archived">Arquivado</option></select></label>
        {kind !== "track" && <><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={fields.indexable === "true"} onChange={event => setFields(current => ({ ...current, indexable: String(event.target.checked) }))} />Indexável</label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={fields.includeInSitemap === "true"} onChange={event => setFields(current => ({ ...current, includeInSitemap: String(event.target.checked) }))} />Incluir no sitemap</label></>}
        <Button type="submit" className="w-full" disabled={busy}>{busy ? "Salvando..." : "Salvar"}</Button>
      </form>
    </div>
  );
}

