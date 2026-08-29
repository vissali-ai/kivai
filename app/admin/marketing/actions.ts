"use server";

import { revalidatePath } from "next/cache";
import { assertAdminApi } from "@/lib/blog/auth";
import { supabaseRest } from "@/lib/blog/supabase";
import { isCustomerMarketingFlowKey } from "@/lib/marketing/customer-flows";
import { deliverCustomerEmail } from "@/lib/marketing/email-delivery";
import { getCustomerMarketingTemplate } from "@/lib/marketing/templates";
import { onboardingTemplateKeys, type OnboardingTemplateKey } from "@/lib/marketing/onboarding-templates";

export async function sendMarketingTemplateNow(formData: FormData) {
  await assertAdminApi();
  const userId = String(formData.get("userId") ?? "");
  const flowKey = String(formData.get("flowKey") ?? "");
  if (!userId || !isCustomerMarketingFlowKey(flowKey)) throw new Error("Selecione um usuário e um modelo válidos.");
  const template = await getCustomerMarketingTemplate(flowKey);
  if (!template || !template.enabled) throw new Error("Este modelo está desativado ou não foi encontrado.");
  const now = new Date().toISOString();
  const communication = await supabaseRest<Array<{ id: string }>>("customer_communications", { method: "POST", body: JSON.stringify({ user_id: userId, event_key: `template_${flowKey}_${Date.now()}`, channel: "email", status: "ready", subject: template.subject, message: template.message, cta_label: template.cta_label, cta_url: template.cta_url, scheduled_for: now, metadata: { source: "admin_suggestion", flow_key: flowKey, template_version: template.updated_at } }) });
  if (!communication[0]) throw new Error("Não foi possível preparar a comunicação.");
  const result = await deliverCustomerEmail(communication[0].id);
  await supabaseRest("customer_marketing_events", { method: "POST", body: JSON.stringify({ user_id: userId, event_type: result.status === "sent" ? "suggested_email_sent" : result.status === "canceled" ? "suggested_email_canceled" : "suggested_email_failed", description: result.status === "sent" ? `E-mail enviado pelo Resend: ${template.subject}` : result.status === "canceled" ? "Envio cancelado porque o usuário não recebe marketing." : `Falha no envio do modelo ${flowKey}.`, metadata: { flow_key: flowKey, delivery_status: result.status } }) });
  revalidatePath("/admin/marketing");
}

export async function enrollCustomerInMarketingFlow(formData: FormData) {
  await assertAdminApi();
  const userId = String(formData.get("userId") ?? "");
  const flowKey = String(formData.get("flowKey") ?? "");
  if (!userId || !isCustomerMarketingFlowKey(flowKey)) throw new Error("Selecione um usuário e um fluxo válidos.");
  const now = new Date().toISOString();
  const existing = await supabaseRest<Array<{ id: string }>>(`customer_marketing_flow_enrollments?select=id&user_id=eq.${encodeURIComponent(userId)}&flow_key=eq.${encodeURIComponent(flowKey)}&limit=1`);
  const payload = { status: "active", enrolled_at: now, updated_at: now, metadata: { source: "admin_manual" } };
  if (existing[0]) await supabaseRest(`customer_marketing_flow_enrollments?id=eq.${encodeURIComponent(existing[0].id)}`, { method: "PATCH", body: JSON.stringify(payload) });
  else await supabaseRest("customer_marketing_flow_enrollments", { method: "POST", body: JSON.stringify({ user_id: userId, flow_key: flowKey, ...payload }) });
  await supabaseRest("customer_marketing_events", { method: "POST", body: JSON.stringify({ user_id: userId, event_type: "marketing_flow_enrolled", description: `Usuário incluído manualmente no fluxo ${flowKey}.`, metadata: { flow_key: flowKey } }) });
  revalidatePath("/admin/marketing");
}

export async function removeCustomerFromMarketingFlow(formData: FormData) {
  await assertAdminApi();
  const enrollmentId = String(formData.get("enrollmentId") ?? "");
  const userId = String(formData.get("userId") ?? "");
  const flowKey = String(formData.get("flowKey") ?? "");
  if (!enrollmentId || !userId || !isCustomerMarketingFlowKey(flowKey)) throw new Error("Fluxo inválido.");
  const now = new Date().toISOString();
  await supabaseRest(`customer_marketing_flow_enrollments?id=eq.${encodeURIComponent(enrollmentId)}&user_id=eq.${encodeURIComponent(userId)}`, { method: "PATCH", body: JSON.stringify({ status: "cancelled", updated_at: now, metadata: { source: "admin_manual", removed_at: now } }) });
  await supabaseRest("customer_marketing_events", { method: "POST", body: JSON.stringify({ user_id: userId, event_type: "marketing_flow_removed", description: `Usuário removido manualmente do fluxo ${flowKey}.`, metadata: { flow_key: flowKey } }) });
  revalidatePath("/admin/marketing");
}

