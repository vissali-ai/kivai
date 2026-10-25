import { authenticateBillingUser } from "@/lib/billing/sumup";
import { reserveAiCredits, finalizeAiCredits } from "@/lib/ai/credits";
import { reserveAiRequest } from "@/lib/ai/limits";
import { requestGeminiJsonParts, GeminiRequestError } from "@/lib/ai/gemini";
import { proofreaderInput, proofreaderOutput, proofreaderInstructions } from "@/lib/ai/text-proofreader";

export const runtime = "nodejs";
export const maxDuration = 60;
const headers = { "Cache-Control": "private, no-store" };
const failure = (error: string, status: number) => Response.json({ error }, { status, headers });

export async function POST(request: Request) {
  let userId: string;
  try { userId = (await authenticateBillingUser(request)).id; }
  catch { return failure("Entre na sua conta para corrigir textos com IA.", 401); }

  let input;
  try {
    const raw = await request.text();
    if (Buffer.byteLength(raw, "utf8") > 28000) return failure("O texto excede o tamanho permitido.", 413);
    const parsed = proofreaderInput.safeParse(JSON.parse(raw));
    if (!parsed.success) return failure("Informe um texto de 10 a 8.000 caracteres e autorize a análise.", 400);
    input = parsed.data;
  } catch { return failure("Não foi possível ler o texto informado.", 400); }

  const operationId = crypto.randomUUID();
  let reserved = false;
  try {
    const reservation = await reserveAiCredits({ userId, operationId, kind: "insight", cost: 1 });
    if (!reservation.allowed) return failure("Créditos insuficientes. Consulte seu saldo na área de Créditos.", 402);
    reserved = true;
    if (!(await reserveAiRequest(userId))) return failure("Limite temporário de solicitações atingido. O crédito será devolvido.", 429);

    const output = await requestGeminiJsonParts(proofreaderInstructions, [{ text: JSON.stringify({ text: input.text, tone: input.tone }) }], 4096);
    const result = proofreaderOutput.parse(output);
    if (!(await finalizeAiCredits(userId, operationId, true))) throw Error("PROOFREADER_CREDIT_FINALIZATION");
    reserved = false;
    return Response.json({ result, cost: 1 }, { headers });
  } catch (error) {
    if (error instanceof GeminiRequestError && error.status === 429) return failure("A IA atingiu um limite temporário. Seu crédito será devolvido.", 429);
    return failure("Não foi possível concluir a correção. Seu crédito reservado será devolvido.", 503);
  } finally {
    if (reserved) {
      try { await finalizeAiCredits(userId, operationId, false); }
      catch { console.error("[kivai-proofreader] Credit refund pending recovery"); }
    }
  }
}
