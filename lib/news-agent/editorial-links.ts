import "server-only";

import { listNewsSources } from "@/lib/news-agent/repository";
import { listDismissedSuggestionUrls } from "@/lib/news-agent/editorial-dismissals";
import { fetchNewsSource } from "@/lib/news-agent/source-collector";
import { deduplicateNewsTopics } from "@/lib/news-agent/candidate-ranking";
import type { EditorialTopic } from "@/lib/news-agent/editorial-topics";
import type { NewsCandidate, NewsSource } from "@/lib/news-agent/types";

export type SearchPeriod = "24h" | "7d" | "30d";
export type SearchRegion = "brasil" | "internacional" | "ambos";
export type EditorialResearchResult = {
  title: string;
  excerpt: string;
  sourceName: string;
  sourceUrl: string;
  publishedAt: string | null;
  categorySlug: string;
};
export type EditorialResearchResponse = {
  items: EditorialResearchResult[];
  model: string;
  searchedAt: string;
  notice: string;
};

const MAX_SOURCES = 32;
const MAX_RESULTS = 24;
const STOPWORDS = new Set([
  "para", "com", "das", "dos", "sobre", "pelas", "pelos", "novas", "novos",
  "seus", "suas", "como", "mais", "melhores", "principais", "brasil", "online",
  "digital", "digitais", "ferramentas", "aplicacoes", "plataformas", "estrategias",
  "atualizacoes", "tendencias", "novidades", "noticias", "empresas",
]);
// Alguns veículos brasileiros usam domínios internacionais.
const BRAZILIAN_HOSTS = new Set(["tecnoblog.net", "manualdousuario.net", "ecommercenapratica.com", "blog.google"]);

