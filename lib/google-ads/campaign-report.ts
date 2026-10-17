import { GOOGLE_ADS_CHANNELS, parseGoogleAdsChannel, type GoogleAdsChannel } from "./campaign-types";
import { parseReportNumber, readCsvHeader } from "./csv-utils";

export type ImportedGoogleAdsCampaign = {
  name: string;
  channel: GoogleAdsChannel;
  rows: number;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  conversionValue: number | null;
};

const requiredColumns = {
  name: ["campanha", "campaign", "nome da campanha", "campaign name"],
  impressions: ["impressoes", "impressions", "impr.", "impr"],
  clicks: ["cliques", "clicks"],
  cost: ["custo", "cost", "cost (account currency)", "custo (moeda da conta)"],
  conversions: ["conversoes", "conversions", "conv.", "conv"],
};

const optionalColumns = {
  id: ["id da campanha", "campaign id", "id"],
  channel: ["tipo de campanha", "campaign type", "advertising channel type", "tipo de canal de publicidade", "tipo de campanha publicitaria"],
  value: ["valor de conversao", "valor de conv.", "valor conv.", "conversion value", "conv. value", "all conv. value"],
};

export function parseCampaignPerformanceCsv(text: string): ImportedGoogleAdsCampaign[] {
  const table = readCsvHeader(text, requiredColumns, optionalColumns);
  if (!table) throw new Error("Exporte um CSV com Campanha, Impressões, Cliques, Custo e Conversões. Inclua Tipo de campanha e Valor de conversão quando disponíveis.");

  const { indices } = table;
  const grouped = new Map<string, ImportedGoogleAdsCampaign>();

  for (const row of table.rows) {
    const name = row[indices.name]?.trim() ?? "";
    if (!name || /^total(\s|:|$)/i.test(name)) continue;
    const numeric = {
      impressions: parseReportNumber(row[indices.impressions] ?? ""),
      clicks: parseReportNumber(row[indices.clicks] ?? ""),
      cost: parseReportNumber(row[indices.cost] ?? ""),
      conversions: parseReportNumber(row[indices.conversions] ?? ""),
    };
    if (Object.values(numeric).some((n) => !Number.isFinite(n) || n < 0)) continue;
    const channel = indices.channel >= 0 ? parseGoogleAdsChannel(row[indices.channel] ?? "") : "UNKNOWN";
    const rawValue = indices.value >= 0 ? parseReportNumber(row[indices.value] ?? "") : NaN;
    const conversionValue = Number.isFinite(rawValue) && rawValue >= 0 ? rawValue : null;
    const id = indices.id >= 0 ? row[indices.id]?.trim() : "";
    const key = id ? id + "|" + channel : name + "|" + channel;
    const previous = grouped.get(key);
    if (previous) {
      previous.rows++;
      previous.impressions += numeric.impressions;
      previous.clicks += numeric.clicks;
      previous.cost += numeric.cost;
      previous.conversions += numeric.conversions;
      if (conversionValue !== null) previous.conversionValue = (previous.conversionValue ?? 0) + conversionValue;
    } else {
      grouped.set(key, {
        name, channel, rows: 1, ...numeric, conversionValue,
      });
    }
  }

  const campaigns = Array.from(grouped.values()).sort((a, b) => b.cost - a.cost);
  if (!campaigns.length) throw new Error("Não encontrei campanhas com métricas válidas no arquivo. Revise o período e o formato da exportação.");
  return campaigns;
}

export function describeCampaignChannel(channel: GoogleAdsChannel) {
  return GOOGLE_ADS_CHANNELS[channel];
}

export function campaignNeedsContext(campaign: ImportedGoogleAdsCampaign) {
  const issues: string[] = [];
  if (campaign.cost > 0 && campaign.conversions === 0) {
    issues.push("Houve custo sem conversões registradas no período. Verifique objetivo, mensuração e janela de atribuição antes de tomar decisões.");
  }
  if (campaign.channel === "PERFORMANCE_MAX") {
    issues.push("Para uma auditoria detalhada de Performance Max, acrescente grupos de recursos, ativos, canais, produtos e insights de pesquisa.");
  }
  if (campaign.channel === "SEARCH") {
    issues.push("Para avaliar intenção e desperdícios na Pesquisa, acrescente termos de pesquisa e palavras-chave.");
  }
  if (campaign.channel === "SHOPPING") {
    issues.push("Para revisar Shopping em detalhes, acrescente desempenho de produtos e informações do feed.");
  }
  if (campaign.channel === "VIDEO") {
    issues.push("Conversões isoladas não avaliam todos os objetivos de Vídeo. Analise visualizações, CPV e retenção quando disponíveis.");
  }
  if (campaign.channel === "UNKNOWN" || campaign.channel === "UNSPECIFIED") {
    issues.push("Informe o tipo de campanha na exportação para liberar diagnósticos específicos.");
  }
  return issues;
}
