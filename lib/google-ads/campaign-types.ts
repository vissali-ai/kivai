/**
 * Tipos de campanha documentados pela Google Ads API.
 * A análise geral usa métricas da campanha; relatórios aprofundados dependem
 * da modalidade e só devem ser solicitados quando forem compatíveis.
 * Fonte: https://developers.google.com/google-ads/api/fields/v23/campaign
 */
export const GOOGLE_ADS_CHANNELS = {
  SEARCH: { label: "Pesquisa", focus: "Termos de pesquisa, palavras-chave, anúncios e correspondências." },
  DISPLAY: { label: "Display", focus: "Posicionamentos, públicos, criativos e frequência, quando disponíveis." },
  SHOPPING: { label: "Shopping", focus: "Produtos, feed, grupos de produtos e rentabilidade por item." },
  VIDEO: { label: "Vídeo", focus: "Visualizações, CPV, engajamento e criativos, quando disponíveis." },
  PERFORMANCE_MAX: { label: "Performance Max", focus: "Grupos de recursos, ativos, canais, produtos e insights de pesquisa." },
  DEMAND_GEN: { label: "Demand Gen", focus: "Criativos, canais, públicos e resultados por grupo de anúncios." },
  MULTI_CHANNEL: { label: "Apps / Multicanal", focus: "Instalações, ações no aplicativo, eventos e valor de conversão." },
  SMART: { label: "Inteligente", focus: "Resultados e temas de pesquisa próprios das campanhas inteligentes." },
  HOTEL: { label: "Hotel", focus: "Desempenho de hotéis, reservas e métricas disponíveis da modalidade." },
  TRAVEL: { label: "Viagens", focus: "Resultados por produtos e atividades de viagem, quando disponíveis." },
  LOCAL: { label: "Local", focus: "Conversões e resultados locais disponíveis." },
  LOCAL_SERVICES: { label: "Serviços Locais", focus: "Leads e desempenho específico do serviço." },
  UNKNOWN: { label: "Tipo não identificado", focus: "Revisar métricas gerais e informar o tipo de campanha." },
  UNSPECIFIED: { label: "Tipo não especificado", focus: "Revisar métricas gerais e informar o tipo de campanha." },
} as const;

export type GoogleAdsChannel = keyof typeof GOOGLE_ADS_CHANNELS;

export function normalizeReportLabel(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase().replace(/\s+/g, " ");
}

export function parseGoogleAdsChannel(value: string): GoogleAdsChannel {
  const cleaned = normalizeReportLabel(value).replace(/[\s-]+/g, "_").toUpperCase();
  if (cleaned in GOOGLE_ADS_CHANNELS) return cleaned as GoogleAdsChannel;
  const label = normalizeReportLabel(value);
  if (/performance[\s_-]*max|p[\s_-]*max|maximo_desempenho|ma[xá]ximo desempenho/.test(label)) return "PERFORMANCE_MAX";
  if (/demand gen|geracao de demanda/.test(label)) return "DEMAND_GEN";
  if (/shopping|compras/.test(label)) return "SHOPPING";
  if (/pesquisa|search/.test(label)) return "SEARCH";
  if (/display|exibicao/.test(label)) return "DISPLAY";
  if (/video|youtube/.test(label)) return "VIDEO";
  if (/app|aplicativo|multi/.test(label)) return "MULTI_CHANNEL";
  if (/hotel|hoteis/.test(label)) return "HOTEL";
  if (/viagem|travel/.test(label)) return "TRAVEL";
  if (/local services|servicos locais/.test(label)) return "LOCAL_SERVICES";
  if (/smart|inteligente/.test(label)) return "SMART";
  if (/local/.test(label)) return "LOCAL";
  return "UNKNOWN";
}
