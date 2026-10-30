import { NextResponse } from "next/server";

export const maxDuration = 40;
const CAMARA = "https://dadosabertos.camara.leg.br/api/v2";
const ALTERNATIVE = "https://fiscalizeopoder.com.br/api/v1";

type Deputy = { id: number; nome: string; siglaPartido?: string; siglaUf?: string; fonte: "camara" | "fiscalize" };

function normalize(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.filter((v): v is Record<string, unknown> => !!v && typeof v === "object");
  if (!value || typeof value !== "object") return [];
  const object = value as Record<string, unknown>;
  for (const key of ["dados", "data", "parlamentares", "items", "results"]) {
    if (Array.isArray(object[key])) return normalize(object[key]);
  }
  return [];
}
function text(value: unknown) { return typeof value === "string" ? value : ""; }
function mapAlternative(record: Record<string, unknown>): Deputy | null {
  const candidateId = Number(record.idCamara ?? record.id_camara ?? record.idDeputado ?? record.id_deputado ?? record.camara_id ?? record.id);
  const nome = text(record.nome ?? record.nomeParlamentar ?? record.nome_parlamentar ?? record.nomeCivil ?? record.nome_civil);
  if (!Number.isSafeInteger(candidateId) || candidateId <= 0 || !nome) return null;
  return {
    id: candidateId, nome,
    siglaPartido: text(record.siglaPartido ?? record.sigla_partido ?? record.partido),
    siglaUf: text(record.siglaUf ?? record.sigla_uf ?? record.uf ?? record.estado),
    fonte: "fiscalize",
  };
}
async function getJson(url: string, timeout: number) {
  const response = await fetch(url, { next: { revalidate: 900 }, signal: AbortSignal.timeout(timeout), headers: { Accept: "application/json" } });
  if (!response.ok) throw Error(`PROVIDER_HTTP_${response.status}`);
  return response.json() as Promise<unknown>;
}
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams;
  const nome = (q.get("nome") ?? "").trim().slice(0, 100);
  const uf = (q.get("uf") ?? "").trim().toUpperCase();
  if (nome.length < 2 || (uf && !/^[A-Z]{2}$/.test(uf)))
    return NextResponse.json({ error: "Informe ao menos dois caracteres de nome e uma UF válida." }, { status: 400 });
  const params = new URLSearchParams({ nome, itens: "100", ordem: "ASC", ordenarPor: "nome" });
  if (uf) params.set("siglaUf", uf);
  try {
    const response = await getJson(`${CAMARA}/deputados?${params}`, 7000);
    const dados = normalize(response) as unknown as Deputy[];
    return NextResponse.json({ dados, fonte: "Câmara dos Deputados" }, { headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600" } });
  } catch (error) {
    console.warn("[politica/deputados] fonte oficial sem resposta:", error instanceof Error ? error.name : "unknown");
  }
  // Somente consulta de API. Não há importação de base ou gravação no Supabase.
  // A API auxiliar deve informar identificadores da Câmara para que os votos usem a fonte primária.
  const alternativeParams = new URLSearchParams({ nome, limite: "100" });
  if (uf) alternativeParams.set("uf", uf);
  try {
    const response = await getJson(`${ALTERNATIVE}/parlamentares?${alternativeParams}`, 6500);
    const cleanName = nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
    const dados = normalize(response).map(mapAlternative).filter((d): d is Deputy => d !== null).filter(d => {
      const normalized = d.nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
      return normalized.includes(cleanName) && (!uf || (d.siglaUf ?? "").toUpperCase() === uf);
    });
    if (dados.length) return NextResponse.json({ dados, fonte: "Fiscalize o Poder (dados derivados de fontes públicas)", aviso: "A API oficial não respondeu; resultados obtidos de fonte pública auxiliar." }, { headers: { "Cache-Control": "public, s-maxage=300" } });
  } catch (error) {
    console.warn("[politica/deputados] consulta auxiliar falhou:", error instanceof Error ? error.name : "unknown");
  }
  return NextResponse.json({ error: "As fontes de consulta não responderam. Não há dados locais e não exibimos resultados sem confirmação. Tente novamente mais tarde." }, { status: 503, headers: { "Retry-After": "60" } });
}
