import "server-only";

import { supabaseRest } from "@/lib/blog/supabase";
import { deliverCustomerEmail } from "@/lib/marketing/email-delivery";
import { getCustomerMarketingTemplate, type CustomerMarketingTemplate } from "@/lib/marketing/templates";

const DAY_MS = 86_400_000;
const REMINDER_DAYS = [7, 3, 1] as const;
const AUTOMATIC_GRACE_DELAY_DAYS = 7;
const AUTOMATIC_GRACE_LENGTH_DAYS = 7;

type SubscriptionRow = { id: string; user_id: string; plan_code: "pro" | "agency"; billing_cycle: "monthly" | "annual" | null; current_period_end: string | null; status: string; grace_until: string | null; automatic_grace_granted_at: string | null };
type RequestRow = { customer_email: string; customer_name: string | null; plan_code: "free" | "pro" | "agency"; status: string };

function daysBetween(now: Date, end: Date) { return Math.ceil((end.getTime() - now.getTime()) / DAY_MS); }
function firstName(value: string | null | undefined) { return value?.trim().split(/\s+/)[0] || "Olá"; }
function formatDate(value: Date) { return value.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }); }
function renderTemplate(template: CustomerMarketingTemplate, values: Record<string, string>) { let subject = template.subject; let message = template.message; for (const [key, value] of Object.entries(values)) { subject = subject.replaceAll(`{{${key}}}`, value); message = message.replaceAll(`{{${key}}}`, value); } return { subject, message }; }
async function contactFor(userId: string) { const requests = await supabaseRest<RequestRow[]>(`subscription_requests?select=customer_email,customer_name,plan_code,status&user_id=eq.${encodeURIComponent(userId)}&order=created_at.desc&limit=1`); return requests[0]; }
function hasPendingPayment(request: RequestRow | undefined, planCode: "pro" | "agency") { return request?.plan_code === planCode && ["awaiting_payment", "payment_reported"].includes(request.status); }

async function sendTransactionalEmail(input: { userId: string; eventKey: string; subject: string; message: string; recipientEmail?: string; ctaLabel?: string | null; ctaUrl?: string | null; secondaryCtaLabel?: string | null; secondaryCtaUrl?: string | null; kind: "subscription_expiry_reminder" | "subscription_automatic_grace"; metadata: Record<string, unknown> }) {
  const rows = await supabaseRest<Array<{ id: string }>>("customer_communications?on_conflict=event_key,channel", {
    method: "POST",
    headers: { Prefer: "resolution=ignore-duplicates,return=representation" },
    body: JSON.stringify({ user_id: input.userId, event_key: input.eventKey, channel: "email", status: "ready", subject: input.subject, message: input.message, scheduled_for: new Date().toISOString(), cta_label: input.ctaLabel ?? "Renovar plano", cta_url: input.ctaUrl ?? "https://www.kivai.com.br/planos", metadata: { ...input.metadata, recipient_email: input.recipientEmail || undefined, automated: true, transactional: true, kind: input.kind, layout: "kivai_campaign", secondary_cta_label: input.secondaryCtaLabel ?? "", secondary_cta_url: input.secondaryCtaUrl ?? "" } }),
  });
  if (!rows[0]) return "duplicate" as const;
  const result = await deliverCustomerEmail(rows[0].id);
  return result.status;
}

