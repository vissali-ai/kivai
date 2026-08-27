import "server-only";

import { plainText } from "@/lib/blog/sanitize";
import { supabaseRest } from "@/lib/blog/supabase";

export type InstagramTutorialStep = {
  title: string;
  description: string;
  imageUrl: string;
};

export type InstagramFaqItem = {
  question: string;
  answer: string;
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
  audienceTitle: string;
  audienceDescription: string;
  plansTitle: string;
  freePlanDetail: string[];
  proPlanDetail: string[];
  agencyPlanDetail: string[];
  faqTitle: string;
  faqItems: InstagramFaqItem[];
  privacyTitle: string;
  privacyDescription: string;
  privacyItems: string[];
  privacyLinkLabel: string;
};

export const DEFAULT_INSTAGRAM_ANALYZER_CONFIG: InstagramAnalyzerConfig = {
  eyebrow: "Kivai Social Intelligence",
  pageTitle: "Quem deixou de seguir no Instagram",
  heroDescription: "Descubra rapidamente de forma gratuita quem não te segue de volta no Instagram e limpe seu perfil.",
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
  freeDescription: "R$ 0. Gratuito para análises essenciais de uma conta com até 50 mil seguidores.",
  proTitle: "Pro",
  proDescription: "R$ 19,90/mês ou R$ 199/ano na promoção anual. Economia de R$ 39,80 em relação a 12 mensalidades.",
  agencyTitle: "Agency",
  agencyDescription: "R$ 59,90/mês ou R$ 599/ano na promoção anual. Economia de R$ 119,80 em relação a 12 mensalidades.",
  audienceTitle: "Para quem é esta ferramenta?",
  audienceDescription: "Para usuários, criadores de conteúdo, influenciadores, marcas, social medias e agências que querem entender melhor sua própria rede no Instagram usando os dados exportados oficialmente pela Meta, sem informar a senha da conta.",
  plansTitle: "Entenda cada plano",
  freePlanDetail: [
    "Disponível gratuitamente para uma conta por análise.",
    "Analisa exportações com até 50 mil seguidores.",
    "Mostra quem não segue você de volta, quem você não segue e seguidores mútuos.",
    "O processamento acontece no navegador e o arquivo não é enviado ao Kivai para gerar o resultado.",
    "Não inclui histórico automático entre análises nem monitoramento recorrente.",
  ],
  proPlanDetail: [
    "Acompanhe a evolução de até 5 contas do Instagram.",
    "Histórico de análises e comparação entre exportações.",
    "Identifique novos seguidores e perfis que deixaram de seguir entre períodos analisados.",
    "Acompanhamento recorrente, comparações e indicadores avançados do perfil.",
    "Analisa contas com até 500 mil seguidores por perfil.",
  ],
  agencyPlanDetail: [
    "Ideal para agências, social medias e profissionais que administram várias contas.",
    "Gerencie até 20 perfis e clientes em um único ambiente.",
    "Organize históricos, comparações e relatórios por conta.",
    "Acompanhamento contínuo para operações com maior volume.",
    "Inclui recursos avançados de histórico, análise e processamento em servidor.",
  ],
  faqTitle: "Dúvidas frequentes",
  faqItems: [
    { question: "Preciso informar minha senha do Instagram?", answer: "Não. A ferramenta usa somente o arquivo de dados que você mesmo exporta pela Central de Contas da Meta." },
    { question: "Funciona em perfil privado?", answer: "Sim. A análise funciona normalmente quando o arquivo pertence à própria conta do usuário, mesmo que o perfil seja privado." },
    { question: "O Kivai salva meu arquivo no plano gratuito?", answer: "Não para gerar esta análise gratuita. O processamento do arquivo acontece localmente no navegador e o resultado é calculado no seu dispositivo." },
    { question: "Por que preciso exportar os dados pela Meta?", answer: "Porque essa é a forma mais segura de trabalhar com os dados da sua própria conta sem pedir senha nem depender de técnicas de acesso não autorizadas." },
    { question: "O resultado é em tempo real?", answer: "Não. O resultado representa os dados existentes no arquivo exportado pela Meta. Para uma análise mais atual, gere uma nova exportação." },
    { question: "É melhor enviar ZIP ou JSON?", answer: "O ZIP exportado pela Meta é a opção mais simples porque normalmente reúne os arquivos necessários de seguidores e seguindo em uma única seleção." },
    { question: "A ferramenta deixa de seguir pessoas automaticamente?", answer: "Não. O Kivai apenas analisa e organiza os perfis encontrados no arquivo. Qualquer ação dentro do Instagram continua sob seu controle." },
  ],
  privacyTitle: "Privacidade e uso dos dados",
  privacyDescription: "A ferramenta foi estruturada para usar somente os dados necessários à análise, com finalidade clara, transparência e separação entre o conteúdo do arquivo do Instagram e os dados usados para publicidade no site.",
  privacyItems: [
    "O Kivai não solicita sua senha do Instagram para realizar a análise.",
    "No plano gratuito, o arquivo selecionado é processado localmente no navegador para gerar o resultado.",
    "Os dados contidos na exportação do Instagram não são vendidos nem usados pelo Kivai para criar públicos ou personalizar anúncios.",
    "Cookies, métricas e publicidade do site são tratados separadamente e seguem as preferências de consentimento e a Política de Privacidade do Kivai.",
    "O site utiliza conexão HTTPS e procura aplicar medidas de segurança compatíveis com os dados processados.",
    "Você mantém o controle sobre o arquivo e pode encerrar a página ou recarregá-la para limpar a análise exibida localmente.",
  ],
  privacyLinkLabel: "Leia a Política de Privacidade completa",
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

function stringList(value: unknown, fallback: string[], maxItems = 10, maxLength = 1000) {
  if (!Array.isArray(value)) return fallback;
  const normalized = value
    .map((item) => plainText(typeof item === "string" ? item : "").slice(0, maxLength))
    .filter(Boolean)
    .slice(0, maxItems);
  return normalized.length ? normalized : fallback;
}

function faqList(value: unknown, fallback: InstagramFaqItem[]) {
  if (!Array.isArray(value)) return fallback;
  const normalized = value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const source = item as Record<string, unknown>;
    const question = plainText(typeof source.question === "string" ? source.question : "").slice(0, 300);
    const answer = plainText(typeof source.answer === "string" ? source.answer : "").slice(0, 1600);
    return question && answer ? [{ question, answer }] : [];
  }).slice(0, 12);
  return normalized.length ? normalized : fallback;
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
    audienceTitle: text(source.audienceTitle, DEFAULT_INSTAGRAM_ANALYZER_CONFIG.audienceTitle, 220),
    audienceDescription: text(source.audienceDescription, DEFAULT_INSTAGRAM_ANALYZER_CONFIG.audienceDescription, 1400),
    plansTitle: text(source.plansTitle, DEFAULT_INSTAGRAM_ANALYZER_CONFIG.plansTitle, 220),
    freePlanDetail: stringList(source.freePlanDetail, DEFAULT_INSTAGRAM_ANALYZER_CONFIG.freePlanDetail),
    proPlanDetail: stringList(source.proPlanDetail, DEFAULT_INSTAGRAM_ANALYZER_CONFIG.proPlanDetail),
    agencyPlanDetail: stringList(source.agencyPlanDetail, DEFAULT_INSTAGRAM_ANALYZER_CONFIG.agencyPlanDetail),
    faqTitle: text(source.faqTitle, DEFAULT_INSTAGRAM_ANALYZER_CONFIG.faqTitle, 220),
    faqItems: faqList(source.faqItems, DEFAULT_INSTAGRAM_ANALYZER_CONFIG.faqItems),
    privacyTitle: text(source.privacyTitle, DEFAULT_INSTAGRAM_ANALYZER_CONFIG.privacyTitle, 220),
    privacyDescription: text(source.privacyDescription, DEFAULT_INSTAGRAM_ANALYZER_CONFIG.privacyDescription, 1400),
    privacyItems: stringList(source.privacyItems, DEFAULT_INSTAGRAM_ANALYZER_CONFIG.privacyItems, 10, 1200),
    privacyLinkLabel: text(source.privacyLinkLabel, DEFAULT_INSTAGRAM_ANALYZER_CONFIG.privacyLinkLabel, 220),
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
