import "server-only";
import type { EditorialTopic } from "@/lib/news-agent/editorial-topics";
import { newsTitleSimilarity } from "@/lib/news-agent/candidate-ranking";
import { interpretGeminiQuota, shortGeminiQuotaBackoff } from "@/lib/ai/gemini-quota";

// A pesquisa com Google Search no Gemini 3.x requer plano pago.
// Gemini 2.5 Flash-Lite/Flash oferece grounding também na modalidade gratuita.
// Só alternar modelos em caso de 404 (modelo indisponível); jamais após 429 de cota.
const MODELS = ["gemini-2.5-flash-lite", "gemini-2.5-flash"] as const;
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

type RawGrounding = { web?: { uri?: string; title?: string } };
type RawResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    groundingMetadata?: { groundingChunks?: RawGrounding[] };
  }>;
};
type AiItem = { title?: string; excerpt?: string; sourceName?: string; publishedAt?: string };
function publicUrl(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    if (url.protocol !== "https:" || host === "localhost" || host.endsWith(".local") ||
      host.endsWith(".internal") || /^(?:\d{1,3}\.){3}\d{1,3}$/.test(host)) return null;
    return url.toString();
  } catch { return null; }
}
function parsedItems(value: string): AiItem[] {
  try {
    const start = value.indexOf("{");
    const end = value.lastIndexOf("}");
    if (start < 0 || end < start) return [];
    const obj = JSON.parse(value.slice(start, end + 1)) as { items?: unknown };
    return Array.isArray(obj.items) ? obj.items.filter((item): item is AiItem =>
      Boolean(item && typeof item === "object")) : [];
  } catch { return []; }
}
function safeDate(value?: string) {
  if (!value || typeof value !== "string") return null;
  const time = Date.parse(value);
  return Number.isFinite(time) && time < Date.now() + 3_600_000 && time > 1_600_000_000_000
    ? new Date(time).toISOString() : null;
}
function selectMatch(title: string, options: AiItem[]) {
  return options.map((item) => ({
    item, score: typeof item.title === "string" ? newsTitleSimilarity(title, item.title) : 0,
  })).sort((a, b) => b.score - a.score)[0];
}
export async function researchWithGemini(input: {
  topics: EditorialTopic[]; freeQuery: string; period: SearchPeriod; region: SearchRegion;
}): Promise<EditorialResearchResponse> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("A chave Gemini não está configurada no servidor.");
  const windowText = { "24h": "nas últimas 24 horas", "7d": "nos últimos 7 dias", "30d": "nos últimos 30 dias" }[input.period];
  const regionText = {
    brasil: "Priorize publicações brasileiras em português.",
    internacional: "Priorize publicações internacionais, com apresentação em português.",
    ambos: "Considere publicações brasileiras e internacionais, com apresentação em português.",
  }[input.region];
  const terms = input.topics.map((topic) => topic.name + ": " + topic.searchTerms).join("; ");
  const prompt = [
    "Você é um pesquisador de pautas para o blog Kivai, focado em tecnologia e negócios digitais.",
    "Pesquise na Web notícias reais e recentes, não invente links, títulos, veículos ou datas.",
    "Hoje é " + new Date().toISOString() + ". Procure notícias publicadas " + windowText + ".",
    regionText,
    "Temas: " + (terms || "não especificados") + ".",
    "Pesquisa personalizada: " + (input.freeQuery || "nenhuma") + ".",
    "As notícias devem ser factuais, com URLs de matérias publicadas em sites confiáveis.",
    "Retorne apenas JSON no formato {\"items\":[{\"title\":\"...\",\"excerpt\":\"breve resumo factual\",\"sourceName\":\"veículo\",\"publishedAt\":\"data ISO se confirmada, caso contrário vazio\"}]} com até 8 notícias.",
    "Não escreva artigos completos. A etapa de redação editorial será separada.",
  ].join("\n");

  let apiResponse: RawResponse | null = null;
  let modelUsed = "";
  for (const model of MODELS) {
    let unsupportedModel = false;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      let response: Response;
      try {
        response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent", {
          method: "POST",
          cache: "no-store",
          signal: AbortSignal.timeout(45_000),
          headers: { "Content-Type": "application/json", "x-goog-api-key": key },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            tools: [{ googleSearch: {} }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 3400 },
          }),
        });
      } catch { throw new Error("Não foi possível alcançar o Gemini. Tente novamente."); }
      if (response.status === 404) { unsupportedModel = true; break; }
      if (response.status === 429) {
        const quota = await interpretGeminiQuota(response, "research", model);
        if (attempt === 0 && await shortGeminiQuotaBackoff(quota)) continue;
        throw quota;
      }
      if (response.status === 403 || response.status === 400) {
        throw new Error("Pesquisa Google com Gemini indisponível para esta chave. Verifique o projeto e o faturamento no Google AI Studio.");
      }
      if (!response.ok) throw new Error("A pesquisa Gemini falhou (HTTP " + response.status + ").");
      apiResponse = await response.json() as RawResponse;
      modelUsed = model;
      break;
    }
    if (apiResponse) break;
    if (!unsupportedModel) break;
  }
  if (!apiResponse) throw new Error("Os modelos configurados para a pesquisa Gemini não estão disponíveis.");
  const candidate = apiResponse.candidates?.[0];
  const generated = parsedItems(candidate?.content?.parts?.map((part) => part.text || "").join("") || "");
  const grounding = candidate?.groundingMetadata?.groundingChunks || [];
  // Nunca apresentar como fonte verificada uma URL inventada na saída do modelo.
  // URLs de resultado vêm exclusivamente das referências devolvidas pela Pesquisa Google.
  const sources = grounding.flatMap((entry) => {
    const uri = publicUrl(entry.web?.uri || "");
    const title = (entry.web?.title || "").trim();
    return uri && title.length >= 8 ? [{ uri, title }] : [];
  });
  const unique = [...new Map(sources.map((source) => [source.uri, source])).values()]
    .filter((source) => !/google\.com\/search|youtube\.com\/results/i.test(source.uri));
  const categorySlug = input.topics[0]?.categorySlug || "noticias";
  const results = unique.slice(0, 12).map((source) => {
    const match = selectMatch(source.title, generated);
    const item = match?.score >= 0.22 ? match.item : null;
    return {
      title: (item?.title || source.title).slice(0, 180),
      excerpt: typeof item?.excerpt === "string" ? item.excerpt.slice(0, 700) : "",
      sourceName: typeof item?.sourceName === "string" && item.sourceName.trim()
        ? item.sourceName.trim().slice(0, 100) : source.title.slice(0, 100),
      sourceUrl: source.uri,
      publishedAt: safeDate(item?.publishedAt),
      categorySlug,
    } satisfies EditorialResearchResult;
  }).filter((item, index, items) =>
    !items.slice(0, index).some((other) => newsTitleSimilarity(item.title, other.title) >= 0.8)
  ).slice(0, 8);
  if (!results.length) throw new Error("O Gemini não retornou referências verificáveis nesta pesquisa. Ajuste os temas ou o período.");
  return {
    items: results, model: modelUsed, searchedAt: new Date().toISOString(),
    notice: "Fontes fornecidas pela pesquisa Google do Gemini. Confirme as datas, o conteúdo e o direito de uso antes de publicar.",
  };
}
