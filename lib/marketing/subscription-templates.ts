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

export const agencyWelcomeTemplate = {
  subject: "Bem-vindo ao Plano Agency Kivai",
  preview: "Seu pagamento foi confirmado e seus recursos Agency já estão disponíveis.",
  features: [
    "Gestão de até 20 contas ou clientes",
    "Análises com maior volume de perfis e dados",
    "Histórico privado por conta acompanhada",
    "Comparações entre exportações e períodos",
    "Identificação de novos seguidores e de quem deixou de seguir",
    "Leitura de curtidas, comentários, interações com stories e insights anteriores quando presentes na exportação da Meta",
  ] as const,
};

export const freeWelcomeTemplate = {
  subject: "Seu Plano Grátis Kivai está disponível",
  preview: "Sua conta está no Plano Grátis e você já pode começar a usar os recursos disponíveis.",
  features: [
    "Análise básica do Instagram Follow Analyzer",
    "Comparação entre quem você segue e quem segue você",
    "Identificação de seguidores, seguindo e conexões mútuas",
    "Uso das ferramentas gratuitas disponíveis no ecossistema Kivai",
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

export function buildAgencyWelcomeEmail(params: {
  firstName?: string | null;
  periodEnd: Date;
  billingCycle: "monthly" | "annual";
}) {
  const name = params.firstName?.trim() || "Olá";
  const cycle = params.billingCycle === "monthly" ? "mensal" : "anual";
  const expires = params.periodEnd.toLocaleDateString("pt-BR");
  const features = agencyWelcomeTemplate.features.map((item) => `• ${item}`).join("\n");

  return {
    subject: agencyWelcomeTemplate.subject,
    message: `${name}, obrigado por escolher o Plano Agency Kivai. Seu pagamento foi confirmado e seu acesso Agency já está ativo.\n\nSeu plano é ${cycle} e fica disponível até ${expires}.\n\nO que você tem disponível no Plano Agency:\n${features}\n\nComo começar:\n1. Entre no seu painel Kivai.\n2. Acesse o Instagram Follow Analyzer.\n3. Organize as contas ou clientes que deseja acompanhar.\n4. Importe as exportações oficiais da Meta em JSON.\n5. Repita as análises ao longo do tempo para construir histórico e comparações.\n\nOs dados ficam vinculados à sua conta e devem permanecer separados por cliente para facilitar sua operação.\n\nObrigado por escolher o Kivai para apoiar sua gestão de múltiplas contas.`,
    ctaLabel: "Acessar meu painel Agency",
    ctaUrl: "https://www.kivai.com.br/conta",
  };
}

export function buildFreeWelcomeEmail(firstName?: string | null) {
  const name = firstName?.trim() || "Olá";
  const features = freeWelcomeTemplate.features.map((item) => `• ${item}`).join("\n");

  return {
    subject: freeWelcomeTemplate.subject,
    message: `${name}, sua conta Kivai está no Plano Grátis e os recursos gratuitos já estão disponíveis.\n\nVocê pode começar por:\n${features}\n\nPara analisar seu Instagram, use a exportação oficial da Meta. No Plano Grátis, Seguidores e Seguindo já são suficientes para a análise básica.\n\nQuando precisar de histórico, mais contas e recursos avançados, você poderá comparar os planos Pro e Agency.`,
    ctaLabel: "Acessar minha conta",
    ctaUrl: "https://www.kivai.com.br/conta",
  };
}
