"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import { BarChart3, FileUp, ShieldCheck } from "lucide-react";
import {
  compareAuctionReports,
  parseAuctionInsightsCsv,
  type AuctionParticipant,
} from "@/lib/google-ads/auction-insights";

function pct(value: number | null) {
  return value === null ? "N/D" : value.toLocaleString("pt-BR", { maximumFractionDigits: 2 }) + "%";
}

function pp(value: number | null) {
  if (value === null) return "N/D";
  const plus = value > 0 ? "+" : "";
  return plus + value.toLocaleString("pt-BR", { maximumFractionDigits: 2 }) + " pp";
}

export function GoogleAdsAuctionCompare() {
  const [prior, setPrior] = useState<AuctionParticipant[] | null>(null);
  const [recent, setRecent] = useState<AuctionParticipant[] | null>(null);
  const [priorName, setPriorName] = useState("");
  const [recentName, setRecentName] = useState("");
  const [error, setError] = useState("");
  const changes = useMemo(() => prior && recent ? compareAuctionReports(prior, recent) : [], [prior, recent]);
  const alerts = useMemo(() => changes.filter((item) => item.state !== "unchanged"), [changes]);

  async function loadReport(event: ChangeEvent<HTMLInputElement>, which: "prior" | "recent") {
    const file = event.target.files?.[0];
    if (which === "prior") { setPrior(null); setPriorName(""); }
    else { setRecent(null); setRecentName(""); }
    setError("");
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv") || file.size > 5 * 1024 * 1024) {
      setError("Envie um arquivo CSV de Informações do leilão de até 5 MB.");
      event.target.value = "";
      return;
    }
    try {
      const participants = parseAuctionInsightsCsv(await file.text());
      if (which === "prior") { setPrior(participants); setPriorName(file.name); }
      else { setRecent(participants); setRecentName(file.name); }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível ler o relatório de leilão.");
    }
    event.target.value = "";
  }

  const stateLabel = {
    new_in_report: "Passou a aparecer neste relatório",
    not_in_current_report: "Não aparece no relatório atual",
    changed: "Parcela variou pelo menos 5 pp",
    unchanged: "Sem variação acima do limite de destaque",
  };

  return (
    <section className="mt-12" aria-labelledby="auction-title">
      <div className="flex items-center gap-2">
        <BarChart3 className="size-5 text-primary" aria-hidden="true" />
        <h2 id="auction-title" className="text-xl font-semibold">Novidades nas Informações do leilão</h2>
      </div>
      <p className="mt-2 max-w-4xl text-sm leading-7 text-muted-foreground">
        Compare dois relatórios exportados do Google Ads para ver quais domínios aparecem em cada período
        e como mudou a participação nas impressões. O acesso comum à Google Ads API não fornece
        publicamente todas as métricas detalhadas de concorrentes, por isso esta análise é por arquivo.
      </p>
      <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.035] p-5">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label htmlFor="auction-before" className="text-sm font-semibold">1. Relatório do período anterior</label>
            <input id="auction-before" type="file" accept=".csv,text/csv"
              onChange={(event) => loadReport(event, "prior")}
              className="mt-3 block w-full text-xs file:mr-3 file:rounded-lg file:border file:border-white/15 file:bg-background file:px-3 file:py-2 file:text-foreground" />
            {prior ? <p className="mt-2 text-xs text-muted-foreground">{priorName}: {prior.length} domínios.</p> : null}
          </div>
          <div>
            <label htmlFor="auction-after" className="text-sm font-semibold">2. Relatório do período atual</label>
            <input id="auction-after" type="file" accept=".csv,text/csv"
              onChange={(event) => loadReport(event, "recent")}
              className="mt-3 block w-full text-xs file:mr-3 file:rounded-lg file:border file:border-white/15 file:bg-background file:px-3 file:py-2 file:text-foreground" />
            {recent ? <p className="mt-2 text-xs text-muted-foreground">{recentName}: {recent.length} domínios.</p> : null}
          </div>
        </div>
        {error ? <p className="mt-4 text-sm text-red-400" role="alert">{error}</p> : null}
        <p className="mt-5 flex items-start gap-2 text-xs leading-6 text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
          Os arquivos são processados no navegador. Compare a mesma conta, campanha e modalidade,
          com períodos de duração equivalente. Diferenças de elegibilidade, volume, segmentação e
          limiares de exibição podem afetar a presença de um concorrente no relatório.
        </p>
        {prior && recent ? (
          <div className="mt-7">
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["Passaram a aparecer", changes.filter((item) => item.state === "new_in_report").length],
                ["Não aparecem agora", changes.filter((item) => item.state === "not_in_current_report").length],
                ["Variação de parcela ≥ 5 pp", changes.filter((item) => item.state === "changed").length],
              ].map(([label, count]) => (
                <div key={label} className="rounded-lg border border-white/10 bg-background p-3">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="mt-2 text-xl font-semibold tabular-nums">{count}</p>
                </div>
              ))}
            </div>
            <h3 className="mt-6 text-sm font-semibold">Alterações identificadas nos relatórios</h3>
            {alerts.length ? (
              <div className="mt-3 overflow-x-auto rounded-lg border border-white/10">
                <table className="min-w-[630px] w-full text-left text-xs">
                  <thead className="bg-background text-muted-foreground">
                    <tr><th className="p-3">Domínio exibido</th><th className="p-3">Anterior</th><th className="p-3">Atual</th><th className="p-3">Variação</th><th className="p-3">Interpretação</th></tr>
                  </thead>
                  <tbody>
                    {alerts.slice(0, 50).map((item) => (
                      <tr key={item.domain} className="border-t border-white/10">
                        <td className="p-3 font-medium">{item.domain}</td>
                        <td className="p-3 tabular-nums">{pct(item.oldShare)}</td>
                        <td className="p-3 tabular-nums">{pct(item.currentShare)}</td>
                        <td className="p-3 tabular-nums">{pp(item.difference)}</td>
                        <td className="p-3">{stateLabel[item.state]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="mt-3 rounded-lg border border-white/10 p-3 text-xs text-muted-foreground">Não foram encontradas alterações acima do limite de destaque. Isso não prova ausência de mudanças no leilão.</p>}
            <p className="mt-4 text-xs leading-6 text-muted-foreground">
              Os alertas mostram diferenças entre relatórios, não descobertas definitivas sobre
              estratégias, orçamento, custo por clique ou entrada de concorrentes no mercado.
              Variações a partir de 5 pontos percentuais recebem destaque por uma regra inicial do Kivai, não por um critério oficial do Google.
            </p>
          </div>
        ) : <p className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
          <FileUp className="size-4" aria-hidden="true" />
          Importe os dois relatórios para comparar.
        </p>}
      </div>
    </section>
  );
}
