import Link from "next/link";
import Image from "next/image";
import { listMusicCatalog, listMusicGenres } from "@/lib/music/repository";
import { getMusicPathPrefix, musicPath } from "@/lib/music/paths";
import { getMusicGenreIcon } from "@/lib/music/genre-icon";

export default async function MusicPage() {
  const [catalog, genres, pathPrefix] = await Promise.all([listMusicCatalog(), listMusicGenres(), getMusicPathPrefix()]);
  const recentAlbums = catalog.flatMap(({ artist, albums }) => albums.map(album => ({ ...album, artist })))
    .sort((a, b) => (a.publishedAt ?? "").localeCompare(b.publishedAt ?? "")).slice(0, 8);
  const genreCounts = new Map<string, number>();
  for (const item of catalog) if (item.artist.genreId) genreCounts.set(item.artist.genreId, (genreCounts.get(item.artist.genreId) ?? 0) + 1);

  return (
    <main className="min-h-screen bg-background px-4 pb-28 pt-24 text-foreground sm:px-6 sm:pt-20">
      <div className="mx-auto max-w-6xl">
        <section className="mt-4">
          <div className="mb-4 flex items-end justify-between gap-3"><div><h2 className="text-2xl font-semibold">Mais recentes</h2><p className="mt-1 text-sm text-muted-foreground">Álbuns e lançamentos adicionados ao catálogo.</p></div></div>
          {recentAlbums.length ? (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
              {recentAlbums.map(album => (
                <article key={album.id} dir="ltr" className="group min-w-0">
                  <Link href={musicPath(pathPrefix, album.artist.slug, album.slug)} className="block">
                    <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
                      {album.coverUrl ? <Image src={album.coverUrl} alt={`Capa do álbum ${album.title}`} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover transition-transform group-hover:scale-[1.03]" /> : null}
                    </div>
                    <h3 className="mt-1 truncate text-[13px] font-semibold sm:text-[15px]">{album.title}</h3>
                  </Link>
                  <Link href={musicPath(pathPrefix, album.artist.slug)} className="mt-0.5 block truncate text-[12px] text-muted-foreground hover:text-primary hover:underline sm:text-[13px]">{album.artist.name}</Link>
                </article>
              ))}
            </div>
          ) : <p className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">Novos lançamentos serão exibidos aqui.</p>}
        </section>

        <section className="mt-12">
          <div className="mb-4"><h2 className="text-2xl font-semibold">Estilos musicais</h2><p className="mt-1 text-sm text-muted-foreground">Explore artistas por gênero musical.</p></div>
          {genres.length ? (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
              {genres.map(genre => {
                const GenreIcon = getMusicGenreIcon(genre.name);
                const count = genreCounts.get(genre.id) ?? 0;
                return (
                  <Link key={genre.id} href={musicPath(pathPrefix, "estilo", genre.slug)} className="group flex min-w-0 items-center gap-3 rounded-xl border border-border bg-card px-3 py-3 transition-colors hover:border-primary/40 hover:bg-muted/40 sm:px-3.5">
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                      <GenreIcon className="size-5" strokeWidth={1.65} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{genre.name}</span>
                      <span className="mt-0.5 block text-[11px] text-muted-foreground">{count} {count === 1 ? "artista" : "artistas"}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : <p className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">Os estilos musicais serão publicados em breve.</p>}
        </section>

      </div>
    </main>
  );
}
