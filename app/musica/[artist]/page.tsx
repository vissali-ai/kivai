import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getMusicCatalogByArtist } from "@/lib/music/repository";
import { MusicArtistComments } from "@/components/music/music-artist-comments";
import type { Metadata } from "next";
import { MessageCircle } from "lucide-react";
import { MusicShareButton } from "@/components/music/music-share-button";
import { listSiteHubs } from "@/lib/site-cms/repository";
import { getMusicPathPrefix, musicPath } from "@/lib/music/paths";

export async function generateMetadata({ params }: { params: Promise<{ artist: string }> }): Promise<Metadata> {
  const { artist: slug } = await params;
  const catalog = await getMusicCatalogByArtist(slug);
  if (!catalog) return { title: "Artista não encontrado | Kivai Música", robots: { index: false, follow: false } };
  const hubs = await listSiteHubs();
  const musicHub = hubs.find((hub) => hub.slug === "musica");
  const hubIsIndexable = Boolean(musicHub && musicHub.status === "published" && musicHub.indexable);
  const { artist } = catalog;
  const canonical = `https://streaming.kivai.com.br/${artist.slug}`;
  const title = `${artist.name} | Kivai Música`;
  const description = artist.bio?.slice(0, 300) || `Conheça ${artist.name} e ouça seus álbuns no Kivai Música.`;
  return {
    title,
    description,
    alternates: { canonical },
    robots: { index: hubIsIndexable && artist.indexable, follow: true },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "Kivai Música",
      locale: "pt_BR",
      type: "profile",
      ...(artist.photoUrl ? { images: [artist.photoUrl] } : {}),
    },
  };
}

export default async function ArtistPage({ params }: { params: Promise<{ artist: string }> }) {
  const { artist: slug } = await params;
  const [catalog, pathPrefix] = await Promise.all([getMusicCatalogByArtist(slug), getMusicPathPrefix()]);
  if (!catalog) notFound();
  const { artist, albums } = catalog;
  const musicHomePath = pathPrefix || "/";
  const artistPlayCount = albums.reduce((total, item) => total + item.tracks.reduce((sum, track) => sum + (track.playCount ?? 0), 0), 0);
  const whatsappDigits = artist.contactWhatsapp?.replace(/\D/g, "") ?? "";
  const whatsappMessage = artist.contactMessage || `Olá! Gostaria de informações sobre contratação de ${artist.name}.`;
  const whatsappHref = whatsappDigits ? `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(whatsappMessage)}` : "";
  return <main className="min-h-screen bg-background px-4 pb-36 pt-24 text-foreground sm:px-6"><div className="mx-auto max-w-[1600px]">
    <Link href={musicHomePath} className="text-sm text-muted-foreground hover:text-foreground">← Música</Link>
    <section className="mt-5 rounded-3xl border border-border bg-card p-5 sm:p-7">
      <div className="flex items-center gap-4 sm:gap-5">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-full border border-border bg-muted sm:size-24">
          {artist.photoUrl ? <Image src={artist.photoUrl} alt={`Foto de perfil de ${artist.name}`} fill sizes="96px" className="object-cover" /> : <span className="flex h-full w-full items-center justify-center text-2xl font-semibold text-muted-foreground">{artist.name.slice(0, 1).toUpperCase()}</span>}
        </div>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Artista</p>
          <h1 className="mt-1 break-words text-2xl font-bold sm:text-3xl">{artist.name}</h1>
          <p className="mt-1 text-xs text-muted-foreground">{artistPlayCount.toLocaleString("pt-BR")} reproduções</p>
        </div>
      </div>
      {artist.bio && <p className="mt-5 max-w-4xl whitespace-pre-line border-t border-border pt-4 leading-7 text-muted-foreground">{artist.bio}</p>}
    </section>
    <section className="mt-5 flex flex-wrap items-center gap-3">
      <MusicShareButton title={`${artist.name} | Kivai Música`} text={`Conheça ${artist.name} no Kivai Música.`} />
      {whatsappHref ? <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"><MessageCircle className="size-4" />Contratar artista</a> : null}
    </section>
    <h2 className="mt-10 text-2xl font-semibold">Álbuns</h2>
    <div className="mt-4">
      <div aria-label="Álbuns do artista" className="-mx-4 flex snap-x snap-proximity touch-pan-x gap-3 overflow-x-auto overscroll-x-contain scroll-smooth px-4 pb-4 [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:gap-4 sm:px-0 md:hidden">{albums.map((album) => <Link key={album.id} href={musicPath(pathPrefix, artist.slug, album.slug)} className="group flex w-[min(72vw,270px)] shrink-0 snap-start gap-3 rounded-xl border border-border bg-card p-2.5 transition-colors hover:border-primary/40"><div className="relative size-14 shrink-0 overflow-hidden rounded-md bg-muted"><span className="sr-only">Capa do álbum</span>{album.coverUrl && <Image src={album.coverUrl} alt={`Capa de ${album.title}`} fill sizes="56px" className="object-cover" />}</div><div className="min-w-0 self-center"><h3 className="truncate text-base font-semibold">{album.title}</h3><p className="mt-0.5 text-sm text-muted-foreground">{album.tracks.length} faixas</p><p className="mt-1 text-[13px] text-primary group-hover:underline">Ver álbum →</p></div></Link>)}</div>
      <div aria-label="Álbuns do artista" className="hidden gap-4 md:grid md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{albums.map((album) => <Link key={album.id} href={musicPath(pathPrefix, artist.slug, album.slug)} className="group flex min-w-0 items-center gap-4 rounded-2xl border border-border bg-card p-3 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-muted/40"><div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-muted"><span className="sr-only">Capa do álbum</span>{album.coverUrl && <Image src={album.coverUrl} alt={`Capa de ${album.title}`} fill sizes="80px" className="object-cover" />}</div><div className="min-w-0"><h3 className="truncate text-base font-semibold">{album.title}</h3><p className="mt-1 text-sm text-muted-foreground">{album.tracks.length} faixas</p><p className="mt-2 text-xs font-medium text-primary group-hover:underline">Abrir álbum</p></div></Link>)}</div>
    </div>
    <MusicArtistComments artistSlug={artist.slug} />
  </div></main>;
}
