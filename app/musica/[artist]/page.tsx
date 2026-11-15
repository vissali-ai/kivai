import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getMusicCatalogByArtist } from "@/lib/music/repository";
import { MusicArtistComments } from "@/components/music/music-artist-comments";
import type { Metadata } from "next";
import { listSiteHubs } from "@/lib/site-cms/repository";

export async function generateMetadata({ params }: { params: Promise<{ artist: string }> }): Promise<Metadata> {
  const { artist: slug } = await params;
  const catalog = await getMusicCatalogByArtist(slug);
  if (!catalog) return { title: "Artista não encontrado | Kivai Música", robots: { index: false, follow: false } };
  const hubs = await listSiteHubs();
  const musicHub = hubs.find((hub) => hub.slug === "musica");
  const hubIsIndexable = Boolean(musicHub && musicHub.status === "published" && musicHub.indexable);
  const { artist } = catalog;
  const canonical = `https://streaming.kivai.com.br/musica/${artist.slug}`;
  const title = `${artist.name} | Kivai Música`;
  const description = artist.bio?.slice(0, 300) || `Conheça ${artist.name} e ouça seus álbuns no Kivai Música.`;
  return { title, description, alternates: { canonical }, robots: { index: hubIsIndexable && artist.indexable, follow: true }, openGraph: { title, description, url: canonical, siteName: "Kivai Música", locale: "pt_BR", type: "profile", ...(artist.coverUrl || artist.photoUrl ? { images: [artist.coverUrl || artist.photoUrl] } : {}) };
}

export default async function ArtistPage({ params }: { params: Promise<{ artist: string }> }) {
  const { artist: slug } = await params;
  const catalog = await getMusicCatalogByArtist(slug);
  if (!catalog) notFound();
  const { artist, albums } = catalog;
  return <main className="min-h-screen bg-background px-4 pb-28 pt-24 text-foreground sm:px-6"><div className="mx-auto max-w-6xl">
    <Link href="/musica" className="text-sm text-muted-foreground hover:text-foreground">← Música</Link>
    <section className="mt-5 overflow-hidden rounded-3xl border border-border bg-card">
      <div className="relative h-48 bg-muted sm:h-72">{(artist.coverUrl || artist.photoUrl) && <Image src={artist.coverUrl || artist.photoUrl} alt="" fill sizes="100vw" className="object-cover" />}<div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" /><div className="absolute bottom-5 left-5 flex items-end gap-4 sm:bottom-8 sm:left-8">{artist.photoUrl && <div className="relative size-20 overflow-hidden rounded-full border-2 border-white/70 sm:size-28"><Image src={artist.photoUrl} alt={`Foto de ${artist.name}`} fill sizes="112px" className="object-cover" /></div>}<div className="text-white"><p className="text-xs uppercase tracking-widest">Artista</p><h1 className="mt-1 text-3xl font-bold sm:text-5xl">{artist.name}</h1></div></div></div>
      {artist.bio && <p className="max-w-4xl whitespace-pre-line p-5 leading-7 text-muted-foreground sm:p-8">{artist.bio}</p>}
    </section>
    <h2 className="mt-10 text-2xl font-semibold">Álbuns</h2>
    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{albums.map((album) => <Link key={album.id} href={`/musica/${artist.slug}/${album.slug}`} className="group flex gap-4 rounded-xl border border-border bg-card p-3"><div className="relative size-24 shrink-0 overflow-hidden rounded-lg bg-muted">{album.coverUrl && <Image src={album.coverUrl} alt={`Capa de ${album.title}`} fill sizes="96px" className="object-cover" />}</div><div className="min-w-0 self-center"><h3 className="truncate font-semibold">{album.title}</h3><p className="mt-1 text-sm text-muted-foreground">{album.tracks.length} faixas</p><p className="mt-3 text-xs text-primary group-hover:underline">Ver álbum →</p></div></Link>)}</div>
    <MusicArtistComments artistSlug={artist.slug} artistName={artist.name} />
  </div></main>;
}

