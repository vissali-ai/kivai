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
  subject: "Conheça os planos Kivai e os novos recursos de projetos",
  description: "Apresenta Grátis, Pro e Agency com os recursos atuais de análise e projetos.",
  message: `<p>Olá!</p>
<p>Os planos do Kivai combinam análise de perfis com recursos para organizar seus projetos de conteúdo.</p>
<h2>Plano Grátis</h2>
<ul>
<li>Análise local de até 50 mil seguidores</li>
<li>Calendário e briefing salvos neste navegador</li>
<li>Exportações gratuitas das ferramentas</li>
</ul>
<h2>Plano Pro</h2>
<ul>
<li>Até 5 perfis do Instagram e 500 mil seguidores por perfil</li>
<li>Histórico privado e comparação entre exportações da Meta</li>
<li>Até 30 calendários e briefings salvos na conta</li>
<li>Acesso aos projetos em outros dispositivos</li>
<li>Duplicação de modelos e projetos</li>
</ul>
<h2>Plano Agency</h2>
<ul>
<li>Até 20 perfis do Instagram</li>
<li>Histórico e comparação separados por perfil</li>
<li>Até 200 calendários e briefings salvos na conta</li>
<li>Organização dos projetos por até 20 clientes</li>
<li>Todos os recursos de projetos do Pro</li>
</ul>
<p>Escolha o plano que acompanha o tamanho da sua operação.</p>`,
  cta_label: "Conhecer os planos",
  cta_url: "https://www.kivai.com.br/planos",
  secondary_cta_label: "Acessar minha conta",
  secondary_cta_url: "https://www.kivai.com.br/conta",
  enabled: true,
  updated_at: "2026-10-01T09:40:00.000Z",
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
