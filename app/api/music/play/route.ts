import { NextResponse } from "next/server";
import { supabaseRest } from "@/lib/blog/supabase";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  try {
    const body = await request.json() as { trackId?: string };
    const trackId = String(body.trackId ?? "");
    if (!uuid.test(trackId)) return NextResponse.json({ error: "Faixa inválida." }, { status: 400 });
    const count = await supabaseRest<number>("rpc/record_music_play", {
      method: "POST",
      body: JSON.stringify({ p_track_id: trackId }),
      headers: { "Cache-Control": "no-store" },
    });
    return NextResponse.json({ playCount: Number(count ?? 0) }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Não foi possível registrar a reprodução." }, { status: 500 });
  }
}
