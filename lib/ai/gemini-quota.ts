import "server-only";

export type GeminiQuotaKind = "minute" | "day" | "zero" | "spend" | "unknown";

export class GeminiQuotaError extends Error {
  readonly status = 429;
  constructor(
    readonly kind: GeminiQuotaKind,
    readonly retrySeconds: number | null,
  ) {
    const message = {
      minute: "Limite temporário de solicitações ou tokens do Gemini atingido. Aguarde um pouco e tente novamente.",
      day: "Cota diária do Gemini esgotada neste projeto. Confira as cotas no Google AI Studio e aguarde a renovação ou ajuste o plano.",
      zero: "A cota disponível para este modelo Gemini parece ser zero neste projeto. Confira os limites e o faturamento no Google AI Studio.",
      spend: "Limite financeiro de uso do Gemini atingido. Confira o saldo, a cobrança e os limites do projeto no Google AI Studio.",
      unknown: "O Gemini retornou HTTP 429. Verifique as cotas e o faturamento do projeto no Google AI Studio antes de repetir a solicitação.",
    }[kind];
    super(message);
    this.name = "GeminiQuotaError";
  }
}

type GoogleApiError = {
  error?: {
    code?: unknown;
    status?: unknown;
    message?: unknown;
    details?: Array<{
      "@type"?: unknown;
      retryDelay?: unknown;
      violations?: Array<{ quotaId?: unknown; quotaDimensions?: unknown; description?: unknown }>;
    }>;
  };
};
function parseSeconds(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return Math.max(0, Math.ceil(value));
  if (typeof value === "string") {
    const match = value.match(/^(\d+(?:\.\d+)?)(?:s)?$/);
    if (match) return Math.max(0, Math.ceil(Number(match[1])));
  }
  return null;
}
function safeString(value: unknown) {
  return typeof value === "string" ? value.slice(0, 500) : "";
}
export async function interpretGeminiQuota(response: Response, stage: "research" | "draft", model: string) {
  let payload: GoogleApiError = {};
  try { payload = await response.json() as GoogleApiError; } catch { /* Sem corpo JSON. */ }
  const err = payload.error;
  const quotaText = (err?.details || []).flatMap((detail) =>
    Array.isArray(detail.violations)
      ? detail.violations.map((item) => [safeString(item.quotaId),safeString(item.description)].join(" "))
      : [],
  ).join(" ");
  const evidence = [safeString(err?.status),safeString(err?.code),safeString(err?.message),quotaText].join(" ").toLowerCase();
  let kind: GeminiQuotaKind = "unknown";
  if (/\b(limit[:=]?\s*0|limit: 0|quota[^\s]*0|zero quota)\b/i.test(evidence)) kind = "zero";
  else if (/spend|billing|prepay|financial|payment|budget/.test(evidence)) kind = "spend";
  else if (/perday|per.day|daily|rpd|quota_exceeded/.test(evidence)) kind = "day";
  else if (/perminute|per.minute|minute|rpm|tpm|rate_limit_exceeded|too_many_requests/.test(evidence)) kind = "minute";

  const detailSeconds = (err?.details || []).map((d) => parseSeconds(d.retryDelay)).find((v) => v !== null) ?? null;
  const headerSeconds = parseSeconds(response.headers.get("Retry-After"));
  const retrySeconds = detailSeconds ?? headerSeconds;
  // Registro estruturado seguro: jamais registrar corpo completo, prompts, matérias ou a chave.
  console.warn("[kivai-editorial] Gemini usage limit", { stage, model, kind, retrySeconds });
  return new GeminiQuotaError(kind, retrySeconds);
}

export async function shortGeminiQuotaBackoff(err: GeminiQuotaError): Promise<boolean> {
  // Repetição curta só quando há indicação de bloqueio por minuto.
  // Não repetir cotas diárias, zero, financeiras ou causas indeterminadas.
  if (err.kind !== "minute" || (err.retrySeconds !== null && err.retrySeconds > 6)) return false;
  const waitMs = Math.min(6_000, Math.max(1_000, (err.retrySeconds ?? 1) * 1_000));
  await new Promise<void>((resolve) => setTimeout(resolve, waitMs));
  return true;
}
