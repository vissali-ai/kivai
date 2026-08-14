import "server-only";

import { randomUUID } from "node:crypto";
import { newsTitleSimilarity } from "@/lib/news-agent/candidate-ranking";
import { fetchNewsSource } from "@/lib/news-agent/source-collector";
import type { NewsCandidate } from "@/lib/news-agent/types";
import { newsRadarConfig } from "@/lib/news-radar/config";
import {
  claimRadarCollection,
  getRadarCache,
  incrementRadarMetric,
  listRadarSources,
  releaseRadarLock,
  saveRadarCache,
} from "@/lib/news-radar/repository";
import {
  radarCategoryLabel,
  type NewsRadarCategory,
  type RadarItem,
  type RadarPayload,
  type RadarResponse,
  type RadarSource,
} from "@/lib/news-radar/types";

const BRAZIL_TIME_ZONE = "America/Sao_Paulo";

type RankedCandidate = NewsCandidate & { sourcePriority: number };
type CandidateGroup = { representative: RankedCandidate; candidates: RankedCandidate[] };

function brazilDateKey(value: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BRAZIL_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function shortExcerpt(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= 280) return normalized;
  return `${normalized.slice(0, 277).trimEnd()}…`;
}

function groupCandidates(candidates: RankedCandidate[]) {
  const groups: CandidateGroup[] = [];
  for (const candidate of candidates) {
    const group = groups.find((item) => newsTitleSimilarity(item.representative.title, candidate.title) >= 0.52);
    if (group) group.candidates.push(candidate);
    else groups.push({ representative: candidate, candidates: [candidate] });
  }
  return groups;
}

function scoreGroup(group: CandidateGroup, now: number, isToday: boolean) {
  const publishedAt = new Date(group.representative.publishedAt!).getTime();
  const ageHours = Math.max((now - publishedAt) / 3_600_000, 0);
  const coverageCount = new Set(group.candidates.map((candidate) => candidate.sourceName)).size;
  const recency = Math.max(100 - ageHours * 4, 0);
  const sourceQuality = Math.max(6 - group.representative.sourcePriority, 1) * 3;
  return Math.round(recency + sourceQuality + (isToday ? 12 : 0) + Math.min(coverageCount - 1, 3) * 9);
}

function selectDiverse(items: RadarItem[], limit: number) {
  const selected: RadarItem[] = [];
  const perSource = new Map<string, number>();
  for (const item of items) {
    if ((perSource.get(item.sourceName) ?? 0) >= 3) continue;
    selected.push(item);
    perSource.set(item.sourceName, (perSource.get(item.sourceName) ?? 0) + 1);
    if (selected.length === limit) return selected;
  }
  for (const item of items) {
    if (!selected.includes(item)) selected.push(item);
    if (selected.length === limit) break;
  }
  return selected;
}

function rankCandidates(candidates: RankedCandidate[], nowDate: Date) {
  const now = nowDate.getTime();
  const cutoff = now - 24 * 3_600_000;
  const todayKey = brazilDateKey(nowDate);
  const recent = candidates
    .filter((candidate) => {
      if (!candidate.publishedAt) return false;
      const timestamp = new Date(candidate.publishedAt).getTime();
      return Number.isFinite(timestamp) && timestamp >= cutoff && timestamp <= now + 5 * 60_000;
    })
    .sort((left, right) => new Date(right.publishedAt!).getTime() - new Date(left.publishedAt!).getTime());

  const ranked = groupCandidates(recent).map((group): RadarItem => {
    const publishedAt = group.representative.publishedAt!;
    const isToday = brazilDateKey(new Date(publishedAt)) === todayKey;
    return {
      title: group.representative.title,
      sourceName: group.representative.sourceName,
      url: group.representative.url,
      excerpt: shortExcerpt(group.representative.excerpt),
      publishedAt,
      window: isToday ? "today" : "last-24-hours",
      coverageCount: new Set(group.candidates.map((candidate) => candidate.sourceName)).size,
      score: scoreGroup(group, now, isToday),
    };
  });

  const today = ranked.filter((item) => item.window === "today").sort((a, b) => b.score - a.score);
  const last24Hours = ranked.filter((item) => item.window === "last-24-hours").sort((a, b) => b.score - a.score);
  return selectDiverse([...today, ...last24Hours], newsRadarConfig.maxResults);
}

