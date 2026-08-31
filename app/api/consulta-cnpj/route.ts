import { NextResponse } from "next/server";

const BRASIL_API_URL = "https://brasilapi.com.br/api/cnpj/v1";
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_IP = 10;
const requestHistory = new Map<string, number[]>();

type BrasilApiError = {
  name?: string;
  message?: string;
  type?: string;
};

function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();

  return request.headers.get("x-real-ip") ?? "unknown";
}

function isAllowed(ip: string) {
  const now = Date.now();
  const recent = (requestHistory.get(ip) ?? []).filter((timestamp) => now - timestamp < WINDOW_MS);

  if (recent.length >= MAX_REQUESTS_PER_IP) {
    requestHistory.set(ip, recent);
    return false;
  }

  recent.push(now);
  requestHistory.set(ip, recent);
  return true;
}

function normalizeCnpj(value: unknown) {
  if (typeof value !== "string") return null;

  const normalized = value
    .trim()
    .toUpperCase()
    .replace(/[.\/-]/g, "");

  if (!/^[0-9A-Z]{14}$/.test(normalized)) return null;

  return normalized;
}

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);

    if (!isAllowed(ip)) {
      return NextResponse.json(
        { error: "Muitas consultas em pouco tempo. Aguarde um minuto e tente novamente." },
        {
          status: 429,
          headers: { "Retry-After": "60", "Cache-Control": "no-store" },
        },
      );
    }

    const body = (await request.json().catch(() => null)) as { cnpj?: unknown } | null;
    const cnpj = normalizeCnpj(body?.cnpj);

    if (!cnpj) {
      return NextResponse.json(
        { error: "Informe um CNPJ válido com 14 caracteres." },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    let response: Response;

    try {
      response = await fetch(`${BRASIL_API_URL}/${encodeURIComponent(cnpj)}`, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    const payload = (await response.json().catch(() => null)) as Record<string, unknown> | BrasilApiError | null;

    if (response.status === 400) {
      return NextResponse.json(
        { error: "O CNPJ informado é inválido ou está mal formatado." },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }

    if (response.status === 404) {
      return NextResponse.json(
        { error: "CNPJ não encontrado na base consultada." },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      );
    }

    if (!response.ok || !payload || typeof payload !== "object") {
      return NextResponse.json(
        { error: "Não foi possível realizar a consulta agora. Tente novamente em alguns instantes." },
        { status: 503, headers: { "Cache-Control": "no-store", "Retry-After": "30" } },
      );
    }

    return NextResponse.json(payload, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return NextResponse.json(
        { error: "A consulta demorou mais que o esperado. Tente novamente." },
        { status: 504, headers: { "Cache-Control": "no-store", "Retry-After": "10" } },
      );
    }

    return NextResponse.json(
      { error: "Não foi possível realizar a consulta agora. Tente novamente em alguns instantes." },
      { status: 503, headers: { "Cache-Control": "no-store", "Retry-After": "30" } },
    );
  }
}
