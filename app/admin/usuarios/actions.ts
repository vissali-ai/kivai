"use server";

import { revalidatePath } from "next/cache";
import { assertAdminApi } from "@/lib/blog/auth";
import { supabaseRest } from "@/lib/blog/supabase";
import { deleteAuthCustomer } from "@/lib/admin/customer-users";

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

export async function grantProTest(formData: FormData) {
  await assertAdminApi();
  const userId = String(formData.get("userId") ?? "");
  if (!userId) throw new Error("Usuário inválido.");
  const now = new Date();
  const end = addDays(now, 7);
  const existing = await supabaseRest<Array<{ id: string }>>(`user_subscriptions?select=id&user_id=eq.${encodeURIComponent(userId)}&order=created_at.desc&limit=1`);
  const payload = { user_id: userId, plan_code: "pro", status: "active", provider: "admin_test", billing_cycle: "monthly", current_period_start: now.toISOString(), current_period_end: end.toISOString(), test_access: true, updated_at: now.toISOString() };
  if (existing[0]) await supabaseRest(`user_subscriptions?id=eq.${encodeURIComponent(existing[0].id)}`, { method: "PATCH", body: JSON.stringify(payload) });
  else await supabaseRest("user_subscriptions", { method: "POST", body: JSON.stringify(payload) });
  await supabaseRest(`user_profiles?user_id=eq.${encodeURIComponent(userId)}`, { method: "PATCH", body: JSON.stringify({ plan_code: "pro", lifecycle_stage: "trial", updated_at: now.toISOString() }) });
  await supabaseRest("customer_marketing_events", { method: "POST", body: JSON.stringify({ user_id: userId, event_type: "pro_test_granted", description: "Acesso Pro de teste liberado por 7 dias pelo administrador.", metadata: { expires_at: end.toISOString() } }) });
  revalidatePath("/admin/usuarios"); revalidatePath("/admin/marketing"); revalidatePath("/conta");
}

export async function grantGracePeriod(formData: FormData) {
  await assertAdminApi();
  const userId = String(formData.get("userId") ?? "");
  const days = Math.max(1, Math.min(30, Number(formData.get("days") ?? 5)));
  if (!userId) throw new Error("Usuário inválido.");
  const subscriptions = await supabaseRest<Array<{ id: string; plan_code: "pro" | "agency"; current_period_end: string | null }>>(`user_subscriptions?select=id,plan_code,current_period_end&user_id=eq.${encodeURIComponent(userId)}&order=created_at.desc&limit=1`);
  const subscription = subscriptions[0];
  if (!subscription) throw new Error("Usuário sem assinatura anterior.");
  const now = new Date();
  const graceUntil = addDays(now, days);
  await supabaseRest(`user_subscriptions?id=eq.${encodeURIComponent(subscription.id)}`, { method: "PATCH", body: JSON.stringify({ status: "active", grace_until: graceUntil.toISOString(), current_period_end: graceUntil.toISOString(), provider: "admin_grace", updated_at: now.toISOString() }) });
  await supabaseRest(`user_profiles?user_id=eq.${encodeURIComponent(userId)}`, { method: "PATCH", body: JSON.stringify({ plan_code: subscription.plan_code, lifecycle_stage: "trial", updated_at: now.toISOString() }) });
  await supabaseRest("customer_marketing_events", { method: "POST", body: JSON.stringify({ user_id: userId, event_type: "grace_period_granted", description: `${days} dias de cortesia concedidos pelo administrador.`, metadata: { grace_until: graceUntil.toISOString() } }) });
  revalidatePath("/admin/usuarios"); revalidatePath("/admin/marketing"); revalidatePath("/conta");
}

export async function updateCustomerMarketing(formData: FormData) {
  await assertAdminApi();
  const userId = String(formData.get("userId") ?? "");
  const lifecycleStage = String(formData.get("lifecycleStage") ?? "lead");
  const customerScore = Math.max(0, Math.min(100, Number(formData.get("customerScore") ?? 0)));
  const tags = String(formData.get("tags") ?? "").split(",").map((v) => v.trim().toLowerCase()).filter(Boolean);
  const notes = String(formData.get("notes") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const whatsappOptIn = formData.get("whatsappOptIn") === "on";
  const emailMarketingOptIn = formData.get("emailMarketingOptIn") === "on";
  if (!userId) throw new Error("Usuário inválido.");
  await supabaseRest(`user_profiles?user_id=eq.${encodeURIComponent(userId)}`, { method: "PATCH", body: JSON.stringify({ lifecycle_stage: lifecycleStage, customer_score: customerScore, marketing_tags: tags, admin_notes: notes || null, phone: phone || null, whatsapp_opt_in: whatsappOptIn, email_marketing_opt_in: emailMarketingOptIn, updated_at: new Date().toISOString() }) });
  revalidatePath("/admin/usuarios"); revalidatePath("/admin/marketing");
}

export async function deleteCustomerPermanently(formData: FormData) {
  await assertAdminApi();
  const userId = String(formData.get("userId") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");
  if (!userId || confirmation !== "EXCLUIR") throw new Error("Confirmação de exclusão inválida.");
  await deleteAuthCustomer(userId);
  revalidatePath("/admin/usuarios"); revalidatePath("/admin/assinaturas"); revalidatePath("/admin/marketing");
}

export async function queueManualCampaign(formData: FormData) {
  await assertAdminApi();
  const userId = String(formData.get("userId") ?? "");
  const channel = String(formData.get("channel") ?? "email");
  const subject = String(formData.get("subject") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const offerType = String(formData.get("offerType") ?? "none");
  if (!userId || !message || !["email", "whatsapp", "internal"].includes(channel)) throw new Error("Mensagem inválida.");
  await supabaseRest("customer_communications", { method: "POST", body: JSON.stringify({ user_id: userId, event_key: `manual_${Date.now()}`, channel, status: "ready", subject: subject || null, message, scheduled_for: new Date().toISOString(), metadata: { source: "admin_manual", offer_type: offerType } }) });
  await supabaseRest("customer_marketing_events", { method: "POST", body: JSON.stringify({ user_id: userId, event_type: "remarketing_queued", description: `Remarketing ${channel} preparado no Admin.`, metadata: { offer_type: offerType } }) });
  revalidatePath("/admin/marketing");
}
