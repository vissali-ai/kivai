import "server-only";

import { createHmac } from "node:crypto";
import { blogConfig } from "@/lib/blog/config";
import { supabaseRest } from "@/lib/blog/supabase";
import { consumeRadarRateLimit } from "@/lib/news-radar/repository";

// Preview pilot: reuse the existing atomic, persistent Supabase limiter with
// isolated hashed namespaces. Before enabling production, move to a dedicated
// AI quota/usage table with daily allowances per plan and global token budgets.
const USER_REQUESTS_PER_HOUR = 5;
const GLOBAL_REQUESTS_PER_HOUR = 30;

function identifier(scope: string) {
  const secret = blogConfig.authSecret || blogConfig.serviceRoleKey;
  if (!secret) throw new Error("AI_LIMITER_NOT_CONFIGURED");
  return createHmac("sha256", secret).update(`kivai-ai:v1:${scope}`).digest("hex");
}

export async function reserveAiRequest(userId: string): Promise<boolean> {
  const userAllowed = await consumeRadarRateLimit(
    identifier(`user:${userId}`),
    USER_REQUESTS_PER_HOUR,
    3600,
  );
  if (!userAllowed) return false;

  return consumeRadarRateLimit(
    identifier("global:all-tools"),
    GLOBAL_REQUESTS_PER_HOUR,
    3600,
  );
}

type HourLimitRow = { request_count: number; window_started_at: string };

// Read-only view of the same limiter used for actual AI requests.
export async function getAiHourlyStatus(userId: string) {
  const rows = await supabaseRest<HourLimitRow[]>(
    `news_radar_rate_limits?select=request_count,window_started_at&identifier_hash=eq.${identifier(`user:${userId}`)}&limit=1`
  );
  const row = rows[0];
  const expiresAt = row ? new Date(row.window_started_at).getTime() + 3_600_000 : 0;
  const active = expiresAt > Date.now();
  const count = active ? row.request_count : 0;
  return {
    limit: USER_REQUESTS_PER_HOUR,
    remaining: Math.max(0, USER_REQUESTS_PER_HOUR - count),
    renews_at: active ? new Date(expiresAt).toISOString() : null,
  };
}
