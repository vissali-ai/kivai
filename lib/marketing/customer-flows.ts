export const customerMarketingFlows = [
  { key: "free_nurture", label: "Nutrição Grátis", description: "Apresenta benefícios dos planos pagos e recursos do Kivai para usuários gratuitos." },
  { key: "pro_upgrade", label: "Upgrade para Pro", description: "Estimula a migração para o Pro com foco em histórico, comparação e mais contas." },
  { key: "agency_upgrade", label: "Upgrade para Agency", description: "Apresenta o Agency para operações com múltiplas contas e clientes." },
  { key: "renewal", label: "Renovação", description: "Fluxo para assinantes próximos do vencimento." },
  { key: "winback", label: "Recuperação", description: "Reativa usuários com assinatura vencida ou inativa." },
  { key: "cross_sell", label: "Venda cruzada", description: "Apresenta serviços Kivai complementares às ferramentas e planos." },
] as const;

export type CustomerMarketingFlowKey = (typeof customerMarketingFlows)[number]["key"];

export function isCustomerMarketingFlowKey(value: string): value is CustomerMarketingFlowKey {
  return customerMarketingFlows.some((flow) => flow.key === value);
}
