import "server-only";

import { XMLParser } from "fast-xml-parser";
import { plainText, sanitizeImportedFeedHtml } from "@/lib/blog/sanitize";
import type { NewsCandidate, NewsSource } from "@/lib/news-agent/types";

const MAX_FEED_BYTES = 3_000_000;
const ALLOWED_FEED_HOSTS = new Set([
  "tecnoblog.net",
  "manualdousuario.net",
  "canaltech.com.br",
  "rss.uol.com.br",
  "olhardigital.com.br",
  "rss.tecmundo.com.br",
  "g1.globo.com",
  "www.mobiletime.com.br",
  "www.nuvemshop.com.br",
  "mittechreview.com.br",
  "www.meioemensagem.com.br",
  "propmark.com.br",
  "ecommercenapratica.com",
  "blog.bling.com.br",
  "lojaintegrada.com.br",
  "melhorenvio.com.br",
  "www.yampi.com.br",
  "blog.vindi.com.br",
  "mercadoeconsumo.com.br",
  "openai.com",
  "blog.google",
  "searchengineland.com",
  "www.searchenginejournal.com",
  "www.bleepingcomputer.com",
  "thehackernews.com",
  "www.smashingmagazine.com",
  "blog.cloudflare.com",
  "github.blog",
  "buffer.com",
  "zapier.com",
  "www.socialmediatoday.com",
  "about.fb.com",
  "trends.google.com",
]);

const parser = new XMLParser({
  ignoreAttributes: false,
  processEntities: false,
  trimValues: true,
});

type ParsedFeed = {
  rss?: { channel?: { item?: unknown | unknown[] } };
  feed?: { entry?: unknown | unknown[] };
};

function asArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function textValue(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return textValue(record["#text"] ?? record.__cdata ?? record.href ?? "");
  }
  return "";
}

function atomLink(value: unknown): string {
  for (const link of asArray(value)) {
    if (typeof link === "string") return link;
    if (link && typeof link === "object") {
      const record = link as Record<string, unknown>;
      if (!record["@_rel"] || record["@_rel"] === "alternate") return textValue(record["@_href"]);
    }
  }
  return "";
}

function normalizeUrl(value: string) {
  const url = new URL(value);
  url.hash = "";
  for (const key of [...url.searchParams.keys()]) {
    if (key.startsWith("utm_") || ["fbclid", "gclid"].includes(key)) url.searchParams.delete(key);
  }
  return url.toString();
}

function safeDate(value: unknown) {
  const date = new Date(textValue(value));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/** O RSS de Trends é uma lista de buscas, não uma lista de matérias.
 * Usamos apenas URLs de notícias associadas (ht:news_item_url), nunca uma URL
 * de busca do Google como fonte jornalística para o gerador de rascunhos.
 */
function googleTrendsCandidates(source: NewsSource, rawItems: unknown[]): NewsCandidate[] {
  return rawItems.flatMap((rawItem): NewsCandidate[] => {
    if (!rawItem || typeof rawItem !== "object") return [];
    const item = rawItem as Record<string, unknown>;
    const trend = plainText(textValue(item.title)).trim().slice(0, 180);
    const publishedAt = safeDate(item.pubDate);
    if (!trend || !publishedAt) return [];
    return asArray(item["ht:news_item"]).flatMap((entry): NewsCandidate[] => {
      if (!entry || typeof entry !== "object") return [];
      const news = entry as Record<string, unknown>;
      const title = plainText(textValue(news["ht:news_item_title"])).trim();
      const rawLink = textValue(news["ht:news_item_url"]);
      if (!title || !rawLink) return [];
      let url: URL;
      try {
        url = new URL(rawLink);
        if (url.protocol !== "https:" || url.username || url.password ||
          url.hostname === "trends.google.com" || url.hostname === "news.google.com" ||
          url.hostname === "localhost" || url.hostname.endsWith(".local")) return [];
      } catch { return []; }
      const normalized = normalizeUrl(url.toString());
      const publisher = plainText(textValue(news["ht:news_item_source"])).trim();
      return [{
        sourceId: source.id, sourceName: publisher ? `Google Trends · ${publisher}` : source.name,
        categorySlug: source.defaultCategorySlug, guid: normalized, url: normalized,
        title: title.slice(0, 180),
        excerpt: `Assunto em alta no Google Trends Brasil: ${trend}. Verifique a notícia original antes de publicar.`,
        contentHtml: "", tags: [trend], publishedAt,
      }];
    });
  });
}

export async function fetchNewsFeed(source: NewsSource): Promise<NewsCandidate[]> {
  const feedUrl = new URL(source.feedUrl);
  if (feedUrl.protocol !== "https:" || !ALLOWED_FEED_HOSTS.has(feedUrl.hostname)) {
    throw new Error(`Feed não autorizado: ${source.name}.`);
  }

  const response = await fetch(feedUrl, {
    cache: "no-store",
    headers: { "User-Agent": "KivaiNewsAgent/1.0 (+https://www.kivai.com.br/blog)" },
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error(`${source.name} respondeu com HTTP ${response.status}.`);
  const declaredSize = Number(response.headers.get("content-length") ?? 0);
  if (declaredSize > MAX_FEED_BYTES) throw new Error(`${source.name} excedeu o limite do feed.`);
  const xml = await response.text();
  if (xml.length > MAX_FEED_BYTES) throw new Error(`${source.name} excedeu o limite do feed.`);

  const document = parser.parse(xml) as ParsedFeed;
  if (!document.rss?.channel && !document.feed) throw new Error(`${source.name} não retornou um feed RSS ou Atom válido.`);
  const rssItems = asArray(document.rss?.channel?.item);
  const atomItems = asArray(document.feed?.entry);
  if (feedUrl.hostname === "trends.google.com" && feedUrl.pathname === "/trending/rss") {
    return googleTrendsCandidates(source, rssItems);
  }
  return [...rssItems, ...atomItems].flatMap((rawItem): NewsCandidate[] => {
    try {
      const item = rawItem as Record<string, unknown>;
      const rawUrl = textValue(item.link) || atomLink(item.link) || textValue(item.guid);
      const url = normalizeUrl(rawUrl);
      const title = plainText(textValue(item.title)).trim();
      const description = textValue(item.description ?? item.summary ?? item.content);
      const rawContent = textValue(item["content:encoded"] ?? item.content ?? item.description ?? item.summary);
      const excerpt = plainText(description || rawContent).trim().slice(0, 1800);
      const contentHtml = sanitizeImportedFeedHtml(rawContent.slice(0, 80_000));
      const tags = asArray(item.category).map(textValue).map((tag) => plainText(tag).trim()).filter(Boolean).slice(0, 8);
      if (!title || !url) return [];
      return [{
        sourceId: source.id,
        sourceName: source.name,
        categorySlug: source.defaultCategorySlug,
        guid: textValue(item.guid ?? item.id) || url,
        url,
        title,
        excerpt,
        contentHtml,
        tags,
        publishedAt: safeDate(item.pubDate ?? item.published ?? item.updated),
      }];
    } catch {
      return [];
    }
  });
}
