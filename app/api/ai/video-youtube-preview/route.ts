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

type GeminiResponse = {
  candidates?: Array<{ finishReason?: string; content?: { parts?: Array<{ text?: string }> } }>;
  error?: { code?: number };
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

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        cache: "no-store",
        signal: AbortSignal.timeout(52_000),
        body: JSON.stringify({
          contents: [{ role: "user", parts: [
            { fileData: { fileUri: url } },
            { text: instruction },
          ] }],
          generationConfig: { maxOutputTokens: mode === "transcript" ? 8192 : 3072, temperature: 0.1 },
        }),
      },
    );

    if (!response.ok) {
      console.warn("[kivai-video-preview] provider status", response.status);
      if (response.status === 429) return fail("Limite temporário do Gemini atingido.", 429);
      if (response.status === 400 || response.status === 404) return fail("O Gemini não conseguiu acessar esse vídeo ou o modelo não está disponível. Tente outro vídeo público.", 422);
      return fail("Falha temporária no processamento.", 503);
    }
    const json = await response.json() as GeminiResponse;
    const candidate = json.candidates?.[0];
    const result = candidate?.content?.parts?.map(p => p.text || "").join("").trim();
    if (!result || (candidate?.finishReason !== "STOP" && candidate?.finishReason !== "MAX_TOKENS")) {
      return fail("O Gemini não retornou texto utilizável.", 503);
    }
    return Response.json({
      text: result,
      mode,
      partial: candidate?.finishReason === "MAX_TOKENS",
      source: url,
      model: "gemini-3.8-flash",
    }, { headers });
  } catch {
    return fail("O processamento falhou ou excedeu o tempo disponível.", 503);
  }
}
