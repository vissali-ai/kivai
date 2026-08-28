import "server-only";

import { supabaseRest } from "@/lib/blog/supabase";

type SubscriptionRow = {
  id: string;
  user_id: string;
  plan_code: "pro" | "agency";
  billing_cycle: "monthly" | "annual" | null;
  current_period_end: string | null;
  status: string;
};

type RequestRow = { customer_email: string; customer_name: string | null };
type ProfileRow = { phone: string | null; whatsapp_opt_in: boolean; email_marketing_opt_in: boolean };

function daysBetween(now: Date, end: Date) {
  return Math.ceil((end.getTime() - now.getTime()) / 86400000);
}

async function contactFor(userId: string) {
  const [requests, profiles] = await Promise.all([
    supabaseRest<RequestRow[]>(`subscription_requests?select=customer_email,customer_name&user_id=eq.${encodeURIComponent(userId)}&order=created_at.desc&limit=1`),
    supabaseRest<ProfileRow[]>(`user_profiles?select=phone,whatsapp_opt_in,email_marketing_opt_in&user_id=eq.${encodeURIComponent(userId)}&limit=1`),
  ]);
  return { request: requests[0], profile: profiles[0] };
}

async function queueMessage(input: { userId: string; eventKey: string; subject: string; message: string; recipientEmail?: string; phone?: string; whatsappOptIn?: boolean; emailOptIn?: boolean; ctaLabel?: string; ctaUrl?: string }) {
  const common = { user_id: input.userId, event_key: input.eventKey, status: "ready", message: input.message, scheduled_for: new Date().toISOString(), cta_label: input.ctaLabel ?? "Renovar plano", cta_url: input.ctaUrl ?? "https://www.kivai.com.br/planos" };
  if (input.recipientEmail && input.emailOptIn !== false) {
    await supabaseRest("customer_communications", { method: "POST", body: JSON.stringify({ ...common, channel: "email", subject: input.subject, metadata: { recipient_email: input.recipientEmail, automated: true } }) }).catch(() => undefined);
  }
  if (input.phone && input.whatsappOptIn) {
    await supabaseRest("customer_communications", { method: "POST", body: JSON.stringify({ ...common, channel: "whatsapp", subject: null, metadata: { recipient_phone: input.phone, automated: true } }) }).catch(() => undefined);
  }
}

export async function expireDueExternalSubscriptions() {
  const now = new Date();
  const active = await supabaseRest<SubscriptionRow[]>(`user_subscriptions?select=id,user_id,plan_code,billing_cycle,current_period_end,status&provider=eq.sumup_external&status=eq.active&current_period_end=not.is.null&limit=500`);
  const expired: string[] = [];
  const reminders: string[] = [];

  for (const subscription of active) {
    if (!subscription.current_period_end) continue;
    const end = new Date(subscription.current_period_end);
    const days = daysBetween(now, end);
    const contact = await contactFor(subscription.user_id);
    const planName = subscription.plan_code === "pro" ? "Pro" : "Agency";
    if ([10, 5, 1].includes(days)) {
      const eventKey = `renewal_${subscription.id}_${days}d`;
      const message = `${contact.request?.customer_name?.trim().split(/\s+/)[0] || "Olá"}, seu Plano ${planName} Kivai vence em ${days} dia${days === 1 ? "" : "s"}, em ${end.toLocaleDateString("pt-BR")}. Se quiser continuar com os recursos e seu histórico disponível, você já pode renovar pelo seu painel.`;
      await queueMessage({ userId: subscription.user_id, eventKey, subject: `Seu Plano ${planName} vence em ${days} dia${days === 1 ? "" : "s"}`, message, recipientEmail: contact.request?.customer_email, phone: contact.profile?.phone ?? undefined, whatsappOptIn: contact.profile?.whatsapp_opt_in, emailOptIn: contact.profile?.email_marketing_opt_in });
      await supabaseRest(`user_profiles?user_id=eq.${encodeURIComponent(subscription.user_id)}`, { method: "PATCH", body: JSON.stringify({ lifecycle_stage: "expiring", updated_at: now.toISOString() }) });
      reminders.push(eventKey);
    }
    if (end <= now) {
      await supabaseRest(`user_subscriptions?id=eq.${encodeURIComponent(subscription.id)}`, { method: "PATCH", body: JSON.stringify({ status: "past_due", updated_at: now.toISOString() }) });
      await supabaseRest(`user_profiles?user_id=eq.${encodeURIComponent(subscription.user_id)}`, { method: "PATCH", body: JSON.stringify({ plan_code: "free", lifecycle_stage: "expired", updated_at: now.toISOString() }) });
      await supabaseRest("customer_marketing_events", { method: "POST", body: JSON.stringify({ user_id: subscription.user_id, event_type: "subscription_expired", description: `Plano ${planName} vencido.`, metadata: { subscription_id: subscription.id, period_end: end.toISOString() } }) });
      expired.push(subscription.id);
    }
  }

  const fifteenDaysAgo = new Date(now.getTime() - 15 * 86400000).toISOString();
  const pastDue = await supabaseRest<SubscriptionRow[]>(`user_subscriptions?select=id,user_id,plan_code,billing_cycle,current_period_end,status&provider=eq.sumup_external&status=eq.past_due&current_period_end=lte.${encodeURIComponent(fifteenDaysAgo)}&limit=300`);
  const winback: string[] = [];
  for (const subscription of pastDue) {
    const contact = await contactFor(subscription.user_id);
    const planName = subscription.plan_code === "pro" ? "Pro" : "Agency";
    const eventKey = `winback_${subscription.id}_15d`;
    await queueMessage({ userId: subscription.user_id, eventKey, subject: `Quer voltar ao Plano ${planName}?`, message: `Sentimos sua falta no Plano ${planName}. Seu acesso premium venceu há alguns dias. Se ainda fizer sentido para você, podemos facilitar sua volta. Entre no Kivai para renovar ou fale conosco para conhecer as condições disponíveis.`, recipientEmail: contact.request?.customer_email, phone: contact.profile?.phone ?? undefined, whatsappOptIn: contact.profile?.whatsapp_opt_in, emailOptIn: contact.profile?.email_marketing_opt_in, ctaLabel: "Voltar para o Kivai" });
    winback.push(eventKey);
  }

  return { checkedAt: now.toISOString(), activeChecked: active.length, remindersQueued: reminders.length, expiredCount: expired.length, winbackQueued: winback.length, expired };
}
