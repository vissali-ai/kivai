export const newsRadarConfig = {
  enabled: process.env.NEWS_RADAR_ENABLED?.trim().toLowerCase() !== "false",
  cacheSeconds: Math.min(Math.max(Number(process.env.NEWS_RADAR_CACHE_SECONDS ?? 600), 300), 1_800),
  lockSeconds: 45,
  staleFallbackHours: 6,
  requestLimit: Math.min(Math.max(Number(process.env.NEWS_RADAR_REQUEST_LIMIT ?? 12), 5), 60),
  rateWindowSeconds: 10 * 60,
  maxResults: 10,
};
