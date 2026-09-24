import "server-only";

import { supabaseRest } from "@/lib/blog/supabase";
import { customerMarketingFlows, type CustomerMarketingFlowKey } from "@/lib/marketing/customer-flows";

export type CustomerMarketingTemplate = {
  flow_key: CustomerMarketingFlowKey;
  title: string;
  subject: string;
  description: string;
  message: string;
  cta_label: string | null;
  cta_url: string | null;
  secondary_cta_label: string | null;
  secondary_cta_url: string | null;
  enabled: boolean;
  updated_at: string;
};

const SELECT = "flow_key,title,subject,description,message,cta_label,cta_url,secondary_cta_label,secondary_cta_url,enabled,updated_at";

const defaultPlansOverview: CustomerMarketingTemplate = {
  flow_key: "plans_overview",
  title: "Conheça os planos Kivai",
  subject: "Conheça os planos Kivai e acompanhe melhor seus perfis",
  description: "Apresenta os três planos do Kivai em um único e-mail, destacando vantagens, limites, preços e o caminho para contratar.",
  message: `<p>Olá!</p>
<p>Se você já usa o Kivai para analisar seu Instagram, os planos pagos permitem transformar uma consulta pontual em um acompanhamento contínuo dos seus perfis.</p>
<h2>Plano Grátis</h2>
<p><strong>R$ 0</strong></p>
<ul>
<li>1 conta por análise</li>
<li>Até 50 mil seguidores</li>
<li>Quem não segue você de volta</li>
<li>Quem você não segue de volta</li>
<li>Seguidores mútuos</li>
<li>Análise atual, sem histórico privado</li>
</ul>
<h2>Plano Pro</h2>
<p><strong>R$ 19,90/mês ou R$ 199/ano</strong></p>
<ul>
<li>Até 5 contas acompanhadas</li>
<li>Até 500 mil seguidores por perfil</li>
<li>Histórico privado de análises</li>
<li>Comparação automática entre períodos</li>
<li>Novos seguidores por período</li>
<li>Identificação de quem deixou de seguir</li>
<li>Evolução de seguidores e seguindo entre análises</li>
<li>Área Pro exclusiva</li>
</ul>
<p>Ideal para quem quer acompanhar a evolução dos próprios perfis e não depender de análises isoladas.</p>
<h2>Plano Agency</h2>
<p><strong>R$ 59,90/mês ou R$ 599/ano</strong></p>
<ul>
<li>Até 20 contas ou clientes</li>
<li>Histórico separado por perfil</li>
<li>Comparações e acompanhamento contínuo</li>
<li>Novos seguidores e unfollows por período</li>
<li>Relatórios organizados por cliente</li>
<li>Análise ampliada da exportação oficial da Meta</li>
</ul>
<p>É a opção indicada para agências, social medias e profissionais que gerenciam vários clientes.</p>
<p>Escolha o plano que combina com sua rotina e use o Kivai para acompanhar seus perfis com mais organização, histórico e visão de evolução.</p>`,
  cta_label: "Conhecer os planos",
  cta_url: "https://www.kivai.com.br/planos",
  secondary_cta_label: "Acessar minha conta",
  secondary_cta_url: "https://www.kivai.com.br/conta",
  enabled: true,
  updated_at: "2026-09-24T00:00:00.000Z",
};

export async function listCustomerMarketingTemplates() {
  const rows = await supabaseRest<CustomerMarketingTemplate[]>(`customer_marketing_templates?select=${SELECT}&order=flow_key.asc`);
  const map = new Map(rows.map((row) => [row.flow_key, row]));
  return customerMarketingFlows.map((flow) => map.get(flow.key) ?? (flow.key === "plans_overview" ? defaultPlansOverview : undefined)).filter(Boolean) as CustomerMarketingTemplate[];
}

export async function getCustomerMarketingTemplate(flowKey: CustomerMarketingFlowKey) {
  const rows = await supabaseRest<CustomerMarketingTemplate[]>(`customer_marketing_templates?select=${SELECT}&flow_key=eq.${encodeURIComponent(flowKey)}&limit=1`);
  return rows[0] ?? (flowKey === "plans_overview" ? defaultPlansOverview : null);
}
