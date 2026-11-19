import { listMusicCatalog } from "@/lib/music/repository";
import { getMusicPathPrefix, musicPath } from "@/lib/music/paths";

export async function GET() {
  try {
    const [catalog, prefix] = await Promise.all([listMusicCatalog(), getMusicPathPrefix()]);
    const items = catalog.flatMap(({ artist, albums }) => [
      {
        id: `artist:${artist.id}`,
        type: "artist" as const,
        title: artist.name,
        description: artist.bio?.slice(0, 180) || "Artista independente",
        href: musicPath(prefix, artist.slug),
        artist: "Artista",
      },
      ...albums.flatMap((album) => [
        {
          id: `album:${album.id}`,
          type: "album" as const,
          title: album.title,
          description: album.description?.slice(0, 180) || `${album.tracks.length} faixas`,
          href: musicPath(prefix, artist.slug, album.slug),
          artist: artist.name,
        },
        ...album.tracks.map((track) => ({
          id: `track:${track.id}`,
          type: "track" as const,
          title: track.title,
          description: `Faixa ${track.trackNumber} • ${album.title}`,
          href: musicPath(prefix, artist.slug, album.slug, track.slug),
          artist: artist.name,
        })),
      ]),
    ]);

    return Response.json({ items }, {
      headers: { "Cache-Control": "public, s-maxage=180, stale-while-revalidate=900" },
    });
  } catch {
    return Response.json({ items: [] }, {
      status: 200,
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" },
    });
  }
}
