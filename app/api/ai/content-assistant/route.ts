import { authenticateBillingUser } from "@/lib/billing/sumup";
import { requestGeminiJsonParts, GeminiRequestError } from "@/lib/ai/gemini";
import { reserveAiCredits, finalizeAiCredits } from "@/lib/ai/credits";
import { reserveAiRequest } from "@/lib/ai/limits";
import { contentAssistantInput, contentAssistantInstructions, validateAssistantOutput } from "@/lib/ai/content-assistant";

export const runtime = "nodejs";
export const maxDuration = 60;
const headers = { "Cache-Control": "private, no-store" };
const failure = (error: string, status: number) => Response.json({ error }, { status, headers });

export async function POST(request: Request) {
  let userId: string;
  try { userId = (await authenticateBillingUser(request)).id; }
  catch { return failure("Entre na sua conta para gerar conteúdo com IA.", 401); }
  let raw: string;
  try { raw = await request.text(); }
  catch { return failure("Não foi possível ler o briefing.", 400); }
  if (Buffer.byteLength(raw, "utf8") > 12000) return failure("O briefing está muito longo. Resuma os campos antes de continuar.", 413);
  let json: unknown;
  try { json = JSON.parse(raw); }
  catch { return failure("Briefing inválido.", 400); }
  const parsed = contentAssistantInput.safeParse(json);
  if (!parsed.success) return failure("Preencha tema, público, objetivo e rede; autorize o envio à IA e confira os limites dos campos.", 400);
  const operationId = crypto.randomUUID();
  let reserved = false;
  try {
    // Text generations share the wallet's existing insight category (1 credit).
    const reservation = await reserveAiCredits({ userId, operationId, kind: "insight", cost: 1 });
    if (!reservation.allowed) return failure("Seus créditos acabaram. Consulte seu saldo e os pacotes em Créditos.", 402);
    reserved = true;
    if (!(await reserveAiRequest(userId))) return failure("O limite de solicitações de IA foi atingido. Aguarde antes de tentar novamente; o crédito será devolvido.", 429);
    const briefing = { ...parsed.data, consent: undefined };
    const output = await requestGeminiJsonParts(contentAssistantInstructions(parsed.data.kind), [{ text: JSON.stringify(briefing) }], 4096);
    const result = validateAssistantOutput(parsed.data, output);
    const completed = await finalizeAiCredits(userId, operationId, true);
    if (!completed) throw new Error("CREDIT_FINALIZATION_FAILED");
    reserved = false;
    return Response.json(result, { headers });
  } catch (cause) {
    if (cause instanceof GeminiRequestError && cause.status === 429) return failure("A IA atingiu seu limite temporário. Tente novamente mais tarde; o crédito será devolvido.", 429);
    return failure("Não foi possível concluir a geração. O crédito reservado será devolvido. Tente novamente mais tarde.", 503);
  } finally {
    if (reserved) {
      try { await finalizeAiCredits(userId, operationId, false); }
      catch { console.error("[kivai-ai] Content assistant refund pending recovery"); }
    }
  }
}
