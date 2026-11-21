import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { listMusicAlbumsPage } from "@/lib/music/repository";
import { getMusicPathPrefix, musicPath } from "@/lib/music/paths";

type PageProps = {
  searchParams: Promise<{ page?: string }>;
};

export const metadata: Metadata = {
  title: "Todos os álbuns | Kivai Música",
  description: "Explore todos os álbuns publicados no Kivai Música, dos lançamentos mais recentes aos anteriores.",
  alternates: { canonical: "/musica/lancamentos" },
};

export default async function MusicReleasesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const requestedPage = Number.parseInt(params.page ?? "1", 10);
  const currentPage = Number.isFinite(requestedPage) ? Math.max(1, requestedPage) : 1;
  const [listing, pathPrefix] = await Promise.all([
    listMusicAlbumsPage(currentPage, 15),
    getMusicPathPrefix(),
  ]);
  const basePath = musicPath(pathPrefix, "lancamentos");
  const pageHref = (page: number) => page === 1 ? basePath : `${basePath}?page=${page}`;

  return (
    <main className="min-h-screen bg-background px-4 pb-28 pt-24 text-foreground sm:px-6 sm:pt-20">
      <div className="mx-auto max-w-6xl">
        <Link href={pathPrefix || "/"} className="inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-foreground">
          <ChevronLeft className="size-4" /> Voltar para músicas
        </Link>

        <header className="mb-7 mt-5">
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Catálogo completo</p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Todos os álbuns</h1>
          <p className="mt-2 text-sm text-muted-foreground">Confira os álbuns publicados, começando pelos lançamentos mais recentes.</p>
        </header>

        {listing.albums.length ? (
          <>
            <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-5">
              {listing.albums.map((album) => (
                <article key={album.id} className="group min-w-0">
                  <Link href={musicPath(pathPrefix, album.artist.slug, album.slug)} className="block">
                    <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
                      {album.coverUrl ? (
                        <Image
                          src={album.coverUrl}
                          alt={`Capa do álbum ${album.title}`}
                          fill
                          sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 18vw"
                          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        />
                      ) : null}
                    </div>
                    <h2 className="mt-2 truncate text-sm font-semibold">{album.title}</h2>
                  </Link>
                  <Link href={musicPath(pathPrefix, album.artist.slug)} className="mt-1 block truncate text-xs text-muted-foreground transition hover:text-primary hover:underline">
                    {album.artist.name}
                  </Link>
                </article>
              ))}
            </div>

            <nav aria-label="Paginação dos álbuns" className="mt-10 flex items-center justify-between border-t border-border pt-5">
              {listing.hasPrevious ? (
                <Link href={pageHref(currentPage - 1)} rel="prev" className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-border px-3 text-sm font-medium transition hover:bg-muted">
                  <ChevronLeft className="size-4" /> Anterior
                </Link>
              ) : <span />}
              <span className="text-sm tabular-nums text-muted-foreground">Página {currentPage}</span>
              {listing.hasNext ? (
                <Link href={pageHref(currentPage + 1)} rel="next" className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-border px-3 text-sm font-medium transition hover:bg-muted">
                  Próxima <ChevronRight className="size-4" />
                </Link>
              ) : <span />}
            </nav>
          </>
        ) : (
          <p className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">Ainda não há álbuns publicados nesta página.</p>
        )}
      </div>
    </main>
  );
}
