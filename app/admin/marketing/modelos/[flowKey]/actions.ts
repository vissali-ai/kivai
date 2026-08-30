"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { listAdminCustomers } from "@/lib/admin/customer-users";
import { assertAdminApi } from "@/lib/blog/auth";
import { supabaseRest } from "@/lib/blog/supabase";
import { isAutomaticMarketingFlowKey, isCustomerMarketingFlowKey } from "@/lib/marketing/customer-flows";
import { deliverCustomerEmail } from "@/lib/marketing/email-delivery";

function text(formData: FormData, key: string, max: number) { return String(formData.get(key) ?? "").trim().slice(0, max); }
function validPair(label: string, url: string) { if (!label && !url) return true; return Boolean(label && /^https:\/\//i.test(url)); }

export async function saveMarketingTemplate(flowKey: string, formData: FormData) {
  await assertAdminApi();
  if (!isCustomerMarketingFlowKey(flowKey)) throw new Error("Fluxo inválido.");
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
  await supabaseRest(`customer_marketing_templates?flow_key=eq.${encodeURIComponent(flowKey)}`, { method: "PATCH", body: JSON.stringify({ title, description, subject, message, cta_label: ctaLabel || null, cta_url: ctaUrl || null, secondary_cta_label: secondaryCtaLabel || null, secondary_cta_url: secondaryCtaUrl || null, enabled: formData.get("enabled") === "on", updated_at: new Date().toISOString() }) });
  revalidatePath(`/admin/marketing/modelos/${flowKey}`); revalidatePath("/admin/marketing");
  redirect(`/admin/marketing/modelos/${flowKey}?saved=1`);
}

export async function sendManualMarketingEmail(flowKey: string, formData: FormData) {
  await assertAdminApi();
  if (!isCustomerMarketingFlowKey(flowKey) || isAutomaticMarketingFlowKey(flowKey)) throw new Error("Este fluxo não permite envio manual.");
  if (formData.get("confirmSend") !== "on") throw new Error("Confirme explicitamente o envio.");
  const userId = text(formData, "userId", 80);
  const subject = text(formData, "subject", 200);
  const message = text(formData, "message", 30000);
  const ctaLabel = text(formData, "ctaLabel", 80);
  const ctaUrl = text(formData, "ctaUrl", 1000);
  const secondaryCtaLabel = text(formData, "secondaryCtaLabel", 80);
  const secondaryCtaUrl = text(formData, "secondaryCtaUrl", 1000);
  if (!userId || !subject || !message) throw new Error("Destinatário, assunto e conteúdo são obrigatórios.");
  if (!validPair(ctaLabel, ctaUrl) || !validPair(secondaryCtaLabel, secondaryCtaUrl)) throw new Error("Cada botão precisa de texto e URL https:// válidos.");
  const user = (await listAdminCustomers()).find((item) => item.id === userId && item.email);
  if (!user) throw new Error("Destinatário não encontrado.");
  const rows = await supabaseRest<Array<{ id: string }>>("customer_communications", { method: "POST", body: JSON.stringify({ user_id: user.id, event_key: `manual_${flowKey}_${crypto.randomUUID()}`, channel: "email", status: "ready", subject, message, cta_label: ctaLabel || null, cta_url: ctaUrl || null, scheduled_for: new Date().toISOString(), metadata: { source: "admin_manual", kind: "template_manual_send", flow_key: flowKey, layout: "kivai_campaign", secondary_cta_label: secondaryCtaLabel, secondary_cta_url: secondaryCtaUrl, recipient_email: user.email, recipient_name: user.fullName } }) });
  const row = rows[0];
  if (!row) throw new Error("Não foi possível criar o envio.");
  const result = await deliverCustomerEmail(row.id);
  if (result.status !== "sent") throw new Error(result.status === "canceled" ? "O usuário optou por não receber e-mails de marketing." : "O envio não foi concluído.");
  redirect(`/admin/marketing/modelos/${flowKey}?sent=1`);
}
