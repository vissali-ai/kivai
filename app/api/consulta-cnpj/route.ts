import { NextResponse } from "next/server";

const BRASIL_API_URL = "https://brasilapi.com.br/api/cnpj/v1";
const MINHA_RECEITA_URL = "https://minhareceita.org";

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_IP = 10;
const PROVIDER_TIMEOUT_MS = 12_000;
const requestHistory = new Map<string, number[]>();

type ProviderResult = {
  response: Response;
  payload: Record<string, unknown> | null;
};

function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();

  return request.headers.get("x-real-ip") ?? "unknown";
}

function isAllowed(ip: string) {
  const now = Date.now();
  const recent = (requestHistory.get(ip) ?? []).filter(
    (timestamp) => now - timestamp < WINDOW_MS,
  );

  if (recent.length >= MAX_REQUESTS_PER_IP) {
    requestHistory.set(ip, recent);
    return false;
  }

  recent.push(now);
  requestHistory.set(ip, recent);

  // Evita crescimento indefinido do mapa em instâncias de longa duração.
  if (requestHistory.size > 1_000) {
    for (const [key, timestamps] of requestHistory) {
      if (timestamps.every((timestamp) => now - timestamp >= WINDOW_MS)) {
        requestHistory.delete(key);
      }
    }
  }

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

async function fetchProvider(url: string): Promise<ProviderResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "Kivai-CNPJ/1.1 (+https://www.kivai.com.br)",
      },
      cache: "no-store",
      signal: controller.signal,
    });

    const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;
    return { response, payload };
  } finally {
    clearTimeout(timeout);
  }
}

function isProviderUnavailable(status: number) {
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

function invalidCnpjResponse() {
  return NextResponse.json(
    { error: "O CNPJ informado é inválido ou está mal formatado." },
    { status: 400, headers: { "Cache-Control": "no-store" } },
  );
}

function notFoundResponse() {
  return NextResponse.json(
    { error: "CNPJ não encontrado na base consultada." },
    { status: 404, headers: { "Cache-Control": "no-store" } },
  );
}

function unavailableResponse() {
  return NextResponse.json(
    { error: "Não foi possível realizar a consulta agora. Tente novamente em alguns instantes." },
    { status: 503, headers: { "Cache-Control": "no-store", "Retry-After": "30" } },
  );
}

function successResponse(payload: Record<string, unknown>) {
  return NextResponse.json(payload, {
    status: 200,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as { cnpj?: unknown } | null;
    const cnpj = normalizeCnpj(body?.cnpj);

    if (!cnpj) {
      return NextResponse.json(
        { error: "Informe um CNPJ válido com 14 caracteres." },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }

    // O limite é aplicado somente a consultas válidas, evitando consumir
    // a cota do usuário com entradas inválidas.
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

    let brasilApiResult: ProviderResult | null = null;

    try {
      brasilApiResult = await fetchProvider(
        `${BRASIL_API_URL}/${encodeURIComponent(cnpj)}`,
      );
    } catch (error) {
      console.warn("[consulta-cnpj] BrasilAPI unavailable, trying fallback", error);
    }

    if (brasilApiResult) {
      const { response, payload } = brasilApiResult;

      if (response.status === 400) return invalidCnpjResponse();
      if (response.status === 404) return notFoundResponse();

      if (response.ok && payload && typeof payload === "object") {
        return successResponse(payload);
      }

      if (!isProviderUnavailable(response.status)) {
        return unavailableResponse();
      }
    }

    // Fallback: a Minha Receita expõe dados de CNPJ em estrutura compatível
    // com os campos já exibidos pela ferramenta.
    try {
      const { response, payload } = await fetchProvider(
        `${MINHA_RECEITA_URL}/${encodeURIComponent(cnpj)}`,
      );

      if (response.status === 400) return invalidCnpjResponse();
      if (response.status === 404) return notFoundResponse();

      if (response.ok && payload && typeof payload === "object") {
        return successResponse(payload);
      }

      if (response.status === 429) {
        return NextResponse.json(
          { error: "As fontes de consulta estão temporariamente limitadas. Aguarde alguns instantes e tente novamente." },
          {
            status: 429,
            headers: {
              "Cache-Control": "no-store",
              "Retry-After": response.headers.get("Retry-After") ?? "30",
            },
          },
        );
      }

      return unavailableResponse();
    } catch (error) {
      console.error("[consulta-cnpj] all providers failed", error);
      return unavailableResponse();
    }
  } catch (error) {
    console.error("[consulta-cnpj] request failed", error);
    return unavailableResponse();
  }
}
