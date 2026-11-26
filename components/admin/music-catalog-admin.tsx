"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MusicAlbum, MusicArtist, MusicTrack } from "@/lib/music/types";

type MusicKind = "artist" | "album" | "track";
type MusicRow = MusicArtist | MusicAlbum | MusicTrack;
type Catalog = { artists: MusicArtist[]; albums: MusicAlbum[]; tracks: MusicTrack[]; genres: { id: string; name: string }[] };
type PendingDelete = { kind: MusicKind; id: string; label: string; impact: string };

function formatDuration(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
function readAudioDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = document.createElement("audio");
    const url = URL.createObjectURL(file);
    audio.preload = "metadata";
    audio.onloadedmetadata = () => {
      const duration = Number.isFinite(audio.duration) ? Math.round(audio.duration) : 0;
      URL.revokeObjectURL(url);
      audio.removeAttribute("src");
      duration > 0 ? resolve(duration) : reject(new Error("Não foi possível identificar a duração do MP3."));
    };
    audio.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Não foi possível ler os metadados do MP3.")); };
    audio.src = url;
  });
}
function readAudioDurationFromUrl(url: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = document.createElement("audio");
    audio.preload = "metadata";
    audio.onloadedmetadata = () => {
      const duration = Number.isFinite(audio.duration) ? Math.round(audio.duration) : 0;
      audio.removeAttribute("src");
      audio.load();
      duration > 0 ? resolve(duration) : reject(new Error("Duração indisponível."));
    };
    audio.onerror = () => reject(new Error("Não foi possível ler a duração do áudio."));
    audio.src = url;
  });
}
function putMusicFile(url: string, file: File, mime: string, progress?: (value: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", mime);
    xhr.upload.onprogress = event => { if (event.lengthComputable) progress?.(Math.round(event.loaded / event.total * 100)); };
    xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error("O armazenamento não aceitou o MP3."));
    xhr.onerror = () => reject(new Error("Falha de conexão durante o envio."));
    xhr.send(file);
  });
}