function cacheIsFresh(cache: Awaited<ReturnType<typeof getRadarCache>>) {
  return Boolean(cache?.payload && cache.expires_at && new Date(cache.expires_at).getTime() > Date.now());
}

function cacheCanBeFallback(cache: Awaited<ReturnType<typeof getRadarCache>>) {
  if (!cache?.payload || !cache.collected_at) return false;
  return new Date(cache.collected_at).getTime() >= Date.now() - newsRadarConfig.staleFallbackHours * 3_600_000;
}

function asResponse(payload: RadarPayload, fromCache: boolean, stale = false): RadarResponse {
  return { ...payload, fromCache, stale };
}

async function recordSearch(response: RadarResponse) {
  try {
    await incrementRadarMetric({
      category: response.category,
      searches: 1,
      cacheHits: response.fromCache ? 1 : 0,
      resultsReturned: response.items.length,
      partialResults: response.partial ? 1 : 0,
      emptyResults: response.items.length ? 0 : 1,
    });
  } catch {
    // Métricas não podem impedir a entrega do Radar.
  }
}

async function recordError(category: NewsRadarCategory) {
  try {
    await incrementRadarMetric({ category, searches: 1, errors: 1 });
  } catch {
    // A falha operacional original permanece prioritária.
  }
}

async function collectCategory(category: NewsRadarCategory, sources: RadarSource[]): Promise<RadarPayload> {
  const settled = await Promise.allSettled(sources.map(async (source) => ({
    source,
    candidates: await fetchNewsSource(source),
  })));
  const successful = settled.flatMap((result) => result.status === "fulfilled" ? [result.value] : []);
  if (!successful.length) throw new Error("As fontes desta categoria estão temporariamente indisponíveis.");
  const candidates = successful.flatMap(({ source, candidates: sourceCandidates }) =>
    sourceCandidates.map((candidate) => ({ ...candidate, sourcePriority: source.radarPriority })),
  );
  const collectedAt = new Date();
  return {
    category,
    categoryLabel: radarCategoryLabel(category),
    items: rankCandidates(candidates, collectedAt),
    collectedAt: collectedAt.toISOString(),
    expiresAt: new Date(collectedAt.getTime() + newsRadarConfig.cacheSeconds * 1_000).toISOString(),
    sourcesChecked: sources.length,
    sourcesSucceeded: successful.length,
    partial: successful.length < sources.length,
  };
}

async function waitForSharedResult(category: NewsRadarCategory, previousCollectedAt?: string | null) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const cache = await getRadarCache(category);
    if (cacheIsFresh(cache) && cache?.collected_at !== previousCollectedAt) return cache;
  }
  return null;
}

export async function searchNewsRadar(category: NewsRadarCategory): Promise<RadarResponse> {
  if (!newsRadarConfig.enabled) throw new Error("O Radar está temporariamente pausado.");
  const existing = await getRadarCache(category);
  if (cacheIsFresh(existing)) {
    const response = asResponse(existing!.payload, true);
    await recordSearch(response);
    return response;
  }

  const lockToken = randomUUID();
  const claimed = await claimRadarCollection(category, lockToken, newsRadarConfig.lockSeconds);
  if (!claimed) {
    const shared = await waitForSharedResult(category, existing?.collected_at);
    if (shared?.payload) {
      const response = asResponse(shared.payload, true);
      await recordSearch(response);
      return response;
    }
    if (cacheCanBeFallback(existing)) {
      const response = asResponse(existing!.payload, true, true);
      await recordSearch(response);
      return response;
    }
    await recordError(category);
    throw new Error("Uma busca desta categoria ainda está em andamento. Tente novamente em instantes.");
  }

  try {
    const sources = await listRadarSources(category);
    if (!sources.length) throw new Error("As fontes do Radar ainda não foram configuradas para esta categoria.");
    const payload = await collectCategory(category, sources);
    await saveRadarCache(category, lockToken, payload);
    const response = asResponse(payload, false);
    await recordSearch(response);
    return response;
  } catch (error) {
    try { await releaseRadarLock(category, lockToken); } catch { /* O lock expira automaticamente. */ }
    if (cacheCanBeFallback(existing)) {
      const response = asResponse(existing!.payload, true, true);
      await recordSearch(response);
      return response;
    }
    await recordError(category);
    throw error;
  }
}
