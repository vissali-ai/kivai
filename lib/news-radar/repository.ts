import "server-only";

import { supabaseRest } from "@/lib/blog/supabase";
import { listNewsSources } from "@/lib/news-agent/repository";
import type { NewsRadarCategory, RadarDailyMetric, RadarPayload, RadarSource } from "@/lib/news-radar/types";

type DbSourceMapping = { source_id: string; priority: number };
type DbCache = {
  category_slug: NewsRadarCategory;
  payload: RadarPayload;
  collected_at: string | null;
  expires_at: string | null;
  lock_token: string | null;
  lock_expires_at: string | null;
};
type DbMetric = {
  metric_date: string;
  category_slug: string;
  searches: number;
  cache_hits: number;
  results_returned: number;
  partial_results: number;
  empty_results: number;
  errors: number;
  outbound_clicks: number;
};

function encode(value: string) {
  return encodeURIComponent(value);
}

export async function listRadarSources(category: NewsRadarCategory): Promise<RadarSource[]> {
  const [mappings, sources] = await Promise.all([
    supabaseRest<DbSourceMapping[]>(
      `news_radar_category_sources?select=source_id,priority&category_slug=eq.${encode(category)}&enabled=eq.true&order=priority.asc`,
    ),
    listNewsSources(),
  ]);
  const byId = new Map(sources.filter((source) => source.enabled).map((source) => [source.id, source]));
  return mappings.flatMap((mapping) => {
    const source = byId.get(mapping.source_id);
    return source ? [{ ...source, radarPriority: mapping.priority }] : [];
  });
}

export async function getRadarCache(category: NewsRadarCategory) {
  const rows = await supabaseRest<DbCache[]>(
    `news_radar_cache?select=*&category_slug=eq.${encode(category)}&limit=1`,
  );
  return rows[0] ?? null;
}

export async function claimRadarCollection(category: NewsRadarCategory, lockToken: string, lockSeconds: number) {
  return supabaseRest<boolean>("rpc/claim_news_radar_collection", {
    method: "POST",
    body: JSON.stringify({ p_category_slug: category, p_lock_token: lockToken, p_lock_seconds: lockSeconds }),
  });
}

export async function saveRadarCache(category: NewsRadarCategory, lockToken: string, payload: RadarPayload) {
  await supabaseRest<DbCache[]>(
    `news_radar_cache?category_slug=eq.${encode(category)}&lock_token=eq.${encode(lockToken)}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        payload,
        collected_at: payload.collectedAt,
        expires_at: payload.expiresAt,
        lock_token: null,
        lock_expires_at: null,
      }),
    },
  );
}

export async function releaseRadarLock(category: NewsRadarCategory, lockToken: string) {
  await supabaseRest<DbCache[]>(
    `news_radar_cache?category_slug=eq.${encode(category)}&lock_token=eq.${encode(lockToken)}`,
    { method: "PATCH", body: JSON.stringify({ lock_token: null, lock_expires_at: null }) },
  );
}

export async function consumeRadarRateLimit(identifierHash: string, limit: number, windowSeconds: number) {
  return supabaseRest<boolean>("rpc/consume_news_radar_rate_limit", {
    method: "POST",
    body: JSON.stringify({
      p_identifier_hash: identifierHash,
      p_request_limit: limit,
      p_window_seconds: windowSeconds,
    }),
  });
}

export async function incrementRadarMetric(input: {
  category: NewsRadarCategory;
  searches?: number;
  cacheHits?: number;
  resultsReturned?: number;
  partialResults?: number;
  emptyResults?: number;
  errors?: number;
  outboundClicks?: number;
}) {
  await supabaseRest("rpc/increment_news_radar_metric", {
    method: "POST",
    body: JSON.stringify({
      p_category_slug: input.category,
      p_searches: input.searches ?? 0,
      p_cache_hits: input.cacheHits ?? 0,
      p_results_returned: input.resultsReturned ?? 0,
      p_partial_results: input.partialResults ?? 0,
      p_empty_results: input.emptyResults ?? 0,
      p_errors: input.errors ?? 0,
      p_outbound_clicks: input.outboundClicks ?? 0,
    }),
  });
}

export async function incrementRadarSourceClick(category: NewsRadarCategory, sourceName: string) {
  await supabaseRest("rpc/increment_news_radar_source_click", {
    method: "POST",
    body: JSON.stringify({ p_category_slug: category, p_source_name: sourceName.slice(0, 120) }),
  });
}

export async function listRadarMetrics(days = 30): Promise<RadarDailyMetric[]> {
  const since = new Date(Date.now() - Math.max(days - 1, 0) * 86_400_000).toISOString().slice(0, 10);
  const rows = await supabaseRest<DbMetric[]>(
    `news_radar_daily_metrics?select=*&metric_date=gte.${since}&order=metric_date.desc,category_slug.asc`,
  );
  return rows.map((row) => ({
    metricDate: row.metric_date,
    category: row.category_slug,
    searches: row.searches,
    cacheHits: row.cache_hits,
    resultsReturned: row.results_returned,
    partialResults: row.partial_results,
    emptyResults: row.empty_results,
    errors: row.errors,
    outboundClicks: row.outbound_clicks,
  }));
}
