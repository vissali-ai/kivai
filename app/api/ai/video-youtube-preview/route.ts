import { createHash } from "node:crypto";
import { supabaseRest } from "@/lib/blog/supabase";

export const runtime = "nodejs";
export const maxDuration = 60;

const headers = { "Cache-Control": "private, no-store" };
const fail = (error: string, status: number) => Response.json({ error }, { status, headers });

function youtubeUrl(raw: unknown): string | null {
  if (typeof raw !== "string" || raw.length > 300) return null;
  let url: URL;
  try { url = new URL(raw.trim()); } catch { return null; }
  if (url.protocol !== "https:") return null;
  const host = url.hostname.toLowerCase();
  let id: string | null = null;
  if (host === "youtu.be") id = url.pathname.slice(1).split("/")[0];
  else if (["youtube.com", "www.youtube.com", "m.youtube.com"].includes(host)) {
    if (url.pathname === "/watch") id = url.searchParams.get("v");
    else if (/^\/(shorts|live)\//.test(url.pathname)) id = url.pathname.split("/")[2];
  }
  if (!id || !/^[A-Za-z0-9_-]{11}$/.test(id)) return null;
  return `https://www.youtube.com/watch?v=${id}`;
}

type GeminiInteraction = {
  status?: string;
  steps?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }>;
};

export async function POST(request: Request) {
  // Anonymous API access is strictly limited to preview deployments.
  if (process.env.VERCEL_ENV !== "preview") return fail("Disponível somente na prévia de testes.", 404);

  let input: { url?: unknown; mode?: unknown; consent?: unknown };
  try {
    const raw = await request.text();
    if (Buffer.byteLength(raw, "utf8") > 1024) return fail("Solicitação inválida.", 413);
    input = JSON.parse(raw);
  } catch { return fail("Dados inválidos.", 400); }

  const url = youtubeUrl(input?.url);
  const mode = input?.mode;
  if (!url || (mode !== "summary" && mode !== "transcript") || input?.consent !== true) {
    return fail("Informe um link público válido do YouTube e autorize o envio para a IA.", 400);
  }
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return fail("A IA não está configurada neste ambiente de teste.", 503);

  const instruction = mode === "summary"
    ? "Analise o vídeo fornecido. Produza em português do Brasil: título curto, resumo fiel em até 5 parágrafos, lista de 5 a 10 tópicos principais e, quando possível, referências temporais [mm:ss]. Não invente informações nem timestamps. Se o vídeo não puder ser acessado ou não houver informações suficientes, explique isso em vez de criar um resumo."
    : "Transcreva em português do Brasil a fala audível do vídeo inteiro, na sequência original. Preserve o máximo possível as palavras ditas, sem resumir nem acrescentar informações. Marque [mm:ss] apenas quando tiver segurança e identifique interlocutores somente quando for possível. Se houver trechos inaudíveis escreva [inaudível]. Se o vídeo for muito longo para uma transcrição completa, informe explicitamente que o resultado é parcial. Nunca invente falas. Responda somente com a transcrição e eventuais ressalvas.";
  // Persisted daily quota: 3 attempts per IP, 30 overall. Failed requests count too.
  const ip = request.headers.get("x-real-ip") || request.headers.get("x-vercel-forwarded-for")?.split(",")[0] || "unknown";
  const key = createHash("sha256")
    .update(`${process.env.ADMIN_AUTH_SECRET ?? "preview"}:${ip}`)
    .digest("hex");
  try {
    const allowed = await supabaseRest<boolean>("rpc/reserve_ai_video_preview", {
      method: "POST",
      body: JSON.stringify({ p_client_key: key }),
    });
    if (!allowed) return fail("Limite diário gratuito do teste atingido. Tente novamente amanhã.", 429);
  } catch { return fail("O controle de acesso temporário está indisponível.", 503); }

  try {
    // Public YouTube links must use the video input type in the Interactions API.
    // The previous generateContent fileData request returned HTTP 503.
    const models = ["gemini-3.8-flash", "gemini-3.7-flash"] as const;
    let response: Response | null = null;
    let model: string = models[0];
    const startedAt = Date.now();
    for (const candidate of models) {
      model = candidate;
      // Keep both attempts inside the same function timeout.
      const remaining = 48_000 - (Date.now() - startedAt);
      if (remaining < 8_000) break;
      response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        cache: "no-store",
        signal: AbortSignal.timeout(remaining),
        body: JSON.stringify({
          model: candidate,
          input: [
            { type: "text", text: instruction },
            { type: "video", uri: url },
          ],
        }),
      });
      if (response.ok) break;
      console.warn("[kivai-video-preview] Gemini HTTP status", candidate, response.status);
      // Retry only temporary service failures, once, using another supported model.
      if (![502, 503, 504].includes(response.status)) break;
    }
    if (!response) return fail("O Gemini não respondeu dentro do tempo de teste.", 504);
    if (!response.ok) {
      if (response.status === 429) return fail("A cota do Gemini foi atingida (429). Não é um erro no seu link.", 429);
      if ([502, 503, 504].includes(response.status))
        return fail("O Gemini continua indisponível (HTTP " + response.status + ") nos modelos testados. Não foi possível processar o vídeo.", 503);
      if ([401, 403].includes(response.status))
        return fail("A chave do ambiente de teste não possui autorização para este modelo Gemini (HTTP " + response.status + ").", 503);
      if ([400, 404, 422].includes(response.status))
        return fail("O Gemini recusou a solicitação (HTTP " + response.status + "). O vídeo pode estar inacessível ou o modelo não suporta esta entrada.", 422);
      return fail("O Gemini retornou HTTP " + response.status + ".", 503);
    }

    const interaction = await response.json() as GeminiInteraction;
    const texts = interaction.steps
      ?.filter(step => step.type === "model_output")
      .flatMap(step => step.content ?? [])
      .filter(item => item.type === "text" && typeof item.text === "string")
      .map(item => item.text?.trim() ?? "")
      .filter(Boolean) ?? [];
    const result = texts.join("\n\n").trim();
    if (!result) {
      console.warn("[kivai-video-preview] empty interactions response", interaction.status ?? "unknown");
      return fail("A IA respondeu, mas não gerou texto utilizável. Tente um vídeo público mais curto.", 503);
    }
    return Response.json({
      text: result,
      mode,
      partial: interaction.status !== "completed",
      source: url,
      model,
    }, { headers });
  } catch (cause) {
    if (cause instanceof Error && (cause.name === "TimeoutError" || cause.name === "AbortError"))
      return fail("O Gemini excedeu o tempo de resposta do teste. Experimente um vídeo menor.", 504);
    console.error("[kivai-video-preview] video analysis request failed");
    return fail("Não foi possível concluir a análise. O serviço pode estar temporariamente indisponível.", 503);
  }
}
