import Link from "next/link";
import Image from "next/image";
import { listMusicArtists, listRecentMusicAlbums, listMusicGenres } from "@/lib/music/repository";
import { getMusicPathPrefix, musicPath } from "@/lib/music/paths";
import { getMusicGenreIcon } from "@/lib/music/genre-icon";

export default async function MusicPage() {
  const [recentAlbums, artists, genres, pathPrefix] = await Promise.all([
    listRecentMusicAlbums(8),
    listMusicArtists(),
    listMusicGenres(),
    getMusicPathPrefix(),
  ]);
  const genreCounts = new Map<string, number>();
  for (const artist of artists) {
    if (artist.genreId) genreCounts.set(artist.genreId, (genreCounts.get(artist.genreId) ?? 0) + 1);
  }

  return (
    <main className="min-h-screen bg-background px-4 pb-28 pt-24 text-foreground sm:px-6 sm:pt-20">
      <div className="mx-auto max-w-6xl">
        <section className="mt-4">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div><h2 className="text-2xl font-semibold">Mais recentes</h2></div>
            <Link
              href={musicPath(pathPrefix, "lancamentos")}
              className="shrink-0 text-sm font-semibold text-primary transition hover:underline"
            >
              Ver mais
            </Link>
          </div>
          {recentAlbums.length ? (
            <div aria-label="Álbuns recentes" className="-mx-4 flex snap-x snap-proximity touch-pan-x gap-3 overflow-x-auto overscroll-x-contain scroll-smooth px-4 pb-4 music-desktop-scroll [-webkit-overflow-scrolling:touch] sm:mx-0 sm:gap-4 sm:px-0">
              {recentAlbums.map(album => (
                <article key={album.id} dir="ltr" className="group w-[38vw] max-w-[156px] shrink-0 snap-start sm:w-[168px] sm:max-w-none">
                  <Link href={musicPath(pathPrefix, album.artist.slug, album.slug)} className="block">
                    <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
                      {album.coverUrl ? <Image src={album.coverUrl} alt={`Capa do álbum ${album.title}`} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover transition-transform group-hover:scale-[1.03]" /> : null}
                    </div>
                    <h3 className="mt-1 truncate text-[13px] font-semibold sm:text-[15px]">{album.title}</h3>
                  </Link>
                  <Link href={musicPath(pathPrefix, album.artist.slug)} className="mt-0.5 block truncate text-[12px] text-muted-foreground hover:text-primary hover:underline sm:text-[13px]">{album.artist.name}</Link>
                </article>
              ))}
              <article dir="ltr" className="w-[38vw] max-w-[156px] shrink-0 snap-start sm:w-[168px] sm:max-w-none">
                <Link
                  href={musicPath(pathPrefix, "lancamentos")}
                  aria-label="Ver todos os álbuns"
                  className="flex aspect-square flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-primary/50 bg-primary/[0.04] text-primary transition-colors hover:border-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  <span className="grid size-11 place-items-center rounded-full bg-primary/10 text-2xl font-light" aria-hidden="true">→</span>
                  <span className="text-sm font-semibold">Ver mais</span>
                </Link>
                <p className="mt-1 truncate text-[12px] text-muted-foreground sm:text-[13px]">Todos os álbuns</p>
              </article>
            </div>
          ) : <p className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">Novos lançamentos serão exibidos aqui.</p>}
        </section>

        <section className="mt-12">
          <div className="mb-4"><h2 className="text-2xl font-semibold">Estilos musicais</h2><p className="mt-1 text-sm text-muted-foreground">Explore artistas por gênero musical.</p></div>
          {genres.length ? (
            <div aria-label="Estilos musicais" className="-mx-4 flex snap-x snap-proximity touch-pan-x gap-2.5 overflow-x-auto overscroll-x-contain scroll-smooth px-4 pb-4 music-desktop-scroll [-webkit-overflow-scrolling:touch] sm:mx-0 sm:gap-3 sm:px-0">
              {genres.map(genre => {
                const GenreIcon = getMusicGenreIcon(genre.name);
                const count = genreCounts.get(genre.id) ?? 0;
                return (
                  <Link key={genre.id} href={musicPath(pathPrefix, "estilo", genre.slug)} className="group flex w-[138px] shrink-0 snap-start flex-col items-start gap-1.5 rounded-xl border border-border bg-card p-2.5 transition-colors hover:border-primary/40 hover:bg-muted/40 sm:w-[150px]">
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                      <GenreIcon className="size-[18px]" strokeWidth={1.65} />
                    </span>
                    <span className="min-w-0">
                      <span className="block w-full truncate text-[13px] font-medium">{genre.name}</span>
                      <span className="mt-0.5 block text-[10px] text-muted-foreground">{count} {count === 1 ? "artista" : "artistas"}</span>
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
