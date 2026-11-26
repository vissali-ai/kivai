"use client";

import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";
import { useMusicPlayer } from "@/components/music/music-player-provider";
import { MusicShareButton } from "@/components/music/music-share-button";
import { MusicPlaylistAdd } from "@/components/music/music-account-features";
import type { MusicCatalog, MusicTrack } from "@/lib/music/types";

type Data = {
  artist: MusicCatalog["artist"];
  album: MusicCatalog["albums"][number];
  track: MusicTrack;
};

export function TrackDetail({ data }: { data: Data }) {
  const player = useMusicPlayer();
  const prefix = player.isStreamingHost ? "" : "/musica";
  const { artist, album, track } = data;
  const queue = album.tracks.map((item) => ({
    ...item,
    artistName: artist.name,
    albumTitle: album.title,
    coverUrl: album.coverUrl,
  }));
  const index = queue.findIndex((item) => item.id === track.id);
  const albumHref = `${prefix}/${artist.slug}/${album.slug}`;
  const shareUrl = `${albumHref}/${track.slug}`;
  const editorialCopy = track.description.trim() || album.description.trim() || artist.bio.trim();

  return (
    <main className="min-h-screen bg-background px-4 pb-28 pt-24 text-foreground sm:px-6">
      <div className="mx-auto max-w-3xl">
        <Link href={albumHref} className="text-sm text-muted-foreground hover:text-primary">← Voltar ao álbum</Link>
        <section className="mt-5 grid gap-6 rounded-3xl border border-border bg-card p-5 sm:grid-cols-[240px_1fr] sm:p-8">
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted">
            {album.coverUrl ? <Image src={album.coverUrl} alt={`Capa do álbum ${album.title}`} fill sizes="(max-width: 640px) 100vw, 240px" className="object-cover" /> : null}
          </div>
          <div className="flex min-w-0 flex-col justify-center">
            <p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Música · Faixa {String(track.trackNumber).padStart(2, "0")}</p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{track.title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              <Link href={`${prefix}/${artist.slug}`} className="hover:text-primary hover:underline">{artist.name}</Link>
              {" · "}
              <Link href={albumHref} className="hover:text-primary hover:underline">{album.title}</Link>
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <button onClick={() => player.play(queue, index)} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 font-semibold text-primary-foreground"><Play className="size-4" />Reproduzir música</button>
              <MusicShareButton title={`${track.title} | ${artist.name}`} text={`Ouça ${track.title}, de ${artist.name}, no Kivai Música.`} url={shareUrl} />
            </div>
            <div className="mt-4"><MusicPlaylistAdd trackId={track.id} /></div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-card p-5 sm:p-6">
          <h2 className="text-lg font-semibold">{track.description.trim() ? "Sobre esta faixa" : album.description.trim() ? `Sobre o álbum ${album.title}` : `Sobre ${artist.name}`}</h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted-foreground">
            {editorialCopy || `Ouça ${track.title}, faixa ${track.trackNumber} do álbum ${album.title}, de ${artist.name}, no Kivai Música.`}
          </p>
          <p className="mt-3 text-sm">
            <Link href={albumHref} className="font-medium text-primary hover:underline">Ver todas as faixas de {album.title}</Link>
          </p>
        </section>
      </div>
    </main>
  );
}
