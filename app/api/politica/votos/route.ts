import { NextResponse } from "next/server";

export const maxDuration = 60;
const BASE = "https://dadosabertos.camara.leg.br/api/v2";
type Vote = { idDeputado?: number; tipoVoto?: string; dataRegistroVoto?: string };
type VotePage = { dados?: Vote[]; links?: Array<{ rel?: string; href?: string }> };
type Ballot = { id: string; data?: string; dataHoraRegistro?: string; descricao?: string; aprovacao?: number; siglaOrgao?: string };
type RecordVote = { votacao: Ballot; voto: string; dataRegistroVoto?: string };
async function fromCamara<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE}${path}`, { next: { revalidate: 3600 }, signal: AbortSignal.timeout(14000) });
  if (!response.ok) throw Error("CAMARA_UNAVAILABLE");
  return response.json() as Promise<T>;
}
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams;
  const id = Number(q.get("id"));
  const year = Number(q.get("ano") ?? new Date().getFullYear());
  const currentYear = new Date().getFullYear();
  if (!Number.isSafeInteger(id) || id <= 0 || !Number.isInteger(year) || year < 2015 || year > currentYear)
    return NextResponse.json({ error: "Deputado ou ano inválido." }, { status: 400 });
  try {
    const params = new URLSearchParams({ dataInicio: `${year}-01-01`, dataFim: `${year}-12-31`, itens: "30", ordem: "DESC", ordenarPor: "dataHoraRegistro" });
    const listing = await fromCamara<{ dados?: Ballot[] }>(`/votacoes?${params}`);
    const ballots = Array.isArray(listing.dados) ? listing.dados.slice(0, 15) : [];
    // Amostra limitada para evitar centenas de chamadas por visitante; votos são paginados por deputado.
    const matches: RecordVote[] = [];
    const failures: string[] = [];
    for (let start = 0; start < ballots.length; start += 5) {
      const batch = await Promise.allSettled(ballots.slice(start, start + 5).map(async votacao => {
        for (let page = 1; page <= 8; page++) {
          const response = await fromCamara<VotePage>(`/votacoes/${encodeURIComponent(votacao.id)}/votos?itens=100&pagina=${page}`);
          const found = (response.dados ?? []).find(v => Number(v.idDeputado) === id);
          if (found) return { votacao, voto: found.tipoVoto ?? "Não informado", dataRegistroVoto: found.dataRegistroVoto };
          if (!response.links?.some(link => link.rel === "next")) return null;
        }
        throw Error("VOTE_PAGINATION_LIMIT");
      }));
      batch.forEach((result, index) => {
        if (result.status === "fulfilled" && result.value) matches.push(result.value);
        if (result.status === "rejected") failures.push(ballots[start + index].id);
      });
    }
    return NextResponse.json({
      dados: matches.sort((a,b) => (b.votacao.dataHoraRegistro ?? b.votacao.data ?? "").localeCompare(a.votacao.dataHoraRegistro ?? a.votacao.data ?? "")),
      totalVotacoesAmostradas: ballots.length, consultasIndisponiveis: failures.length,
      limite: "Amostra das 15 votações mais recentes retornadas pela Câmara no ano escolhido. Não representa o histórico completo. Apenas votos nominais registrados são exibidos.",
      fonte: "https://dadosabertos.camara.leg.br/swagger/api.html",
    });
  } catch {
    return NextResponse.json({ error: "Não foi possível consultar as votações na Câmara. Tente novamente." }, { status: 503 });
  }
}
