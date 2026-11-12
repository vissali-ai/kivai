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
    const model = "gemini-3.8-flash";
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/interactions",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        cache: "no-store",
        signal: AbortSignal.timeout(50_000),
        body: JSON.stringify({
          model,
          input: [
            { type: "text", text: instruction },
            { type: "video", uri: url },
          ],
          generation_config: { temperature: 0.1 },
        }),
      },
    );

    if (!response.ok) {
      // Log only the HTTP status; never log response body, credentials, or video URLs.
      console.warn("[kivai-video-preview] interactions provider status", response.status);
      if (response.status === 429) return fail("O limite de uso da API Gemini foi atingido. Tente novamente mais tarde.", 429);
      if (response.status === 503 || response.status === 502 || response.status === 504)
        return fail("O serviço Gemini está temporariamente indisponível (503). Tente novamente mais tarde.", 503);
      if (response.status === 401 || response.status === 403)
        return fail("A chave Gemini do ambiente de teste não tem permissão para processar este modelo.", 503);
      if (response.status === 400 || response.status === 404 || response.status === 422)
        return fail("O modelo Gemini não conseguiu aceitar este link do YouTube. Verifique se o vídeo é público e está acessível.", 422);
      return fail("O Gemini não concluiu a análise. Código HTTP " + response.status + ".", 503);
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
