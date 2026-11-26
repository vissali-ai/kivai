import { notFound } from "next/navigation";
import { MusicAlbumDetail } from "@/components/music/album-detail";
import { getMusicAlbum } from "@/lib/music/repository";
import type { MusicCatalog } from "@/lib/music/types";

type Props = { params: Promise<{ artist: string; album: string }> };

export default async function AlbumPage({ params }: Props) {
  const { artist, album } = await params;
  const result = await getMusicAlbum(artist, album);
  if (!result) notFound();

  const data: MusicCatalog = {
    artist: result.artist,
    albums: [result.album],
  };

  return <MusicAlbumDetail data={data} />;
}
