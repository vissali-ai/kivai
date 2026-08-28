import "server-only";

import { supabaseRest } from "@/lib/blog/supabase";
import {
  normalizeInstagramAnalyzerConfig,
  type InstagramAnalyzerConfig,
} from "@/lib/instagram-follow-analyzer-config";

export type InstagramAnalyzerEditablePlan = "free" | "pro";
export type InstagramAnalyzerPlanVariants = Record<InstagramAnalyzerEditablePlan, InstagramAnalyzerConfig>;

type VariantRow = {
  plan_code: "free" | "pro" | "agency";
  config: unknown;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function proFallback(base: InstagramAnalyzerConfig): InstagramAnalyzerConfig {
  return normalizeInstagramAnalyzerConfig({
    ...base,
    eyebrow: "Kivai Pro",
    heroDescription:
      "Acompanhe a evolução dos seus perfis, compare novas exportações e mantenha um histórico privado das suas análises do Instagram.",
    badgeOne: "Acompanhamento Pro",
    tutorialDescription:
      "Para alimentar seu histórico Pro, exporte periodicamente seus dados pela Central de Contas da Meta. Cada nova exportação pode ser comparada com as anteriores.",
    tutorialSteps: base.tutorialSteps.map((step, index) =>
      index === 3
        ? {
            ...step,
            description:
              "Escolha a frequência de exportação que combine com sua rotina de acompanhamento. Você poderá importar novas exportações no Kivai para comparar períodos.",
          }
        : step,
    ),
    uploadTitle: "Atualize seu acompanhamento Pro",
    uploadDescription:
      "Importe uma nova exportação do Instagram para atualizar o perfil, registrar a análise e comparar a evolução com os períodos anteriores.",
  });
}

function normalizeVariant(
  raw: unknown,
  fallback: InstagramAnalyzerConfig,
): InstagramAnalyzerConfig {
  const source = asRecord(raw);
  if (!Object.keys(source).length) return fallback;
  return normalizeInstagramAnalyzerConfig({ ...fallback, ...source });
}

export async function getInstagramAnalyzerPlanVariants(
  base: InstagramAnalyzerConfig,
): Promise<InstagramAnalyzerPlanVariants> {
  const proBase = proFallback(base);
  try {
    const rows = await supabaseRest<VariantRow[]>(
      "instagram_analyzer_plan_variants?select=plan_code,config&plan_code=in.(free,pro)",
      { allowMissingConfig: true },
    );
    const byPlan = new Map(rows.map((row) => [row.plan_code, row.config]));
    return {
      free: normalizeVariant(byPlan.get("free"), base),
      pro: normalizeVariant(byPlan.get("pro"), proBase),
    };
  } catch {
    return { free: base, pro: proBase };
  }
}

export async function saveInstagramAnalyzerPlanVariant(
  plan: InstagramAnalyzerEditablePlan,
  config: unknown,
  base: InstagramAnalyzerConfig,
) {
  const fallback = plan === "pro" ? proFallback(base) : base;
  const normalized = normalizeVariant(config, fallback);
  await supabaseRest("instagram_analyzer_plan_variants?on_conflict=plan_code", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify({
      plan_code: plan,
      config: normalized,
      updated_at: new Date().toISOString(),
    }),
  });
  return normalized;
}
