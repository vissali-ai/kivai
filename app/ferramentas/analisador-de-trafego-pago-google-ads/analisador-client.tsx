"use client";

import Link from "next/link";
import { useMemo, useState, type ChangeEvent } from "react";
import { ArrowLeft, ArrowRight, Download, FileSpreadsheet, ShieldCheck, Target } from "lucide-react";
import { CampaignReportSection } from "@/components/tools/google-ads-campaign-report";
import { parseDelimited, parseReportNumber as numberFromInput } from "@/lib/google-ads/csv-utils";
import { normalizeReportLabel as normalize } from "@/lib/google-ads/campaign-types";

type SearchTerm = { term: string; clicks: number; cost: number; conversions: number };

function money(value: number) {
  return Number.isFinite(value) ? value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "Não calculado";
}

function formatCount(value: number) {
  return Number.isFinite(value) ? value.toLocaleString("pt-BR", { maximumFractionDigits: 1 }) : "Não calculado";
}

function parseSearchTerms(text: string): SearchTerm[] {
  const aliases = {
    term: ["termo de pesquisa", "termos de pesquisa", "search term", "termo pesquisado"],
    clicks: ["cliques", "clicks"],
    cost: ["custo", "cost"],
    conversions: ["conversoes", "conversions", "conv."],
  };
  for (const delimiter of [";", "\t", ","]) {
    const rows = parseDelimited(text.replace(/^\uFEFF/, ""), delimiter);
    const findIndex = (columns: string[], possible: string[]) =>
      columns.findIndex((column) => possible.includes(normalize(column)));
    const headerIndex = rows.findIndex((row) =>
      findIndex(row, aliases.term) >= 0 &&
      findIndex(row, aliases.clicks) >= 0 &&
      findIndex(row, aliases.cost) >= 0 &&
      findIndex(row, aliases.conversions) >= 0
    );
    if (headerIndex < 0) continue;
    const header = rows[headerIndex];
    const ids = {
      term: findIndex(header, aliases.term),
      clicks: findIndex(header, aliases.clicks),
      cost: findIndex(header, aliases.cost),
      conversions: findIndex(header, aliases.conversions),
    };
    return rows.slice(headerIndex + 1).map((row) => ({
      term: row[ids.term]?.trim() ?? "",
      clicks: numberFromInput(row[ids.clicks] ?? ""),
      cost: numberFromInput(row[ids.cost] ?? ""),
      conversions: numberFromInput(row[ids.conversions] ?? ""),
    })).filter((row) =>
      Boolean(row.term) &&
      Number.isFinite(row.clicks) && row.clicks >= 0 &&
      Number.isFinite(row.cost) && row.cost >= 0 &&
      Number.isFinite(row.conversions) && row.conversions >= 0 &&
      !["total", "totais", "total geral"].includes(normalize(row.term))
    );
  }
  throw new Error("Não encontrei colunas de Termo de pesquisa, Cliques, Custo e Conversões. Exporte o relatório de termos do Google Ads em CSV.");
}

