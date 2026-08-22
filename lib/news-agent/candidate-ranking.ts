import { slugify } from "@/lib/blog/slug";
import type { NewsCandidate } from "@/lib/news-agent/types";

const CORE_TERMS = /\b(pdf|imagem|imagens|foto|fotos|v[ií]deo|[aá]udio|arquivo|arquivos|zip|rar|metadados|qr code|favicon|instagram|whatsapp|social media|e-?commerce|loja virtual|seo|automa[cç][aã]o|marketing digital)\b/i;
const SUPPORT_TERMS = /\b(formato|converter|convers[aã]o|compactar|compress[aã]o|redimensionar|editar|privacidade|seguran[cç]a|produtividade|conte[uú]do|campanha|analytics|tr[aá]fego|vendas?|cliente|intelig[eê]ncia artificial|\bia\b)\b/i;

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
  if (CORE_TERMS.test(text)) score += 4;
  if (SUPPORT_TERMS.test(text)) score += 2;
  if (["marketing", "e-commerce", "inteligencia-artificial"].includes(candidate.categorySlug)) score += 1;
  return Math.min(score, 6);
}

export function rankEditorialCandidates(candidates: NewsCandidate[]) {
  return candidates
    .map((candidate) => ({ candidate, score: candidateEditorialRelevance(candidate) }))
    .filter((item) => item.score >= 2)
    .sort((left, right) => right.score - left.score
      || new Date(right.candidate.publishedAt ?? 0).getTime() - new Date(left.candidate.publishedAt ?? 0).getTime());
}
