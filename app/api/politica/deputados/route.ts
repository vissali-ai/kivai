import { NextResponse } from "next/server";

const BASE = "https://dadosabertos.camara.leg.br/api/v2";
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams;
  const nome = (q.get("nome") ?? "").trim().slice(0, 100);
  const uf = (q.get("uf") ?? "").trim().toUpperCase();
  if (nome.length < 2 || (uf && !/^[A-Z]{2}$/.test(uf)))
    return NextResponse.json({ error: "Informe ao menos dois caracteres de nome e uma UF válida." }, { status: 400 });
  const params = new URLSearchParams({ nome, itens: "100", ordem: "ASC", ordenarPor: "nome" });
  if (uf) params.set("siglaUf", uf);
  try {
    const response = await fetch(`${BASE}/deputados?${params}`, { next: { revalidate: 1800 }, signal: AbortSignal.timeout(12000) });
    if (response.status === 404) return NextResponse.json({ dados: [], aviso: "Nenhum deputado localizado na consulta atual da Câmara. Ex-parlamentares podem não aparecer nesta pesquisa." });
    if (!response.ok) {
      console.warn("[politica/deputados] Câmara retornou HTTP", response.status);
      return NextResponse.json({ error: "Não foi possível consultar a base da Câmara neste momento. Tente novamente mais tarde." }, { status: 502 });
    }
    const payload = await response.json() as { dados?: unknown[] };
    return NextResponse.json({ dados: Array.isArray(payload.dados) ? payload.dados : [] });
  } catch (error) {
    console.warn("[politica/deputados] Falha de conexão com a fonte oficial", error instanceof Error ? error.name : "unknown");
    return NextResponse.json({ error: "Falha de comunicação com a Câmara. Tente novamente mais tarde." }, { status: 503 });
  }
}
