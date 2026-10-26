import type { SiteOriginalField } from "@/lib/site-cms/types";

// Conteúdo promocional da home. O Admin edita estes campos na página /planos.
export const homePlanFields: SiteOriginalField[] = [
  { key: "home-plans-enabled", label: "Home: mostrar comparação de planos", type: "boolean", value: true },
  { key: "home-plans-title", label: "Home: título do bloco de planos", type: "text", value: "Um Kivai para cada necessidade" },
  { key: "home-plans-description", label: "Home: descrição do bloco", type: "textarea", value: "Comece gratuitamente e escolha mais recursos conforme seu trabalho evolui. Suas ferramentas favoritas continuam disponíveis." },
  { key: "home-free-features", label: "Home: destaques do Grátis (um por linha)", type: "textarea", value: "Ferramentas gratuitas sem assinatura\n10 créditos de IA por mês para contas cadastradas\nAté 5 projetos salvos na conta" },
  { key: "home-pro-features", label: "Home: destaques do Pro (um por linha)", type: "textarea", value: "100 créditos de IA por mês\nAté 30 projetos salvos na conta\nHistórico e comparações do Instagram" },
  { key: "home-agency-features", label: "Home: destaques do Agency (um por linha)", type: "textarea", value: "300 créditos de IA por mês\nAté 200 projetos salvos na conta\nKivai Aprova: clientes aprovam posts por link" },
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
