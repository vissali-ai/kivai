"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import { BarChart3, FileUp, Info, ShieldCheck } from "lucide-react";
import {
  campaignNeedsContext,
  describeCampaignChannel,
  parseCampaignPerformanceCsv,
  type ImportedGoogleAdsCampaign,
} from "@/lib/google-ads/campaign-report";
import { GOOGLE_ADS_CHANNELS } from "@/lib/google-ads/campaign-types";

function decimal(value: number, digits = 2) {
  return Number.isFinite(value) ? value.toLocaleString("pt-BR", { minimumFractionDigits: digits, maximumFractionDigits: digits }) : "Não disponível";
}
function count(value: number) {
  return Number.isFinite(value) ? value.toLocaleString("pt-BR", { maximumFractionDigits: 1 }) : "Não disponível";
}

const supportedTypes = [
  "SEARCH", "PERFORMANCE_MAX", "DISPLAY", "SHOPPING", "VIDEO",
  "DEMAND_GEN", "MULTI_CHANNEL", "SMART", "HOTEL", "TRAVEL",
  "LOCAL", "LOCAL_SERVICES",
] as const;

export function CampaignReportSection() {
  const [campaigns, setCampaigns] = useState<ImportedGoogleAdsCampaign[]>([]);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [showScope, setShowScope] = useState(false);
  const [selected, setSelected] = useState("all");

  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setError(""); setCampaigns([]); setFileName(""); setSelected("all");
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Selecione um relatório de campanhas em formato CSV."); event.target.value = ""; return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("O arquivo deve ter no máximo 5 MB nesta versão."); event.target.value = ""; return;
    }
    try {
      const parsed = parseCampaignPerformanceCsv(await file.text());
      setCampaigns(parsed);
      setFileName(file.name);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível interpretar o relatório.");
    }
    event.target.value = "";
  }

  const channelTypes = useMemo(() => [...new Set(campaigns.map((campaign) => campaign.channel))], [campaigns]);
  const visible = useMemo(() => selected === "all" ? campaigns : campaigns.filter((campaign) => campaign.channel === selected), [campaigns, selected]);
  const totals = useMemo(() => visible.reduce((total, campaign) => ({
    impressions: total.impressions + campaign.impressions,
    clicks: total.clicks + campaign.clicks,
    cost: total.cost + campaign.cost,
    conversions: total.conversions + campaign.conversions,
    value: total.value + (campaign.conversionValue ?? 0),
    valueComplete: total.valueComplete && campaign.conversionValue !== null,
  }), { impressions: 0, clicks: 0, cost: 0, conversions: 0, value: 0, valueComplete: true }), [visible]);

  return (
    <section className="mt-12" aria-labelledby="campanhas-title">
      <div className="flex items-center gap-2">
        <BarChart3 className="size-5 text-primary" aria-hidden="true" />
        <h2 id="campanhas-title" className="text-xl font-semibold">Visão geral de campanhas Google Ads</h2>
      </div>
      <p className="mt-2 max-w-4xl text-sm leading-7 text-muted-foreground">
        Importe o relatório de campanhas, independentemente da modalidade.
        O Kivai identifica os tipos disponíveis no CSV e compara os indicadores gerais.
        Os relatórios específicos de cada modalidade serão incorporados em etapas posteriores.
      </p>

      <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.035] p-5">
        <label htmlFor="google-ads-campaign-report" className="text-sm font-medium">
          Importar relatório de campanhas CSV (até 5 MB)
        </label>
        <p className="mt-1 text-xs leading-6 text-muted-foreground">
          Inclua Campanha, Impressões, Cliques, Custo e Conversões.
          Recomendamos incluir Tipo de campanha e Valor de conversão, quando aplicáveis.
        </p>
        <input
          id="google-ads-campaign-report"
          type="file"
          accept=".csv,text/csv"
          onChange={importFile}
          className="mt-3 block w-full text-xs file:mr-3 file:rounded-lg file:border file:border-white/15 file:bg-background file:px-3 file:py-2 file:text-foreground"
        />
        {error ? <p role="alert" className="mt-3 text-sm text-red-400">{error}</p> : null}
        {fileName ? (
          <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
            {fileName} · {campaigns.length} {campaigns.length === 1 ? "campanha importada" : "campanhas importadas"} · processamento no navegador
          </p>
        ) : null}

        <button type="button" onClick={() => setShowScope((current) => !current)}
          aria-expanded={showScope}
          className="mt-5 inline-flex items-center gap-2 text-xs font-medium text-primary hover:underline">
          <Info className="size-4" aria-hidden="true" />
          {showScope ? "Ocultar modalidades e limites da análise" : "Ver modalidades e limites da análise"}
        </button>
        {showScope ? (
          <div className="mt-3 rounded-lg border border-white/10 bg-background p-4">
            <p className="text-sm font-medium">Modalidades previstas na arquitetura</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {supportedTypes.map((type) => (
                <span key={type} className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-muted-foreground">
                  {GOOGLE_ADS_CHANNELS[type].label}
                </span>
              ))}
            </div>
            <p className="mt-3 text-xs leading-6 text-muted-foreground">
              Nesta versão: somente métricas gerais presentes no CSV. A análise de grupos de recursos
              da Performance Max, produtos do Shopping, posicionamentos de Display, vídeos,
              públicos e outros detalhamentos exige relatórios complementares ou a API Google Ads.
              Ausência de dados não equivale a desempenho ruim.
            </p>
          </div>
        ) : null}

        {campaigns.length > 0 ? (
          <div className="mt-7">
            <div className="flex flex-wrap gap-2" aria-label="Filtrar por tipo de campanha">
              <button type="button" onClick={() => setSelected("all")} aria-pressed={selected === "all"}
                className={"rounded-full border px-3 py-1.5 text-xs font-medium " + (selected === "all" ? "border-primary bg-primary text-primary-foreground" : "border-white/10 hover:border-primary/40")}>
                Todos ({campaigns.length})
              </button>
              {channelTypes.map((type) => (
                <button key={type} type="button" onClick={() => setSelected(type)} aria-pressed={selected === type}
                  className={"rounded-full border px-3 py-1.5 text-xs font-medium " + (selected === type ? "border-primary bg-primary text-primary-foreground" : "border-white/10 hover:border-primary/40")}>
                  {describeCampaignChannel(type).label}
                </button>
              ))}
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {[
                { label: "Impressões", value: count(totals.impressions) },
                { label: "Cliques", value: count(totals.clicks) },
                { label: "Custo", value: decimal(totals.cost) },
                { label: "Conversões", value: count(totals.conversions) },
                { label: "CPA", value: totals.conversions > 0 ? decimal(totals.cost / totals.conversions) : "N/D" },
                { label: "ROAS", value: totals.valueComplete && totals.cost > 0 ? decimal(totals.value / totals.cost) + "x" : "N/D" },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-lg border border-white/10 bg-background p-3">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="mt-1 break-words text-lg font-semibold tabular-nums">{value}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Valores de custo e conversão na moeda da conta exportada. ROAS só aparece quando todas as campanhas filtradas têm valor de conversão.
              Comparações de campanhas com objetivos diferentes exigem cuidado.
            </p>

            <div className="mt-6 space-y-3">
              {visible.map((campaign, index) => {
                const detail = describeCampaignChannel(campaign.channel);
                const issues = campaignNeedsContext(campaign);
                return (
                  <article key={campaign.name + campaign.channel + index} className="rounded-xl border border-white/10 bg-background p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h3 className="font-semibold">{campaign.name}</h3>
                      <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-1 text-[11px] font-medium text-primary">{detail.label}</span>
                    </div>
                    <p className="mt-3 text-xs leading-6 text-muted-foreground">
                      {count(campaign.clicks)} cliques · Custo {decimal(campaign.cost)} · {count(campaign.conversions)} conversões
                      {campaign.cost > 0 && campaign.conversionValue !== null ? " · ROAS " + decimal(campaign.conversionValue / campaign.cost) + "x" : ""}
                    </p>
                    <p className="mt-2 text-xs leading-6 text-muted-foreground">
                      <span className="font-semibold text-foreground">O que aprofundar: </span>{detail.focus}
                    </p>
                    {issues.length > 0 ? (
                      <div className="mt-3 space-y-1.5 border-t border-white/10 pt-3">
                        {issues.map((issue) => <p key={issue} className="text-xs leading-5 text-muted-foreground">{issue}</p>)}
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="mt-5 inline-flex items-center gap-2 text-xs text-muted-foreground">
            <FileUp className="size-4" aria-hidden="true" />
            Nenhum relatório importado nesta sessão.
          </p>
        )}
      </div>
    </section>
  );
}
