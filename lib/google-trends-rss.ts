import "server-only";
import { XMLParser } from "fast-xml-parser";

const FEED_URL = "https://trends.google.com/trending/rss?geo=BR";
export type TrendingNews = { title: string; source: string; url: string };
export type TrendingTopic = {
  title: string;
  volume: string | null;
  publishedAt: string | null;
  news: TrendingNews[];
  exploreUrl: string;
};

type XmlNode = Record<string, unknown>;
const list = (value: unknown): XmlNode[] => (Array.isArray(value) ? value : value ? [value] : []).filter(
  (item): item is XmlNode => typeof item === "object" && item !== null
);
const str = (value: unknown) => typeof value === "string" || typeof value === "number" ? String(value).trim() : "";
function safeHttpUrl(value: unknown) {
  try {
    const url = new URL(str(value));
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : "";
  } catch {
    return "";
  }
}
export async function getBrazilTrends(): Promise<{ topics: TrendingTopic[]; fetchedAt: string }> {
  const response = await fetch(FEED_URL, {
    next: { revalidate: 600 },
    headers: { Accept: "application/rss+xml, application/xml;q=0.9" },
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error("Não foi possível consultar o Google Trends.");
  const xml = await response.text();
  if (xml.length > 1_500_000) throw new Error("O feed ultrapassou o limite esperado.");
  const parsed = new XMLParser({ ignoreAttributes: false, removeNSPrefix: true, trimValues: true }).parse(xml);
  const channel = parsed?.rss?.channel;
  if (!channel) throw new Error("O Google Trends retornou um feed inesperado.");
  const topics: TrendingTopic[] = list(channel.item).map((entry) => {
    const title = str(entry.title).slice(0, 180);
    const time = new Date(str(entry.pubDate));
    const news = list(entry.news_item).slice(0, 4).map((article) => ({
      title: str(article.news_item_title).slice(0, 250),
      source: str(article.news_item_source).slice(0, 100),
      url: safeHttpUrl(article.news_item_url),
    })).filter((article) => article.title && article.url);
    return {
      title,
      volume: str(entry.approx_traffic) || null,
      publishedAt: Number.isFinite(time.getTime()) ? time.toISOString() : null,
      news,
      exploreUrl: "https://trends.google.com/trends/explore?geo=BR&q=" + encodeURIComponent(title),
    };
  }).filter((item) => item.title);
  if (!topics.length) throw new Error("O feed de tendências está vazio no momento.");
  return { topics, fetchedAt: new Date().toISOString() };
}
