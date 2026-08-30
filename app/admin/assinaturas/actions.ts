"use server";

import { revalidatePath } from "next/cache";
import { assertAdminApi } from "@/lib/blog/auth";
import { supabaseRest } from "@/lib/blog/supabase";
import { deliverCustomerEmail } from "@/lib/marketing/email-delivery";
import { getOnboardingTemplate } from "@/lib/marketing/onboarding-templates";

type RequestRow = { id: string; user_id: string; customer_email: string; customer_name: string | null; plan_code: "pro" | "agency"; billing_cycle: "monthly" | "annual"; status: string };
type SubscriptionRow = { id: string; plan_code: "free" | "pro" | "agency"; billing_cycle: "monthly" | "annual" | null; status: string; current_period_end: string | null };

function addPeriod(start: Date, cycle: "monthly" | "annual") { const end = new Date(start); if (cycle === "monthly") end.setUTCMonth(end.getUTCMonth() + 1); else end.setUTCFullYear(end.getUTCFullYear() + 1); return end; }
function personalize(value: string, params: { firstName: string; periodEnd: Date; billingCycle: "monthly" | "annual" }) {
  return value.replaceAll("{{nome}}", params.firstName).replaceAll("{{vencimento}}", params.periodEnd.toLocaleDateString("pt-BR")).replaceAll("{{ciclo}}", params.billingCycle === "monthly" ? "mensal" : "anual");
}

export async function confirmSubscriptionPayment(formData: FormData) {
  await assertAdminApi();
  const requestId = String(formData.get("requestId") ?? "");
  if (!requestId) throw new Error("Solicitação inválida.");
  const requests = await supabaseRest<RequestRow[]>(`subscription_requests?select=id,user_id,customer_email,customer_name,plan_code,billing_cycle,status&id=eq.${encodeURIComponent(requestId)}&limit=1`);
  const request = requests[0];
  if (!request || !["awaiting_payment", "payment_reported"].includes(request.status)) throw new Error("Solicitação não disponível para confirmação.");
  const subscriptions = await supabaseRest<SubscriptionRow[]>(`user_subscriptions?select=id,plan_code,billing_cycle,status,current_period_end&user_id=eq.${encodeURIComponent(request.user_id)}&order=created_at.desc&limit=1`);
  const existing = subscriptions[0];
  const now = new Date();
  const existingEnd = existing?.current_period_end ? new Date(existing.current_period_end) : null;
  const isRenewal = existing?.status === "active" && existing.plan_code === request.plan_code && existing.billing_cycle === request.billing_cycle && existingEnd && existingEnd > now;
  const periodStart = isRenewal ? existingEnd : now;
  const periodEnd = addPeriod(periodStart, request.billing_cycle);
  const payload = { user_id: request.user_id, plan_code: request.plan_code, status: "active", provider: "sumup_external", billing_cycle: request.billing_cycle, provider_checkout_reference: request.id, current_period_start: periodStart.toISOString(), current_period_end: periodEnd.toISOString(), cancel_at_period_end: false, grace_until: null, automatic_grace_granted_at: null, automatic_grace_original_period_end: null, test_access: false, updated_at: now.toISOString() };
  if (existing) await supabaseRest(`user_subscriptions?id=eq.${encodeURIComponent(existing.id)}`, { method: "PATCH", body: JSON.stringify(payload) });
  else await supabaseRest("user_subscriptions", { method: "POST", body: JSON.stringify(payload) });
  await supabaseRest(`user_profiles?user_id=eq.${encodeURIComponent(request.user_id)}`, { method: "PATCH", body: JSON.stringify({ plan_code: request.plan_code, lifecycle_stage: "active", updated_at: now.toISOString() }) });
  await supabaseRest(`subscription_requests?id=eq.${encodeURIComponent(request.id)}`, { method: "PATCH", body: JSON.stringify({ status: "active", confirmed_at: now.toISOString(), confirmed_by: "admin", updated_at: now.toISOString() }) });

  const firstName = request.customer_name?.trim().split(/\s+/)[0] || "Olá";
  const planName = request.plan_code === "pro" ? "Pro" : "Agency";
  let welcome: { subject: string; message: string; ctaLabel: string | null; ctaUrl: string | null };
  if (!isRenewal) {
    const template = await getOnboardingTemplate(request.plan_code === "pro" ? "pro_welcome" : "agency_welcome");
    if (!template || !template.enabled) throw new Error(`O onboarding do Plano ${planName} está desativado ou indisponível.`);
    welcome = { subject: personalize(template.subject, { firstName, periodEnd, billingCycle: request.billing_cycle }), message: personalize(template.message, { firstName, periodEnd, billingCycle: request.billing_cycle }), ctaLabel: template.cta_label, ctaUrl: template.cta_url };
  } else {
    welcome = { subject: `Seu Plano ${planName} Kivai foi renovado`, message: `${firstName}, sua renovação foi confirmada e o Plano ${planName} continua ativo até ${periodEnd.toLocaleDateString("pt-BR")}. Entre no painel para continuar usando os recursos do seu plano.`, ctaLabel: "Acessar meu painel", ctaUrl: "https://www.kivai.com.br/conta" };
  }

  const communication = await supabaseRest<Array<{ id: string }>>("customer_communications", { method: "POST", body: JSON.stringify({ user_id: request.user_id, event_key: `${isRenewal ? "renewal" : "activation"}_${request.id}`, channel: "email", status: "ready", subject: welcome.subject, message: welcome.message, cta_label: welcome.ctaLabel, cta_url: welcome.ctaUrl, scheduled_for: now.toISOString(), metadata: { recipient_email: request.customer_email, kind: isRenewal ? "subscription_renewal" : request.plan_code === "pro" ? "pro_welcome" : "agency_welcome", transactional: true, period_end: periodEnd.toISOString(), plan_code: request.plan_code, billing_cycle: request.billing_cycle } }) });
  if (communication[0]) await deliverCustomerEmail(communication[0].id);
  await supabaseRest("customer_marketing_events", { method: "POST", body: JSON.stringify({ user_id: request.user_id, event_type: isRenewal ? "subscription_renewed" : "subscription_activated", description: `Plano ${planName} ${request.billing_cycle === "monthly" ? "mensal" : "anual"} confirmado pelo administrador e comunicação automática processada por e-mail.`, metadata: { period_end: periodEnd.toISOString(), request_id: request.id } }) });
  revalidatePath("/admin/assinaturas"); revalidatePath("/admin/usuarios"); revalidatePath("/admin/marketing"); revalidatePath("/conta");
}

export async function rejectSubscriptionPayment(formData: FormData) {
  await assertAdminApi(); const requestId = String(formData.get("requestId") ?? ""); if (!requestId) throw new Error("Solicitação inválida.");
  await supabaseRest(`subscription_requests?id=eq.${encodeURIComponent(requestId)}`, { method: "PATCH", body: JSON.stringify({ status: "rejected", updated_at: new Date().toISOString() }) });
  revalidatePath("/admin/assinaturas");
}
