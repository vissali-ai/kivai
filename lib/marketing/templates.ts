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
  enabled: boolean;
  updated_at: string;
};

export async function listCustomerMarketingTemplates() {
  const rows = await supabaseRest<CustomerMarketingTemplate[]>("customer_marketing_templates?select=flow_key,title,subject,description,message,cta_label,cta_url,enabled,updated_at&order=flow_key.asc");
  const map = new Map(rows.map((row) => [row.flow_key, row]));
  return customerMarketingFlows.map((flow) => map.get(flow.key)).filter(Boolean) as CustomerMarketingTemplate[];
}

export async function getCustomerMarketingTemplate(flowKey: CustomerMarketingFlowKey) {
  const rows = await supabaseRest<CustomerMarketingTemplate[]>(`customer_marketing_templates?select=flow_key,title,subject,description,message,cta_label,cta_url,enabled,updated_at&flow_key=eq.${encodeURIComponent(flowKey)}&limit=1`);
  return rows[0] ?? null;
}
