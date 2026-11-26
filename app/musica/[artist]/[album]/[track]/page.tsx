import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMusicTrack } from "@/lib/music/repository";
import { TrackDetail } from "@/components/music/track-detail";

type Props = { params: Promise<{ artist: string; album: string; track: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { artist, album, track } = await params;
  const result = await getMusicTrack(artist, album, track);
  if (!result) return { title: "Música não encontrada | Kivai Música", robots: { index: false, follow: false } };
  const title = `${result.track.title} | ${result.artist.name} | Kivai Música`;
  const description =
    result.track.description?.slice(0, 300) ||
    result.album.description?.slice(0, 300) ||
    `Ouça ${result.track.title}, de ${result.artist.name}, do álbum ${result.album.title}, no Kivai Música.`;
  const canonical = `https://streaming.kivai.com.br/${result.artist.slug}/${result.album.slug}/${result.track.slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "Kivai Música",
      locale: "pt_BR",
      images: result.album.coverUrl ? [result.album.coverUrl] : [],
      type: "music.song",
    },
  };
}

export default async function TrackPage({ params }: Props) {
  const { artist, album, track } = await params;
  const result = await getMusicTrack(artist, album, track);
  if (!result) notFound();
  return <TrackDetail data={result} />;
}
