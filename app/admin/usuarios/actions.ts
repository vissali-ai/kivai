"use server";

import { revalidatePath } from "next/cache";
import { assertAdminApi } from "@/lib/blog/auth";
import { blogConfig } from "@/lib/blog/config";
import { supabaseRest } from "@/lib/blog/supabase";
import { deleteAuthCustomer } from "@/lib/admin/customer-users";

function addDays(date: Date, days: number) { const copy = new Date(date); copy.setUTCDate(copy.getUTCDate() + days); return copy; }

export async function grantProTest(formData: FormData) {
  await assertAdminApi(); const userId = String(formData.get("userId") ?? ""); if (!userId) throw new Error("Usuário inválido.");
  const now = new Date(); const end = addDays(now, 7);
  const existing = await supabaseRest<Array<{ id: string }>>(`user_subscriptions?select=id&user_id=eq.${encodeURIComponent(userId)}&order=created_at.desc&limit=1`);
  const payload = { user_id: userId, plan_code: "pro", status: "active", provider: "admin_test", billing_cycle: "monthly", current_period_start: now.toISOString(), current_period_end: end.toISOString(), test_access: true, updated_at: now.toISOString() };
  if (existing[0]) await supabaseRest(`user_subscriptions?id=eq.${encodeURIComponent(existing[0].id)}`, { method: "PATCH", body: JSON.stringify(payload) }); else await supabaseRest("user_subscriptions", { method: "POST", body: JSON.stringify(payload) });
  await supabaseRest(`user_profiles?user_id=eq.${encodeURIComponent(userId)}`, { method: "PATCH", body: JSON.stringify({ plan_code: "pro", lifecycle_stage: "trial", updated_at: now.toISOString() }) });
  await supabaseRest("customer_marketing_events", { method: "POST", body: JSON.stringify({ user_id: userId, event_type: "pro_test_granted", description: "Acesso Pro de teste liberado por 7 dias pelo administrador.", metadata: { expires_at: end.toISOString() } }) });
  revalidatePath("/admin/usuarios"); revalidatePath("/admin/marketing"); revalidatePath("/conta");
}

export async function grantGracePeriod(formData: FormData) {
  await assertAdminApi(); const userId = String(formData.get("userId") ?? ""); const days = Math.max(1, Math.min(30, Number(formData.get("days") ?? 5))); if (!userId) throw new Error("Usuário inválido.");
  const subscriptions = await supabaseRest<Array<{ id: string; plan_code: "pro" | "agency"; current_period_end: string | null }>>(`user_subscriptions?select=id,plan_code,current_period_end&user_id=eq.${encodeURIComponent(userId)}&order=created_at.desc&limit=1`);
  const subscription = subscriptions[0]; if (!subscription) throw new Error("Usuário sem assinatura anterior.");
  const now = new Date(); const graceUntil = addDays(now, days);
  await supabaseRest(`user_subscriptions?id=eq.${encodeURIComponent(subscription.id)}`, { method: "PATCH", body: JSON.stringify({ status: "active", grace_until: graceUntil.toISOString(), current_period_end: graceUntil.toISOString(), provider: "admin_grace", updated_at: now.toISOString() }) });
  await supabaseRest(`user_profiles?user_id=eq.${encodeURIComponent(userId)}`, { method: "PATCH", body: JSON.stringify({ plan_code: subscription.plan_code, lifecycle_stage: "trial", updated_at: now.toISOString() }) });
  await supabaseRest("customer_marketing_events", { method: "POST", body: JSON.stringify({ user_id: userId, event_type: "grace_period_granted", description: `${days} dias de cortesia concedidos pelo administrador.`, metadata: { grace_until: graceUntil.toISOString() } }) });
  revalidatePath("/admin/usuarios"); revalidatePath("/admin/marketing"); revalidatePath("/conta");
}

