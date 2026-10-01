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
<li>Análise local de uma conta do Instagram por vez, com até 50 mil seguidores</li>
<li>Calendário, briefing, QR Code, marca d’água e relatório Social Media disponíveis gratuitamente</li>
<li>Rascunhos de calendário, briefing e relatório neste navegador; sem histórico do Instagram ou projetos salvos na conta</li>
</ul>
<h2>Plano Pro</h2>
<ul>
<li>Até 5 perfis do Instagram e 500 mil seguidores por perfil</li>
<li>Histórico privado e comparação entre exportações oficiais da Meta importadas por você</li>
<li>Até 30 projetos no total: calendários, briefings, QR Codes, modelos de marca d’água e relatórios Social Media</li>
<li>Projetos pessoais acessíveis em outros dispositivos, com duplicação de modelos e exportação JSON</li>
</ul>
<h2>Plano Agency</h2>
<ul>
<li>Até 20 perfis do Instagram</li>
<li>Histórico e comparação separados por perfil</li>
<li>Até 200 projetos das cinco ferramentas acima salvos na conta</li>
<li>Organização e filtro dos projetos por até 20 nomes de clientes</li>
<li>Todos os recursos do Pro, com acesso aos projetos em outros dispositivos</li>
</ul>
<p>As análises do Instagram dependem de novas exportações da Meta; não há coleta automática. Os nomes de clientes são para organização e não incluem login ou aprovação externa.</p>
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
