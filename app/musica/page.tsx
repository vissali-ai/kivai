import Link from "next/link";
import Image from "next/image";
import { listMusicCatalog } from "@/lib/music/repository";
import { getMusicPathPrefix, musicPath } from "@/lib/music/paths";
import { StreamingHomeActions } from "@/components/music/streaming-home-actions";

export default async function MusicPage() {
  const [catalog, pathPrefix] = await Promise.all([listMusicCatalog(), getMusicPathPrefix()]);
  const isStreamingHome = pathPrefix === "";

  return (
    <main className="min-h-screen bg-background px-4 pb-28 pt-24 text-foreground sm:px-6">
      <div className="mx-auto max-w-6xl">
        {isStreamingHome ? (
          <section className="mb-10 rounded-2xl border border-border bg-card/70 p-5 sm:p-7">
            <h1 className="font-heading text-2xl font-semibold sm:text-3xl">
              Quer sua música aqui? Entre em contato.
            </h1>
            <StreamingHomeActions />
          </section>
        ) : null}

        <p className="text-xs font-semibold uppercase tracking-[.2em] text-primary">Kivai apresenta</p>
        <h2 className="mt-2 font-heading text-3xl font-semibold sm:text-5xl">Música independente</h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">Conheça artistas e descubra novos álbuns.</p>

        <section className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {catalog.map(({ artist, albums }) => (
            <Link
              key={artist.id}
              href={musicPath(pathPrefix, artist.slug)}
              className="group overflow-hidden rounded-2xl border border-border bg-card"
            >
              <div className="relative aspect-[16/9] bg-muted">
                {(artist.coverUrl || artist.photoUrl) && (
                  <Image
                    src={artist.coverUrl || artist.photoUrl}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, 33vw"
                    className="object-cover transition-transform group-hover:scale-[1.02]"
                  />
                )}
              </div>
              <div className="p-5">
                <h3 className="text-xl font-semibold">{artist.name}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{artist.bio}</p>
                <p className="mt-4 text-xs text-primary">
                  {albums.length} {albums.length === 1 ? "álbum" : "álbuns"}
                </p>
              </div>
            </Link>
          ))}
        </section>

        {!catalog.length && (
          <p className="mt-8 rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
            Em breve, novos artistas no Kivai Música.
          </p>
        )}
      </div>
    </main>
  );
}
