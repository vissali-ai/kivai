import { NextResponse } from "next/server";
import { getMusicTrack } from "@/lib/music/repository";

export async function GET(_request: Request, { params }: { params: Promise<{ artist: string; album: string; track: string }> }) {
  const { artist, album, track } = await params;
  const result = await getMusicTrack(artist, album, track);
  if (!result) return NextResponse.json({ error: "Música não encontrada." }, { status: 404 });
  return NextResponse.json(result, { headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300" } });
}
