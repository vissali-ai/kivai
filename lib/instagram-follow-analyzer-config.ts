import "server-only";

import { plainText } from "@/lib/blog/sanitize";
import { supabaseRest } from "@/lib/blog/supabase";

export type InstagramTutorialStep = {
  title: string;
  description: string;
  imageUrl: string;
};

export type InstagramAnalyzerConfig = {
  eyebrow: string;
  pageTitle: string;
  heroDescription: string;
  badgeOne: string;
  badgeTwo: string;
  tutorialKicker: string;
  tutorialTitle: string;
  tutorialDescription: string;
  metaButtonLabel: string;
  metaUrl: string;
  tutorialSteps: InstagramTutorialStep[];
  finalCta: string;
  uploadTitle: string;
  uploadDescription: string;
  uploadLabel: string;
  freeTitle: string;
  freeDescription: string;
  proTitle: string;
  proDescription: string;
  agencyTitle: string;
  agencyDescription: string;
};

export const DEFAULT_INSTAGRAM_ANALYZER_CONFIG: InstagramAnalyzerConfig = {
  eyebrow: "Kivai Social Intelligence",
  pageTitle: "Instagram Follow Analyzer",
  heroDescription: "Descubra rapidamente de forma gratuita quem não te segue de volta no instagram e limpe seu perfil.",
  badgeOne: "Análise rápida",
  badgeTwo: "Exportação oficial da Meta",
  tutorialKicker: "Precisa de ajuda?",
  tutorialTitle: "Confira o passo a passo abaixo",
  tutorialDescription: "Para analisar quem não te segue de volta, primeiro você precisa exportar seu arquivo do Instagram pela Central de Contas da Meta.",
  metaButtonLabel: "Abrir página oficial da Meta",
  metaUrl: "https://accountscenter.instagram.com/info_and_permissions/dyi/?theme=dark",
  tutorialSteps: [
    { title: "Criar exportação", description: "Na página de exportação da Central de Contas, clique em Criar exportação.", imageUrl: "" },
    { title: "Escolher para onde exportar", description: "Selecione Exportar para serviço externo para continuar.", imageUrl: "" },
    { title: "Escolher Google Drive", description: "Selecione Google Drive. É a opção que recomendamos para uma experiência mais simples.", imageUrl: "" },
    { title: "Escolher a frequência", description: "Escolha a frequência que fizer mais sentido para você e avance. Para uma análise pontual, Uma vez é suficiente.", imageUrl: "" },
    { title: "Conectar sua conta", description: "Clique em Conectar e autorize sua conta do Google Drive para receber a exportação.", imageUrl: "" },
    { title: "Personalizar informações", description: "Na tela de confirmação da exportação, entre em Personalizar informações.", imageUrl: "" },
    { title: "Deixar somente Conexões", description: "Para a análise gratuita, deixe marcada apenas a seção Conexões, com os dados de Contatos e Seguidores e Seguindo, e salve.", imageUrl: "" },
    { title: "Selecionar Desde o início", description: "Abra Intervalo de datas, escolha Desde o início e salve. Esse ponto é importante para evitar uma exportação incompleta.", imageUrl: "" },
    { title: "Escolher JSON e iniciar", description: "Em Formato, escolha JSON, que é mais leve, salve e clique em Iniciar exportação. A Meta enviará uma confirmação por e-mail quando o arquivo estiver pronto. O processo pode levar cerca de 10 minutos, podendo variar conforme a conta.", imageUrl: "" },
  ],
  finalCta: "Pronto para exportar? Clique no botão abaixo",
  uploadTitle: "Importe seus dados do Instagram",
  uploadDescription: "Envie o arquivo exportado do Instagram e aguarde a análise completa.",
  uploadLabel: "Selecione o arquivo ZIP ou JSON",
  freeTitle: "Grátis",
  freeDescription: "Até 50 mil seguidores, com as três análises essenciais.",
  proTitle: "Pro",
  proDescription: "Com histórico que você vai poder acompanhar quem deixou de seguir, acompanhamento rotineiro do perfil, novos seguidores, comparações e análises avançadas.",
  agencyTitle: "Agency",
  agencyDescription: "Múltiplas contas, clientes, relatórios e operação para agências.",
};

type ConfigRow = { custom_data: unknown };

function text(value: unknown, fallback: string, max = 1000) {
  const cleaned = plainText(typeof value === "string" ? value : "").slice(0, max);
  return cleaned || fallback;
}

