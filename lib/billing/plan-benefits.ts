export type PlanCode = "free" | "pro" | "agency";
export const planBenefits: Record<PlanCode, string[]> = {
  free: ["Análise local de até 50 mil seguidores", "Até 5 projetos de ferramentas compatíveis salvos na conta e sincronizados entre dispositivos", "Calendário e briefing salvos neste navegador", "Exportações gratuitas das ferramentas", "10 créditos de IA por mês para contas cadastradas"],
  pro: ["Até 5 perfis do Instagram e 500 mil seguidores por perfil", "Histórico privado e comparação entre exportações da Meta", "Até 30 projetos de ferramentas compatíveis salvos na conta", "Abra seus projetos em outros dispositivos e duplique modelos", "100 créditos de IA por mês incluídos na assinatura"],
  agency: ["Até 20 perfis do Instagram", "Histórico e comparação separados por perfil", "Até 200 projetos de ferramentas compatíveis salvos na conta", "Organização dos projetos por até 20 clientes", "Todos os recursos de projetos do Pro", "Kivai Aprova: envie publicações por link privado para clientes aprovarem ou solicitarem ajustes, sem criar conta", "Histórico de decisões, revogação de links e envio de novas versões", "300 créditos de IA por mês incluídos na assinatura"],
};
export const projectLimits: Record<PlanCode, number> = { free: 5, pro: 30, agency: 200 };
