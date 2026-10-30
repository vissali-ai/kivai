import { NextResponse } from "next/server";

export const maxDuration = 25;

const BASE = "https://api.portaldatransparencia.gov.br/api-de-dados/emendas";

/**
 * Consulta exploratória à API da CGU. Não atribui emendas a municípios:
 * o endpoint de listagem geral não comprova local de aplicação ou favorecido.
 * O filtro municipal só poderá ser ativado depois de validar o contrato oficial.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const ano = Number(url.searchParams.get("ano"));
  const pagina = Number(url.searchParams.get("pagina") ?? "1");
  if (!Number.isInteger(ano) || ano < 2014 || ano > new Date().getFullYear() || !Number.isInteger(pagina) || pagina < 1 || pagina > 100) {
    return NextResponse.json({ error: "Ano ou página inválidos." }, { status: 400 });
  }
  const key = process.env.PORTAL_TRANSPARENCIA_API_KEY;
  if (!key) {
    return NextResponse.json({
      error: "Integração da CGU ainda não configurada. Cadastre PORTAL_TRANSPARENCIA_API_KEY na Vercel.",
      status: "not_configured",
    }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
  try {
    const params = new URLSearchParams({ ano: String(ano), pagina: String(pagina) });
    const response = await fetch(BASE + "?" + params, {
      headers: { "chave-api-dados": key, Accept: "application/json" },
      next: { revalidate: 1800 },
      signal: AbortSignal.timeout(12000),
    });
    if (response.status === 401 || response.status === 403) return NextResponse.json({ error: "Credencial da API da CGU não autorizada.", status: "unauthorized" }, { status: 502 });
    if (!response.ok) {
      console.warn("[politica/emendas] CGU HTTP", response.status);
      return NextResponse.json({ error: "A CGU não respondeu à consulta solicitada.", status: "upstream_error" }, { status: 502 });
    }
    const data: unknown = await response.json();
    if (!Array.isArray(data)) return NextResponse.json({ error: "Formato inesperado da API da CGU.", status: "invalid_response" }, { status: 502 });
    return NextResponse.json({
      dados: data,
      escopo: "Consulta geral de emendas por ano e página, ainda NÃO filtrada por município.",
      ano, pagina, parcial: true,
      fonte: "https://api.portaldatransparencia.gov.br/swagger-ui/index.html",
    }, { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800" } });
  } catch (error) {
    console.warn("[politica/emendas] Falha de comunicação", error instanceof Error ? error.name : "unknown");
    return NextResponse.json({ error: "Falha de comunicação com a API da CGU.", status: "timeout_or_network" }, { status: 503 });
  }
}
