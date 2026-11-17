import Link from "next/link";
import Image from "next/image";
import { listMusicCatalog, listMusicGenres } from "@/lib/music/repository";
import { getMusicPathPrefix, musicPath } from "@/lib/music/paths";
import { StreamingHomeActions } from "@/components/music/streaming-home-actions";

export default async function MusicPage() {
  const [catalog, genres, pathPrefix] = await Promise.all([listMusicCatalog(), listMusicGenres(), getMusicPathPrefix()]);
  const recentAlbums = catalog.flatMap(({ artist, albums }) => albums.map(album => ({ ...album, artist })))
    .sort((a, b) => (b.releaseDate ?? "").localeCompare(a.releaseDate ?? "")).slice(0, 8);
  const genreCounts = new Map<string, number>();
  for (const item of catalog) if (item.artist.genreId) genreCounts.set(item.artist.genreId, (genreCounts.get(item.artist.genreId) ?? 0) + 1);
  const isStreamingHome = pathPrefix === "";

  return (
    <main className="min-h-screen bg-background px-4 pb-28 pt-24 text-foreground sm:px-6">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.2em] text-primary">Kivai apresenta</p>
            <h1 className="mt-1 font-heading text-3xl font-semibold sm:text-4xl">Explorar música</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Descubra artistas independentes, lançamentos e estilos musicais.</p>
          </div>
          {isStreamingHome ? (
            <aside className="flex items-center gap-3 rounded-xl border border-border bg-card/60 px-3 py-2">
              <div className="hidden sm:block"><p className="text-sm font-medium">Quer sua música aqui?</p><p className="text-xs text-muted-foreground">Fale com a gente</p></div>
              <StreamingHomeActions compact />
            </aside>
          ) : null}
        </header>

        <section className="mt-9">
          <div className="mb-4 flex items-end justify-between gap-3"><div><h2 className="text-2xl font-semibold">Mais recentes</h2><p className="mt-1 text-sm text-muted-foreground">Álbuns e lançamentos adicionados ao catálogo.</p></div></div>
          {recentAlbums.length ? (
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              {recentAlbums.map(album => (
                <Link key={album.id} href={musicPath(pathPrefix, album.artist.slug, album.slug)} className="group min-w-0">
                  <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
                    {album.coverUrl ? <Image src={album.coverUrl} alt={`Capa do álbum ${album.title}`} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover transition-transform group-hover:scale-[1.03]" /> : null}
                  </div>
                  <h3 className="mt-2 truncate text-sm font-semibold">{album.title}</h3>
                  <p className="truncate text-xs text-muted-foreground">{album.artist.name}</p>
                </Link>
              ))}
            </div>
          ) : <p className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">Novos lançamentos serão exibidos aqui.</p>}
        </section>

        <section className="mt-12">
          <div className="mb-4"><h2 className="text-2xl font-semibold">Estilos musicais</h2><p className="mt-1 text-sm text-muted-foreground">Explore artistas por gênero musical.</p></div>
          {genres.length ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {genres.map(genre => (
                <Link key={genre.id} href={musicPath(pathPrefix, "estilo", genre.slug)} className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-muted">
                  {genre.imageUrl ? <Image src={genre.imageUrl} alt={`Estilo ${genre.name}`} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover transition-transform group-hover:scale-105" /> : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4 text-white"><h3 className="text-lg font-semibold">{genre.name}</h3><p className="mt-1 text-xs text-white/80">{genreCounts.get(genre.id) ?? 0} {(genreCounts.get(genre.id) ?? 0) === 1 ? "artista" : "artistas"}</p></div>
                </Link>
              ))}
            </div>
          ) : <p className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">Os estilos musicais serão publicados em breve.</p>}
        </section>

      </div>
    </main>
  );
}
