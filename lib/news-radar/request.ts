import "server-only";

import { createHmac } from "node:crypto";
import { blogConfig } from "@/lib/blog/config";

export function radarRequestIdentifier(request: Request, scope: "search" | "click") {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const address = forwarded || request.headers.get("x-real-ip")?.trim() || "unknown";
  const secret = process.env.NEWS_RADAR_RATE_LIMIT_SALT || blogConfig.authSecret || blogConfig.serviceRoleKey;
  return createHmac("sha256", secret || "kivai-news-radar-local")
    .update(`${scope}:${address}`)
    .digest("hex");
}

export function publicRadarError(error: unknown) {
  const message = error instanceof Error ? error.message : "Não foi possível buscar as notícias agora.";
  if (message.includes("configuradas") || message.includes("indisponíveis") || message.includes("andamento") || message.includes("pausado")) {
    return message;
  }
  return "Não foi possível buscar as notícias agora. Tente novamente em alguns instantes.";
}
