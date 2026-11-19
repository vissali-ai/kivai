"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ListPlus, LogOut, Play, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCurrentUser, getStoredSession, signOut, supabaseUserFetch } from "@/lib/user-auth";
import { useMusicPlayer } from "@/components/music/music-player-provider";

type Playlist = { id: string; name: string; created_at?: string };
type Entry = { playlist_id: string; track_id: string; position: number };
type TrackRow = { id: string; slug: string; album_id: string; title: string; track_number: number; duration_seconds: number | null; audio_url: string; status: "draft" | "published" | "archived"; album: { title: string; cover_url: string | null; artist: { name: string; slug: string } | null } | null };

export function MusicPlaylistAdd({ trackId }: { trackId: string }) {
  const [items, setItems] = useState<Playlist[]>([]);
  const [selected, setSelected] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    let active = true;
    const session = getStoredSession();
    if (!session?.access_token) return;
    getCurrentUser(session).then(async (user) => {
      if (!active || !user?.id) return;
      setSignedIn(true);
      const response = await supabaseUserFetch("/rest/v1/music_user_playlists?select=id,name&order=created_at.desc");
      if (!response.ok) return;
      const rows = await response.json() as Playlist[];
      if (active) { setItems(rows); setSelected(rows[0]?.id ?? ""); }
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  async function add() {
    if (!selected) return;
    setBusy(true); setMessage("");
    try {
      const pos = await supabaseUserFetch(`/rest/v1/music_user_playlist_tracks?select=position&playlist_id=eq.${selected}&order=position.desc&limit=1`);
      if (!pos.ok) throw new Error("Não foi possível consultar a playlist.");
      const rows = await pos.json() as Array<{ position: number }>;
      const response = await supabaseUserFetch("/rest/v1/music_user_playlist_tracks", {
        method: "POST", headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ playlist_id: selected, track_id: trackId, position: (rows[0]?.position ?? -1) + 1 }),
      });
      if (response.status === 409) { setMessage("Essa faixa já está na playlist."); return; }
      if (!response.ok) throw new Error("Não foi possível adicionar a faixa.");
      setMessage("Adicionada à playlist.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Erro ao adicionar."); }
    finally { setBusy(false); }
  }

  if (!signedIn) return <Button asChild size="sm" variant="ghost"><Link href="/conta/login?next=%2Fminha-biblioteca">Salvar</Link></Button>;
  return <div className="flex flex-wrap items-center gap-1.5">
    {items.length ? <>
      <select aria-label="Playlist de destino" value={selected} onChange={(event) => setSelected(event.target.value)} className="h-8 max-w-32 rounded-full border border-border bg-background px-2 text-xs">
        {items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
      </select>
      <Button size="sm" variant="ghost" disabled={!selected || busy} onClick={add}><ListPlus className="size-4" />Salvar</Button>
    </> : <Button asChild size="sm" variant="ghost"><Link href="/minha-biblioteca"><Plus className="size-4" />Criar playlist</Link></Button>}
    {message ? <span role="status" className="w-full text-[11px] text-muted-foreground">{message}</span> : null}
  </div>;
}

export function MusicLibraryDashboard() {
  const player = useMusicPlayer();
  const [playlists, setPlaylists] = useState<Array<Playlist & { tracks: TrackRow[] }>>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true); setError("");
    if (!getStoredSession()?.access_token) { window.location.replace("/conta/login?next=%2Fminha-biblioteca"); return; }
    try {
      const response = await supabaseUserFetch("/rest/v1/music_user_playlists?select=id,name,created_at&order=created_at.desc");
      if (response.status === 401) { window.location.replace("/conta/login?next=%2Fminha-biblioteca"); return; }
      if (!response.ok) throw new Error("Não foi possível carregar suas playlists.");
      const lists = await response.json() as Playlist[];
      if (!lists.length) { setPlaylists([]); return; }
      const ids = lists.map((item) => item.id);
      const entryResponse = await supabaseUserFetch(`/rest/v1/music_user_playlist_tracks?select=playlist_id,track_id,position&playlist_id=in.(${ids.join(",")})&order=position.asc`);
      if (!entryResponse.ok) throw new Error("Não foi possível carregar as faixas salvas.");
      const entries = await entryResponse.json() as Entry[];
      const trackIds = [...new Set(entries.map((item) => item.track_id))];
      let tracks: TrackRow[] = [];
      if (trackIds.length) {
        const params = new URLSearchParams({
          select: "id,slug,album_id,title,track_number,duration_seconds,audio_url,status,album:music_albums(title,cover_url,artist:music_artists(name,slug))",
          id: `in.(${trackIds.join(",")})`, status: "eq.published",
        });
        const trackResponse = await supabaseUserFetch(`/rest/v1/music_tracks?${params.toString()}`);
        if (!trackResponse.ok) throw new Error("Não foi possível consultar as músicas.");
        tracks = await trackResponse.json() as TrackRow[];
      }
      const map = new Map(tracks.map((track) => [track.id, track]));
      setPlaylists(lists.map((list) => ({
        ...list,
        tracks: entries.filter((entry) => entry.playlist_id === list.id)
          .sort((a, b) => a.position - b.position)
          .map((entry) => map.get(entry.track_id))
          .filter((track): track is TrackRow => Boolean(track)),
      })));
    } catch (err) { setError(err instanceof Error ? err.message : "Erro ao carregar biblioteca."); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) return;
    setBusy(true); setError("");
    try {
      const response = await supabaseUserFetch("/rest/v1/music_user_playlists", {
        method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ name: name.trim() }),
      });
      if (!response.ok) throw new Error("Não foi possível criar a playlist.");
      setName(""); await load();
    } catch (err) { setError(err instanceof Error ? err.message : "Erro ao criar playlist."); }
    finally { setBusy(false); }
  }

  async function removeTrack(playlistId: string, trackId: string) {
    setBusy(true);
    try {
      const params = new URLSearchParams({ playlist_id: `eq.${playlistId}`, track_id: `eq.${trackId}` });
      const response = await supabaseUserFetch(`/rest/v1/music_user_playlist_tracks?${params.toString()}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Não foi possível remover a faixa.");
      setPlaylists((current) => current.map((list) => list.id === playlistId ? { ...list, tracks: list.tracks.filter((track) => track.id !== trackId) } : list));
    } catch (err) { setError(err instanceof Error ? err.message : "Erro ao remover faixa."); }
    finally { setBusy(false); }
  }

  async function removePlaylist(id: string) {
    if (!window.confirm("Excluir esta playlist? As músicas originais continuarão no catálogo.")) return;
    setBusy(true);
    try {
      const response = await supabaseUserFetch(`/rest/v1/music_user_playlists?id=eq.${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Não foi possível excluir a playlist.");
      setPlaylists((current) => current.filter((list) => list.id !== id));
    } catch (err) { setError(err instanceof Error ? err.message : "Erro ao excluir playlist."); }
    finally { setBusy(false); }
  }

  async function logout() { await signOut(); window.location.replace("/"); }
  const total = playlists.reduce((sum, list) => sum + list.tracks.length, 0);

  return <main className="mx-auto min-h-screen max-w-[1400px] px-4 pb-32 lg:pb-36 pt-24 text-foreground sm:px-6 xl:px-10">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-xs font-semibold uppercase tracking-[.2em] text-primary">Kivai Música</p><h1 className="mt-2 text-3xl font-bold sm:text-4xl">Minha biblioteca</h1><p className="mt-2 text-sm text-muted-foreground">{playlists.length} playlists · {total} músicas salvas</p></div>
      <div className="flex gap-2"><Button asChild variant="outline"><Link href="/">Explorar</Link></Button><Button variant="ghost" onClick={logout}><LogOut className="size-4" />Sair</Button></div>
    </div>
    <form onSubmit={create} className="mt-7 flex flex-col gap-2 rounded-2xl border border-border bg-card p-4 sm:flex-row">
      <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nome da nova playlist" maxLength={60} aria-label="Nome da nova playlist" />
      <Button type="submit" disabled={busy || !name.trim()}><Plus className="size-4" />Criar playlist</Button>
    </form>
    {error ? <p role="alert" className="mt-4 rounded-lg border border-destructive/30 p-3 text-sm">{error}</p> : null}
    {loading ? <p className="mt-8 text-sm text-muted-foreground">Carregando biblioteca...</p> : null}
    {!loading && !playlists.length ? <section className="mt-8 rounded-2xl border border-dashed p-10 text-center"><h2 className="font-semibold">Sua primeira playlist começa aqui</h2><p className="mt-2 text-sm text-muted-foreground">Crie uma playlist e salve nela as faixas que deseja ouvir novamente.</p></section> : null}
    <div className="mt-7 grid gap-5 xl:grid-cols-2">
      {playlists.map((list) => {
        const queue = list.tracks.map((track) => ({
          id: track.id, slug: track.slug, albumId: track.album_id, title: track.title, trackNumber: track.track_number,
          durationSeconds: track.duration_seconds, audioUrl: track.audio_url, status: track.status,
          artistName: track.album?.artist?.name ?? "Artista", albumTitle: track.album?.title ?? "Álbum",
          coverUrl: track.album?.cover_url ?? "",
        }));
        return <section key={list.id} className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between gap-3 border-b border-border p-4 sm:p-5">
            <div className="min-w-0"><h2 className="truncate text-lg font-semibold">{list.name}</h2><p className="text-xs text-muted-foreground">{list.tracks.length} músicas</p></div>
            <div className="flex shrink-0 gap-1"><Button size="sm" variant="outline" disabled={!queue.length} onClick={() => player.play(queue, 0)}><Play className="size-4" />Tocar</Button><Button size="icon" variant="ghost" disabled={busy} aria-label="Excluir playlist" onClick={() => removePlaylist(list.id)}><Trash2 className="size-4" /></Button></div>
          </div>
          {list.tracks.length ? <ol className="divide-y divide-border">{list.tracks.map((track) => <li key={track.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
            <div className="relative size-10 shrink-0 overflow-hidden rounded-md bg-muted">{track.album?.cover_url ? <Image src={track.album.cover_url} alt="" fill sizes="40px" className="object-cover" /> : null}</div>
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{track.title}</p><p className="truncate text-xs text-muted-foreground">{track.album?.artist?.name ?? "Artista"} · {track.album?.title ?? "Álbum"}</p></div>
            <Button size="icon" variant="ghost" disabled={busy} aria-label={`Remover ${track.title}`} onClick={() => removeTrack(list.id, track.id)}><Trash2 className="size-4" /></Button>
          </li>)}</ol> : <p className="p-5 text-sm text-muted-foreground">Playlist vazia. Explore os álbuns e use Salvar para adicionar faixas.</p>}
        </section>;
      })}
    </div>
  </main>;
}
