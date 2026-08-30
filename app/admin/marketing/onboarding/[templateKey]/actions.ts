"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertAdminApi } from "@/lib/blog/auth";
import { supabaseRest } from "@/lib/blog/supabase";
import { onboardingTemplateKeys, type OnboardingTemplateKey } from "@/lib/marketing/onboarding-templates";

function text(formData: FormData, key: string, max: number) { return String(formData.get(key) ?? "").trim().slice(0, max); }
function validPair(label: string, url: string) { if (!label && !url) return true; return Boolean(label && /^https:\/\//i.test(url)); }

export async function saveOnboardingTemplateRich(templateKey: string, formData: FormData) {
  await assertAdminApi();
  if (!onboardingTemplateKeys.includes(templateKey as OnboardingTemplateKey)) throw new Error("Modelo de onboarding inválido.");
  const title = text(formData, "title", 160);
  const description = text(formData, "description", 1500);
  const subject = text(formData, "subject", 200);
  const message = text(formData, "message", 30000);
  const ctaLabel = text(formData, "ctaLabel", 80);
  const ctaUrl = text(formData, "ctaUrl", 1000);
  const secondaryCtaLabel = text(formData, "secondaryCtaLabel", 80);
  const secondaryCtaUrl = text(formData, "secondaryCtaUrl", 1000);
  if (!title || !subject || !message) throw new Error("Nome interno, assunto e conteúdo são obrigatórios.");
  if (!validPair(ctaLabel, ctaUrl) || !validPair(secondaryCtaLabel, secondaryCtaUrl)) throw new Error("Cada botão precisa de texto e URL https:// válidos.");
  await supabaseRest(`customer_onboarding_templates?template_key=eq.${encodeURIComponent(templateKey)}`, { method: "PATCH", body: JSON.stringify({ title, description, subject, message, cta_label: ctaLabel || null, cta_url: ctaUrl || null, secondary_cta_label: secondaryCtaLabel || null, secondary_cta_url: secondaryCtaUrl || null, enabled: formData.get("enabled") === "on", updated_at: new Date().toISOString() }) });
  revalidatePath("/admin/marketing"); revalidatePath(`/admin/marketing/onboarding/${templateKey}`);
  redirect(`/admin/marketing/onboarding/${templateKey}?saved=1`);
}
