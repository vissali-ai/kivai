import "server-only";

import { supabaseRest } from "@/lib/blog/supabase";
import type { NewsAgentRun, NewsCandidate, NewsSource } from "@/lib/news-agent/types";

type DbSource = {
  id: string; name: string; feed_url: string; site_url: string; default_category_slug: string;
  enabled: boolean; created_at: string; updated_at: string;
};
type DbRun = {
  id: string; status: NewsAgentRun["status"]; sources_checked: number; items_found: number;
  drafts_created: number; items_skipped: number; error: string | null;
  started_at: string; finished_at: string | null;
};
type DbImport = { id: string; content_hash: string; status?: string };

function encode(value: string) { return encodeURIComponent(value); }

function mapSource(row: DbSource): NewsSource {
  return {
    id: row.id, name: row.name, feedUrl: row.feed_url, siteUrl: row.site_url,
    defaultCategorySlug: row.default_category_slug, enabled: row.enabled,
    createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

function mapRun(row: DbRun): NewsAgentRun {
  return {
    id: row.id, status: row.status, sourcesChecked: row.sources_checked,
    itemsFound: row.items_found, draftsCreated: row.drafts_created,
    itemsSkipped: row.items_skipped, error: row.error ?? "", startedAt: row.started_at,
    finishedAt: row.finished_at,
  };
}

export async function listNewsSources() {
  const rows = await supabaseRest<DbSource[]>("blog_rss_sources?select=*&order=name.asc");
  return rows.map(mapSource);
}

export async function listRecentAgentRuns(limit = 10) {
  const rows = await supabaseRest<DbRun[]>(`blog_news_agent_runs?select=*&order=started_at.desc&limit=${limit}`);
  return rows.map(mapRun);
}

export async function createAgentRun() {
  const rows = await supabaseRest<DbRun[]>("blog_news_agent_runs", {
    method: "POST", body: JSON.stringify({ status: "running" }),
  });
  return mapRun(rows[0]);
}

export async function finishAgentRun(id: string, input: {
  status: "completed" | "failed";
  sourcesChecked: number;
  itemsFound: number;
  draftsCreated: number;
  itemsSkipped: number;
  error?: string;
}) {
  const rows = await supabaseRest<DbRun[]>(`blog_news_agent_runs?id=eq.${encode(id)}`, {
    method: "PATCH",
    body: JSON.stringify({
      status: input.status,
      sources_checked: input.sourcesChecked,
      items_found: input.itemsFound,
      drafts_created: input.draftsCreated,
      items_skipped: input.itemsSkipped,
      error: input.error || null,
      finished_at: new Date().toISOString(),
    }),
  });
  return mapRun(rows[0]);
}

export async function listKnownContentHashes(hashes: string[]) {
  if (!hashes.length) return new Set<string>();
  const rows = await supabaseRest<Pick<DbImport, "content_hash">[]>(
    `blog_news_imports?select=content_hash&status=in.(processing,draft-created,ignored)&content_hash=in.(${hashes.join(",")})`,
  );
  return new Set(rows.map((row) => row.content_hash));
}

export async function claimNewsImport(candidate: NewsCandidate, runId: string, contentHash: string) {
  try {
    const rows = await supabaseRest<DbImport[]>("blog_news_imports", {
      method: "POST",
      body: JSON.stringify({
        source_id: candidate.sourceId,
        run_id: runId,
        source_guid: candidate.guid,
        source_url: candidate.url,
        original_title: candidate.title,
        original_excerpt: candidate.excerpt || null,
        original_published_at: candidate.publishedAt,
        content_hash: contentHash,
        status: "processing",
      }),
    });
    return rows[0]?.id ?? null;
  } catch (error) {
    if (error instanceof Error && (error.message.includes("23505") || error.message.includes("duplicate key"))) {
      const existing = await supabaseRest<DbImport[]>(
        `blog_news_imports?select=id,content_hash,status&content_hash=eq.${encode(contentHash)}&limit=1`,
      );
      if (existing[0]?.status === "failed") {
        await supabaseRest(`blog_news_imports?id=eq.${encode(existing[0].id)}`, {
          method: "PATCH",
          body: JSON.stringify({ status: "processing", run_id: runId, error: null, processed_at: null }),
        });
        return existing[0].id;
      }
      return null;
    }
    throw error;
  }
}

export async function completeNewsImport(id: string, postId: string) {
  await supabaseRest(`blog_news_imports?id=eq.${encode(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "draft-created", post_id: postId, processed_at: new Date().toISOString(), error: null }),
  });
}

export async function failNewsImport(id: string, error: string) {
  await supabaseRest(`blog_news_imports?id=eq.${encode(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "failed", processed_at: new Date().toISOString(), error: error.slice(0, 1000) }),
  });
}