export async function retryCommunicationNow(formData: FormData) {
  await assertAdminApi();
  const communicationId = String(formData.get("communicationId") ?? "");
  if (!communicationId) throw new Error("Comunicação inválida.");
  const rows = await supabaseRest<Array<{ id: string; status: string; channel: string }>>(`customer_communications?select=id,status,channel&id=eq.${encodeURIComponent(communicationId)}&limit=1`);
  const row = rows[0];
  if (!row || row.channel !== "email" || !["ready", "failed"].includes(row.status)) throw new Error("Esta comunicação não está disponível para envio manual.");
  if (row.status === "failed") await supabaseRest(`customer_communications?id=eq.${encodeURIComponent(row.id)}&status=eq.failed`, { method: "PATCH", body: JSON.stringify({ status: "ready", error: null, updated_at: new Date().toISOString() }) });
  await deliverCustomerEmail(row.id);
  revalidatePath("/admin/marketing");
}

export async function saveMarketingTemplate(formData: FormData) {
  await assertAdminApi();
  const flowKey = String(formData.get("flowKey") ?? "");
  if (!isCustomerMarketingFlowKey(flowKey)) throw new Error("Modelo inválido.");
  const title = String(formData.get("title") ?? "").trim().slice(0, 160);
  const subject = String(formData.get("subject") ?? "").trim().slice(0, 200);
  const description = String(formData.get("description") ?? "").trim().slice(0, 1500);
  const message = String(formData.get("message") ?? "").trim().slice(0, 12000);
  const ctaLabel = String(formData.get("ctaLabel") ?? "").trim().slice(0, 80) || null;
  const ctaUrl = String(formData.get("ctaUrl") ?? "").trim().slice(0, 1000) || null;
  const enabled = formData.get("enabled") === "on";
  if (!title || !subject || !message) throw new Error("Título, assunto e mensagem são obrigatórios.");
  if (ctaUrl && !/^https:\/\//i.test(ctaUrl)) throw new Error("O link do botão deve começar com https://.");
  const now = new Date().toISOString();
  await supabaseRest(`customer_marketing_templates?flow_key=eq.${encodeURIComponent(flowKey)}`, { method: "PATCH", body: JSON.stringify({ title, subject, description, message, cta_label: ctaLabel, cta_url: ctaUrl, enabled, updated_at: now }) });
  revalidatePath("/admin/marketing");
  revalidatePath(`/admin/marketing/modelos/${flowKey}`);
}

export async function saveMarketingReminder(formData: FormData) {
  await assertAdminApi();
  const note = String(formData.get("note") ?? "").trim().slice(0, 2000);
  await supabaseRest("admin_marketing_reminders?id=eq.1", { method: "PATCH", body: JSON.stringify({ note, updated_at: new Date().toISOString() }) });
  revalidatePath("/admin/marketing");
}

export async function saveOnboardingTemplate(formData: FormData) {
  await assertAdminApi();
  const templateKey = String(formData.get("templateKey") ?? "") as OnboardingTemplateKey;
  if (!onboardingTemplateKeys.includes(templateKey)) throw new Error("Modelo de onboarding inválido.");
  const title = String(formData.get("title") ?? "").trim().slice(0, 160);
  const subject = String(formData.get("subject") ?? "").trim().slice(0, 200);
  const description = String(formData.get("description") ?? "").trim().slice(0, 1500);
  const message = String(formData.get("message") ?? "").trim().slice(0, 12000);
  const ctaLabel = String(formData.get("ctaLabel") ?? "").trim().slice(0, 80) || null;
  const ctaUrl = String(formData.get("ctaUrl") ?? "").trim().slice(0, 1000) || null;
  const enabled = formData.get("enabled") === "on";
  if (!title || !subject || !message) throw new Error("Título, assunto e mensagem são obrigatórios.");
  if (ctaUrl && !/^https:\/\//i.test(ctaUrl)) throw new Error("O link do botão deve começar com https://.");
  await supabaseRest(`customer_onboarding_templates?template_key=eq.${encodeURIComponent(templateKey)}`, { method: "PATCH", body: JSON.stringify({ title, subject, description, message, cta_label: ctaLabel, cta_url: ctaUrl, enabled, updated_at: new Date().toISOString() }) });
  revalidatePath("/admin/marketing");
  revalidatePath(`/admin/marketing/onboarding/${templateKey}`);
}
