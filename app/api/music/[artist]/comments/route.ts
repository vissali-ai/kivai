import { NextResponse } from "next/server";
import { authenticateBillingUser } from "@/lib/auth/authenticated-billing-user";
import { plainText } from "@/lib/blog/sanitize";
import { supabaseRest } from "@/lib/blog/supabase";
import { getMusicCatalogByArtist } from "@/lib/music/repository";

const headers = { "Cache-Control": "private, no-store" };
type CommentRow = { id: string; author_name: string; content: string; created_at: string };
const error = (message: string, status: number) => NextResponse.json({ error: message }, { status, headers });

export async function GET(_request: Request, { params }: { params: Promise<{ artist: string }> }) {
  try {
    const { artist: slug } = await params;
    const catalog = await getMusicCatalogByArtist(slug);
    if (!catalog) return error("Artista não encontrado.", 404);
    const comments = await supabaseRest<CommentRow[]>(`music_artist_comments?select=id,author_name,content,created_at&artist_id=eq.${encodeURIComponent(catalog.artist.id)}&status=eq.published&order=created_at.desc&limit=100`);
    return NextResponse.json({ comments }, { headers });
  } catch {
    return error("Não foi possível carregar os comentários agora.", 503);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ artist: string }> }) {
  let user: Awaited<ReturnType<typeof authenticateBillingUser>>;
  try { user = await authenticateBillingUser(request); }
  catch { return error("Entre na sua conta Kivai para comentar.", 401); }

  try {
    if (Number(request.headers.get("content-length") ?? 0) > 6000) return error("Comentário muito longo.", 413);
    const { artist: slug } = await params;
    const catalog = await getMusicCatalogByArtist(slug);
    if (!catalog) return error("Artista não encontrado.", 404);
    const body = await request.json() as { content?: unknown };
    if (typeof body.content !== "string" || body.content.length > 5000) return error("Escreva um comentário de até 1.000 caracteres.", 400);
    const content = plainText(body.content).trim();
    if (content.length < 3 || content.length > 1000) return error("O comentário deve ter entre 3 e 1.000 caracteres.", 400);

    const recent = await supabaseRest<Array<{ id: string }>>(`music_artist_comments?select=id&artist_id=eq.${encodeURIComponent(catalog.artist.id)}&user_id=eq.${encodeURIComponent(user.id)}&created_at=gte.${encodeURIComponent(new Date(Date.now() - 60_000).toISOString())}&limit=1`);
    if (recent.length) return error("Aguarde um minuto antes de enviar outro comentário para este artista.", 429);

    const metadata = user.user_metadata ?? {};
    const rawName = typeof metadata.full_name === "string" ? metadata.full_name : typeof metadata.name === "string" ? metadata.name : "Ouvinte";
    const authorName = plainText(rawName).trim().slice(0, 80) || "Ouvinte";
    await supabaseRest("music_artist_comments", {
      method: "POST",
      body: JSON.stringify({ artist_id: catalog.artist.id, user_id: user.id, author_name: authorName, content, status: "pending" }),
    });
    return NextResponse.json({ ok: true, message: "Comentário enviado para revisão antes de aparecer publicamente." }, { status: 201, headers });
  } catch {
    return error("Não foi possível enviar seu comentário agora. Tente novamente.", 503);
  }
}