function saveFile(name: string, body: string, mimeType: string) {
  const blob = new Blob([body], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const inputClass = "mt-1.5 w-full rounded-lg border border-white/15 bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary/60";
const fieldClass = "block text-xs font-medium text-muted-foreground";
const cardClass = "rounded-xl border border-white/10 bg-white/[0.035] p-5";

function Field({ label, value, onChange, placeholder, type = "text" }: {
  label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <label className={fieldClass}>
      {label}
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder} className={inputClass} />
    </label>
  );
}

export default function GoogleAdsTrafficAnalyzerClient() {
  const [client, setClient] = useState("");
  const [segment, setSegment] = useState("");
  const [city, setCity] = useState("");
  const [budget, setBudget] = useState("");
  const [targetLeads, setTargetLeads] = useState("");
  const [cpc, setCpc] = useState("");
  const [conversionRate, setConversionRate] = useState("");
  const [closeRate, setCloseRate] = useState("");
  const [ticket, setTicket] = useState("");
  const [fileName, setFileName] = useState("");
  const [terms, setTerms] = useState<SearchTerm[]>([]);
  const [fileError, setFileError] = useState("");
  const [minClicks, setMinClicks] = useState("10");
  const [minCost, setMinCost] = useState("50");

  const results = useMemo(() => {
    const investment = numberFromInput(budget), clickCost = numberFromInput(cpc);
    const leadRate = numberFromInput(conversionRate), salesRate = numberFromInput(closeRate);
    const averageTicket = numberFromInput(ticket), goal = numberFromInput(targetLeads);
    const validCore = investment > 0 && clickCost > 0 && leadRate > 0 && leadRate <= 100;
    const validSales = salesRate >= 0 && salesRate <= 100 && averageTicket >= 0;
    const clicks = validCore ? investment / clickCost : NaN;
    const leads = validCore ? clicks * leadRate / 100 : NaN;
    const sales = validCore && validSales ? leads * salesRate / 100 : NaN;
    const revenue = Number.isFinite(sales) ? sales * averageTicket : NaN;
    return {
      clicks, leads, sales, revenue,
      cpl: validCore ? investment / leads : NaN,
      roas: validCore && validSales ? revenue / investment : NaN,
      requiredBudget: goal > 0 && clickCost > 0 && leadRate > 0 && leadRate <= 100
        ? goal / (leadRate / 100) * clickCost : NaN,
    };
  }, [budget, targetLeads, cpc, conversionRate, closeRate, ticket]);

  const candidates = useMemo(() => {
    const clicksLimit = numberFromInput(minClicks);
    const costLimit = numberFromInput(minCost);
    if (!Number.isFinite(clicksLimit) || clicksLimit < 0 || !Number.isFinite(costLimit) || costLimit < 0) return [];
    return terms.filter((term) => term.conversions === 0 && term.clicks >= clicksLimit && term.cost >= costLimit)
      .sort((a, b) => b.cost - a.cost);
  }, [terms, minClicks, minCost]);

  const totals = useMemo(() => terms.reduce((acc, term) => ({
    clicks: acc.clicks + term.clicks, cost: acc.cost + term.cost, conversions: acc.conversions + term.conversions,
  }), { clicks: 0, cost: 0, conversions: 0 }), [terms]);

  async function onReport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setTerms([]); setFileName(""); setFileError("");
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setFileError("Limite de 5 MB por arquivo nesta versão."); event.target.value = ""; return;
    }
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setFileError("Envie um relatório CSV do Google Ads."); event.target.value = ""; return;
    }
    try {
      const report = parseSearchTerms(await file.text());
      if (!report.length) throw new Error("O arquivo não contém linhas válidas de termos de pesquisa.");
      setTerms(report); setFileName(file.name);
    } catch (error) {
      setFileError(error instanceof Error ? error.message : "Não foi possível analisar o CSV.");
    }
    event.target.value = "";
  }

  function exportPlan() {
    const plan = {
      titulo: "Planejamento inicial de tráfego pago",
      cliente: client, segmento: segment, localizacao: city,
      premissas: { investimento_mensal: budget, meta_leads: targetLeads, cpc_estimado: cpc,
        taxa_clique_para_lead_percentual: conversionRate, taxa_fechamento_percentual: closeRate, ticket_medio: ticket },
      simulacao: results,
      aviso: "Cenário matemático ilustrativo. Não representa previsão de mercado ou diagnóstico gerado por IA.",
    };
    saveFile("kivai-plano-trafego.json", JSON.stringify(plan, null, 2), "application/json;charset=utf-8");
  }

  function exportReview() {
    const header = "Termo de pesquisa;Cliques;Custo;Conversões;Situação";
    const rows = candidates.map((term) => [
      term.term, String(term.clicks), term.cost.toFixed(2).replace(".", ","), String(term.conversions),
      "Revisar manualmente; não negativar automaticamente",
    ].map((value) => '"' + value.replace(/"/g, '""') + '"').join(";"));
    saveFile("kivai-termos-para-revisao.csv", "\uFEFF" + [header, ...rows].join("\r\n"), "text/csv;charset=utf-8");
  }

  return (
    <main className="min-h-screen bg-background pb-16 pt-24 text-foreground">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Link href="/ferramentas/trafego-pago" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden="true" /> Voltar para Tráfego Pago
        </Link>
        <div className="mt-8 max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-wider text-primary">Seu analista de tráfego</p>
          <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">Analisador de Tráfego Pago Google Ads</h1>
          <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">
            Monte um plano mensal, importe métricas gerais de campanhas de qualquer modalidade e revise termos de pesquisa quando aplicável.
            Esta versão inicial analisa arquivos CSV localmente. A conexão com a API Google Ads e os diagnósticos com Gemini ainda não estão disponíveis.
          </p>
          <p className="mt-3 inline-flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="size-4 text-primary" aria-hidden="true" /> Os dados são tratados neste navegador, sem upload para o Kivai. Eles não são salvos automaticamente.
          </p>
        </div>

        <section className="mt-10" aria-labelledby="plano-title">
          <div className="flex items-center gap-2">
            <Target className="size-5 text-primary" aria-hidden="true" />
            <h2 id="plano-title" className="text-xl font-semibold">Plano mensal do cliente</h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Preencha o que souber. Campos não informados não serão adivinhados. Use premissas próprias para criar projeções editáveis.
          </p>
          <div className="mt-5 grid gap-6 lg:grid-cols-2">
            <div className={cardClass}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Cliente ou projeto" value={client} onChange={setClient} placeholder="Nome opcional" />
                <Field label="Segmento" value={segment} onChange={setSegment} placeholder="Ex.: Odontologia" />
                <div className="sm:col-span-2"><Field label="Cidade ou região de atendimento" value={city} onChange={setCity} placeholder="Ex.: Belo Horizonte e região" /></div>
                <Field label="Investimento mensal (R$)" value={budget} onChange={setBudget} placeholder="Ex.: 3000" />
                <Field label="Meta mensal de leads" value={targetLeads} onChange={setTargetLeads} placeholder="Ex.: 120" />
                <Field label="CPC estimado (R$)" value={cpc} onChange={setCpc} placeholder="Ex.: 5,50" />
                <Field label="Cliques que viram leads (%)" value={conversionRate} onChange={setConversionRate} placeholder="Ex.: 4" />
                <Field label="Leads que fecham (%)" value={closeRate} onChange={setCloseRate} placeholder="Ex.: 15" />
                <Field label="Ticket médio (R$)" value={ticket} onChange={setTicket} placeholder="Ex.: 1500" />
              </div>
              <button onClick={exportPlan} type="button" className="mt-6 inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2.5 text-sm font-medium hover:border-primary/50">
                <Download className="size-4" aria-hidden="true" /> Baixar planejamento
              </button>
            </div>
            <div className={cardClass}>
              <h3 className="text-base font-semibold">Simulação mensal</h3>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Estimativas aritméticas baseadas exclusivamente nos valores inseridos. Não são métricas reais, pesquisa regional nem promessa de retorno.
              </p>
              <dl className="mt-5 grid grid-cols-2 gap-4">
                {[
                  ["Cliques estimados", formatCount(results.clicks)],
                  ["Leads estimados", formatCount(results.leads)],
                  ["CPL projetado", money(results.cpl)],
                  ["Vendas estimadas", formatCount(results.sales)],
                  ["Receita simulada", money(results.revenue)],
                  ["ROAS projetado", Number.isFinite(results.roas) ? results.roas.toLocaleString("pt-BR", { maximumFractionDigits: 2 }) + "x" : "Não calculado"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg bg-background p-3">
                    <dt className="text-xs text-muted-foreground">{label}</dt>
                    <dd className="mt-1 text-lg font-semibold tabular-nums">{value}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-5 rounded-lg border border-primary/20 bg-primary/[0.055] p-4">
                <p className="text-sm font-medium">Investimento para alcançar a meta de leads</p>
                <p className="mt-1 text-xl font-semibold tabular-nums">{money(results.requiredBudget)}</p>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  Depende do CPC e da taxa de conversão informados. Resultados reais podem variar.
                </p>
              </div>
            </div>
          </div>
        </section>

        <CampaignReportSection />

        <section className="mt-12" aria-labelledby="relatorio-title">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="size-5 text-primary" aria-hidden="true" />
            <h2 id="relatorio-title" className="text-xl font-semibold">Revisão complementar de termos de pesquisa</h2>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">
            Exporte os termos de pesquisa do Google Ads em CSV, com colunas Termo de pesquisa, Cliques, Custo e Conversões.
            Este relatório complementa a visão de campanha quando há termos disponíveis. A análise usa limites definidos por você e apenas sinaliza termos para revisão, sem executar negativas.
          </p>
          <div className={cardClass + " mt-5"}>
            <label className="block text-sm font-medium" htmlFor="ads-csv">Importar relatório CSV (até 5 MB)</label>
            <input id="ads-csv" type="file" accept=".csv,text/csv" onChange={onReport} className="mt-3 block w-full text-xs file:mr-3 file:rounded-lg file:border file:border-white/15 file:bg-background file:px-3 file:py-2 file:text-foreground" />
            {fileError ? <p role="alert" className="mt-3 text-sm text-red-400">{fileError}</p> : null}
            {fileName ? <p className="mt-3 text-xs text-muted-foreground">Relatório carregado: {fileName} ({terms.length} termos)</p> : null}
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Mínimo de cliques para revisão" value={minClicks} onChange={setMinClicks} />
              <Field label="Custo mínimo sem conversão (R$)" value={minCost} onChange={setMinCost} />
            </div>
            {terms.length > 0 ? (
              <div className="mt-6">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg bg-background p-3"><p className="text-xs text-muted-foreground">Cliques no relatório</p><p className="mt-1 text-xl font-semibold">{formatCount(totals.clicks)}</p></div>
                  <div className="rounded-lg bg-background p-3"><p className="text-xs text-muted-foreground">Custo informado</p><p className="mt-1 text-xl font-semibold">{money(totals.cost)}</p></div>
                  <div className="rounded-lg bg-background p-3"><p className="text-xs text-muted-foreground">Termos para revisão</p><p className="mt-1 text-xl font-semibold">{candidates.length}</p></div>
                </div>
                <p className="mt-5 text-xs leading-5 text-muted-foreground">
                  Zero conversões não prova irrelevância. Antes de negativar, confira intenção de busca, janela de conversão, volume e possíveis bloqueios a termos rentáveis. O custo histórico não é economia garantida.
                </p>
                <div className="mt-4 overflow-x-auto rounded-lg border border-white/10">
                  <table className="min-w-[560px] w-full text-left text-sm">
                    <thead className="bg-background text-xs text-muted-foreground"><tr><th className="p-3">Termo para revisão</th><th className="p-3">Cliques</th><th className="p-3">Custo</th><th className="p-3">Conversões</th></tr></thead>
                    <tbody>
                      {candidates.slice(0, 100).map((term, index) => (
                        <tr key={term.term + index} className="border-t border-white/10">
                          <td className="p-3">{term.term}</td><td className="p-3 tabular-nums">{formatCount(term.clicks)}</td><td className="p-3 tabular-nums">{money(term.cost)}</td><td className="p-3 tabular-nums">{formatCount(term.conversions)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!candidates.length ? <p className="p-4 text-sm text-muted-foreground">Nenhum termo atende aos limites definidos.</p> : null}
                </div>
                <button onClick={exportReview} type="button" disabled={!candidates.length} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">
                  <Download className="size-4" aria-hidden="true" /> Exportar termos para revisão
                </button>
              </div>
            ) : null}
          </div>
        </section>
        <div className="mt-10 flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="size-4" aria-hidden="true" />
          Nenhum dado de cliente ou arquivo é enviado ao servidor nesta ferramenta.
          <ArrowRight className="size-3" aria-hidden="true" />
          <Link href="/ferramentas/trafego-pago" className="underline hover:text-foreground">Outras ferramentas de Tráfego Pago</Link>
        </div>
      </div>
    </main>
  );
}
