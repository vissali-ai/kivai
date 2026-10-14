import { z } from "zod";

// Only fields that already exist in the Kivai Social Media report are eligible.
// Derived values such as engagement rate are deliberately excluded.
export const IMPORTABLE_SOCIAL_METRICS = {
  followersStart: "Seguidores no início",
  followersEnd: "Seguidores no final",
  newFollowers: "Novos seguidores",
  lostFollowers: "Seguidores perdidos",
  publications: "Publicações realizadas",
  staticPosts: "Posts estáticos",
  carousels: "Carrosséis",
  videos: "Vídeos publicados",
  reels: "Reels/Shorts publicados",
  stories: "Stories publicados",
  lives: "Lives realizadas",
  reach: "Alcance",
  impressions: "Impressões",
  videoViews: "Visualizações de vídeo",
  profileViews: "Visitas ao perfil",
  likes: "Curtidas",
  comments: "Comentários",
  shares: "Compartilhamentos",
  saves: "Salvamentos",
  replies: "Respostas",
  clicks: "Cliques gerais",
  linkClicks: "Cliques em links",
  profileClicks: "Cliques no perfil",
  siteVisits: "Visitas ao site",
  contactClicks: "Cliques em contato",
  leads: "Leads",
  conversions: "Conversões",
  sales: "Vendas",
  revenue: "Receita total (R$)",
  investment: "Investimento em anúncios (R$)",
  paidImpressions: "Impressões pagas",
  paidClicks: "Cliques pagos",
  paidLeads: "Leads pagos",
  paidConversions: "Conversões pagas",
  paidRevenue: "Receita atribuída aos anúncios (R$)",
} as const;

export const socialMetricKeys = Object.keys(IMPORTABLE_SOCIAL_METRICS) as Array<keyof typeof IMPORTABLE_SOCIAL_METRICS>;
export type SocialImportMetricKey = keyof typeof IMPORTABLE_SOCIAL_METRICS;
export const socialImportSources = ["Instagram Insights", "Meta Business Suite", "Meta Ads Manager", "YouTube Studio", "TikTok Studio", "Outra"] as const;
export type SocialImportSource = typeof socialImportSources[number];

const fieldKey = z.enum(socialMetricKeys as [SocialImportMetricKey, ...SocialImportMetricKey[]]);
const date = z.union([z.literal(""), z.iso.date()]);
const supportedNetworks = ["", "Instagram", "Facebook", "TikTok", "YouTube", "LinkedIn", "X", "Threads", "Pinterest", "Outra"] as const;

export const socialImportResultSchema = z.object({
  network: z.enum(supportedNetworks),
  startDate: date,
  endDate: date,
  metrics: z.array(z.object({
    key: fieldKey,
    value: z.number().finite().min(0).max(1_000_000_000_000),
    evidence: z.string().trim().min(1).max(180),
  })).max(40),
  warnings: z.array(z.string().trim().min(4).max(240)).max(8),
}).superRefine((data, ctx) => {
  if (data.startDate && data.endDate && data.startDate > data.endDate) {
    ctx.addIssue({ code: "custom", message: "Período inconsistente" });
  }
  const seen = new Set<string>();
  data.metrics.forEach((m, index) => {
    if (seen.has(m.key)) ctx.addIssue({ code: "custom", message: "Métrica repetida", path: ["metrics", index] });
    seen.add(m.key);
  });
});
export type SocialImportResult = z.infer<typeof socialImportResultSchema>;

const textFile = z.object({
  kind: z.literal("text"),
  content: z.string().trim().min(1).max(35_000),
});
const binaryFile = z.object({
  kind: z.literal("binary"),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp", "application/pdf"]),
  data: z.string().min(100).max(2_800_000).regex(/^[a-zA-Z0-9+/=]+$/),
});
export const socialImportRequestSchema = z.object({
  source: z.enum(socialImportSources),
  networkHint: z.enum(supportedNetworks),
  files: z.array(z.discriminatedUnion("kind", [textFile, binaryFile])).min(1).max(3),
}).superRefine((data, ctx) => {
  const binary = data.files.filter(f => f.kind === "binary");
  const pdf = binary.some(f => f.mimeType === "application/pdf");
  const text = data.files.some(f => f.kind === "text");
  if ((pdf || text) && data.files.length !== 1) {
    ctx.addIssue({ code: "custom", message: "Somente um documento por análise" });
  }
  const bytes = binary.reduce((sum, f) => sum + Math.floor(f.data.length * 3 / 4), 0);
  if (bytes > 2_300_000) ctx.addIssue({ code: "custom", message: "Arquivos muito grandes" });
});
export type SocialImportRequest = z.infer<typeof socialImportRequestSchema>;
