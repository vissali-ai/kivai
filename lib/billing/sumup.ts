import "server-only";

import { blogConfig } from "@/lib/blog/config";
import { supabaseRest } from "@/lib/blog/supabase";

const SUMUP_API = "https://api.sumup.com/v0.1";

export type BillingCycle = "monthly" | "annual";
export type PaidPlanCode = "pro" | "agency";

type AuthUser = { id: string; email?: string; user_metadata?: Record<string, unknown> };
type PlanRow = { code: PaidPlanCode; name: string; price_monthly_brl: number | string; price_annual_brl: number | string };
type SumUpCheckout = {
  id: string;
  checkout_reference: string;
  status: string;
  customer_id?: string;
  hosted_checkout_url?: string;
  payment_instrument?: { token?: string };
  transactions?: Array<{ status?: string }>;
};
type SumUpPaymentInstrument = { token: string; active?: boolean; mandate?: { status?: string; type?: string } };

type SubscriptionRow = {
  id: string;
  user_id: string;
  plan_code: PaidPlanCode;
  status?: string;
  billing_cycle: BillingCycle | null;
  provider_customer_id: string | null;
  provider_subscription_id: string | null;
  provider_checkout_reference: string | null;
  current_period_start?: string | null;
  current_period_end?: string | null;
  cancel_at_period_end?: boolean;
};

type BillingAttemptRow = { id: string; status: "processing" | "successful" | "failed" };

function apiKey() { return process.env.SUMUP_API_KEY ?? ""; }
function merchantCode() { return process.env.SUMUP_MERCHANT_CODE ?? ""; }

export function isSumUpConfigured() {
  return Boolean(apiKey() && merchantCode());
}

