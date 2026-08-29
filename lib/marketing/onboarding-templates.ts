import "server-only";

import { supabaseRest } from "@/lib/blog/supabase";

export type OnboardingTemplateKey = "account_welcome" | "free_welcome" | "pro_welcome" | "agency_welcome";

export type OnboardingTemplate = {
  template_key: OnboardingTemplateKey;
  title: string;
  subject: string;
  description: string;
  message: string;
  cta_label: string | null;
  cta_url: string | null;
  enabled: boolean;
  updated_at: string;
};

export const onboardingTemplateKeys: OnboardingTemplateKey[] = ["account_welcome", "free_welcome", "pro_welcome", "agency_welcome"];

export async function listOnboardingTemplates() {
  return supabaseRest<OnboardingTemplate[]>("customer_onboarding_templates?select=template_key,title,subject,description,message,cta_label,cta_url,enabled,updated_at&order=template_key.asc");
}

export async function getOnboardingTemplate(key: OnboardingTemplateKey) {
  const rows = await supabaseRest<OnboardingTemplate[]>(`customer_onboarding_templates?select=template_key,title,subject,description,message,cta_label,cta_url,enabled,updated_at&template_key=eq.${encodeURIComponent(key)}&limit=1`);
  return rows[0] ?? null;
}
