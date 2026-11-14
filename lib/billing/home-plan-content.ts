import type { SiteOriginalField } from "@/lib/site-cms/types";

// Conteúdo promocional da home. O Admin edita estes campos na página /planos.
export const homePlanFields: SiteOriginalField[] = [
  { key: "home-plans-enabled", label: "Home: mostrar comparação de planos", type: "boolean", value: false },
  { key: "home-plans-title", label: "Home: título do bloco de planos", type: "text", value: "Todas as ferramentas grátis. IA com créditos." },
  { key: "home-plans-description", label: "Home: descrição do bloco", type: "textarea", value: "Use as ferramentas sem cadastro. Entre na sua conta se quiser salvar projetos ou usar recursos de IA. Os créditos de IA ajudam a cobrir os custos de manutenção da plataforma." },
  { key: "home-free-features", label: "Home: destaques do Grátis (um por linha)", type: "textarea", value: "Todas as ferramentas gratuitas, sem cadastro\n5 créditos iniciais de IA para contas cadastradas\nCréditos adicionais de IA disponíveis para compra" },
  { key: "home-pro-features", label: "Home: destaques do Pro (um por linha)", type: "textarea", value: "Retome até 30 projetos de qualquer dispositivo\n100 créditos de IA por mês\nCompare a evolução de até 5 perfis do Instagram" },
  { key: "home-agency-features", label: "Home: destaques do Agency (um por linha)", type: "textarea", value: "Organize até 200 projetos por cliente\nKivai Aprova: aprovação de posts sem login do cliente\n300 créditos de IA por mês" },
  { key: "plans-free-outcome", label: "Planos: resultado principal Grátis", type: "textarea", value: "Resolva uma tarefa pontual com ferramentas gratuitas e sem mensalidade." },
  { key: "plans-pro-outcome", label: "Planos: resultado principal Pro", type: "textarea", value: "Salve planejamentos e projetos na conta, continue de outro dispositivo e compare a evolução dos seus perfis do Instagram." },
  { key: "plans-agency-outcome", label: "Planos: resultado principal Agency", type: "textarea", value: "Organize até 20 clientes, reaproveite projetos e envie publicações para aprovação sem exigir cadastro do cliente." },
  { key: "context-plans-enabled", label: "Divulgação contextual: exibir chamadas nas ferramentas e hubs", type: "boolean", value: false },
  { key: "context-plans-title", label: "Divulgação contextual: título", type: "text", value: "Continue seu trabalho de onde parou" },
  { key: "context-plans-hub-text", label: "Divulgação contextual: texto no Hub Social Media", type: "textarea", value: "Comece com as ferramentas gratuitas. Com Pro, salve planejamentos na conta e acompanhe comparações do Instagram. Com Agency, organize os projetos por cliente e envie publicações para aprovação sem exigir cadastro." },
  { key: "context-plans-tool-text", label: "Divulgação contextual: texto ao final das ferramentas Social Media", type: "textarea", value: "Já concluiu sua tarefa? No Pro, você pode salvar projetos compatíveis na conta e continuar em outro dispositivo. No Agency, organize por cliente e peça aprovação de publicações por link privado." },
  { key: "context-plans-cta", label: "Divulgação contextual: texto do link para planos", type: "text", value: "Comparar benefícios por plano" },
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
