"use server";

import { revalidatePath } from "next/cache";
import { assertAdminApi } from "@/lib/blog/auth";
import { supabaseRest } from "@/lib/blog/supabase";

type RequestRow = {
  id: string;
  user_id: string;
  plan_code: "pro" | "agency";
  billing_cycle: "monthly" | "annual";
  status: string;
};

type SubscriptionRow = {
  id: string;
  plan_code: "free" | "pro" | "agency";
  billing_cycle: "monthly" | "annual" | null;
  status: string;
  current_period_end: string | null;
};

function addPeriod(start: Date, cycle: "monthly" | "annual") {
  const end = new Date(start);
  if (cycle === "monthly") end.setUTCMonth(end.getUTCMonth() + 1);
  else end.setUTCFullYear(end.getUTCFullYear() + 1);
  return end;
}

export async function confirmSubscriptionPayment(formData: FormData) {
  await assertAdminApi();
  const requestId = String(formData.get("requestId") ?? "");
  if (!requestId) throw new Error("Solicitação inválida.");

  const requests = await supabaseRest<RequestRow[]>(`subscription_requests?select=id,user_id,plan_code,billing_cycle,status&id=eq.${encodeURIComponent(requestId)}&limit=1`);
  const request = requests[0];
  if (!request || !["awaiting_payment", "payment_reported"].includes(request.status)) throw new Error("Solicitação não disponível para confirmação.");

  const subscriptions = await supabaseRest<SubscriptionRow[]>(`user_subscriptions?select=id,plan_code,billing_cycle,status,current_period_end&user_id=eq.${encodeURIComponent(request.user_id)}&order=created_at.desc&limit=1`);
  const existing = subscriptions[0];
  const now = new Date();
  const existingEnd = existing?.current_period_end ? new Date(existing.current_period_end) : null;
  const isRenewal = existing?.status === "active" && existing.plan_code === request.plan_code && existing.billing_cycle === request.billing_cycle && existingEnd && existingEnd > now;
  const periodStart = isRenewal ? existingEnd : now;
  const periodEnd = addPeriod(periodStart, request.billing_cycle);
  const payload = {
    user_id: request.user_id,
    plan_code: request.plan_code,
    status: "active",
    provider: "sumup_external",
    billing_cycle: request.billing_cycle,
    provider_checkout_reference: request.id,
    current_period_start: periodStart.toISOString(),
    current_period_end: periodEnd.toISOString(),
    cancel_at_period_end: false,
    updated_at: now.toISOString(),
  };

  if (existing) {
    await supabaseRest(`user_subscriptions?id=eq.${encodeURIComponent(existing.id)}`, { method: "PATCH", body: JSON.stringify(payload) });
  } else {
    await supabaseRest("user_subscriptions", { method: "POST", body: JSON.stringify(payload) });
  }

  await supabaseRest(`user_profiles?user_id=eq.${encodeURIComponent(request.user_id)}`, {
    method: "PATCH",
    body: JSON.stringify({ plan_code: request.plan_code, updated_at: now.toISOString() }),
  });

  await supabaseRest(`subscription_requests?id=eq.${encodeURIComponent(request.id)}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "active", confirmed_at: now.toISOString(), confirmed_by: "admin", updated_at: now.toISOString() }),
  });

  revalidatePath("/admin/assinaturas");
  revalidatePath("/conta");
}

export async function rejectSubscriptionPayment(formData: FormData) {
  await assertAdminApi();
  const requestId = String(formData.get("requestId") ?? "");
  if (!requestId) throw new Error("Solicitação inválida.");

  await supabaseRest(`subscription_requests?id=eq.${encodeURIComponent(requestId)}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "rejected", updated_at: new Date().toISOString() }),
  });
  revalidatePath("/admin/assinaturas");
}
