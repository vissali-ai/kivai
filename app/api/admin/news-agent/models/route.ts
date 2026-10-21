import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/blog/auth";
import { apiError } from "@/lib/blog/api";
import { GEMINI_FREE_TEXT_MODELS } from "@/lib/ai/free-models";

export const dynamic = "force-dynamic";
type GeminiModelInfo = { name?: string; supportedGenerationMethods?: string[] };
export async function GET() {
  try {
    await assertAdminApi();
    const key = process.env.GEMINI_API_KEY;
    if (!key) return NextResponse.json({
      models: GEMINI_FREE_TEXT_MODELS.map((model) => ({ ...model, available: false })),
      verified: false, message: "Chave Gemini indisponível no servidor.",
    }, { headers: { "Cache-Control": "private, no-store" } });

    // Consulta de catálogo: não gera texto, não usa Google Search e não revela a chave.
    let upstream: Response;
    try {
      upstream = await fetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000", {
        method: "GET", cache: "no-store", signal: AbortSignal.timeout(10_000),
        headers: { "x-goog-api-key": key },
      });
    } catch { throw new Error("Catálogo do Gemini indisponível. Tente novamente."); }
    if (!upstream.ok) throw new Error("Não foi possível conferir o catálogo desta chave Gemini.");
    const data = await upstream.json() as { models?: GeminiModelInfo[] };
    const allowed = new Set((data.models || []).filter((model) =>
      model.supportedGenerationMethods?.includes("generateContent")
    ).map((model) => model.name?.replace(/^models\//, "")).filter(Boolean));
    return NextResponse.json({
      models: GEMINI_FREE_TEXT_MODELS.map((model) => ({ ...model, available: allowed.has(model.id) })),
      verified: true,
      message: "Modelo listado para esta chave não garante cota disponível ou que a conta esteja na modalidade gratuita.",
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return apiError(error); }
}