const blank: Catalog = { artists: [], albums: [], tracks: [], genres: [] };
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
  const [catalogSearch, setCatalogSearch] = useState("");
  const [batchAlbumId, setBatchAlbumId] = useState("");
  const [batchFiles, setBatchFiles] = useState<Array<{ file: File; title: string; duration: number }>>([]);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, percent: 0, label: "" });

  async function refresh() {
    const response = await fetch("/api/admin/music", { cache: "no-store" });
    if (!response.ok) {
      setMessage("Não foi possível carregar o catálogo. A migração precisa estar aplicada.");
      return;
    }
    const catalog = await response.json() as Catalog;
    setData(catalog);

    // Recupera automaticamente a duração de faixas antigas que foram cadastradas sem metadados.
    const missingDurations = catalog.tracks.filter(track => !track.durationSeconds && track.audioUrl);
    for (const track of missingDurations) {
      try {
        const durationSeconds = await readAudioDurationFromUrl(track.audioUrl);
        const saved = await fetch("/api/admin/music", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind: "track", id: track.id, albumId: track.albumId, title: track.title, trackNumber: track.trackNumber, durationSeconds, audioUrl: track.audioUrl, fullAudio: track.fullAudio, description: track.description, status: track.status }),
        });
        if (saved.ok) {
          setData(current => ({ ...current, tracks: current.tracks.map(item => item.id === track.id ? { ...item, durationSeconds } : item) }));
        }
      } catch {
        // Mantém a faixa intacta quando o arquivo não disponibiliza metadados.
      }
    }
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
      const durationSeconds = uploadKind === "audio" ? await readAudioDuration(file) : 0;
      const mime = uploadKind === "audio" ? (file.type === "audio/mp3" ? "audio/mp3" : "audio/mpeg") : file.type;
      const prepared = await fetch("/api/admin/music", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "upload", uploadKind, mime, size: file.size }) });
      const signed = await prepared.json();
      if (!prepared.ok) throw new Error(signed.error);
      await putMusicFile(signed.uploadUrl, file, mime);
      const key = uploadKind === "audio" ? "audioUrl" : uploadKind === "photo" ? "photoUrl" : uploadKind === "genre" ? "imageUrl" : "coverUrl";
      setFields(current => ({ ...current, [key]: signed.publicUrl, ...(uploadKind === "audio" ? { durationSeconds: String(durationSeconds), title: current.title?.trim() ? current.title : file.name.replace(/\.mp3$/i, "").replace(/[_-]+/g, " ") } : {}) }));
      setMessage(uploadKind === "audio" ? `Upload concluído. Duração identificada: ${formatDuration(durationSeconds)}.` : "Upload concluído. Salve o cadastro para aplicar.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Falha no upload."); }
    finally { setBusy(false); }
  }

  async function selectBatchFiles(files: FileList | null) {
    if (!files) return;
    const selected = Array.from(files).filter(file => file.name.toLowerCase().endsWith(".mp3"));
    const items = await Promise.all(selected.map(async file => {
      let duration = 0;
      try { duration = await readAudioDuration(file); } catch { /* exibimos a falha como duração indisponível */ }
      return { file, title: file.name.replace(/\.mp3$/i, "").replace(/[_-]+/g, " "), duration };
    }));
    setBatchFiles(items);
    if (items.length !== selected.length) setMessage("Alguns arquivos foram ignorados. Selecione somente MP3.");
  }

  async function uploadBatch() {
    if (!batchAlbumId || !batchFiles.length || busy) return;
    setBusy(true);
    let nextNumber = Math.max(0, ...data.tracks.filter(track => track.albumId === batchAlbumId).map(track => track.trackNumber)) + 1;
    const failed: typeof batchFiles = [];
    let completed = 0;
    for (const item of batchFiles) {
      setBatchProgress({ current: completed + failed.length + 1, total: batchFiles.length, percent: 0, label: item.file.name });
      try {
        const duration = item.duration || await readAudioDuration(item.file);
        const mime = item.file.type === "audio/mp3" ? "audio/mp3" : "audio/mpeg";
        const prepared = await fetch("/api/admin/music", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "upload", uploadKind: "audio", mime, size: item.file.size }) });
        const signed = await prepared.json();
        if (!prepared.ok) throw new Error(signed.error ?? "Falha ao preparar upload.");
        await putMusicFile(signed.uploadUrl, item.file, mime, percent => setBatchProgress(current => ({ ...current, percent })));
        const saved = await fetch("/api/admin/music", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "track", albumId: batchAlbumId, title: item.title.trim() || item.file.name.replace(/\.mp3$/i, ""), trackNumber: nextNumber, durationSeconds: duration, audioUrl: signed.publicUrl, status: fields.status ?? "draft" }) });
        const result = await saved.json();
        if (!saved.ok) throw new Error(result.error ?? "Falha ao salvar faixa.");
        nextNumber += 1;
        completed += 1;
      } catch { failed.push(item); }
    }
    await refresh();
    setBatchFiles(failed);
    setBatchProgress({ current: completed + failed.length, total: completed + failed.length, percent: 100, label: "" });
    setMessage(failed.length ? `${completed} música(s) adicionada(s). ${failed.length} falharam e ficaram disponíveis para nova tentativa.` : `${completed} música(s) adicionada(s) ao álbum com duração identificada automaticamente.`);
    setBusy(false);
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

  const uploadField = (key: string, title: string, accept: string, uploadKind: string, square = false, banner = false) => (
    <label className="block space-y-2 text-sm">
      <span className="block font-medium">{title}</span>
      {square || banner ? (
        <div className="flex flex-wrap items-start gap-4">
          <div className={`relative ${banner ? "aspect-[16/5] w-full max-w-md" : "aspect-square w-40 shrink-0"} overflow-hidden rounded-xl border border-dashed border-border bg-muted`}>
            {fields[key] ? <img src={fields[key]} alt={"Prévia: " + title} className="h-full w-full object-cover" /> : <div className="flex h-full flex-col items-center justify-center gap-2 p-3 text-center text-muted-foreground"><span className="text-3xl" aria-hidden="true">▧</span><span className="text-xs">{banner ? "Prévia horizontal 16:5" : "Prévia quadrada 1:1"}</span></div>}
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <Input type="file" accept={accept} disabled={busy} multiple={uploadKind === "audio"} onChange={event => { const selected = event.target.files; if (uploadKind === "audio" && selected && selected.length > 1) { setBatchAlbumId(fields.albumId ?? ""); void selectBatchFiles(selected); } else { setBatchFiles([]); void upload(selected?.[0], uploadKind); } }} />
            <p className="text-xs text-muted-foreground">{banner ? "Proporção recomendada: horizontal 16:5. JPG, PNG ou WebP · até 8 MB." : "Proporção recomendada: 1:1 (quadrada). JPG, PNG ou WebP · até 8 MB."}</p>
            <small className="block break-all text-muted-foreground">{fields[key]}</small>
          </div>
        </div>
      ) : (
        <>
          <span className="block text-xs text-muted-foreground">{fields[key] ? "Arquivo definido" : "Sem arquivo"}</span>
          <Input type="file" accept={accept} disabled={busy} onChange={event => void upload(event.target.files?.[0], uploadKind)} />
          <small className="block break-all text-muted-foreground">{fields[key]}</small>
        </>
      )}
    </label>
  );

  const filteredArtists = data.artists.filter(artist => {
    const term = catalogSearch.trim().toLocaleLowerCase("pt-BR");
    if (!term) return true;
    const albums = data.albums.filter(album => album.artistId === artist.id);
    return artist.name.toLocaleLowerCase("pt-BR").includes(term) || albums.some(album => album.title.toLocaleLowerCase("pt-BR").includes(term) || data.tracks.some(track => track.albumId === album.id && track.title.toLocaleLowerCase("pt-BR").includes(term)));
  });

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <section className="space-y-4" aria-label="Catálogo musical">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">Artistas e lançamentos</h2><p className="text-xs text-muted-foreground">Abra cada artista para visualizar os álbuns e suas músicas.</p></div><Button type="button" onClick={() => edit("artist")}>Novo artista</Button></div>
        <Input value={catalogSearch} onChange={event => setCatalogSearch(event.target.value)} placeholder="Buscar artista, álbum ou música..." />
        {message && <p role="status" className="rounded-lg border border-border p-3 text-sm">{message}</p>}
        <div className="space-y-3">{filteredArtists.map(artist => {
          const albums = data.albums.filter(album => album.artistId === artist.id);
          const tracksCount = data.tracks.filter(track => albums.some(album => album.id === track.albumId)).length;
          return <details key={artist.id} className="rounded-xl border border-border bg-card p-3">
            <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2"><span><strong>{artist.name}</strong><small className="ml-2 text-muted-foreground">{albums.length} álbuns · {tracksCount} músicas</small></span><span className="flex gap-2"><Button type="button" size="sm" variant="outline" onClick={event => {event.preventDefault();edit("artist",artist);}}>Editar</Button><Button type="button" size="sm" variant="outline" onClick={event => {event.preventDefault();setId("");setKind("album");setFields({status:"draft",artistId:artist.id});}}>Novo álbum</Button></span></summary>
            <div className="mt-3 space-y-2 border-l pl-3">{albums.map(album => {
              const tracks = data.tracks.filter(track => track.albumId === album.id).sort((a,b)=>a.trackNumber-b.trackNumber);
              return <details key={album.id} className="rounded-lg border border-border/70 p-3"><summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2"><span><strong className="text-sm">{album.title}</strong><small className="ml-2 text-muted-foreground">{tracks.length} músicas · {statusLabels[album.status]}</small></span><span className="flex gap-2"><Button type="button" size="sm" variant="outline" onClick={event=>{event.preventDefault();edit("album",album);}}>Editar álbum</Button><Button type="button" size="sm" variant="outline" onClick={event=>{event.preventDefault();setId("");setKind("track");setFields({status:"draft",albumId:album.id,trackNumber:String(Math.max(0,...tracks.map(track=>track.trackNumber))+1)});}}>Adicionar uma música</Button><Button type="button" size="sm" onClick={event=>{event.preventDefault();setBatchAlbumId(album.id);}}>Adicionar em lote</Button></span></summary>
                <div className="mt-2 space-y-1">{tracks.map(track=><div key={track.id} className="flex items-center justify-between gap-2 rounded bg-muted/40 px-2 py-1.5 text-sm"><span className="min-w-0 truncate">{String(track.trackNumber).padStart(2,"0")}. {track.title}</span><span className="flex shrink-0 items-center gap-1"><small className="text-muted-foreground">{(track.playCount ?? 0).toLocaleString("pt-BR")} reproduções · {track.durationSeconds?formatDuration(track.durationSeconds):"Duração indisponível"}</small><Button type="button" size="sm" variant="ghost" onClick={()=>edit("track",track)}>Editar</Button><Button type="button" size="sm" variant="destructive" onClick={()=>askDelete("track",track)}>Excluir</Button></span></div>)}</div>
              </details>;
            })}{!albums.length&&<p className="text-xs text-muted-foreground">Este artista ainda não possui álbuns.</p>}</div>
          </details>;
        })}{!filteredArtists.length&&<p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">Nenhum artista ou álbum encontrado.</p>}</div>
        {pendingDelete && <div className="space-y-3 rounded-lg border border-destructive/40 p-4"><p className="text-sm font-semibold">Excluir definitivamente “{pendingDelete.label}”?</p><p className="text-sm">{pendingDelete.impact}</p><p className="text-xs text-muted-foreground">O cadastro e seus registros dependentes serão removidos, incluindo mídias Kivai vinculadas.</p><label className="block text-sm">Digite EXCLUIR DEFINITIVAMENTE<input value={confirm} onChange={event=>setConfirm(event.target.value)} className="mt-1 w-full rounded border border-border bg-background p-2"/></label><div className="flex gap-2"><Button type="button" variant="destructive" disabled={busy||confirm!=="EXCLUIR DEFINITIVAMENTE"} onClick={()=>void remove()}>Excluir permanentemente</Button><Button type="button" variant="outline" onClick={()=>{setPendingDelete(null);setConfirm("");}}>Cancelar</Button></div></div>}
      </section>

      <div className="space-y-4">
      <form onSubmit={save} className="min-w-0 space-y-4 rounded-xl border border-border bg-card p-4 sm:p-5">
        <h2 className="font-semibold">{id ? "Editar" : "Novo"} {kindLabels[kind]}</h2>
        {kind === "artist" ? <>{label("name", "Nome")}{label("slug", "Slug")}<label className="block space-y-1 text-sm">Estilo musical<select className="h-10 w-full rounded-md border border-input bg-background px-3" value={fields.genreId ?? ""} onChange={event => setFields(current => ({ ...current, genreId: event.target.value }))}><option value="">Sem estilo definido</option>{data.genres.map(genre => <option key={genre.id} value={genre.id}>{genre.name}</option>)}</select></label>{label("bio", "Biografia")}{label("contactWhatsapp", "WhatsApp para contratação")}{label("contactMessage", "Mensagem inicial para WhatsApp")}{uploadField("photoUrl", "Foto principal do artista", "image/jpeg,image/png,image/webp", "photo", true)}</> : null}
        {kind === "album" ? <>
          <label className="block space-y-1 text-sm">Artista<select className="h-10 w-full rounded-md border border-input bg-background px-3" value={fields.artistId ?? ""} onChange={event => setFields(current => ({ ...current, artistId: event.target.value }))}><option value="">Selecione...</option>{data.artists.map(artist => <option key={artist.id} value={artist.id}>{artist.name}</option>)}</select></label>
          {label("title", "Título")}{label("slug", "Slug")}{label("description", "Descrição")}{label("releaseDate", "Data de lançamento", "date")}{uploadField("coverUrl", "Capa do álbum", "image/jpeg,image/png,image/webp", "cover", true)}
        </> : null}
        {kind === "track" ? <>
          <label className="block space-y-1 text-sm">Álbum<select className="h-10 w-full rounded-md border border-input bg-background px-3" value={fields.albumId ?? ""} onChange={event => setFields(current => ({ ...current, albumId: event.target.value }))}><option value="">Selecione...</option>{data.albums.map(album => <option key={album.id} value={album.id}>{data.artists.find(artist => artist.id === album.artistId)?.name ?? "Artista"} · {album.title}</option>)}</select></label>
          {label("title", "Título da faixa")}{label("slug", "URL personalizada (slug)")}<p className="text-xs text-muted-foreground">Gerado automaticamente pelo título. Pode ser personalizado; o sistema evita URLs duplicadas dentro do álbum.</p><p className="rounded-md bg-muted p-3 text-xs text-muted-foreground">Para manter as reproduções, edite esta faixa e substitua o MP3 no mesmo cadastro. Se excluir e recriar, o histórico será restaurado quando artista, álbum e título coincidirem. O histórico de uma faixa excluída antes desta proteção não pode ser recuperado.</p><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={fields.fullAudio === "true"} onChange={event => setFields(current => ({ ...current, fullAudio: String(event.target.checked) }))} />Este áudio contém um EP/LP completo</label>{fields.fullAudio === "true" && <label className="block space-y-1 text-sm"><span>Descrição do áudio completo</span><textarea rows={8} maxLength={8000} value={fields.description ?? ""} onChange={event => setFields(current => ({ ...current, description: event.target.value }))} placeholder={"EP/LP: nome do lançamento\nArtista: nome do artista\n\nFAIXAS:\n01. Nome da música\n02. Nome da música\n\nCréditos e outras informações..."} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></label>}<p className="text-xs text-muted-foreground">A duração é identificada automaticamente pelo MP3.</p>{uploadField("audioUrl", "Arquivo(s) MP3 · até 100 MB por arquivo", "audio/mpeg,.mp3", "audio")}{batchFiles.length > 0 && <div className="space-y-3 rounded-lg border border-border p-3"><p className="text-sm font-medium">{batchFiles.length} arquivo(s) selecionado(s) para este álbum</p><div className="max-h-48 space-y-2 overflow-auto">{batchFiles.map((item,index)=><div key={item.file.name+index} className="grid grid-cols-[1fr_auto] items-center gap-2"><Input aria-label={`Título da faixa ${index+1}`} value={item.title} onChange={event=>setBatchFiles(current=>current.map((entry,i)=>i===index?{...entry,title:event.target.value}:entry))}/><small className="text-muted-foreground">{item.duration?formatDuration(item.duration):"Duração não lida"}</small></div>)}</div>{batchProgress.total>0&&<div className="space-y-1"><div className="flex justify-between text-xs"><span>{batchProgress.label||"Processamento"}</span><span>{batchProgress.current}/{batchProgress.total} · {batchProgress.percent}%</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary transition-all" style={{width:`${batchProgress.percent}%`}}/></div></div>}<Button type="button" className="w-full" disabled={busy||!fields.albumId||!batchFiles.length} onClick={()=>void uploadBatch()}>{busy?"Enviando músicas...":`Enviar ${batchFiles.length} música(s)`}</Button></div>}
        </> : null}
        <label className="block space-y-1 text-sm">Publicação<select className="h-10 w-full rounded-md border border-input bg-background px-3" value={fields.status ?? "draft"} onChange={event => setFields(current => ({ ...current, status: event.target.value }))}><option value="draft">Rascunho</option><option value="published">Publicado</option><option value="archived">Arquivado</option></select></label>
        {kind !== "track" && <><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={fields.indexable === "true"} onChange={event => setFields(current => ({ ...current, indexable: String(event.target.checked) }))} />Indexável</label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={fields.includeInSitemap === "true"} onChange={event => setFields(current => ({ ...current, includeInSitemap: String(event.target.checked) }))} />Incluir no sitemap</label></>}
        <Button type="submit" className="w-full" disabled={busy}>{busy ? "Salvando..." : "Salvar"}</Button>
      </form>
      </div>
    </div>
  );
}

