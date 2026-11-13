import { createHash } from "node:crypto";
import { supabaseRest } from "@/lib/blog/supabase";
import { authenticateBillingUser } from "@/lib/auth/authenticated-billing-user";

export const runtime = "nodejs";
export const maxDuration = 240;

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
  // Authenticated visitors use monthly plan allowances; anonymous preview visitors retain the trial rate cap.
  let quotaUserId: string | null = null;
  let quotaReserved = false;
  let completed = false;
  if (request.headers.get("authorization")?.startsWith("Bearer ")) {
    try {
      const user = await authenticateBillingUser(request);
      quotaUserId = user.id;
      const allowed = await supabaseRest<boolean>("rpc/kivai_reserve_video_study_usage",{
        method:"POST",body:JSON.stringify({p_user_id:user.id,p_kind:"summary"})
      });
      if (!allowed) return fail("Limite mensal de análises do seu plano atingido.",429);
      quotaReserved = true;
    } catch (error) {
      if (quotaUserId) return fail("Não foi possível validar a franquia mensal.",503);
      return fail("Faça login novamente para continuar.",401);
    }
  }
  // Anonymous preview: 12 attempts per IP, 30 globally per day, at most 3 successful analyses per IP.
  const ip = request.headers.get("x-real-ip") || request.headers.get("x-vercel-forwarded-for")?.split(",")[0] || "unknown";
  const key = createHash("sha256")
    .update(`${process.env.ADMIN_AUTH_SECRET ?? "preview"}:${ip}`)
    .digest("hex");
  if (!quotaUserId) try {
    const allowed = await supabaseRest<boolean>("rpc/reserve_ai_video_preview", {
      method: "POST",
      body: JSON.stringify({ p_client_key: key }),
    });
    if (!allowed) return fail("Limite diário de segurança atingido (12 tentativas por visitante ou 30 globais, com máximo de 3 resultados concluídos).", 429);
  } catch { return fail("O controle de acesso temporário está indisponível.", 503); }

  try {
    // Public YouTube links must use the video input type in the Interactions API.
    // The previous generateContent fileData request returned HTTP 503.
    // Validated with this project's free-tier key in a Vercel preview smoke test.
    const model = "gemini-3.5-flash-lite";
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      cache: "no-store",
      signal: AbortSignal.timeout(180_000),
      body: JSON.stringify({
        model,
        input: [
          { type: "text", text: instruction },
          { type: "video", uri: url },
        ],
      }),
    });
    if (!response.ok) {
      console.warn("[kivai-video-preview] Gemini HTTP", model, response.status);
      if (response.status === 429) return fail("O limite gratuito do Gemini foi atingido (429).", 429);
      if ([502,503,504].includes(response.status)) return fail("O processamento do vídeo está temporariamente indisponível no Gemini (HTTP " + response.status + ").", 503);
      if ([400,404,422].includes(response.status)) return fail("O Gemini não aceitou este link de vídeo (HTTP " + response.status + "). Verifique se o vídeo é público.", 422);
      return fail("A API de vídeo do Gemini retornou HTTP " + response.status + ".", 503);
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
    try {
      const recorded = quotaUserId ? true : await supabaseRest<boolean>("rpc/record_ai_video_preview_success", {
        method: "POST",
        body: JSON.stringify({ p_client_key: key }),
      });
      if (!recorded) console.warn("[kivai-video-preview] completed request without quota record");
    } catch {
      console.warn("[kivai-video-preview] quota completion record failed");
    }
    completed = true;
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
  } finally {
    if (quotaUserId && quotaReserved && !completed) {
      try { await supabaseRest("rpc/kivai_refund_video_study_usage",{method:"POST",body:JSON.stringify({p_user_id:quotaUserId,p_kind:"summary"})}); }
      catch { console.warn("[kivai-video-preview] could not refund failed monthly analysis"); }
    }

  }
}
