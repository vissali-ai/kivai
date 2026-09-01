import { NextResponse } from "next/server";
const BASE_URL = "https://brasilapi.com.br/api/registrobr/v1";
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_IP = 10;
const requestHistory = new Map<string, number[]>();
function getClientIp(request: Request) { const forwarded = request.headers.get("x-forwarded-for"); if (forwarded) return forwarded.split(",")[0].trim(); return request.headers.get("x-real-ip") ?? "unknown"; }
function isAllowed(ip: string) { const now = Date.now(); const recent = (requestHistory.get(ip) ?? []).filter((t) => now - t < WINDOW_MS); if (recent.length >= MAX_REQUESTS_PER_IP) { requestHistory.set(ip, recent); return false; } recent.push(now); requestHistory.set(ip, recent); if (requestHistory.size > 1000) { for (const [key, timestamps] of requestHistory) { if (timestamps.every((timestamp) => now - timestamp >= WINDOW_MS)) requestHistory.delete(key); } } return true; }
function normalizeDomain(value: unknown) { if (typeof value !== "string") return null; let domain = value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0].replace(/\.$/, ""); if (!domain || !domain.endsWith(".br")) return null; if (domain.length > 253 || !/^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(domain)) return null; return domain; }
export async function POST(request: Request) { try {
const body = (await request.json().catch(() => null)) as { domain?: unknown } | null; const domain = normalizeDomain(body?.domain); if (!domain) return NextResponse.json({ error: "Informe um domínio .br válido, como kivai.com.br." }, { status: 400 });
const ip = getClientIp(request); if (!isAllowed(ip)) return NextResponse.json({ error: "Muitas consultas em pouco tempo. Aguarde um minuto e tente novamente." }, { status: 429, headers: { "Retry-After": "60" } });
const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 10000); let response: Response;
try { response = await fetch(BASE_URL + "/" + encodeURIComponent(domain), { headers: { Accept: "application/json", "User-Agent": "Kivai-RegistroBR/1.0 (+https://www.kivai.com.br)" }, cache: "no-store", signal: controller.signal }); } finally { clearTimeout(timeout); }
const payload = await response.json().catch(() => null);
if (response.status === 400) return NextResponse.json({ error: "Domínio inválido ou não reconhecido pela fonte de consulta." }, { status: 400 });
if (response.status === 429) return NextResponse.json({ error: "A fonte de dados atingiu o limite de consultas. Aguarde alguns instantes e tente novamente." }, { status: 429 });
if (!response.ok || !payload || typeof payload !== "object" || Array.isArray(payload)) return NextResponse.json({ error: "Não foi possível realizar a consulta agora. Tente novamente em alguns instantes." }, { status: 503 });
return NextResponse.json(payload); } catch (error) { console.error("[verificador-dominio-br]", error); return NextResponse.json({ error: "Não foi possível realizar a consulta agora. Tente novamente em alguns instantes." }, { status: 503 }); } }