import { authenticateBillingUser } from "@/lib/billing/sumup";
import { GeminiRequestError, requestGeminiJson } from "@/lib/ai/gemini";
import { reserveAiRequest } from "@/lib/ai/limits";
import {
  hasAnalyzableMetrics,
  socialReportInputSchema,
  socialReportInsightSchema,
} from "@/lib/ai/social-report";

export const runtime = "nodejs";
export const maxDuration = 30;

const responseHeaders = { "Cache-Control": "private, no-store" };
const instructions = [
  "Você é analista de métricas de redes sociais no Kivai.",
  "Responda APENAS um objeto JSON válido com as propriedades summary (string), strengths (array), attention (array), actions (array).",
  "Escreva em português brasileiro, tom profissional, claro e objetivo.",
  "Use somente os indicadores recebidos. Nunca invente números, comparações, metas, benchmarks ou causas.",
  "Taxas no input são porcentagens: não multiplique por cem novamente.",
  "Diferencie falta de dado (null) de zero medido (0).",
  "Quando não houver comparação, não afirme que houve crescimento ou queda.",
  "Faça recomendações práticas como hipóteses, não como fatos comprovados.",
  "Não repita identificadores pessoais nem solicite nomes de clientes.",
  "summary: até 80 palavras; strengths e attention: até 3 frases curtas; actions: entre 1 e 4 sugestões objetivas.",
].join("\n");

function error(message: string, status: number, retryAfter?: number) {
  return Response.json(
    { error: message },
    { status, headers: { ...responseHeaders, ...(retryAfter ? { "Retry-After": String(retryAfter) } : {}) } },
  );
}

export async function POST(request: Request) {
  // Authenticate BEFORE consuming any quota or contacting Gemini.
  let userId: string;
  try {
    userId = (await authenticateBillingUser(request)).id;
  } catch {
    return error("Faça login no Kivai para utilizar a análise com IA.", 401);
  }

  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > 6_000) {
    return error("Os indicadores enviados excedem o limite de tamanho.", 413);
  }
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return error("Dados inválidos.", 400);
  }

  const parsed = socialReportInputSchema.safeParse(json);
  if (!parsed.success || !hasAnalyzableMetrics(parsed.data)) {
    return error("Informe indicadores válidos para iniciar a análise.", 400);
  }

  try {
    const allowed = await reserveAiRequest(userId);
    if (!allowed) return error("Limite de análises com IA atingido. Tente novamente mais tarde.", 429, 3600);
    const result = await requestGeminiJson(instructions, parsed.data);
    const validated = socialReportInsightSchema.safeParse(result);
    if (!validated.success) return error("A análise não pôde ser validada. Tente novamente.", 503, 30);
    return Response.json({ analysis: validated.data }, { headers: responseHeaders });
  } catch (cause) {
    if (cause instanceof GeminiRequestError && cause.status === 429) {
      return error("A cota gratuita do Gemini está temporariamente limitada.", 429, 120);
    }
    if (cause instanceof GeminiRequestError && cause.status === 404) {
      return error("Os modelos do Gemini não estão disponíveis para este projeto. Tente novamente mais tarde.", 503, 60);
    }
    console.error("[kivai-ai] Análise Social Media indisponível");
    return error("Não foi possível gerar a análise agora. Tente novamente mais tarde.", 503, 30);
  }
}
