export type PlanCode = "free" | "pro" | "agency";
export const planBenefits: Record<PlanCode, string[]> = {
  free: ["Análise local de até 50 mil seguidores", "Calendário e briefing salvos neste navegador", "Exportações gratuitas das ferramentas"],
  pro: ["Até 5 perfis do Instagram e 500 mil seguidores por perfil", "Histórico privado e comparação entre exportações da Meta", "Até 30 calendários e briefings salvos na conta", "Abra seus projetos em outros dispositivos e duplique modelos"],
  agency: ["Até 20 perfis do Instagram", "Histórico e comparação separados por perfil", "Até 200 calendários e briefings salvos na conta", "Organização dos projetos por até 20 clientes", "Todos os recursos de projetos do Pro"],
};
export const projectLimits: Record<PlanCode, number> = { free: 0, pro: 30, agency: 200 };
