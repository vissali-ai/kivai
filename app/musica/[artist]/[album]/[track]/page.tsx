import type { Metadata } from "next";
import { getMusicTrack } from "@/lib/music/repository";
import { TrackDetail } from "@/components/music/track-detail";

type Props = { params: Promise<{ artist: string; album: string; track: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { artist, album, track } = await params;
  const result = await getMusicTrack(artist, album, track);
  if (!result) return { title: "Música não encontrada | Kivai Música" };
  return {
    title: `${result.track.title} | ${result.artist.name} | Kivai Música`,
    description: `Ouça ${result.track.title}, de ${result.artist.name}, do álbum ${result.album.title}, no Kivai Música.`,
    alternates: { canonical: `https://streaming.kivai.com.br/${result.artist.slug}/${result.album.slug}/${result.track.slug}` },
    openGraph: {
      title: `${result.track.title} | ${result.artist.name}`,
      description: `Ouça ${result.track.title} no Kivai Música.`,
      images: result.album.coverUrl ? [result.album.coverUrl] : [],
      type: "music.song",
    },
  };
}

export default async function TrackPage({ params }: Props) {
  const { artist, album, track } = await params;
  return <TrackDetail artistSlug={artist} albumSlug={album} trackSlug={track} />;
}
