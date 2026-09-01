import { NextResponse } from "next/server";

const BASE_URL = "https://brasilapi.com.br/api/ncm/v1";
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_IP = 10;
const requestHistory = new Map<string, number[]>();

function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
function isAllowed(ip: string) {
  const now = Date.now();
  const recent = (requestHistory.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_REQUESTS_PER_IP) { requestHistory.set(ip, recent); return false; }
  recent.push(now); requestHistory.set(ip, recent); return true;
}
function normalizeCode(value: unknown) {
  if (typeof value !== "string") return null;
  const normalized = value.trim().replace(/\D/g, "");
  return /^\d{8}$/.test(normalized) ? normalized : null;
}
export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    if (!isAllowed(ip)) return NextResponse.json({ error: "Muitas consultas em pouco tempo. Aguarde um minuto e tente novamente." }, { status: 429, headers: { "Retry-After": "60" } });
    const body = (await request.json().catch(() => null)) as { code?: unknown } | null;
    const code = normalizeCode(body?.code);
    if (!code) return NextResponse.json({ error: "Informe um código NCM com 8 dígitos, com ou sem pontos." }, { status: 400 });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    let response: Response;
    try {
      response = await fetch(`${BASE_URL}/${encodeURIComponent(code)}`, { headers: { Accept: "application/json", "User-Agent": "Kivai-NCM/1.0 (+https://www.kivai.com.br)" }, cache: "no-store", signal: controller.signal });
    } finally { clearTimeout(timeout); }
    const payload = await response.json().catch(() => null);
    if (response.status === 404) return NextResponse.json({ error: "Código NCM não encontrado na base consultada." }, { status: 404 });
    if (response.status === 429) return NextResponse.json({ error: "A fonte de dados atingiu o limite de consultas. Aguarde alguns instantes e tente novamente." }, { status: 429 });
    if (!response.ok || !payload || typeof payload !== "object" || Array.isArray(payload)) return NextResponse.json({ error: "Não foi possível realizar a consulta agora. Tente novamente em alguns instantes." }, { status: 503 });
    return NextResponse.json(payload);
  } catch (error) {
    console.error("[consulta-ncm]", error);
    return NextResponse.json({ error: "Não foi possível realizar a consulta agora. Tente novamente em alguns instantes." }, { status: 503 });
  }
}