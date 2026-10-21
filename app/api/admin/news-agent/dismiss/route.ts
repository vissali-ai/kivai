import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/blog/auth";
import { apiError } from "@/lib/blog/api";
import { dismissEditorialSuggestion, restoreEditorialSuggestion } from "@/lib/news-agent/editorial-dismissals";
import { normalizeSuggestionUrl } from "@/lib/news-agent/editorial-links";

export async function POST(request: Request) {
  try {
    await assertAdminApi();
    const body = await request.json() as { sourceUrl?: unknown };
    if (typeof body.sourceUrl !== "string" || body.sourceUrl.length > 2048) {
      return NextResponse.json({ error: "Link de sugestão inválido." }, { status: 400 });
    }
    await dismissEditorialSuggestion(normalizeSuggestionUrl(body.sourceUrl));
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return apiError(error); }
}
export async function DELETE(request: Request) {
  try {
    await assertAdminApi();
    const body = await request.json() as { sourceUrl?: unknown };
    if (typeof body.sourceUrl !== "string" || body.sourceUrl.length > 2048) {
      return NextResponse.json({ error: "Link de sugestão inválido." }, { status: 400 });
    }
    await restoreEditorialSuggestion(normalizeSuggestionUrl(body.sourceUrl));
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return apiError(error); }
}