async function sumupFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!isSumUpConfigured()) throw new Error("PAYMENT_UNAVAILABLE");
  const response = await fetch(`${SUMUP_API}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const text = await response.text();
  let payload: unknown = {};
  try { payload = text ? JSON.parse(text) : {}; } catch { payload = { message: text }; }
  if (!response.ok) throw new Error(`SUMUP_${response.status}:${JSON.stringify(payload).slice(0, 800)}`);
  return payload as T;
}

export async function authenticateBillingUser(request: Request): Promise<AuthUser> {
  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token || !blogConfig.supabaseUrl || !blogConfig.serviceRoleKey) throw new Error("UNAUTHORIZED");
  const response = await fetch(`${blogConfig.supabaseUrl}/auth/v1/user`, {
    headers: { apikey: blogConfig.serviceRoleKey, Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!response.ok) throw new Error("UNAUTHORIZED");
  const user = await response.json() as AuthUser;
  if (!user.id) throw new Error("UNAUTHORIZED");
  return user;
}

export async function getPaidPlan(code: string): Promise<PlanRow> {
  if (code !== "pro" && code !== "agency") throw new Error("INVALID_PLAN");
  const rows = await supabaseRest<PlanRow[]>(`subscription_plans?select=code,name,price_monthly_brl,price_annual_brl&code=eq.${code}&active=eq.true&limit=1`);
  if (!rows[0]) throw new Error("INVALID_PLAN");
  return rows[0];
}

function amountFor(plan: PlanRow, cycle: BillingCycle) {
  const amount = Number(cycle === "monthly" ? plan.price_monthly_brl : plan.price_annual_brl);
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("INVALID_AMOUNT");
  return amount;
}

function customerId(userId: string) {
  return `kivai-${userId}`.slice(0, 60);
}

async function ensureSumUpCustomer(user: AuthUser) {
  const id = customerId(user.id);
  try {
    await sumupFetch(`/customers/${encodeURIComponent(id)}`);
    return id;
  } catch (error) {
    if (error instanceof Error && !error.message.startsWith("SUMUP_404")) throw error;
  }
  const metadata = user.user_metadata ?? {};
  const fullName = String(metadata.full_name ?? metadata.name ?? "").trim();
  const parts = fullName.split(/\s+/).filter(Boolean);
  await sumupFetch("/customers", {
    method: "POST",
    body: JSON.stringify({
      customer_id: id,
      personal_details: {
        ...(parts[0] ? { first_name: parts[0] } : {}),
        ...(parts.length > 1 ? { last_name: parts.slice(1).join(" ") } : {}),
        ...(user.email ? { email: user.email } : {}),
      },
    }),
  });
  return id;
}

async function savePendingSubscription(params: {
  user: AuthUser;
  plan: PaidPlanCode;
  cycle: BillingCycle;
  reference: string;
  checkoutId: string;
  sumupCustomerId?: string | null;
}) {
  await supabaseRest("user_subscriptions", {
    method: "POST",
    body: JSON.stringify({
      user_id: params.user.id,
      plan_code: params.plan,
      status: "pending",
      provider: "sumup",
      provider_customer_id: params.sumupCustomerId ?? null,
      provider_subscription_id: params.checkoutId,
      provider_checkout_reference: params.reference,
      billing_cycle: params.cycle,
      updated_at: new Date().toISOString(),
    }),
  });
}

export async function startCheckout(params: {
  user: AuthUser;
  planCode: string;
  billingCycle: BillingCycle;
  origin: string;
}) {
  const plan = await getPaidPlan(params.planCode);
  const amount = amountFor(plan, params.billingCycle);
  const reference = `kivai-${plan.code}-${params.billingCycle}-${crypto.randomUUID()}`.slice(0, 90);

  if (params.billingCycle === "annual") {
    const checkout = await sumupFetch<SumUpCheckout>("/checkouts", {
      method: "POST",
      body: JSON.stringify({
        checkout_reference: reference,
        amount,
        currency: "BRL",
        merchant_code: merchantCode(),
        description: `Kivai ${plan.name} anual`,
        redirect_url: `${params.origin}/conta/checkout/retorno?ref=${encodeURIComponent(reference)}`,
        hosted_checkout: { enabled: true },
      }),
    });
    await savePendingSubscription({ user: params.user, plan: plan.code, cycle: params.billingCycle, reference, checkoutId: checkout.id });
    return { mode: "hosted" as const, reference, checkoutId: checkout.id, hostedCheckoutUrl: checkout.hosted_checkout_url };
  }

  const sumupCustomerId = await ensureSumUpCustomer(params.user);
  const checkout = await sumupFetch<SumUpCheckout>("/checkouts", {
    method: "POST",
    body: JSON.stringify({
      checkout_reference: reference,
      amount: 1,
      currency: "BRL",
      merchant_code: merchantCode(),
      description: `Autorizar assinatura Kivai ${plan.name}`,
      customer_id: sumupCustomerId,
      purpose: "SETUP_RECURRING_PAYMENT",
    }),
  });
  await savePendingSubscription({ user: params.user, plan: plan.code, cycle: params.billingCycle, reference, checkoutId: checkout.id, sumupCustomerId });
  return { mode: "recurring_setup" as const, reference, checkoutId: checkout.id, customerId: sumupCustomerId, amount };
}

export async function retrieveCheckout(checkoutId: string) {
  return sumupFetch<SumUpCheckout>(`/checkouts/${encodeURIComponent(checkoutId)}`);
}

async function createAndChargeSavedCard(params: { plan: PlanRow; cycle: BillingCycle; customerId: string; token: string }) {
  const reference = `kivai-charge-${params.plan.code}-${params.cycle}-${crypto.randomUUID()}`.slice(0, 90);
  const checkout = await sumupFetch<SumUpCheckout>("/checkouts", {
    method: "POST",
    body: JSON.stringify({
      checkout_reference: reference,
      amount: amountFor(params.plan, params.cycle),
      currency: "BRL",
      merchant_code: merchantCode(),
      description: `Kivai ${params.plan.name} ${params.cycle === "monthly" ? "mensal" : "anual"}`,
      customer_id: params.customerId,
    }),
  });
  const charged = await sumupFetch<SumUpCheckout>(`/checkouts/${encodeURIComponent(checkout.id)}`, {
    method: "PUT",
    body: JSON.stringify({ payment_type: "card", installments: 1, token: params.token, customer_id: params.customerId }),
  });
  return { reference, checkout: charged };
}

function isSuccessful(checkout: SumUpCheckout) {
  return checkout.status === "PAID" || checkout.transactions?.some((tx) => tx.status === "SUCCESSFUL") === true;
}

export async function completeRecurringSetup(user: AuthUser, setupReference: string) {
  const subscriptions = await supabaseRest<SubscriptionRow[]>(`user_subscriptions?select=*&user_id=eq.${encodeURIComponent(user.id)}&provider_checkout_reference=eq.${encodeURIComponent(setupReference)}&status=eq.pending&limit=1`);
  const subscription = subscriptions[0];
  if (!subscription?.provider_subscription_id || !subscription.provider_customer_id || !subscription.billing_cycle) throw new Error("SUBSCRIPTION_NOT_FOUND");
  const setup = await retrieveCheckout(subscription.provider_subscription_id);
  const token = setup.payment_instrument?.token;
  if (!token) throw new Error("TOKEN_NOT_READY");
  const plan = await getPaidPlan(subscription.plan_code);
  const charged = await createAndChargeSavedCard({ plan, cycle: subscription.billing_cycle, customerId: subscription.provider_customer_id, token });
  if (!isSuccessful(charged.checkout)) throw new Error("PAYMENT_NOT_CONFIRMED");
  await activateSubscription({ subscriptionId: subscription.id, userId: user.id, plan: subscription.plan_code, cycle: subscription.billing_cycle, checkoutReference: charged.reference, checkoutId: charged.checkout.id });
  return { active: true, plan: subscription.plan_code };
}

export async function confirmHostedCheckout(user: AuthUser, reference: string) {
  const subscriptions = await supabaseRest<SubscriptionRow[]>(`user_subscriptions?select=*&user_id=eq.${encodeURIComponent(user.id)}&provider_checkout_reference=eq.${encodeURIComponent(reference)}&status=eq.pending&limit=1`);
  const subscription = subscriptions[0];
  if (!subscription?.provider_subscription_id || !subscription.billing_cycle) throw new Error("SUBSCRIPTION_NOT_FOUND");
  const checkout = await retrieveCheckout(subscription.provider_subscription_id);
  if (!isSuccessful(checkout)) return { active: false, status: checkout.status };
  await activateSubscription({ subscriptionId: subscription.id, userId: user.id, plan: subscription.plan_code, cycle: subscription.billing_cycle, checkoutReference: reference, checkoutId: checkout.id });
  return { active: true, plan: subscription.plan_code };
}

async function activateSubscription(params: { subscriptionId: string; userId: string; plan: PaidPlanCode; cycle: BillingCycle; checkoutReference: string; checkoutId: string }) {
  const now = new Date();
  const end = new Date(now);
  if (params.cycle === "monthly") end.setUTCMonth(end.getUTCMonth() + 1);
  else end.setUTCFullYear(end.getUTCFullYear() + 1);
  await supabaseRest(`user_subscriptions?id=eq.${encodeURIComponent(params.subscriptionId)}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "active", provider_checkout_reference: params.checkoutReference, provider_subscription_id: params.checkoutId, current_period_start: now.toISOString(), current_period_end: end.toISOString(), grace_until: null, automatic_grace_granted_at: null, automatic_grace_original_period_end: null, updated_at: now.toISOString() }),
  });
  await supabaseRest(`user_profiles?user_id=eq.${encodeURIComponent(params.userId)}`, {
    method: "PATCH",
    body: JSON.stringify({ plan_code: params.plan, updated_at: now.toISOString() }),
  });
}

