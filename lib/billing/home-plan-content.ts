import type { SiteOriginalField } from "@/lib/site-cms/types";

// Conteúdo promocional da home. O Admin edita estes campos na página /planos.
export const homePlanFields: SiteOriginalField[] = [
  { key: "home-plans-enabled", label: "Home: mostrar comparação de planos", type: "boolean", value: true },
  { key: "home-plans-title", label: "Home: título do bloco de planos", type: "text", value: "Um Kivai para cada necessidade" },
  { key: "home-plans-description", label: "Home: descrição do bloco", type: "textarea", value: "Comece gratuitamente e escolha mais recursos conforme seu trabalho evolui. Suas ferramentas favoritas continuam disponíveis." },
  { key: "home-free-features", label: "Home: destaques do Grátis (um por linha)", type: "textarea", value: "Ferramentas gratuitas sem assinatura\n10 créditos de IA por mês para contas cadastradas\nAté 5 projetos salvos na conta" },
  { key: "home-pro-features", label: "Home: destaques do Pro (um por linha)", type: "textarea", value: "100 créditos de IA por mês\nAté 30 projetos salvos na conta\nHistórico e comparações do Instagram" },
  { key: "home-agency-features", label: "Home: destaques do Agency (um por linha)", type: "textarea", value: "300 créditos de IA por mês\nAté 200 projetos salvos na conta\nKivai Aprova: clientes aprovam posts por link" },
  { key: "context-plans-enabled", label: "Divulgação contextual: exibir chamadas nas ferramentas e hubs", type: "boolean", value: true },
  { key: "context-plans-title", label: "Divulgação contextual: título", type: "text", value: "O Kivai acompanha a evolução do seu trabalho" },
  { key: "context-plans-hub-text", label: "Divulgação contextual: texto no Hub Social Media", type: "textarea", value: "Use as ferramentas gratuitas para criar e planejar. Com Pro, acompanhe análises do Instagram e amplie seu espaço de projetos; com Agency, organize clientes e envie posts para aprovação." },
  { key: "context-plans-tool-text", label: "Divulgação contextual: texto ao final das ferramentas Social Media", type: "textarea", value: "As ferramentas gratuitas continuam disponíveis. Conheça o Pro para histórico e mais projetos salvos, e o Agency para gerenciar aprovações por cliente." },
  { key: "context-plans-cta", label: "Divulgação contextual: texto do link para planos", type: "text", value: "Conhecer Grátis, Pro e Agency" },
];

export function withHomePlanFields(fields: SiteOriginalField[] = []): SiteOriginalField[] {
  const keys = new Set(fields.map(field => field.key));
  return [...fields, ...homePlanFields.filter(field => !keys.has(field.key))];
}

export const planPriceDisplay = {
  free: { monthly: "R$ 0", annual: "Grátis" },
  pro: { monthly: "R$ 19,90", annual: "R$ 199/ano" },
  agency: { monthly: "R$ 59,90", annual: "R$ 599/ano" },
} as const;
