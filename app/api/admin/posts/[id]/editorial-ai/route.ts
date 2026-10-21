import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/blog/auth";
import { apiError } from "@/lib/blog/api";
import { getPostById } from "@/lib/blog/repository";
import { generateEditorialBase, getEditorialBase, personalizeEditorialBase, saveEditorialBase } from "@/lib/blog/editorial-ai";

export const maxDuration = 90;
export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };
const headers = { "Cache-Control": "private, no-store" };

export async function GET(_request: Request, { params }: Context) {
  try {
    await assertAdminApi();
    const post = await getPostById((await params).id);
    if (!post) return NextResponse.json({ error: "Matéria não encontrada." }, { status: 404, headers });
    return NextResponse.json({ base: await getEditorialBase(post.id) }, { headers });
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request, { params }: Context) {
  try {
    await assertAdminApi();
    const post = await getPostById((await params).id);
    if (!post) return NextResponse.json({ error: "Matéria não encontrada." }, { status: 404, headers });
    const raw = await request.text();
    if (raw.length > 2500) return NextResponse.json({ error: "Instruções muito longas." }, { status: 413, headers });
    const body = JSON.parse(raw) as { action?: unknown; instructions?: unknown };
    if (body.action === "prepare-base") {
      if (!post.sourceUrl || !post.sourceName) {
        return NextResponse.json({ error: "Informe uma fonte editorial para preparar a matéria-base." }, { status: 400, headers });
      }
      const existing = await getEditorialBase(post.id);
      if (existing) return NextResponse.json({ base: existing, existing: true }, { headers });
      const generated = await generateEditorialBase({
        sourceUrl: post.sourceUrl, sourceTitle: post.title, sourceName: post.sourceName, excerpt: post.excerpt,
      });
      const base = await saveEditorialBase(post.id, generated);
      return NextResponse.json({ base, existing: false }, { headers });
    }
    if (body.action === "personalize") {
      const base = await getEditorialBase(post.id);
      if (!base) return NextResponse.json({ error: "Prepare primeiro a matéria-base a partir da fonte." }, { status: 409, headers });
      const instructions = typeof body.instructions === "string" ? body.instructions.trim() : "";
      if (instructions.length > 1200) return NextResponse.json({ error: "Limite de 1.200 caracteres nas orientações." }, { status: 400, headers });
      const article = await personalizeEditorialBase(base, instructions);
      return NextResponse.json({ article }, { headers });
    }
    return NextResponse.json({ error: "Ação editorial não reconhecida." }, { status: 400, headers });
  } catch (error) { return apiError(error); }
}
