import { NextResponse } from "next/server";

export const maxDuration = 60;
const BASE = "https://dadosabertos.camara.leg.br/api/v2";
const FALLBACK = "https://fiscalizeopoder.com.br/api/v1";
type Vote = { idDeputado?: number; tipoVoto?: string; dataRegistroVoto?: string };
type VotePage = { dados?: Vote[] };
type Ballot = { id: string; data?: string; dataHoraRegistro?: string; descricao?: string; aprovacao?: number; siglaOrgao?: string };
type RecordVote = { votacao: Ballot; voto: string; dataRegistroVoto?: string };
async function fromCamara<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE}${path}`, { next: { revalidate: 3600 }, signal: AbortSignal.timeout(8500) });
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
    const params = new URLSearchParams({ dataInicio: `${year}-01-01`, dataFim: `${year}-12-31`, itens: "8", ordem: "DESC", ordenarPor: "dataHoraRegistro" });
    const listing = await fromCamara<{ dados?: Ballot[] }>(`/votacoes?${params}`);
    const ballots = Array.isArray(listing.dados) ? listing.dados.slice(0, 15) : [];
    // Amostra limitada para evitar centenas de chamadas por visitante; votos são paginados por deputado.
    const matches: RecordVote[] = [];
    const failures: string[] = [];
    for (let start = 0; start < ballots.length; start += 5) {
      const batch = await Promise.allSettled(ballots.slice(start, start + 5).map(async votacao => {
        // A Câmara não garante paginação nesse endpoint; consultar uma vez só.
        const response = await fromCamara<VotePage>(`/votacoes/${encodeURIComponent(votacao.id)}/votos`);
        const found = (response.dados ?? []).find(v => Number(v.idDeputado) === id);
        return found ? { votacao, voto: found.tipoVoto ?? "Não informado", dataRegistroVoto: found.dataRegistroVoto } : null;
      }));
      batch.forEach((result, index) => {
        if (result.status === "fulfilled" && result.value) matches.push(result.value);
        if (result.status === "rejected") failures.push(ballots[start + index].id);
      });
    }
    return NextResponse.json({
      dados: matches.sort((a,b) => (b.votacao.dataHoraRegistro ?? b.votacao.data ?? "").localeCompare(a.votacao.dataHoraRegistro ?? a.votacao.data ?? "")),
      totalVotacoesAmostradas: ballots.length, consultasIndisponiveis: failures.length,
      limite: "Amostra das 8 votações mais recentes retornadas pela Câmara no ano escolhido. Não representa o histórico completo. Apenas votos nominais registrados são exibidos.",
      fonte: "https://dadosabertos.camara.leg.br/swagger/api.html",
    });
  } catch (error) {
    console.warn("[politica/votos] Falha da Câmara:", error instanceof Error ? error.name : "unknown");
    try {
      const response = await fetch(FALLBACK + "/parlamentares/" + id + "/votos", {
        next: { revalidate: 1800 }, signal: AbortSignal.timeout(8500), headers: { Accept: "application/json" },
      });
      if (!response.ok) throw Error("FALLBACK_HTTP_" + response.status);
      const payload: unknown = await response.json();
      const root = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
      const data = Array.isArray(payload) ? payload : [root.dados, root.votos, root.items, root.results, root.data].find(Array.isArray) ?? [];
      const rows = (data as unknown[]).filter((item): item is Record<string, unknown> => !!item && typeof item === "object");
      const matches = rows.flatMap(row => {
        const nested = row.votacao && typeof row.votacao === "object" ? row.votacao as Record<string, unknown> : {};
        const voteId = row.idVotacao ?? row.id_votacao ?? nested.id;
        const date = String(row.data ?? row.dataVotacao ?? nested.data ?? "");
        const voto = String(row.voto ?? row.tipoVoto ?? row.tipo_voto ?? "");
        if (!voteId || !voto || Number(date.slice(0,4)) !== year) return [];
        return [{ votacao: { id: String(voteId), data: date, descricao: String(row.descricao ?? nested.descricao ?? row.ementa ?? "") }, voto }];
      }).slice(0,30);
      if (matches.length) return NextResponse.json({
        dados: matches, totalVotacoesAmostradas: matches.length, consultasIndisponiveis: 0,
        limite: "Registros retornados pela API pública auxiliar para o ano escolhido. Não representam o histórico completo.",
        fonte: "https://fiscalizeopoder.com.br/dados",
      }, { headers: { "Cache-Control": "public, s-maxage=900" } });
      console.warn("[politica/votos] Sem registros compatíveis da API auxiliar para o ano", year);
    } catch (secondary) {
      console.warn("[politica/votos] Falha da API auxiliar:", secondary instanceof Error ? secondary.message : "unknown");
    }
    return NextResponse.json({ error: "As APIs de votações não retornaram registros verificáveis. Tente novamente mais tarde." }, { status: 503 });
  }
}
