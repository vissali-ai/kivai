"use server";
import { revalidatePath } from "next/cache";
import { assertAdminApi } from "@/lib/blog/auth";
import { supabaseRest } from "@/lib/blog/supabase";
import { deliverCustomerEmail } from "@/lib/marketing/email-delivery";

export async function confirmSubscriptionPayment(formData: FormData) {
  await assertAdminApi();
  const requestId = String(formData.get("requestId") ?? "");
  if (!requestId) throw new Error("Solicitação inválida.");
  const result = await supabaseRest<{ alreadyActive: boolean; communicationId?: string }>("rpc/kivai_confirm_payment", { method: "POST", body: JSON.stringify({ p_request_id: requestId }) });
  // Activation and outbox are atomic; email failure never reverses activation.
  if (result.communicationId) {
    try { await deliverCustomerEmail(result.communicationId); }
    catch { console.error("subscription_email_pending", result.communicationId); }
  }
  for (const path of ["/admin/assinaturas", "/admin/usuarios", "/admin/marketing", "/conta", "/conta/pro"]) revalidatePath(path);
}
export async function rejectSubscriptionPayment(formData: FormData) {
  await assertAdminApi();
  const requestId = String(formData.get("requestId") ?? "");
  if (!requestId) throw new Error("Solicitação inválida.");
  await supabaseRest(`subscription_requests?id=eq.${encodeURIComponent(requestId)}&status=in.(awaiting_payment,payment_reported)`, { method: "PATCH", body: JSON.stringify({ status: "rejected", updated_at: new Date().toISOString() }) });
  revalidatePath("/admin/assinaturas");
}
