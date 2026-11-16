"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Play, Pause } from "lucide-react";
import { useMusicPlayer } from "@/components/music/music-player-provider";
import { MusicShareButton } from "@/components/music/music-share-button";
import type { MusicCatalog } from "@/lib/music/types";

export default function AlbumPage() {
  const params = useParams<{ artist: string; album: string }>();
  const [data, setData] = useState<MusicCatalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [sharedTrackId, setSharedTrackId] = useState("");
  const player = useMusicPlayer();
  const prefix = player.isStreamingHost ? "" : "/musica";

  useEffect(() => {
    let alive = true;
    fetch(`/api/music/${encodeURIComponent(params.artist)}/${encodeURIComponent(params.album)}`)
      .then((response) => response.ok ? response.json() : null)
      .then((value) => { if (alive) setData(value); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [params.artist, params.album]);

  useEffect(() => {
    const trackId = new URLSearchParams(window.location.search).get("faixa");
    setSharedTrackId(trackId || "");
  }, [params.artist, params.album]);

  if (loading) return <main className="px-4 pb-28 pt-24">Carregando álbum...</main>;
  if (!data) return <main className="px-4 pb-28 pt-24">Álbum não encontrado.</main>;

  const album = data.albums[0];
  const artistHref = `${prefix}/${data.artist.slug}`;
  const albumHref = `${prefix}/${data.artist.slug}/${album.slug}`;
  const queue = album.tracks.map((track) => ({ ...track, artistName: data.artist.name, albumTitle: album.title, coverUrl: album.coverUrl }));
  const current = player.queue[player.index];
  const sharedTrackIndex = queue.findIndex((track) => track.id === sharedTrackId);
  const sharedTrack = sharedTrackIndex >= 0 ? queue[sharedTrackIndex] : null;

  return (
    <main className="min-h-screen bg-background px-4 pb-28 pt-24 text-foreground sm:px-6">
      <div className="mx-auto max-w-5xl">
        <Link href={artistHref} className="text-sm text-muted-foreground">← {data.artist.name}</Link>
        <section className="mt-5 grid gap-6 rounded-3xl border border-border bg-card p-5 sm:grid-cols-[240px_1fr] sm:p-8">
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted">
            {album.coverUrl && <Image src={album.coverUrl} alt={`Capa do álbum ${album.title}`} fill sizes="(max-width: 640px) 100vw, 240px" className="object-cover" />}
          </div>
          <div className="flex flex-col justify-end">
            <p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Álbum</p>
            <h1 className="mt-2 text-3xl font-bold sm:text-5xl">{album.title}</h1>
            <Link href={artistHref} className="mt-2 font-medium hover:underline">{data.artist.name}</Link>
            <p className="mt-2 text-sm text-muted-foreground">{album.tracks.length} faixas{album.releaseDate ? ` · ${new Date(`${album.releaseDate}T00:00:00`).toLocaleDateString("pt-BR")}` : ""}</p>
            {album.description && <p className="mt-4 whitespace-pre-line text-sm leading-6 text-muted-foreground">{album.description}</p>}
            <div className="mt-6 flex flex-wrap gap-2">
              <button disabled={!queue.length} onClick={() => player.play(queue, 0)} className="inline-flex min-h-12 w-fit items-center gap-2 rounded-full bg-primary px-6 font-semibold text-primary-foreground disabled:opacity-50"><Play className="size-4" />Ouvir álbum</button>
              <MusicShareButton title={`${album.title} | ${data.artist.name}`} text={`Ouça o álbum ${album.title}, de ${data.artist.name}, no Kivai Música.`} url={albumHref} />
            </div>
          </div>
        </section>

        {sharedTrack ? (
          <section className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
            <div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wide text-primary">Música compartilhada</p><p className="truncate font-semibold">{sharedTrack.title}</p><p className="text-xs text-muted-foreground">{data.artist.name} · {album.title}</p></div>
            <button onClick={() => player.play(queue, sharedTrackIndex)} className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground"><Play className="size-4" />Reproduzir faixa</button>
          </section>
        ) : null}

        <section className="mt-8">
          <h2 className="mb-3 text-lg font-semibold">Faixas</h2>
          <ol className="divide-y divide-border">
            {queue.map((track, index) => {
              const isCurrent = current?.id === track.id;
              const isShared = sharedTrackId === track.id;
              const trackShareUrl = `${albumHref}?faixa=${encodeURIComponent(track.id)}`;
              return (
                <li key={track.id} className={`flex items-center gap-2 rounded-lg px-3 py-2 ${isShared ? "bg-primary/10 ring-1 ring-primary/30" : isCurrent ? "bg-primary/10" : "hover:bg-muted/50"}`}>
                  <span className="w-7 text-right text-xs tabular-nums text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
                  <button aria-label={isCurrent && player.playing ? `Pausar ${track.title}` : `Reproduzir ${track.title}`} onClick={() => isCurrent ? (player.playing ? document.querySelector("audio")?.pause() : document.querySelector("audio")?.play()) : player.play(queue, index)} className="rounded-full p-2 hover:bg-muted">{isCurrent && player.playing ? <Pause className="size-4" /> : <Play className="size-4" />}</button>
                  <span className={`min-w-0 flex-1 truncate text-sm ${isCurrent || isShared ? "font-semibold text-primary" : ""}`}>{track.title}{isShared ? <span className="ml-2 text-[10px] uppercase tracking-wide text-primary">Compartilhada</span> : null}</span>
                  <span className="text-xs tabular-nums text-muted-foreground">{track.durationSeconds ? `${Math.floor(track.durationSeconds / 60)}:${String(track.durationSeconds % 60).padStart(2, "0")}` : "—"}</span>
                  <MusicShareButton compact title={`${track.title} | ${data.artist.name}`} text={`Ouça ${track.title}, de ${data.artist.name}, no Kivai Música.`} url={trackShareUrl} />
                </li>
              );
            })}
          </ol>
        </section>
      </div>
    </main>
  );
}
