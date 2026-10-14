import "server-only";

import { createHmac } from "node:crypto";
import { blogConfig } from "@/lib/blog/config";
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
