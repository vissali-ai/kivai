export const customerMarketingFlows = [
  { key: "free_nurture", label: "Nutrição Grátis", description: "Apresenta benefícios dos planos pagos e recursos do Kivai para usuários gratuitos.", automatic: false },
  { key: "pro_upgrade", label: "Upgrade para Pro", description: "Estimula a migração para o Pro com foco em histórico, comparação e mais contas.", automatic: false },
  { key: "agency_upgrade", label: "Upgrade para Agency", description: "Apresenta o Agency para operações com múltiplas contas e clientes.", automatic: false },
  { key: "renewal", label: "Renovação", description: "Fluxo automático para assinantes próximos do vencimento.", automatic: true },
  { key: "winback", label: "Recuperação", description: "Fluxo automático de recuperação com cortesia após o vencimento quando elegível.", automatic: true },
  { key: "cross_sell", label: "Venda cruzada", description: "Apresenta serviços Kivai complementares às ferramentas e planos.", automatic: false },
  { key: "new_post", label: "Novas publicações", description: "Envia automaticamente cada nova publicação do blog para todos os usuários cadastrados.", automatic: true },
] as const;

export type CustomerMarketingFlowKey = (typeof customerMarketingFlows)[number]["key"];

export function isCustomerMarketingFlowKey(value: string): value is CustomerMarketingFlowKey {
  return customerMarketingFlows.some((flow) => flow.key === value);
}

export function isAutomaticMarketingFlowKey(value: CustomerMarketingFlowKey) {
  return customerMarketingFlows.find((flow) => flow.key === value)?.automatic ?? false;
}
