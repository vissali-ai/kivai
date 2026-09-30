"use server";

import { revalidatePath } from "next/cache";
import { assertAdminApi } from "@/lib/blog/auth";
import { supabaseRest } from "@/lib/blog/supabase";
import { activateSubscriptionRequest } from "@/lib/billing/activate-subscription";

export async function confirmSubscriptionPayment(formData: FormData) {
  await assertAdminApi();
  const requestId = String(formData.get("requestId") ?? "");
  if (!requestId) throw new Error("Solicitação inválida.");
  await activateSubscriptionRequest(requestId);
  revalidatePath("/admin/assinaturas");
  revalidatePath("/admin/usuarios");
  revalidatePath("/admin/marketing");
  revalidatePath("/conta");
  revalidatePath("/conta/dados");
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