export async function expireDueExternalSubscriptions() {
  const now = new Date();
  const expiredCount = await supabaseRest<number>("rpc/kivai_expire_access", { method: "POST", body: "{}" });
  const renewalTemplate = await getCustomerMarketingTemplate("renewal");
  const graceTemplate = await getCustomerMarketingTemplate("winback");
  const active = await supabaseRest<SubscriptionRow[]>("user_subscriptions?select=id,user_id,plan_code,billing_cycle,current_period_end,status,grace_until,automatic_grace_granted_at&provider=in.(sumup_external,external_recurring)&status=eq.active&plan_code=in.(pro,agency)&current_period_end=not.is.null&limit=500");
  const reminders: string[] = [];
  for (const subscription of active) {
    if (!subscription.current_period_end) continue;
    if (subscription.automatic_grace_granted_at) continue;
    const end = new Date(subscription.current_period_end); const days = daysBetween(now, end); const contact = await contactFor(subscription.user_id); const planName = subscription.plan_code === "pro" ? "Pro" : "Agency";
    if (REMINDER_DAYS.includes(days as (typeof REMINDER_DAYS)[number]) && !hasPendingPayment(contact, subscription.plan_code) && renewalTemplate?.enabled) {
      const eventKey = `renewal_${subscription.id}_${end.toISOString()}_${days}d`;
      const rendered = renderTemplate(renewalTemplate, { nome: firstName(contact?.customer_name), plano: planName, dias: String(days), data_vencimento: formatDate(end) });
      const status = await sendTransactionalEmail({ userId: subscription.user_id, eventKey, subject: rendered.subject, message: rendered.message, recipientEmail: contact?.customer_email, ctaLabel: renewalTemplate.cta_label, ctaUrl: renewalTemplate.cta_url, secondaryCtaLabel: renewalTemplate.secondary_cta_label, secondaryCtaUrl: renewalTemplate.secondary_cta_url, kind: "subscription_expiry_reminder", metadata: { subscription_id: subscription.id, plan_code: subscription.plan_code, days_until_expiry: days, period_end: end.toISOString() } });
      if (status !== "duplicate") reminders.push(eventKey);
      await supabaseRest(`user_profiles?user_id=eq.${encodeURIComponent(subscription.user_id)}`, { method: "PATCH", body: JSON.stringify({ lifecycle_stage: "expiring", updated_at: now.toISOString() }) });
    }

  }

  const graceCutoff = new Date(now.getTime() - AUTOMATIC_GRACE_DELAY_DAYS * DAY_MS);
  const pastDue = await supabaseRest<SubscriptionRow[]>(`user_subscriptions?select=id,user_id,plan_code,billing_cycle,current_period_end,status,grace_until,automatic_grace_granted_at&provider=in.(sumup_external,external_recurring)&status=eq.past_due&plan_code=in.(pro,agency)&automatic_grace_granted_at=is.null&current_period_end=lte.${encodeURIComponent(graceCutoff.toISOString())}&limit=300`);
  const graceGranted: string[] = [];
  for (const subscription of pastDue) {
    if (!subscription.current_period_end) continue;
    const contact = await contactFor(subscription.user_id); if (hasPendingPayment(contact, subscription.plan_code)) continue;
    const originalPeriodEnd = subscription.current_period_end; const graceUntil = new Date(now.getTime() + AUTOMATIC_GRACE_LENGTH_DAYS * DAY_MS);
    const granted = await supabaseRest<{ graceUntil: string } | null>("rpc/kivai_automatic_grace", { method: "POST", body: JSON.stringify({ p_subscription_id: subscription.id }) });
    if (!granted) continue;
    const planName = subscription.plan_code === "pro" ? "Pro" : "Agency";
    await supabaseRest("customer_marketing_events", { method: "POST", body: JSON.stringify({ user_id: subscription.user_id, event_type: "automatic_grace_granted", description: `${AUTOMATIC_GRACE_LENGTH_DAYS} dias de cortesia automática no Plano ${planName}.`, metadata: { subscription_id: subscription.id, plan_code: subscription.plan_code, original_period_end: originalPeriodEnd, grace_until: graceUntil.toISOString() } }) });
    if (graceTemplate?.enabled) {
      const eventKey = `automatic_grace_${subscription.id}_${new Date(originalPeriodEnd).toISOString()}`;
      const rendered = renderTemplate(graceTemplate, { nome: firstName(contact?.customer_name), plano: planName, dias: String(AUTOMATIC_GRACE_LENGTH_DAYS), data_vencimento: formatDate(new Date(originalPeriodEnd)), data_fim_cortesia: formatDate(graceUntil) });
      await sendTransactionalEmail({ userId: subscription.user_id, eventKey, subject: rendered.subject, message: rendered.message, recipientEmail: contact?.customer_email, ctaLabel: graceTemplate.cta_label, ctaUrl: graceTemplate.cta_url, secondaryCtaLabel: graceTemplate.secondary_cta_label, secondaryCtaUrl: graceTemplate.secondary_cta_url, kind: "subscription_automatic_grace", metadata: { subscription_id: subscription.id, plan_code: subscription.plan_code, grace_until: graceUntil.toISOString(), original_period_end: originalPeriodEnd } });
    }
    graceGranted.push(subscription.id);
  }
  return { checkedAt: now.toISOString(), activeChecked: active.length, remindersSent: reminders.length, expiredCount, graceGrantedCount: graceGranted.length, graceGranted };
}
