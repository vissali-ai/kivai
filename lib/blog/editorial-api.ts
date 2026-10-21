import { NextResponse } from "next/server";
import { GeminiQuotaError } from "@/lib/ai/gemini-quota";
import { GeminiRequestError } from "@/lib/ai/gemini";
import { apiError } from "@/lib/blog/api";

export function editorialApiError(error: unknown) {
  const headers: Record<string, string> = { "Cache-Control": "private, no-store" };
  if (error instanceof GeminiQuotaError) {
    if (error.retrySeconds !== null) headers["Retry-After"] = String(error.retrySeconds);
    return NextResponse.json({ error: error.message, code: "GEMINI_QUOTA_" + error.kind.toUpperCase(),
      retrySeconds: error.retrySeconds }, { status: 429, headers });
  }
  if (error instanceof GeminiRequestError) {
    return NextResponse.json({ error: error.status === 429
      ? "Limite de uso do Gemini atingido. Aguarde e confira as cotas do projeto antes de tentar novamente."
      : "O Gemini não conseguiu concluir a reportagem. Confira o modelo selecionado e tente novamente." },
    { status: error.status === 429 ? 429 : 503, headers });
  }
  return apiError(error);
}
