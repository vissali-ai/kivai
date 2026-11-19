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
    <main className="min-h-screen bg-background px-4 pb-36 pt-24 text-foreground sm:px-6 sm:pt-28 xl:px-10">
      <div className="mx-auto max-w-[1600px]">
        <section id="recentes" className="mt-3">
          <div className="mb-5">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Mais recentes</h1>
            <p className="mt-1 text-sm text-muted-foreground">Descubra os lançamentos mais recentes do catálogo.</p>
          </div>
          {recentAlbums.length ? (
            <>
              <div aria-label="Álbuns recentes" className="-mx-4 flex snap-x snap-proximity touch-pan-x gap-3 overflow-x-auto overscroll-x-contain scroll-smooth px-4 pb-4 [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:gap-4 sm:px-0 md:hidden">
                {recentAlbums.map(album => (
                  <article key={album.id} dir="ltr" className="group w-[38vw] max-w-[156px] shrink-0 snap-start sm:w-[168px]">
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
              <div aria-label="Álbuns recentes" className="hidden grid-cols-3 gap-x-5 gap-y-8 md:grid lg:grid-cols-4 2xl:grid-cols-6">
                {recentAlbums.map(album => (
                  <article key={album.id} className="group min-w-0">
                    <Link href={musicPath(pathPrefix, album.artist.slug, album.slug)} className="block">
                      <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl">
                        {album.coverUrl ? <Image src={album.coverUrl} alt={`Capa do álbum ${album.title}`} fill sizes="(max-width: 1024px) 33vw, (max-width: 1536px) 25vw, 16vw" className="object-cover transition-transform duration-500 group-hover:scale-105" /> : null}
                      </div>
                      <h3 className="mt-3 truncate text-sm font-semibold sm:text-base">{album.title}</h3>
                    </Link>
                    <Link href={musicPath(pathPrefix, album.artist.slug)} className="mt-1 block truncate text-sm text-muted-foreground transition-colors hover:text-primary hover:underline">{album.artist.name}</Link>
                  </article>
                ))}
              </div>
            </>
          ) : <p className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">Novos lançamentos serão exibidos aqui.</p>}
        </section>

        <section id="estilos" className="mt-14">
          <div className="mb-5">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Estilos musicais</h2>
            <p className="mt-1 text-sm text-muted-foreground">Explore artistas por gênero musical.</p>
          </div>
          {genres.length ? (
            <>
              <div aria-label="Estilos musicais" className="-mx-4 flex snap-x snap-proximity touch-pan-x gap-2.5 overflow-x-auto overscroll-x-contain scroll-smooth px-4 pb-4 [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:gap-3 sm:px-0 md:hidden">
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
              <div aria-label="Estilos musicais" className="hidden grid-cols-2 gap-3 md:grid lg:grid-cols-4 2xl:grid-cols-5">
                {genres.map(genre => {
                  const GenreIcon = getMusicGenreIcon(genre.name);
                  const count = genreCounts.get(genre.id) ?? 0;
                  return (
                    <Link key={genre.id} href={musicPath(pathPrefix, "estilo", genre.slug)} className="group flex min-h-[112px] items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:bg-muted/40">
                      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                        <GenreIcon className="size-5" strokeWidth={1.65} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{genre.name}</span>
                        <span className="mt-1 block text-xs text-muted-foreground">{count} {count === 1 ? "artista" : "artistas"}</span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            </>
          ) : <p className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">Os estilos musicais serão publicados em breve.</p>}
        </section>
      </div>
    </main>
  );
