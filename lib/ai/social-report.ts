import { z } from "zod";

// Payload deliberately excludes client names, handles, links, notes and other PII.
// Only explicitly informed aggregate metrics should be sent to the model.
const metric = z.number().finite().min(0).max(1_000_000_000_000).nullable();

export const socialReportInputSchema = z.object({
  network: z.enum(["Instagram", "Facebook", "TikTok", "YouTube", "LinkedIn", "X", "Threads", "Pinterest", "Outra"]),
  startDate: z.union([z.literal(""), z.iso.date()]),
  endDate: z.union([z.literal(""), z.iso.date()]),
  engagementMethod: z.enum(["followers", "reach", "impressions"]),
  metrics: z.object({
    followersStart: metric,
    followersEnd: metric,
    reach: metric,
    impressions: metric,
    interactions: metric,
    publications: metric,
    clicks: metric,
    investment: metric,
    leads: metric,
    revenue: metric,
    engagementRate: metric,
    ctr: metric,
    roas: metric,
  }),
  previous: z.object({
    reach: metric,
    impressions: metric,
    interactions: metric,
  }).nullable(),
});

export const socialReportInsightSchema = z.object({
  summary: z.string().trim().min(20).max(1200),
  strengths: z.array(z.string().trim().min(6).max(280)).max(3),
  attention: z.array(z.string().trim().min(6).max(280)).max(3),
  actions: z.array(z.string().trim().min(6).max(320)).min(1).max(4),
});

export type SocialReportAiInput = z.infer<typeof socialReportInputSchema>;
export type SocialReportAiInsight = z.infer<typeof socialReportInsightSchema>;

export function hasAnalyzableMetrics(input: SocialReportAiInput): boolean {
  return [
    input.metrics.reach,
    input.metrics.impressions,
    input.metrics.followersEnd,
    input.metrics.interactions,
    input.metrics.publications,
    input.metrics.leads,
    input.metrics.revenue,
  ].some((value) => value !== null);
}
