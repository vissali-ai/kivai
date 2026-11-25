"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Play } from "lucide-react";
import { useMusicPlayer } from "@/components/music/music-player-provider";
import { MusicShareButton } from "@/components/music/music-share-button";
import { MusicPlaylistAdd } from "@/components/music/music-account-features";
import type { MusicCatalog, MusicTrack } from "@/lib/music/types";

type Data = { artist: MusicCatalog["artist"]; album: MusicCatalog["albums"][number]; track: MusicTrack };

export function TrackDetail({ artistSlug, albumSlug, trackSlug }: { artistSlug: string; albumSlug: string; trackSlug: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const player = useMusicPlayer();
  const prefix = player.isStreamingHost ? "" : "/musica";
  useEffect(() => {
    let active = true;
    fetch(`/api/music/${encodeURIComponent(artistSlug)}/${encodeURIComponent(albumSlug)}/${encodeURIComponent(trackSlug)}`)
      .then(response => response.ok ? response.json() : null)
      .then(value => { if (active) setData(value); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [artistSlug, albumSlug, trackSlug]);

  if (loading) return <main className="min-h-screen px-4 pb-28 pt-24">Carregando música...</main>;
  if (!data) return <main className="min-h-screen px-4 pb-28 pt-24">Música não encontrada.</main>;

  const { artist, album, track } = data;
  const queue = album.tracks.map(item => ({ ...item, artistName: artist.name, albumTitle: album.title, coverUrl: album.coverUrl }));
  const index = queue.findIndex(item => item.id === track.id);
  const albumHref = `${prefix}/${artist.slug}/${album.slug}`;
  const shareUrl = `${albumHref}/${track.slug}`;

  return (
    <main className="min-h-screen bg-background px-4 pb-28 pt-24 text-foreground sm:px-6">
      <div className="mx-auto max-w-3xl">
        <Link href={albumHref} className="text-sm text-muted-foreground hover:text-primary">← Voltar ao álbum</Link>
        <section className="mt-5 grid gap-6 rounded-3xl border border-border bg-card p-5 sm:grid-cols-[240px_1fr] sm:p-8">
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted">
            {album.coverUrl ? <Image src={album.coverUrl} alt={`Capa do álbum ${album.title}`} fill sizes="(max-width: 640px) 100vw, 240px" className="object-cover" /> : null}
          </div>
          <div className="flex min-w-0 flex-col justify-center">
            <p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Música</p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{track.title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{artist.name} · {album.title}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              <button onClick={() => player.play(queue, index)} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 font-semibold text-primary-foreground"><Play className="size-4" />Reproduzir música</button>
              <MusicShareButton title={`${track.title} | ${artist.name}`} text={`Ouça ${track.title}, de ${artist.name}, no Kivai Música.`} url={shareUrl} />
            </div>
            <div className="mt-4"><MusicPlaylistAdd trackId={track.id} /></div>
          </div>
        </section>
        <p className="mt-4 text-sm text-muted-foreground">A reprodução continua pela fila do álbum. Ao terminar, o player poderá avançar para a próxima faixa.</p>
        {track.fullAudio && track.description.trim() ? <section className="mt-6 rounded-2xl border border-border bg-card p-5"><p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Áudio completo (EP/LP)</p><div className="mt-3 whitespace-pre-line text-sm leading-7 text-muted-foreground">{track.description}</div></section> : null}
      </div>
    </main>
  );
}
