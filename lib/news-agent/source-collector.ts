import "server-only";

import { XMLParser } from "fast-xml-parser";
import { plainText } from "@/lib/blog/sanitize";
import { fetchNewsFeed } from "@/lib/news-agent/rss";
import type { NewsCandidate, NewsSource } from "@/lib/news-agent/types";

const MAX_DOCUMENT_BYTES = 3_000_000;
const MAX_ITEMS_PER_SOURCE = 24;
const USER_AGENT = "KivaiNewsAgent/1.0 (+https://www.kivai.com.br/blog)";
const SITEMAP_HOSTS = new Set(["tray.com.br"]);
const PAGE_RULES: Record<string, RegExp> = {
  "www.ecommercebrasil.com.br": /^\/(?:noticias|artigos)\//,
};

const parser = new XMLParser({ ignoreAttributes: false, processEntities: false, trimValues: true });

type SitemapDocument = {
  sitemapindex?: { sitemap?: SitemapEntry | SitemapEntry[] };
  urlset?: { url?: SitemapEntry | SitemapEntry[] };
};
type SitemapEntry = { loc?: unknown; lastmod?: unknown };

function asArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function textValue(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return textValue(record["#text"] ?? record.__cdata ?? "");
  }
  return "";
}

function normalizeUrl(value: string, base?: URL) {
  const url = new URL(value, base);
  url.hash = "";
  for (const key of [...url.searchParams.keys()]) {
    if (key.startsWith("utm_") || ["fbclid", "gclid"].includes(key)) url.searchParams.delete(key);
  }
  return url;
}

function safeDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function attribute(tag: string, name: string) {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, "i"));
  return match?.[1] ?? "";
}

function metaContent(html: string, key: string) {
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = match[0];
    if ([attribute(tag, "property"), attribute(tag, "name")].some((value) => value.toLowerCase() === key.toLowerCase())) {
      return plainText(attribute(tag, "content"));
    }
  }
  return "";
}

async function fetchDocument(url: URL, allowedHosts: Set<string>) {
  if (url.protocol !== "https:" || !allowedHosts.has(url.hostname)) throw new Error(`Origem não autorizada: ${url.hostname}.`);
  const response = await fetch(url, {
    cache: "no-store",
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error(`${url.hostname} respondeu com HTTP ${response.status}.`);
  const declaredSize = Number(response.headers.get("content-length") ?? 0);
  if (declaredSize > MAX_DOCUMENT_BYTES) throw new Error(`${url.hostname} excedeu o limite de tamanho.`);
  const content = await response.text();
  if (content.length > MAX_DOCUMENT_BYTES) throw new Error(`${url.hostname} excedeu o limite de tamanho.`);
  return content;
}

async function mapInBatches<T, R>(items: T[], mapper: (item: T) => Promise<R>, batchSize = 5) {
  const output: R[] = [];
  for (let index = 0; index < items.length; index += batchSize) {
    output.push(...await Promise.all(items.slice(index, index + batchSize).map(mapper)));
  }
  return output;
}

async function articleCandidate(
  source: NewsSource,
  url: URL,
  fallbackTitle = "",
  fallbackDate: string | null = null,
): Promise<NewsCandidate | null> {
  try {
    const html = await fetchDocument(url, new Set([url.hostname]));
    const title = metaContent(html, "og:title") || fallbackTitle;
    if (!title) return null;
    const excerpt = metaContent(html, "og:description") || metaContent(html, "description");
    const publishedAt = safeDate(metaContent(html, "article:published_time"))
      ?? safeDate(html.match(/["']datePublished["']\s*:\s*["']([^"']+)["']/i)?.[1] ?? "")
      ?? fallbackDate;
    return {
      sourceId: source.id,
      sourceName: source.name,
      categorySlug: source.defaultCategorySlug,
      guid: url.toString(),
      url: url.toString(),
      title,
      excerpt: excerpt.slice(0, 1800),
      contentHtml: "",
      tags: [],
      publishedAt,
    } satisfies NewsCandidate;
  } catch {
    if (!fallbackTitle) return null;
    return {
      sourceId: source.id, sourceName: source.name, categorySlug: source.defaultCategorySlug,
      guid: url.toString(), url: url.toString(), title: fallbackTitle, excerpt: "", contentHtml: "", tags: [],
      publishedAt: fallbackDate,
    } satisfies NewsCandidate;
  }
}

async function fetchSitemapSource(source: NewsSource) {
  const root = normalizeUrl(source.feedUrl);
  if (!SITEMAP_HOSTS.has(root.hostname)) throw new Error(`Sitemap não autorizado: ${source.name}.`);
  const allowedHosts = new Set([root.hostname]);
  const rootXml = await fetchDocument(root, allowedHosts);
  const rootDocument = parser.parse(rootXml) as SitemapDocument;
  const sitemapEntries = asArray(rootDocument.sitemapindex?.sitemap)
    .map((entry) => ({ url: normalizeUrl(textValue(entry.loc), root) }))
    .filter((entry) => entry.url.pathname.includes("post-sitemap"))
    .slice(0, 4);
  const documents = sitemapEntries.length
    ? await Promise.all(sitemapEntries.map((entry) => fetchDocument(entry.url, allowedHosts)))
    : [rootXml];
  const entries = documents.flatMap((xml) => {
    const document = parser.parse(xml) as SitemapDocument;
    return asArray(document.urlset?.url).flatMap((entry) => {
      try {
        const url = normalizeUrl(textValue(entry.loc), root);
        if (url.hostname !== root.hostname || !url.pathname.startsWith("/escola/")) return [];
        return [{ url, lastmod: safeDate(textValue(entry.lastmod)) }];
      } catch { return []; }
    });
  });
  const latest = entries
    .sort((left, right) => new Date(right.lastmod ?? 0).getTime() - new Date(left.lastmod ?? 0).getTime())
    .slice(0, MAX_ITEMS_PER_SOURCE);
  const candidates = await mapInBatches(latest, (entry) => articleCandidate(source, entry.url, "", entry.lastmod));
  return candidates.filter((candidate): candidate is NewsCandidate => Boolean(candidate));
}

async function fetchPageSource(source: NewsSource) {
  const pageUrl = normalizeUrl(source.feedUrl);
  const pathRule = PAGE_RULES[pageUrl.hostname];
  if (!pathRule) throw new Error(`Página não autorizada: ${source.name}.`);
  const html = await fetchDocument(pageUrl, new Set([pageUrl.hostname]));
  const links = new Map<string, { url: URL; title: string }>();
  for (const match of html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    try {
      const url = normalizeUrl(match[1], pageUrl);
      const title = plainText(match[2]).replace(/\s+/g, " ").trim();
      if (url.hostname === pageUrl.hostname && pathRule.test(url.pathname) && title.length >= 20 && !links.has(url.toString())) {
        links.set(url.toString(), { url, title });
      }
    } catch { /* Link inválido da página de origem. */ }
  }
  const selected = [...links.values()].slice(0, MAX_ITEMS_PER_SOURCE);
  const candidates = await mapInBatches(selected, (entry) => articleCandidate(source, entry.url, entry.title));
  return candidates.filter((candidate): candidate is NewsCandidate => Boolean(candidate));
}

export function fetchNewsSource(source: NewsSource) {
  if (source.kind === "sitemap") return fetchSitemapSource(source);
  if (source.kind === "page") return fetchPageSource(source);
  return fetchNewsFeed(source);
}
