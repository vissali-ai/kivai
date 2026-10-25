import { authenticateBillingUser } from "@/lib/billing/sumup";
import { reserveAiCredits, finalizeAiCredits } from "@/lib/ai/credits";
import { reserveAiRequest } from "@/lib/ai/limits";
import { requestGeminiJsonParts } from "@/lib/ai/gemini";
import { creatorRequestSchema, postContentSchema, POST_CONTENT_INSTRUCTION, POST_CREDIT_COST } from "@/lib/post-creator/schema";
export const runtime = "nodejs";
export const maxDuration = 60;
const headers = { "Cache-Control": "private, no-store" };
const fail = (error: string, status: number) => Response.json({ error }, { status, headers });
export async function GET() { return Response.json({ costs: POST_CREDIT_COST }, { headers }); }
export async function POST(request: Request) {
  let userId: string;
  try { userId = (await authenticateBillingUser(request)).id; } catch { return fail("Entre na sua conta para gerar com IA.", 401); }
  let input;
  try { const raw = await request.text(); if (Buffer.byteLength(raw) > 16000) return fail("Reduza o briefing para continuar.", 413); input = creatorRequestSchema.parse(JSON.parse(raw)); }
  catch { return fail("Confira o briefing e autorize o envio para a IA.", 400); }
  if (!process.env.GEMINI_API_KEY) return fail("A geração com IA está temporariamente indisponível. Nenhum crédito foi consumido.", 503);
  const operationId = crypto.randomUUID(); let reserved = false;
  try {
    if (!(await reserveAiCredits({ userId, operationId, kind: "insight", cost: POST_CREDIT_COST.content })).allowed) return fail("Créditos insuficientes. Consulte o saldo ou compre créditos avulsos.", 402);
    reserved = true;
    if (!(await reserveAiRequest(userId))) return fail("Limite temporário de IA atingido. Aguarde e tente novamente. A reserva será devolvida.", 429);
    const result = { content: postContentSchema.parse(await requestGeminiJsonParts(POST_CONTENT_INSTRUCTION, [{ text: JSON.stringify(input.brief) }], 4096)) };
    if (!(await finalizeAiCredits(userId, operationId, true))) throw Error("FINALIZATION_FAILED");
    reserved = false;
    return Response.json(result, { headers });
  } catch { return fail("Não foi possível gerar ou validar o conteúdo. Sua reserva de créditos será devolvida. Tente novamente mais tarde.", 503); }
  finally { if (reserved) try { await finalizeAiCredits(userId, operationId, false); } catch { console.error("[kivai-ai] Post creator refund pending recovery"); } }
}
