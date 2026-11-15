import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/blog/auth";
import { apiError } from "@/lib/blog/api";
import { supabaseRest } from "@/lib/blog/supabase";

type AdminComment = {
  id: string;
  artist_id: string;
  author_name: string;
  content: string;
  status: "pending" | "published" | "hidden";
  created_at: string;
  moderated_at: string | null;
  artist?: { name: string; slug: string };
};

export async function GET() {
  try {
    await assertAdminApi();
    const comments = await supabaseRest<AdminComment[]>("music_artist_comments?select=id,artist_id,author_name,content,status,created_at,moderated_at,artist:music_artists(name,slug)&order=created_at.desc&limit=300");
    return NextResponse.json({ comments }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (cause) {
    return apiError(cause);
  }
}

export async function PATCH(request: Request) {
  try {
    await assertAdminApi();
    const body = await request.json() as { id?: unknown; status?: unknown };
    const id = typeof body.id === "string" ? body.id : "";
    const status = body.status;
    if (!/^[0-9a-f-]{36}$/i.test(id) || !["pending", "published", "hidden"].includes(String(status))) {
      return NextResponse.json({ error: "Selecione um comentário e uma situação válidos." }, { status: 400, headers: { "Cache-Control": "no-store" } });
    }
    const rows = await supabaseRest<AdminComment[]>(`music_artist_comments?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify({ status, moderated_at: status === "pending" ? null : new Date().toISOString() }),
    });
    return NextResponse.json({ comment: rows[0] ?? null }, { headers: { "Cache-Control": "no-store" } });
  } catch (cause) {
    return apiError(cause);
  }
}

export async function DELETE(request: Request) {
  try {
    await assertAdminApi();
    const body = await request.json() as { id?: unknown };
    const id = typeof body.id === "string" ? body.id : "";
    if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Comentário inválido." }, { status: 400, headers: { "Cache-Control": "no-store" } });
    await supabaseRest(`music_artist_comments?id=eq.${encodeURIComponent(id)}`, { method: "DELETE", headers: { Prefer: "return=minimal" } });
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (cause) {
    return apiError(cause);
  }
}
