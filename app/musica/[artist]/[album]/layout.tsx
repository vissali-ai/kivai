import type { Metadata } from "next";
import { getMusicAlbum } from "@/lib/music/repository";

export async function generateMetadata({ params }: { params: Promise<{ artist: string; album: string }> }): Promise<Metadata> {
  const { artist: artistSlug, album: albumSlug } = await params;
  const catalog = await getMusicAlbum(artistSlug, albumSlug);
  if (!catalog) return { title: "Álbum não encontrado | Kivai Música", robots: { index: false, follow: false } };
  const { artist, album } = catalog;
  const canonical = `https://streaming.kivai.com.br/musica/${artist.slug}/${album.slug}`;
  const title = `${album.title} — ${artist.name} | Kivai Música`;
  const description = album.description?.slice(0, 300) || `Ouça ${album.title}, de ${artist.name}, no Kivai Música.`;
  return { title, description, alternates: { canonical }, robots: { index: album.indexable, follow: true }, openGraph: { title, description, url: canonical, siteName: "Kivai Música", locale: "pt_BR", type: "music.album", ...(album.coverUrl ? { images: [album.coverUrl] } : {}) } };
}

export default function AlbumLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}