function normalize(text: string) {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}
function keywords(text: string): string[] {
  return [...new Set(normalize(text).match(/[a-z0-9]{3,}/g) || [])]
    .filter((word) => !STOPWORDS.has(word));
}
function containsKeyword(text: string, word: string) {
  return text.includes(word);
}
function validArticleUrl(raw: string) {
  try {
    const url = new URL(raw);
    const hostname = url.hostname.toLowerCase();
    if (url.protocol !== "https:" || url.username || url.password ||
      hostname === "localhost" || hostname.endsWith(".local") ||
      hostname.endsWith(".internal") || /^\d/.test(hostname) || hostname.startsWith("[") ||
      hostname === "news.google.com") return null;
    return url.toString();
  } catch { return null; }
}
function isInternational(source: NewsSource) {
  try {
    const host = new URL(source.siteUrl).hostname.toLowerCase();
    return !host.endsWith(".br") && !BRAZILIAN_HOSTS.has(host);
  } catch { return false; }
}
function matchesTopic(source: NewsSource, topic: EditorialTopic) {
  if (source.editorialTopicSlugs?.length) return source.editorialTopicSlugs.includes(topic.slug);
  return source.defaultCategorySlug === topic.categorySlug;
}
function sourcePriority(source: NewsSource, topics: EditorialTopic[], region: SearchRegion) {
  const matched = topics.filter((topic) => matchesTopic(source, topic)).length;
  const international = isInternational(source);
  const regionPriority = region === "internacional" ? (international ? 7 : 0)
    : region === "brasil" ? (!international ? 7 : 0) : 3;
  return matched * 12 + regionPriority;
}
function selectSources(sources: NewsSource[], topics: EditorialTopic[], region: SearchRegion) {
  const sorted = sources.filter((source) => region === "ambos" ||
    (region === "internacional" ? isInternational(source) : !isInternational(source)))
    .sort((a, b) => sourcePriority(b, topics, region) - sourcePriority(a, topics, region)
    || a.name.localeCompare(b.name));
  if (!topics.length) return sorted.slice(0, MAX_SOURCES);
  const pool = sorted.filter((source) => topics.some((topic) => matchesTopic(source, topic)));
  if (!pool.length) return sorted.slice(0, MAX_SOURCES);
  const selected: NewsSource[] = [];
  // Rodízio impede que "Todos" consulte somente um tipo de notícia.
  for (let pass = 0; pass < 3 && selected.length < MAX_SOURCES; pass++) {
    for (const topic of topics) {
      const source = pool.filter((item) => matchesTopic(item, topic) && !selected.includes(item))[0];
      if (source && selected.length < MAX_SOURCES) selected.push(source);
    }
  }
  for (const source of pool) {
    if (selected.length >= MAX_SOURCES) break;
    if (!selected.includes(source)) selected.push(source);
  }
  return selected;
}
function relevance(candidate: NewsCandidate, topics: EditorialTopic[], queryTerms: string[], source?: NewsSource) {
  const text = normalize(candidate.title + " " + candidate.excerpt + " " + candidate.tags.join(" "));
  if (queryTerms.length && !queryTerms.some((word) => containsKeyword(text, word))) return -1;
  let score = queryTerms.reduce((sum, word) => sum + (containsKeyword(text, word) ? 5 : 0), 0);
  if (!topics.length) return score;
  let topicMatched = false;
  for (const topic of topics) {
    const terms = keywords(topic.name + " " + topic.searchTerms);
    const count = terms.filter((word) => containsKeyword(text, word)).length;
    const matchesSource = Boolean(source && matchesTopic(source, topic));
    if (count > 0 || matchesSource) {
      topicMatched = true;
      score += Math.min(count, 4) * 2 + (matchesSource ? 6 : 0);
    }
  }
  return topicMatched ? score : -1;
}
export function normalizeSuggestionUrl(raw: string) {
  const url = validArticleUrl(raw);
  if (!url) throw new Error("Link HTTPS inválido para descarte.");
  const normalized = new URL(url);
  normalized.hash = "";
  for (const key of [...normalized.searchParams.keys()]) {
    if (key.startsWith("utm_") || ["fbclid", "gclid"].includes(key)) normalized.searchParams.delete(key);
  }
  return normalized.toString();
}
export async function researchEditorialLinks(input: {
  topics: EditorialTopic[];
  freeQuery: string;
  period: SearchPeriod;
  region: SearchRegion;
}): Promise<EditorialResearchResponse> {
  const sources = (await listNewsSources()).filter((source) => source.enabled && source.kind === "rss");
  if (!sources.length) throw new Error("Nenhuma fonte de notícias RSS está ativa no painel.");
  // As fontes são previamente cadastradas e passam pela allowlist do coletor existente.
  // Pesquisa independente de Google Search Grounding e de cotas de geração Gemini.
  const selected = selectSources(sources, input.topics, input.region);
  if (!selected.length) return { items: [], model: "fontes-rss", searchedAt: new Date().toISOString(),
    notice: "Nenhuma fonte RSS ativa corresponde à região selecionada. Experimente a opção Ambos." };
  const dismissedUrls = await listDismissedSuggestionUrls();
  const sourcesById = new Map(selected.map((source) => [source.id, source]));
  const gathered = await Promise.allSettled(selected.map((source) => fetchNewsSource(source)));
  const candidates = gathered.flatMap((outcome) => outcome.status === "fulfilled" ? outcome.value : []);
  const cutoff = Date.now() - ({ "24h": 1, "7d": 7, "30d": 30 }[input.period] * 24 * 60 * 60 * 1000);
  const queryTerms = keywords(input.freeQuery);
  const scored = candidates.flatMap((candidate) => {
    const url = validArticleUrl(candidate.url);
    const publishedAt = candidate.publishedAt ? Date.parse(candidate.publishedAt) : NaN;
    if (!url || dismissedUrls.has(normalizeSuggestionUrl(url)) || !candidate.title || !Number.isFinite(publishedAt) ||
      publishedAt < cutoff || publishedAt > Date.now() + 60 * 60 * 1000) return [];
    const score = relevance(candidate, input.topics, queryTerms, sourcesById.get(candidate.sourceId));
    if (score < 0) return [];
    return [{ candidate: { ...candidate, url }, score, publishedAt }];
  }).sort((a, b) => b.score - a.score || b.publishedAt - a.publishedAt);
  const unique = deduplicateNewsTopics(scored.map((item) => item.candidate), 0.72)
    .slice(0, MAX_RESULTS);
  const items = unique.map((candidate) => ({
    title: candidate.title.slice(0, 180),
    excerpt: candidate.excerpt.slice(0, 700),
    sourceName: candidate.sourceName,
    sourceUrl: candidate.url,
    publishedAt: candidate.publishedAt,
    categorySlug: candidate.categorySlug === "guia-de-ferramentas"
      ? "tecnologia" : candidate.categorySlug,
  }));
  const successCount = gathered.filter((outcome) => outcome.status === "fulfilled").length;
  const failureCount = gathered.length - successCount;
  const failureNotice = failureCount ? ` ${failureCount} fonte(s) não responderam; os resultados podem estar incompletos.` : "";
  return {
    items,
    model: "fontes-rss",
    searchedAt: new Date().toISOString(),
    notice: items.length
      ? "Links e datas coletados diretamente das fontes editoriais cadastradas no Kivai. Confira a matéria original antes de publicar." + failureNotice
      : successCount
        ? "Nenhuma matéria encontrada nas fontes consultadas para esses temas e período. Experimente 7 ou 30 dias, outra palavra-chave ou mais temas." + failureNotice
        : "As fontes cadastradas não responderam desta vez. Tente novamente mais tarde.",
  };
}
