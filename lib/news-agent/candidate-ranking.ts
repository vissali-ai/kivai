import { slugify } from "@/lib/blog/slug";
import type { NewsCandidate } from "@/lib/news-agent/types";

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
