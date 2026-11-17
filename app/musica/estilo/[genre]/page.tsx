import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getMusicGenreBySlug } from "@/lib/music/repository";
import { getMusicPathPrefix, musicPath } from "@/lib/music/paths";

export async function generateMetadata({ params }: { params: Promise<{ genre: string }> }): Promise<Metadata> {
  const { genre: slug } = await params;
  const data = await getMusicGenreBySlug(slug);
  if (!data) return { title: "Estilo não encontrado | Kivai Música", robots: { index: false, follow: false } };
  return {
    title: `${data.genre.name} | Kivai Música`,
    description: data.genre.description || `Conheça artistas de ${data.genre.name} no Kivai Música.`,
    alternates: { canonical: `https://streaming.kivai.com.br/estilo/${data.genre.slug}` },
    openGraph: { title: `${data.genre.name} | Kivai Música`, description: data.genre.description || `Artistas de ${data.genre.name}.`, images: data.genre.imageUrl ? [data.genre.imageUrl] : [] },
  };
}

export default async function MusicGenrePage({ params }: { params: Promise<{ genre: string }> }) {
  const [{ genre: slug }, prefix] = await Promise.all([params, getMusicPathPrefix()]);
  const data = await getMusicGenreBySlug(slug);
  if (!data) notFound();
  return (
    <main className="min-h-screen bg-background px-4 pb-28 pt-24 text-foreground sm:px-6">
      <div className="mx-auto max-w-6xl">
        <Link href={prefix || "/"} className="text-sm text-muted-foreground hover:text-foreground">← Explorar música</Link>
        <header className="mt-5 relative flex min-h-56 items-end overflow-hidden rounded-3xl border border-border bg-muted p-6 sm:min-h-72 sm:p-10">
          {data.genre.imageUrl ? <Image src={data.genre.imageUrl} alt="" fill priority sizes="100vw" className="object-cover" /> : null}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
          <div className="relative z-10 text-white"><p className="text-xs font-semibold uppercase tracking-[.2em] text-white/75">Estilo musical</p><h1 className="mt-2 text-4xl font-bold sm:text-6xl">{data.genre.name}</h1>{data.genre.description ? <p className="mt-3 max-w-2xl text-sm leading-6 text-white/85">{data.genre.description}</p> : null}<p className="mt-3 text-xs text-white/75">{data.artists.length} {data.artists.length === 1 ? "artista" : "artistas"}</p></div>
        </header>
        <section className="mt-9">
          <h2 className="text-2xl font-semibold">Artistas de {data.genre.name}</h2>
          {data.artists.length ? (
            <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {data.artists.map(({ artist, albums }) => (
                <Link key={artist.id} href={musicPath(prefix, artist.slug)} className="group overflow-hidden rounded-2xl border border-border bg-card">
                  <div className="relative aspect-[16/9] bg-muted">{(artist.coverUrl || artist.photoUrl) ? <Image src={artist.coverUrl || artist.photoUrl} alt={`Imagem de ${artist.name}`} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover transition-transform group-hover:scale-[1.02]" /> : null}</div>
                  <div className="p-5"><h3 className="text-xl font-semibold">{artist.name}</h3><p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{artist.bio}</p><p className="mt-4 text-xs text-primary">{albums.length} {albums.length === 1 ? "álbum" : "álbuns"}</p></div>
                </Link>
              ))}
            </div>
          ) : <p className="mt-4 rounded-xl border border-dashed p-6 text-sm text-muted-foreground">Ainda não há artistas associados a este estilo. Volte em breve.</p>}
        </section>
      </div>
    </main>
  );
}
