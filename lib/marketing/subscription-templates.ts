export const proWelcomeTemplate = {
  subject: "Bem-vindo ao Plano Pro Kivai",
  preview: "Seu pagamento foi confirmado e seus recursos Pro já estão disponíveis.",
  features: [
    "Até 5 contas do Instagram acompanhadas",
    "Análises de perfis com até 500 mil seguidores",
    "Histórico privado das análises",
    "Comparação automática entre exportações",
    "Identificação de novos seguidores e de quem deixou de seguir por período",
    "Leitura de curtidas, comentários e interações com stories quando esses dados estiverem presentes na exportação da Meta",
  ] as const,
};

export function buildProWelcomeEmail(params: {
  firstName?: string | null;
  periodEnd: Date;
  billingCycle: "monthly" | "annual";
}) {
  const name = params.firstName?.trim() || "Olá";
  const cycle = params.billingCycle === "monthly" ? "mensal" : "anual";
  const expires = params.periodEnd.toLocaleDateString("pt-BR");
  const features = proWelcomeTemplate.features.map((item) => `• ${item}`).join("\n");

  return {
    subject: proWelcomeTemplate.subject,
    message: `${name}, obrigado por escolher o Plano Pro Kivai. Seu pagamento foi confirmado e seu acesso Pro já está ativo.\n\nSeu plano é ${cycle} e fica disponível até ${expires}.\n\nO que você tem disponível no Plano Pro:\n${features}\n\nComo começar:\n1. Entre no seu painel Kivai.\n2. Acesse a Área Pro.\n3. Informe o @ do perfil que deseja acompanhar.\n4. Importe a exportação oficial da Meta em JSON.\n5. Faça novas análises ao longo do tempo para liberar comparações e histórico.\n\nSeus dados de análise ficam vinculados à sua conta e o histórico Pro é privado. Você pode acompanhar a situação do plano e renovar pelo próprio painel.\n\nObrigado por fazer parte do Kivai. Esperamos que o Pro ajude você a acompanhar seus perfis com mais clareza e tomar decisões melhores a partir dos seus dados.`,
    ctaLabel: "Acessar minha Área Pro",
    ctaUrl: "https://www.kivai.com.br/conta/pro",
  };
}
