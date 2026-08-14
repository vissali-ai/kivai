import type { NewsSource } from "@/lib/news-agent/types";

export const NEWS_RADAR_CATEGORIES = [
  { slug: "marketing", label: "Marketing", description: "Campanhas, marcas, mídia e mercado publicitário." },
  { slug: "inteligencia-artificial", label: "Inteligência Artificial", description: "Produtos, pesquisas e aplicações de IA." },
  { slug: "e-commerce", label: "E-commerce", description: "Lojas virtuais, varejo digital e meios de pagamento." },
] as const;

export type NewsRadarCategory = (typeof NEWS_RADAR_CATEGORIES)[number]["slug"];

export type RadarSource = NewsSource & {
  radarPriority: number;
};

export type RadarItem = {
  title: string;
  sourceName: string;
  url: string;
  excerpt: string;
  publishedAt: string;
  window: "today" | "last-24-hours";
  coverageCount: number;
  score: number;
};

export type RadarPayload = {
  category: NewsRadarCategory;
  categoryLabel: string;
  items: RadarItem[];
  collectedAt: string;
  expiresAt: string;
  sourcesChecked: number;
  sourcesSucceeded: number;
  partial: boolean;
};

export type RadarResponse = RadarPayload & {
  fromCache: boolean;
  stale: boolean;
};

export type RadarDailyMetric = {
  metricDate: string;
  category: string;
  searches: number;
  cacheHits: number;
  resultsReturned: number;
  partialResults: number;
  emptyResults: number;
  errors: number;
  outboundClicks: number;
};

export function isNewsRadarCategory(value: unknown): value is NewsRadarCategory {
  return NEWS_RADAR_CATEGORIES.some((category) => category.slug === value);
}

export function radarCategoryLabel(slug: NewsRadarCategory) {
  return NEWS_RADAR_CATEGORIES.find((category) => category.slug === slug)?.label ?? slug;
}
