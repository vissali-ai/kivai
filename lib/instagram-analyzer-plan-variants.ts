import "server-only";

import { plainText } from "@/lib/blog/sanitize";
import { supabaseRest } from "@/lib/blog/supabase";
import {
  normalizeInstagramAnalyzerConfig,
  type InstagramAnalyzerConfig,
  type InstagramTutorialStep,
} from "@/lib/instagram-follow-analyzer-config";

export type InstagramAnalyzerEditablePlan = "free" | "pro" | "agency";
export type InstagramAnalyzerPlanVariants = Record<InstagramAnalyzerEditablePlan, InstagramAnalyzerConfig>;

type VariantRow = {
  plan_code: InstagramAnalyzerEditablePlan;
  config: unknown;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function safeText(value: unknown, fallback = "", max = 1500) {
  const cleaned = plainText(typeof value === "string" ? value : "").slice(0, max);
  return cleaned || fallback;
}

function safeUrl(value: unknown, fallback = "") {
  if (typeof value !== "string") return fallback;
  const cleaned = value.trim().slice(0, 1200);
  if (!cleaned) return fallback;
  if (cleaned.startsWith("/") || /^https?:\/\//i.test(cleaned)) return cleaned;
  return fallback;
}

function normalizeSteps(value: unknown, fallback: InstagramTutorialStep[]) {
  if (!Array.isArray(value)) return fallback;
  const steps = value.flatMap((item, index) => {
    if (!item || typeof item !== "object") return [];
    const source = item as Record<string, unknown>;
    const fallbackStep = fallback[index] ?? { title: `Passo ${index + 1}`, description: "", imageUrl: "" };
    const title = safeText(source.title, fallbackStep.title, 180);
    const description = safeText(source.description, fallbackStep.description, 1500);
    const imageUrl = safeUrl(source.imageUrl, fallbackStep.imageUrl);
    return title || description || imageUrl ? [{ title, description, imageUrl }] : [];
  }).slice(0, 20);
  return steps.length ? steps : fallback;
}

function proFallback(base: InstagramAnalyzerConfig): InstagramAnalyzerConfig {
  return {
    ...base,
    eyebrow: "Kivai Pro",
    heroDescription:
      "Acompanhe a evolução dos seus perfis, compare novas exportações e mantenha um histórico privado das suas análises do Instagram.",
    badgeOne: "Acompanhamento Pro",
    tutorialDescription:
      "Para alimentar seu histórico Pro, exporte periodicamente seus dados pela Central de Contas da Meta. Para aproveitar os recursos avançados, inclua Seguidores e Seguindo, Comentários, Curtidas, Interações com stories e Insights anteriores do Instagram.",
    tutorialSteps: base.tutorialSteps.map((step, index) =>
      index === 3
        ? {
            ...step,
            description:
              "Escolha a frequência de exportação que combine com sua rotina de acompanhamento. Você poderá importar novas exportações no Kivai para comparar períodos.",
          }
        : index === 6
          ? {
              ...step,
              title: "Selecionar os dados do Pro",
              description:
                "Em Personalizar informações, selecione Seguidores e Seguindo, Comentários, Curtidas, Interações com stories e Insights anteriores do Instagram. Esses dados permitem enriquecer o histórico e as métricas disponíveis quando estiverem presentes na exportação da Meta.",
            }
          : step,
    ),
    uploadTitle: "Atualize seu acompanhamento Pro",
    uploadDescription:
      "Importe uma nova exportação do Instagram para atualizar o perfil, registrar a análise e comparar a evolução com os períodos anteriores.",
  };
}

function agencyFallback(base: InstagramAnalyzerConfig): InstagramAnalyzerConfig {
  const pro = proFallback(base);
  return {
    ...pro,
    eyebrow: "Kivai Agency",
    pageTitle: "Analisador de Seguidores do Instagram para agências",
    heroDescription:
      "Centralize a análise de até 20 perfis ou clientes, organize históricos por conta e acompanhe mudanças de seguidores e indicadores em uma operação profissional.",
    badgeOne: "Até 20 contas e clientes",
    badgeTwo: "Histórico separado por perfil",
    tutorialKicker: "Configuração Agency",
    tutorialTitle: "Prepare as exportações dos seus clientes",
    tutorialDescription:
      "Use uma exportação oficial da Meta para cada perfil administrado. Para aproveitar a experiência Agency, selecione Seguidores e Seguindo, Comentários, Curtidas, Interações com stories e Insights anteriores do Instagram.",
    tutorialSteps: pro.tutorialSteps.map((step, index) =>
      index === 3
        ? {
            ...step,
            description:
              "Defina uma frequência de exportação compatível com sua rotina de atendimento. Repita o processo para cada cliente que será acompanhado no painel Agency.",
          }
        : index === 6
          ? {
              ...step,
              title: "Selecionar os dados da análise Agency",
              description:
                "Em Personalizar informações, selecione Seguidores e Seguindo, Comentários, Curtidas, Interações com stories e Insights anteriores do Instagram. Mantenha somente os dados necessários à análise para reduzir o tamanho da exportação.",
            }
          : step,
    ),
    finalCta: "Depois de exportar, importe o arquivo na conta correta do seu painel Agency.",
    uploadTitle: "Importe a exportação de um cliente",
    uploadDescription:
      "Selecione a conta ou cliente correto e importe a nova exportação para atualizar o histórico, as comparações e os indicadores daquele perfil.",
    uploadLabel: "Selecione o ZIP ou JSON da conta",
    audienceTitle: "Para quem é o Agency?",
    audienceDescription:
      "Para agências, social medias, consultores e equipes que administram vários perfis do Instagram e precisam separar clientes, históricos e análises em uma única operação.",
    plansTitle: "Recursos do seu plano Agency",
    agencyPlanDetail: [
      "Gerencie até 20 perfis ou clientes em um único ambiente.",
      "Mantenha histórico privado e separado para cada conta.",
      "Compare exportações e identifique novos seguidores e unfollows por período.",
      "Aproveite dados de curtidas, comentários, stories e insights quando estiverem presentes na exportação oficial da Meta.",
      "Organize uma rotina recorrente de análise para operações de maior volume.",
      "Processamento e estrutura preparados para uso profissional e múltiplos clientes.",
    ],
    faqTitle: "Dúvidas sobre o Agency",
    faqItems: [
      ...pro.faqItems,
      {
        question: "Quantos perfis posso administrar no Agency?",
        answer: "O plano Agency foi estruturado para até 20 perfis ou clientes no mesmo ambiente.",
      },
      {
        question: "Os históricos dos clientes ficam separados?",
        answer: "Sim. Cada perfil deve manter sua própria sequência de exportações e comparações para evitar mistura de dados entre clientes.",
      },
    ].slice(0, 12),
    privacyDescription:
      "No Agency, cada exportação pertence a uma conta ou cliente específico. O Kivai organiza o histórico por perfil e aplica as mesmas diretrizes de segurança e finalidade clara no tratamento dos dados importados.",
  };
}

function normalizeVariant(raw: unknown, fallback: InstagramAnalyzerConfig): InstagramAnalyzerConfig {
  const source = asRecord(raw);
  if (!Object.keys(source).length) return fallback;
  const normalized = normalizeInstagramAnalyzerConfig({ ...fallback, ...source });
  return {
    ...normalized,
    tutorialSteps: normalizeSteps(source.tutorialSteps, fallback.tutorialSteps),
  };
}

export async function getInstagramAnalyzerPlanVariants(
  base: InstagramAnalyzerConfig,
): Promise<InstagramAnalyzerPlanVariants> {
  const proBase = proFallback(base);
  const agencyBase = agencyFallback(base);
  try {
    const rows = await supabaseRest<VariantRow[]>(
      "instagram_analyzer_plan_variants?select=plan_code,config&plan_code=in.(free,pro,agency)",
      { allowMissingConfig: true },
    );
    const byPlan = new Map(rows.map((row) => [row.plan_code, row.config]));
    return {
      free: normalizeVariant(byPlan.get("free"), base),
      pro: normalizeVariant(byPlan.get("pro"), proBase),
      agency: normalizeVariant(byPlan.get("agency"), agencyBase),
    };
  } catch {
    return { free: base, pro: proBase, agency: agencyBase };
  }
}

export async function saveInstagramAnalyzerPlanVariant(
  plan: InstagramAnalyzerEditablePlan,
  config: unknown,
  base: InstagramAnalyzerConfig,
) {
  const fallback = plan === "pro" ? proFallback(base) : plan === "agency" ? agencyFallback(base) : base;
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
