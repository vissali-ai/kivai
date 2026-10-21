import "server-only";

import { listNewsSources } from "@/lib/news-agent/repository";
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

const MAX_SOURCES = 18;
const MAX_RESULTS = 20;
const STOPWORDS = new Set([
  "para", "com", "das", "dos", "sobre", "pelas", "pelos", "novas", "novos",
  "seus", "suas", "como", "mais", "melhores", "principais", "brasil", "online",
  "digital", "digitais", "ferramentas", "aplicacoes", "plataformas", "estrategias",
  "atualizacoes", "tendencias", "novidades", "noticias", "empresas",
]);
const BROAD_TOPICS = new Set(["tecnologia", "inteligencia-artificial", "marketing-digital", "e-commerce"]);

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
function sourcePriority(source: NewsSource, topics: EditorialTopic[], region: SearchRegion) {
  const isForeign = /^(?:openai\.com|blog\.google)$/.test(new URL(source.siteUrl).hostname);
  const topicMatch = topics.some((topic) => topic.categorySlug === source.defaultCategorySlug);
  const genericBoost = topics.some((topic) =>
    topic.slug === "tecnologia" && source.defaultCategorySlug === "tecnologia");
  return (topicMatch ? 10 : 0) + (genericBoost ? 2 : 0) +
    (region === "internacional" ? (isForeign ? 6 : 0) : (isForeign ? 0 : 2)) +
    (source.kind === "rss" ? 5 : -4);
}
function relevance(candidate: NewsCandidate, topics: EditorialTopic[], queryTerms: string[]) {
  const text = normalize(candidate.title + " " + candidate.excerpt + " " + candidate.tags.join(" "));
  if (queryTerms.length && !queryTerms.some((word) => containsKeyword(text, word))) return -1;
  let score = queryTerms.reduce((sum, word) => sum + (containsKeyword(text, word) ? 5 : 0), 0);
  if (!topics.length) return score;
  let topicMatched = false;
  for (const topic of topics) {
    const terms = keywords(topic.name + " " + topic.searchTerms);
    const count = terms.filter((word) => containsKeyword(text, word)).length;
    const matchesCategory = candidate.categorySlug === topic.categorySlug;
    const broad = BROAD_TOPICS.has(topic.slug);
    if (count > 0 || (broad && matchesCategory)) {
      topicMatched = true;
      score += Math.min(count, 4) * 2 + (matchesCategory ? 4 : 0);
    }
  }
  return topicMatched ? score : -1;
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
  const selected = sources
    .map((source, index) => ({ source, index, priority: sourcePriority(source, input.topics, input.region) }))
    .sort((a, b) => b.priority - a.priority || a.index - b.index)
    .slice(0, MAX_SOURCES);
  const gathered = await Promise.allSettled(selected.map(({ source }) => fetchNewsSource(source)));
  const candidates = gathered.flatMap((outcome) => outcome.status === "fulfilled" ? outcome.value : []);
  const cutoff = Date.now() - ({ "24h": 1, "7d": 7, "30d": 30 }[input.period] * 24 * 60 * 60 * 1000);
  const queryTerms = keywords(input.freeQuery);
  const scored = candidates.flatMap((candidate) => {
    const url = validArticleUrl(candidate.url);
    const publishedAt = candidate.publishedAt ? Date.parse(candidate.publishedAt) : NaN;
    if (!url || !candidate.title || !Number.isFinite(publishedAt) ||
      publishedAt < cutoff || publishedAt > Date.now() + 60 * 60 * 1000) return [];
    const score = relevance(candidate, input.topics, queryTerms);
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
  return {
    items,
    model: "fontes-rss",
    searchedAt: new Date().toISOString(),
    notice: items.length
      ? "Links e datas coletados diretamente das fontes editoriais cadastradas no Kivai. Confira a matéria original antes de publicar."
      : successCount
        ? "Nenhuma matéria encontrada nas fontes consultadas para esses temas e período. Experimente 7 ou 30 dias, outra palavra-chave ou mais temas."
        : "As fontes cadastradas não responderam desta vez. Tente novamente mais tarde.",
  };
}