function url(value: unknown, fallback = "") {
  if (typeof value !== "string") return fallback;
  const clean = value.trim().slice(0, 1200);
  if (!clean) return fallback;
  if (clean.startsWith("/") || /^https?:\/\//i.test(clean)) return clean;
  return fallback;
}

export function normalizeInstagramAnalyzerConfig(value: unknown): InstagramAnalyzerConfig {
  const source = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const rawSteps = Array.isArray(source.tutorialSteps) ? source.tutorialSteps : [];
  const tutorialSteps = DEFAULT_INSTAGRAM_ANALYZER_CONFIG.tutorialSteps.map((fallback, index) => {
    const item = rawSteps[index] && typeof rawSteps[index] === "object" ? rawSteps[index] as Record<string, unknown> : {};
    return {
      title: text(item.title, fallback.title, 180),
      description: text(item.description, fallback.description, 1500),
      imageUrl: url(item.imageUrl, ""),
    };
  });

  return {
    eyebrow: text(source.eyebrow, DEFAULT_INSTAGRAM_ANALYZER_CONFIG.eyebrow, 180),
    pageTitle: text(source.pageTitle, DEFAULT_INSTAGRAM_ANALYZER_CONFIG.pageTitle, 180),
    heroDescription: text(source.heroDescription, DEFAULT_INSTAGRAM_ANALYZER_CONFIG.heroDescription, 800),
    badgeOne: text(source.badgeOne, DEFAULT_INSTAGRAM_ANALYZER_CONFIG.badgeOne, 120),
    badgeTwo: text(source.badgeTwo, DEFAULT_INSTAGRAM_ANALYZER_CONFIG.badgeTwo, 120),
    tutorialKicker: text(source.tutorialKicker, DEFAULT_INSTAGRAM_ANALYZER_CONFIG.tutorialKicker, 120),
    tutorialTitle: text(source.tutorialTitle, DEFAULT_INSTAGRAM_ANALYZER_CONFIG.tutorialTitle, 220),
    tutorialDescription: text(source.tutorialDescription, DEFAULT_INSTAGRAM_ANALYZER_CONFIG.tutorialDescription, 1000),
    metaButtonLabel: text(source.metaButtonLabel, DEFAULT_INSTAGRAM_ANALYZER_CONFIG.metaButtonLabel, 160),
    metaUrl: url(source.metaUrl, DEFAULT_INSTAGRAM_ANALYZER_CONFIG.metaUrl),
    tutorialSteps,
    finalCta: text(source.finalCta, DEFAULT_INSTAGRAM_ANALYZER_CONFIG.finalCta, 220),
    uploadTitle: text(source.uploadTitle, DEFAULT_INSTAGRAM_ANALYZER_CONFIG.uploadTitle, 220),
    uploadDescription: text(source.uploadDescription, DEFAULT_INSTAGRAM_ANALYZER_CONFIG.uploadDescription, 800),
    uploadLabel: text(source.uploadLabel, DEFAULT_INSTAGRAM_ANALYZER_CONFIG.uploadLabel, 180),
    freeTitle: text(source.freeTitle, DEFAULT_INSTAGRAM_ANALYZER_CONFIG.freeTitle, 120),
    freeDescription: text(source.freeDescription, DEFAULT_INSTAGRAM_ANALYZER_CONFIG.freeDescription, 700),
    proTitle: text(source.proTitle, DEFAULT_INSTAGRAM_ANALYZER_CONFIG.proTitle, 120),
    proDescription: text(source.proDescription, DEFAULT_INSTAGRAM_ANALYZER_CONFIG.proDescription, 900),
    agencyTitle: text(source.agencyTitle, DEFAULT_INSTAGRAM_ANALYZER_CONFIG.agencyTitle, 120),
    agencyDescription: text(source.agencyDescription, DEFAULT_INSTAGRAM_ANALYZER_CONFIG.agencyDescription, 700),
  };
}

export async function getInstagramAnalyzerConfig() {
  try {
    const rows = await supabaseRest<ConfigRow[]>("site_contents?select=custom_data&slug=eq.instagram-follow-analyzer&limit=1", { allowMissingConfig: true });
    return normalizeInstagramAnalyzerConfig(rows[0]?.custom_data);
  } catch {
    return DEFAULT_INSTAGRAM_ANALYZER_CONFIG;
  }
}

export async function saveInstagramAnalyzerConfig(config: unknown) {
  const normalized = normalizeInstagramAnalyzerConfig(config);
  await supabaseRest("site_contents?slug=eq.instagram-follow-analyzer", {
    method: "PATCH",
    body: JSON.stringify({ custom_data: normalized, updated_at: new Date().toISOString() }),
  });
  return normalized;
}
