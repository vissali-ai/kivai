"use server";

import { revalidatePath } from "next/cache";
import { assertAdminApi } from "@/lib/blog/auth";
import { blogConfig } from "@/lib/blog/config";
import { supabaseRest } from "@/lib/blog/supabase";
import { deleteAuthCustomer, listAdminCustomers } from "@/lib/admin/customer-users";
import { isCustomerMarketingFlowKey } from "@/lib/marketing/customer-flows";
import { deliverCustomerEmail } from "@/lib/marketing/email-delivery";
import { getOnboardingTemplate } from "@/lib/marketing/onboarding-templates";

function addDays(date: Date, days: number) { const copy = new Date(date); copy.setUTCDate(copy.getUTCDate() + days); return copy; }

export async function grantProTest(formData: FormData) {
  await assertAdminApi();
  const userId = String(formData.get("userId") ?? "");
  if (!userId) throw new Error("Usuário inválido.");
  const accessUntil = addDays(new Date(), 7);
  await supabaseRest("rpc/kivai_set_access", { method: "POST", body: JSON.stringify({ p_user_id: userId, p_plan: "pro", p_until: accessUntil.toISOString(), p_source: "admin_test" }) });

  const [template, customers] = await Promise.all([
    getOnboardingTemplate("pro_test_welcome"),
    listAdminCustomers(),
  ]);
  const customer = customers.find((item) => item.id === userId);
  if (template?.enabled && customer?.email) {
    const communication = await supabaseRest<Array<{ id: string }>>("customer_communications", {
      method: "POST",
      body: JSON.stringify({
        user_id: userId,
        event_key: `pro_test_welcome_${userId}_${accessUntil.toISOString()}`,
        channel: "email",
        status: "ready",
        subject: template.subject,
        message: template.message,
        cta_label: template.cta_label,
        cta_url: template.cta_url,
        scheduled_for: new Date().toISOString(),
        metadata: {
          source: "admin_test_access",
          kind: "pro_test_welcome",
          transactional: true,
          layout: "kivai_campaign",
          recipient_email: customer.email,
          secondary_cta_label: template.secondary_cta_label ?? "",
          secondary_cta_url: template.secondary_cta_url ?? "",
          access_until: accessUntil.toISOString(),
          template_version: template.updated_at,
        },
      }),
    });
    if (communication[0]) {
      const delivery = await deliverCustomerEmail(communication[0].id);
      await supabaseRest("customer_marketing_events", {
        method: "POST",
        body: JSON.stringify({
          user_id: userId,
          event_type: "pro_test_access_granted",
          description: "Acesso de teste ao Plano Pro liberado e comunicação automática processada por e-mail.",
          metadata: { access_until: accessUntil.toISOString(), email_delivery_status: delivery.status },
        }),
      });
    }
  }

  revalidatePath("/admin/usuarios"); revalidatePath("/admin/marketing"); revalidatePath("/conta"); revalidatePath("/conta/pro");
}
export async function grantGracePeriod(formData: FormData) {
  await assertAdminApi();
  const userId = String(formData.get("userId") ?? "");
  const days = Math.max(1, Math.min(30, Number(formData.get("days") ?? 5)));
  const rows = await supabaseRest<Array<{plan_code: string; current_period_end: string | null}>>(
    "user_subscriptions?select=plan_code,current_period_end&user_id=eq."+encodeURIComponent(userId)+"&order=updated_at.desc&limit=1");
  if (!rows[0] || rows[0].plan_code === "free") throw new Error("Usuário sem assinatura paga anterior.");
  const base = Math.max(Date.now(), Date.parse(rows[0].current_period_end ?? "") || 0);
  await supabaseRest("rpc/kivai_set_access", { method: "POST", body: JSON.stringify({ p_user_id: userId, p_plan: rows[0].plan_code, p_until: addDays(new Date(base), days).toISOString(), p_source: "admin_grace" }) });
  revalidatePath("/admin/usuarios"); revalidatePath("/conta");
}
export async function updateCustomerAccount(formData: FormData) {
  await assertAdminApi();
  const userId = String(formData.get("userId") ?? "");
  const plan = String(formData.get("planCode") ?? "free");
  const services = String(formData.get("contractedServices") ?? "").split(",").map(v => v.trim()).filter(Boolean).slice(0,30);
  const notes = String(formData.get("notes") ?? "").trim();
  if (!userId || !["free", "pro", "agency"].includes(plan)) throw new Error("Dados inválidos.");
  // Saving contact/notes does not replace a paid subscription with an admin grant.
  if (formData.get("changeAccess") !== "on") {
    await supabaseRest("user_profiles?user_id=eq."+encodeURIComponent(userId), {method:"PATCH",body:JSON.stringify({contracted_services:services,admin_notes:notes || null,updated_at:new Date().toISOString()})});
  } else {
    const date = String(formData.get("accessUntil") ?? "");
    if (plan !== "free" && !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Informe a validade do acesso administrativo.");
    await supabaseRest("rpc/kivai_set_access", {method:"POST",body:JSON.stringify({p_user_id:userId,p_plan:plan,p_until:plan==='free'?null:new Date(date+"T23:59:59-03:00").toISOString(),p_source:"admin_manual",p_services:services,p_notes:notes || null})});
  }
  for (const path of ["/admin/usuarios", "/admin/marketing", "/conta", "/conta/pro", "/conta/dados"]) revalidatePath(path);
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
  const communication = await supabaseRest<Array<{ id: string }>>("customer_communications", { method: "POST", body: JSON.stringify({ user_id: userId, event_key: `manual_${Date.now()}`, channel, status: "ready", subject: subject || null, message, scheduled_for: new Date().toISOString(), metadata: { source: "admin_manual", offer_type: offerType } }) });
  if (channel === "email" && communication[0]) await deliverCustomerEmail(communication[0].id);
  await supabaseRest("customer_marketing_events", { method: "POST", body: JSON.stringify({ user_id: userId, event_type: channel === "email" ? "remarketing_sent" : "remarketing_queued", description: channel === "email" ? "Remarketing por e-mail processado pelo Resend." : `Remarketing ${channel} preparado no Admin.`, metadata: { offer_type: offerType } }) });
  revalidatePath("/admin/marketing");
}

export async function queueSuggestedEmail(formData: FormData) {
  await assertAdminApi(); const userId = String(formData.get("userId") ?? ""); const subject = String(formData.get("subject") ?? "").trim(); const message = String(formData.get("message") ?? "").trim(); const flowKey = String(formData.get("flowKey") ?? "").trim();
  if (!userId || !subject || !message) throw new Error("Selecione um usuário e uma sugestão válida.");
  if (flowKey && !isCustomerMarketingFlowKey(flowKey)) throw new Error("Fluxo de marketing inválido.");
  const now = new Date().toISOString();
  const communication = await supabaseRest<Array<{ id: string }>>("customer_communications", { method: "POST", body: JSON.stringify({ user_id: userId, event_key: `suggestion_${flowKey || "manual"}_${Date.now()}`, channel: "email", status: "ready", subject, message, scheduled_for: now, metadata: { source: "admin_suggestion", flow_key: flowKey || null } }) });
  if (communication[0]) await deliverCustomerEmail(communication[0].id);
  await supabaseRest("customer_marketing_events", { method: "POST", body: JSON.stringify({ user_id: userId, event_type: "suggested_email_processed", description: `Sugestão de e-mail processada pelo Resend: ${subject}`, metadata: { flow_key: flowKey || null } }) });
  revalidatePath("/admin/marketing");
}

export async function enrollCustomerInFlow(formData: FormData) {
  await assertAdminApi(); const userId = String(formData.get("userId") ?? ""); const flowKey = String(formData.get("flowKey") ?? "");
  if (!userId || !isCustomerMarketingFlowKey(flowKey)) throw new Error("Selecione um usuário e um fluxo válidos.");
  const now = new Date().toISOString(); const existing = await supabaseRest<Array<{ id: string }>>(`customer_marketing_flow_enrollments?select=id&user_id=eq.${encodeURIComponent(userId)}&flow_key=eq.${encodeURIComponent(flowKey)}&limit=1`); const payload = { status: "active", enrolled_at: now, updated_at: now, metadata: { source: "admin_manual" } };
  if (existing[0]) await supabaseRest(`customer_marketing_flow_enrollments?id=eq.${encodeURIComponent(existing[0].id)}`, { method: "PATCH", body: JSON.stringify(payload) }); else await supabaseRest("customer_marketing_flow_enrollments", { method: "POST", body: JSON.stringify({ user_id: userId, flow_key: flowKey, ...payload }) });
  await supabaseRest("customer_marketing_events", { method: "POST", body: JSON.stringify({ user_id: userId, event_type: "marketing_flow_enrolled", description: `Usuário incluído manualmente no fluxo ${flowKey}.`, metadata: { flow_key: flowKey } }) });
  revalidatePath("/admin/marketing");
}
