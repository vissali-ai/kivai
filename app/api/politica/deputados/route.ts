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
    if (!response.ok) throw Error("CAMARA_UNAVAILABLE");
    const payload = await response.json() as { dados?: unknown[] };
    return NextResponse.json({ dados: Array.isArray(payload.dados) ? payload.dados : [] });
  } catch {
    return NextResponse.json({ error: "A Câmara dos Deputados está indisponível. Tente novamente." }, { status: 503 });
  }
}