async function downgradeUser(userId: string, subscriptionId: string, status: "past_due" | "canceled", error?: string) {
  const now = new Date().toISOString();
  await supabaseRest(`user_subscriptions?id=eq.${encodeURIComponent(subscriptionId)}`, { method: "PATCH", body: JSON.stringify({ status, updated_at: now }) });
  await supabaseRest(`user_profiles?user_id=eq.${encodeURIComponent(userId)}`, { method: "PATCH", body: JSON.stringify({ plan_code: "free", updated_at: now }) });
  if (error) console.error("subscription_downgraded", subscriptionId, error);
}

export async function runDueSubscriptionRenewals() {
  if (!isSumUpConfigured()) throw new Error("PAYMENT_UNAVAILABLE");
  const now = new Date();
  const rows = await supabaseRest<SubscriptionRow[]>(`user_subscriptions?select=*&provider=eq.sumup&status=eq.active&billing_cycle=eq.monthly&current_period_end=lte.${encodeURIComponent(now.toISOString())}&order=current_period_end.asc&limit=100`);
  const results: Array<{ id: string; status: string }> = [];

  for (const subscription of rows) {
    const due = subscription.current_period_end;
    if (!due) continue;
    if (subscription.cancel_at_period_end) {
      await downgradeUser(subscription.user_id, subscription.id, "canceled");
      results.push({ id: subscription.id, status: "canceled" });
      continue;
    }
    if (!subscription.provider_customer_id) {
      await downgradeUser(subscription.user_id, subscription.id, "past_due", "missing_customer");
      results.push({ id: subscription.id, status: "past_due" });
      continue;
    }

    const existing = await supabaseRest<BillingAttemptRow[]>(`subscription_billing_attempts?select=id,status&subscription_id=eq.${encodeURIComponent(subscription.id)}&due_period_end=eq.${encodeURIComponent(due)}&limit=1`);
    if (existing[0]?.status === "successful" || existing[0]?.status === "processing") {
      results.push({ id: subscription.id, status: existing[0].status });
      continue;
    }

    let attemptId = existing[0]?.id;
    if (!attemptId) {
      const created = await supabaseRest<Array<{ id: string }>>("subscription_billing_attempts", {
        method: "POST",
        body: JSON.stringify({ subscription_id: subscription.id, due_period_end: due, status: "processing" }),
      });
      attemptId = created[0]?.id;
    } else {
      await supabaseRest(`subscription_billing_attempts?id=eq.${encodeURIComponent(attemptId)}`, { method: "PATCH", body: JSON.stringify({ status: "processing", error: null, updated_at: now.toISOString() }) });
    }
    if (!attemptId) continue;

    try {
      const instruments = await sumupFetch<SumUpPaymentInstrument[]>(`/customers/${encodeURIComponent(subscription.provider_customer_id)}/payment-instruments`);
      const instrument = instruments.find((item) => item.active !== false && item.mandate?.status !== "inactive" && item.token);
      if (!instrument) throw new Error("NO_ACTIVE_PAYMENT_INSTRUMENT");
      const plan = await getPaidPlan(subscription.plan_code);
      const charged = await createAndChargeSavedCard({ plan, cycle: "monthly", customerId: subscription.provider_customer_id, token: instrument.token });
      if (!isSuccessful(charged.checkout)) throw new Error("PAYMENT_NOT_CONFIRMED");

      const periodStart = new Date(due);
      const periodEnd = new Date(periodStart);
      periodEnd.setUTCMonth(periodEnd.getUTCMonth() + 1);
      await supabaseRest(`user_subscriptions?id=eq.${encodeURIComponent(subscription.id)}`, {
        method: "PATCH",
        body: JSON.stringify({ provider_checkout_reference: charged.reference, provider_subscription_id: charged.checkout.id, current_period_start: periodStart.toISOString(), current_period_end: periodEnd.toISOString(), grace_until: null, automatic_grace_granted_at: null, automatic_grace_original_period_end: null, status: "active", updated_at: new Date().toISOString() }),
      });
      await supabaseRest(`subscription_billing_attempts?id=eq.${encodeURIComponent(attemptId)}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "successful", checkout_reference: charged.reference, checkout_id: charged.checkout.id, updated_at: new Date().toISOString() }),
      });
      results.push({ id: subscription.id, status: "successful" });
    } catch (error) {
      const reason = error instanceof Error ? error.message.slice(0, 800) : "renewal_failed";
      await supabaseRest(`subscription_billing_attempts?id=eq.${encodeURIComponent(attemptId)}`, { method: "PATCH", body: JSON.stringify({ status: "failed", error: reason, updated_at: new Date().toISOString() }) });
      await downgradeUser(subscription.user_id, subscription.id, "past_due", reason);
      results.push({ id: subscription.id, status: "failed" });
    }
  }

  return { checked: rows.length, results };
}
