import { authenticateBillingUser } from "@/lib/billing/sumup";
import { reserveAiCredits, finalizeAiCredits } from "@/lib/ai/credits";
import { reserveAiRequest } from "@/lib/ai/limits";
import { getSocialEvidence, parseSocialLink } from "@/lib/ai/post-link";
import { analyzePostTextImages, analyzeYoutubeVideo, postAnalyzerInput } from "@/lib/ai/post-analyzer";

export const runtime = "nodejs";
export const maxDuration = 60;
const headers = { "Cache-Control": "private, no-store" };
function fail(error: string, status: number, extra: Record<string, unknown> = {}) {
  return Response.json({ error, ...extra }, { status, headers });
}

export async function POST(request: Request) {
  let userId: string;
  try { userId = (await authenticateBillingUser(request)).id; }
  catch { return fail("Entre na sua conta para analisar publicações com IA.", 401); }

  let input;
  try {
    if (Number(request.headers.get("content-length")) > 2_900_000) return fail("O envio excedeu o limite de 2,9 MB para imagens processadas.", 413);
    const raw = await request.text();
    if (Buffer.byteLength(raw) > 2_900_000) return fail("Reduza o número ou tamanho das imagens.", 413);
    const parsed = postAnalyzerInput.safeParse(JSON.parse(raw));
    if (!parsed.success) return fail("Confira o link, os campos e os arquivos enviados.", 400);
    input = parsed.data;
  } catch { return fail("Dados inválidos.", 400); }

  const link = input.url ? parseSocialLink(input.url) : null;
  if (input.status === "published" && !link) return fail("Informe um link público válido de uma rede social compatível.", 400);
  if (input.url && !link) return fail("Este link não pertence a uma rede social compatível.", 400);
  if (input.status === "draft" && !input.caption && !input.images.length && !link) return fail("Envie o rascunho ou informe o texto que deseja analisar.", 400);
  for (const image of input.images) {
    const bytes = Buffer.from(image.data, "base64");
    if (bytes.length > 480_000 || bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) return fail("Imagem processada inválida ou acima do limite.", 400);
  }
  if (input.videoFrames && !input.images.length) return fail("Não foi possível extrair quadros do vídeo. Tente outro arquivo.", 400);

  const operationId = crypto.randomUUID();
  const wantsVideo = Boolean(link?.network === "youtube" && link.videoId && !input.images.length);
  const cost: 1 | 2 = input.images.length ? 2 : 1;
  let reserved = false;
  try {
    const reserve = await reserveAiCredits({ userId, operationId, kind: cost === 2 ? "import" : "insight", cost });
    if (!reserve.allowed) return fail("Créditos insuficientes para esta análise. Consulte seu saldo.", 402);
    reserved = true;
    if (!(await reserveAiRequest(userId))) return fail("Limite temporário de IA atingido. Seu crédito será devolvido.", 429);

    const evidence = link ? await getSocialEvidence(link) : { title: "", caption: "", author: "", source: "Rascunho fornecido pelo usuário" };
    const hasText = Boolean(evidence.title || evidence.caption || input.caption);
    const hasImages = Boolean(input.images.length);
    if (!hasText && !hasImages && !wantsVideo) {
      return fail("A plataforma não disponibilizou a descrição para leitura automática. Envie o arquivo ou informe a legenda para continuar.", 422, { needsCaption: true });
    }

    let audiovisual = false;
    let result;
    if (wantsVideo && link) {
      try {
        result = await analyzeYoutubeVideo(input, evidence, "https://www.youtube.com/watch?v=" + link.videoId);
        audiovisual = true;
      } catch {
        // A análise por vídeo é opcional: não afirmar que o vídeo foi assistido.
        if (!hasText) return fail("Não foi possível acessar o vídeo. Envie o arquivo ou informe o conteúdo da publicação.", 422, { needsCaption: true });
      }
    }
    if (!result) result = await analyzePostTextImages(input, evidence);

    if (!(await finalizeAiCredits(userId, operationId, true))) throw Error("POST_ANALYZER_CREDIT_FINALIZATION");
    reserved = false;
    const covered = {
      description: Boolean(evidence.caption || input.caption),
      title: Boolean(evidence.title),
      visuals: audiovisual || hasImages,
      audio: audiovisual,
      videoFull: audiovisual,
    };
    const limitations = [
      ...(!covered.description ? ["A descrição da publicação não foi recuperada."] : []),
      ...(input.videoFrames ? ["Foram analisados quadros estáticos do vídeo, não seu áudio ou movimento contínuo."] : []),
      ...(!covered.visuals ? ["Não houve acesso ao conteúdo visual para esta análise."] : []),
      ...(!covered.audio && (wantsVideo || input.videoFrames) ? ["Falas, trilha sonora e ritmo audiovisual não foram verificados."] : []),
      "Dados privados de retenção e alcance não estão disponíveis sem acesso autorizado à conta.",
    ];
    return Response.json({
      result, network: link?.network || "rascunho", source: evidence.source, covered, limitations,
      cost,
    }, { headers });
  } catch {
    return fail("Não foi possível concluir a análise. A reserva de créditos será devolvida.", 503);
  } finally {
    if (reserved) {
      try { await finalizeAiCredits(userId, operationId, false); }
      catch { console.error("[kivai-posts] Credit refund pending recovery"); }
    }
  }
}
