import { authenticateBillingUser } from "@/lib/billing/sumup";
import { requestGeminiJsonParts, type GeminiInputPart } from "@/lib/ai/gemini";
import { reserveAiCredits, finalizeAiCredits } from "@/lib/ai/credits";
import { reserveAiRequest } from "@/lib/ai/limits";
import { toolAssistantInput, toolInstructions, validateToolOutput } from "@/lib/ai/tool-assistant";
export const runtime = "nodejs";
export const maxDuration = 60;
const headers = { "Cache-Control": "private, no-store" };
const fail = (error: string, status: number) => Response.json({ error }, { status, headers });
export async function POST(request: Request) {
  let userId: string;
  try { userId = (await authenticateBillingUser(request)).id; } catch { return fail("Entre na sua conta para usar a IA.", 401); }
  let parsed;
  try {
    if (Number(request.headers.get("content-length")) > 2_900_000) return fail("Arquivo muito grande para IA.", 413);
    const raw = await request.text();
    if (Buffer.byteLength(raw) > 2_900_000) return fail("Arquivo muito grande para IA. Reduza as páginas.", 413);
    parsed = toolAssistantInput.safeParse(JSON.parse(raw));
  } catch { return fail("Dados inválidos.", 400); }
  if (!parsed.success) return fail("Confira os campos, limites e autorização de envio.", 400);
  const input = parsed.data;
  const attachment = input.kind === "caption" ? input.image : input.kind === "table" || input.kind === "document" ? input.file : undefined;
  if (attachment) {
    const bytes = Buffer.from(attachment.data, "base64");
    const isPdf = attachment.mimeType === "application/pdf";
    if (bytes.length > 2_000_000 || (isPdf ? bytes.subarray(0,5).toString() !== "%PDF-" : bytes[0] !== 255 || bytes[1] !== 216 || bytes[2] !== 255)) return fail("Arquivo inválido ou acima de 2 MB.", 400);
    if ((input.kind === "caption") === isPdf) return fail("Formato incompatível.", 400);
    if (isPdf) {
      try {
        const { PDFDocument } = await import("pdf-lib");
        const pdf = await PDFDocument.load(bytes);
        if (pdf.getPageCount() < 1 || pdf.getPageCount() > 3) return fail("Envie de 1 a 3 páginas por geração.", 400);
      } catch { return fail("PDF inválido ou protegido. Confira o arquivo.", 400); }
    }
  }
  const cost = attachment ? 2 : 1;
  const operationId = crypto.randomUUID(); let reserved = false;
  try {
    if (!(await reserveAiCredits({userId, operationId, kind: attachment ? "import" : "insight", cost})).allowed) return fail("Créditos insuficientes. Consulte seu saldo.", 402);
    reserved = true;
    if (!(await reserveAiRequest(userId))) return fail("Limite temporário de IA atingido. Aguarde; a reserva será devolvida.", 429);
    const payload = { ...input, consent: undefined, image: undefined, file: undefined };
    const parts: GeminiInputPart[] = [{text: JSON.stringify(payload)}];
    if (attachment) parts.push({inlineData: attachment});
    const output = await requestGeminiJsonParts(toolInstructions(input.kind), parts, 4096);
    const result = validateToolOutput(input, output);
    if (!(await finalizeAiCredits(userId, operationId, true))) throw Error("FINALIZATION_FAILED");
    reserved = false;
    return Response.json(result, {headers});
  } catch { return fail("Não foi possível concluir ou validar o resultado. A reserva será devolvida. Tente com menos conteúdo.", 503); }
  finally { if (reserved) try { await finalizeAiCredits(userId, operationId, false); } catch { console.error("[kivai-ai] Tool refund pending recovery"); } }
}