export async function updateCustomerAccount(formData: FormData) {
  await assertAdminApi();
  const userId = String(formData.get("userId") ?? "");
  const planCode = String(formData.get("planCode") ?? "free");
  const services = String(formData.get("contractedServices") ?? "").split(",").map((value) => value.trim()).filter(Boolean).slice(0, 30);
  const notes = String(formData.get("notes") ?? "").trim();
  if (!userId || !["free", "pro", "agency"].includes(planCode)) throw new Error("Dados inválidos.");
  const lifecycleStage = planCode === "free" ? "free" : "active";
  await supabaseRest(`user_profiles?user_id=eq.${encodeURIComponent(userId)}`, { method: "PATCH", body: JSON.stringify({ plan_code: planCode, lifecycle_stage: lifecycleStage, contracted_services: services, admin_notes: notes || null, updated_at: new Date().toISOString() }) });
  revalidatePath("/admin/usuarios"); revalidatePath("/admin/marketing"); revalidatePath("/conta"); revalidatePath("/conta/dados");
}

export async function sendCustomerPasswordReset(formData: FormData) {
  await assertAdminApi();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const provider = String(formData.get("provider") ?? "");
  if (!email || provider !== "email") throw new Error("Redefinição disponível somente para contas criadas com e-mail e senha.");
  const origin = "https://www.kivai.com.br";
  const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? blogConfig.serviceRoleKey;
  const response = await fetch(`${blogConfig.supabaseUrl}/auth/v1/recover?redirect_to=${encodeURIComponent(`${origin}/conta/redefinir-senha`)}`, { method: "POST", headers: { apikey: publicKey, "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
  if (!response.ok) throw new Error("Não foi possível enviar o link de redefinição.");
  revalidatePath("/admin/usuarios");
}

export async function updateCustomerMarketing(formData: FormData) {
  await assertAdminApi(); const userId = String(formData.get("userId") ?? ""); if (!userId) throw new Error("Usuário inválido.");
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (formData.has("lifecycleStage")) patch.lifecycle_stage = String(formData.get("lifecycleStage") ?? "free");
  if (formData.has("customerScore")) patch.customer_score = Math.max(0, Math.min(100, Number(formData.get("customerScore") ?? 0)));
  if (formData.has("tags")) patch.marketing_tags = String(formData.get("tags") ?? "").split(",").map((v) => v.trim().toLowerCase()).filter(Boolean);
  if (formData.has("notes")) patch.admin_notes = String(formData.get("notes") ?? "").trim() || null;
  if (formData.has("phone")) patch.phone = String(formData.get("phone") ?? "").trim() || null;
  if (formData.has("whatsappOptIn")) patch.whatsapp_opt_in = formData.get("whatsappOptIn") === "on";
  if (formData.has("emailMarketingOptIn")) patch.email_marketing_opt_in = formData.get("emailMarketingOptIn") === "on";
  await supabaseRest(`user_profiles?user_id=eq.${encodeURIComponent(userId)}`, { method: "PATCH", body: JSON.stringify(patch) });
  revalidatePath("/admin/usuarios"); revalidatePath("/admin/marketing");
}

export async function deleteCustomerPermanently(formData: FormData) {
  await assertAdminApi(); const userId = String(formData.get("userId") ?? ""); const confirmation = String(formData.get("confirmation") ?? ""); if (!userId || confirmation !== "EXCLUIR") throw new Error("Confirmação de exclusão inválida.");
  await deleteAuthCustomer(userId); revalidatePath("/admin/usuarios"); revalidatePath("/admin/assinaturas"); revalidatePath("/admin/marketing");
}

export async function queueManualCampaign(formData: FormData) {
  await assertAdminApi(); const userId = String(formData.get("userId") ?? ""); const channel = String(formData.get("channel") ?? "email"); const subject = String(formData.get("subject") ?? "").trim(); const message = String(formData.get("message") ?? "").trim(); const offerType = String(formData.get("offerType") ?? "none");
  if (!userId || !message || !["email", "whatsapp", "internal"].includes(channel)) throw new Error("Mensagem inválida.");
  await supabaseRest("customer_communications", { method: "POST", body: JSON.stringify({ user_id: userId, event_key: `manual_${Date.now()}`, channel, status: "ready", subject: subject || null, message, scheduled_for: new Date().toISOString(), metadata: { source: "admin_manual", offer_type: offerType } }) });
  await supabaseRest("customer_marketing_events", { method: "POST", body: JSON.stringify({ user_id: userId, event_type: "remarketing_queued", description: `Remarketing ${channel} preparado no Admin.`, metadata: { offer_type: offerType } }) });
  revalidatePath("/admin/marketing");
}
