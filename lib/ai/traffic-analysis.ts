import { z } from "zod";

const finiteMetric = z.number().finite().min(0).max(1_000_000_000_000);
const positiveGoal = finiteMetric.nullable();

export const trafficGoalsSchema = z.object({
  budget: positiveGoal,
  leads: positiveGoal,
  maxCpl: positiveGoal,
  targetRoas: positiveGoal,
  monthlyRevenue: positiveGoal,
  conversionsAreLeads: z.boolean(),
  conversionValueIsRevenue: z.boolean(),
  objective: z.enum(["leads", "sales", "traffic", "awareness", "video", "app", "other"]).optional(),
  targetConversions: positiveGoal.optional(),
  maxCpa: positiveGoal.optional(),
  targetClicks: positiveGoal.optional(),
  targetImpressions: positiveGoal.optional(),
}).strict();

export const trafficSnapshotSchema = z.object({
  from: z.iso.date(),
  to: z.iso.date(),
  source: z.enum(["csv", "google_ads_api"]).optional(),
  timeZone: z.string().min(1).max(80).optional(),
  goals: trafficGoalsSchema,
  totals: z.object({
    impressions: finiteMetric,
    clicks: finiteMetric,
    cost: finiteMetric,
    conversions: finiteMetric,
    conversionValue: positiveGoal,
    campaignCount: z.number().int().min(1).max(20_000),
  }).strict(),
  channels: z.array(z.object({
    channel: z.string().max(35),
    cost: finiteMetric,
    conversions: finiteMetric,
    clicks: finiteMetric,
  }).strict()).max(20),
}).strict().superRefine((value, context) => {
  if (value.from > value.to) context.addIssue({ code: "custom", message: "Período inválido." });
});

export const trafficReportKind = z.enum([
  "recomendacoes_google", "anuncios_recursos", "palavras_chave",
  "termos_pesquisa", "publicos_regioes", "leilao", "performance_max", "outros",
]);

export const trafficAnalysisRequestSchema = z.object({
  consent: z.literal(true),
  snapshot: trafficSnapshotSchema,
  context: z.object({
    sector: z.string().trim().max(120),
    region: z.string().trim().max(120),
    notes: z.string().trim().max(1500),
    objective: z.enum(["leads", "sales", "traffic", "awareness", "video", "app", "other"]),
  }).strict().optional(),
  reports: z.array(z.object({
    kind: trafficReportKind,
    content: z.string().trim().min(10).max(12_000),
  }).strict()).max(3),
}).strict().superRefine((data, context) => {
  const total = data.reports.reduce((sum, item) => sum + item.content.length, 0);
  if (total > 28_000) context.addIssue({ code: "custom", message: "Reduza os relatórios complementares." });
});

export const trafficAiOutputSchema = z.object({
  summary: z.string().trim().min(30).max(850),
  recommendations: z.array(z.object({
    priority: z.enum(["alta", "media", "baixa"]),
    decision: z.enum(["revisar_agora", "investigar", "aguardar", "manter", "completar_dados"]),
    title: z.string().trim().min(8).max(125),
    finding: z.string().trim().min(20).max(550),
    evidence: z.string().trim().min(10).max(450),
    recommendation: z.string().trim().min(15).max(550),
    risk: z.string().trim().min(10).max(330),
    source: z.enum(["metas", "metricas_de_campanhas", "arquivo_complementar"]),
  }).strict()).min(1).max(8),
  missingData: z.array(z.string().trim().min(10).max(220)).max(8),
}).strict();

export type TrafficAnalysisRequest = z.infer<typeof trafficAnalysisRequestSchema>;
export type TrafficAiOutput = z.infer<typeof trafficAiOutputSchema>;
