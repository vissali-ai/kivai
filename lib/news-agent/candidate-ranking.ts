import { slugify } from "@/lib/blog/slug";
import type { NewsCandidate } from "@/lib/news-agent/types";

const CORE_TERMS = /\b(pdf|imagem|imagens|image|images|foto|fotos|photo|photos|v[ií]deo|video|[aá]udio|audio|arquivo|arquivos|file|files|zip|rar|metadados|metadata|qr code|favicon|instagram|whatsapp|social media|e-?commerce|loja virtual|online store|seo|automa[cç][aã]o|automation|marketing digital|digital marketing)\b/i;
const SUPPORT_TERMS = /\b(formato|format|converter|conversion|convers[aã]o|compactar|compress[aã]o|compression|redimensionar|resize|editar|editing|privacidade|privacy|seguran[cç]a|security|produtividade|productivity|conte[uú]do|content|campanha|campaign|analytics|tr[aá]fego|traffic|vendas?|sales|cliente|customer|intelig[eê]ncia artificial|artificial intelligence|\bia\b|ai)\b/i;
const OFF_TOPIC_TERMS = /\b(celebridade|celebrity|futebol|football|campeonato|reality show|fofoca|gossip|receita culin[aá]ria|hor[oó]scopo|crime|assassinato|elei[cç][aã]o|partido pol[ií]tico)\b/i;

export const EDITORIAL_MIN_SCORE = 3;

export function editorialFitFromScore(score: number) {
  if (score >= 4) return { key: "aligned", label: "Alinhada ao editorial", detail: "Relação direta com os temas centrais do Kivai." } as const;
  if (score >= EDITORIAL_MIN_SCORE) return { key: "review", label: "Revisar encaixe", detail: "Tema próximo do editorial, mas precisa de um ângulo próprio do Kivai." } as const;
  if (score > 0) return { key: "outside", label: "Fora do editorial", detail: "Relação insuficiente com os temas do Kivai." } as const;
  return { key: "unrated", label: "Sem avaliação", detail: "Pauta antiga, coletada antes desta classificação." } as const;
}

export function normalizedNewsTitle(value: string) {
  return slugify(value).replace(/-/g, " ");
}

export function newsTitleSimilarity(left: string, right: string) {
  const a = new Set(normalizedNewsTitle(left).split(" ").filter((word) => word.length > 2));
  const b = new Set(normalizedNewsTitle(right).split(" ").filter((word) => word.length > 2));
  if (!a.size || !b.size) return 0;
  const intersection = [...a].filter((word) => b.has(word)).length;
  return intersection / new Set([...a, ...b]).size;
}

export function deduplicateNewsTopics(candidates: NewsCandidate[], threshold = 0.58) {
  const selected: NewsCandidate[] = [];
  for (const candidate of candidates) {
    if (!selected.some((item) => newsTitleSimilarity(item.title, candidate.title) >= threshold)) {
      selected.push(candidate);
    }
  }
  return selected;
}

export function candidateEditorialRelevance(candidate: NewsCandidate) {
  const text = `${candidate.title} ${candidate.excerpt}`;
  let score = 0;
  const hasCoreTerm = CORE_TERMS.test(text);
  if (hasCoreTerm) score += 4;
  if (SUPPORT_TERMS.test(text)) score += 2;
  if (["marketing", "e-commerce", "inteligencia-artificial"].includes(candidate.categorySlug)) score += 1;
  if (!hasCoreTerm && OFF_TOPIC_TERMS.test(text)) score -= 3;
  return Math.max(0, Math.min(score, 6));
}

export function rankEditorialCandidates(candidates: NewsCandidate[]) {
  return candidates
    .map((candidate) => ({ candidate, score: candidateEditorialRelevance(candidate) }))
    .filter((item) => item.score >= EDITORIAL_MIN_SCORE)
    .sort((left, right) => right.score - left.score
      || new Date(right.candidate.publishedAt ?? 0).getTime() - new Date(left.candidate.publishedAt ?? 0).getTime());
}
