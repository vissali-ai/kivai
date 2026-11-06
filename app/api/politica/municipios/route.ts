import { NextResponse } from "next/server";
export const maxDuration = 20;
type Municipio = { id: number; nome: string; microrregiao?: { mesorregiao?: { UF?: { sigla?: string } } }; "regiao-imediata"?: { "regiao-intermediaria"?: { UF?: { sigla?: string } } } };
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams;
  const uf = (q.get("uf") ?? "").toUpperCase();
  if (!/^[A-Z]{2}$/.test(uf)) return NextResponse.json({ error: "Escolha uma UF válida." }, { status: 400 });
  try {
    const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`, { next: { revalidate: 86400 }, signal: AbortSignal.timeout(9000) });
    if (!response.ok) throw Error("IBGE_HTTP_" + response.status);
    const data = await response.json() as Municipio[];
    return NextResponse.json({ municipios: data.map(({id,nome})=>({ id, nome })).sort((a,b)=>a.nome.localeCompare(b.nome,"pt-BR")), fonte: "IBGE" }, { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } });
  } catch (error) {
    console.warn("[politica/municipios] IBGE:", error instanceof Error ? error.name : "unknown");
    return NextResponse.json({ error: "Não foi possível carregar os municípios oficiais. Tente novamente." }, { status: 503 });
  }
}
