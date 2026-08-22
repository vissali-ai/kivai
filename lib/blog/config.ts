export const blogConfig = {
  supabaseUrl: process.env.SUPABASE_URL?.replace(/\/$/, "") ?? "",
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  storageBucket: process.env.SUPABASE_BLOG_BUCKET ?? "blog-media",
  adminEmail: process.env.ADMIN_EMAIL ?? "",
  adminPassword: process.env.ADMIN_PASSWORD ?? "",
  authSecret: process.env.ADMIN_AUTH_SECRET ?? "",
};

export const newsAgentConfig = {
  cronSecret: process.env.NEWS_AGENT_CRON_SECRET ?? "",
  maxDrafts: 15,
  maxAgeHours: Math.min(Math.max(Number(process.env.NEWS_AGENT_MAX_AGE_HOURS ?? 48), 4), 168),
};

export function isNewsAgentConfigured() {
  return newsAgentConfig.cronSecret.length >= 32;
}

export function isBlogDatabaseConfigured() {
  return Boolean(blogConfig.supabaseUrl && blogConfig.serviceRoleKey);
}

export function assertBlogDatabaseConfigured() {
  if (!isBlogDatabaseConfigured()) {
    throw new Error(
      "O CMS ainda não foi conectado ao Supabase. Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
}
