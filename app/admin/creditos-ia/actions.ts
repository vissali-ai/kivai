"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { assertAdminApi } from "@/lib/blog/auth";
import { blogConfig } from "@/lib/blog/config";
import { listAdminCustomers } from "@/lib/admin/customer-users";
import { supabaseRest } from "@/lib/blog/supabase";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function adjustCustomerAiCredits(formData: FormData) {
  await assertAdminApi();
  const userId = String(formData.get("userId") ?? "").trim();
  const kind = String(formData.get("kind") ?? "");
  const raw = String(formData.get("quantity") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  const confirmation = String(formData.get("confirmation") ?? "");
  const operationId = String(formData.get("operationId") ?? "");

  if (!UUID.test(userId) || !UUID.test(operationId) ||
      !["grant", "deduct"].includes(kind) ||
      !/^[1-9][0-9]{0,4}$/.test(raw) ||
      Number(raw) > 10000 ||
      reason.length < 10 || reason.length > 500 ||
      confirmation !== "CONFIRMAR") {
    throw new Error("Informe usuário, quantidade, justificativa e confirmação válidos.");
  }
  // Prevent granting credits to unrelated or deleted account IDs.
  const customers = await listAdminCustomers();
  if (!customers.some(customer => customer.id === userId)) {
    throw new Error("Usuário não encontrado no Kivai.");
  }
  const amount = Number(raw) * (kind === "grant" ? 1 : -1);
  const result = await supabaseRest<{ applied: boolean; already_applied: boolean; balance_after: number }>(
    "rpc/kivai_admin_adjust_ai_credits", {
      method: "POST",
      body: JSON.stringify({
        p_operation_id: operationId,
        p_user_id: userId,
        p_delta: amount,
        p_reason: reason,
        p_operator_email: blogConfig.adminEmail,
      }),
    });
  if (!result || (!result.applied && !result.already_applied)) {
    throw new Error("Não foi possível ajustar os créditos. Nenhum saldo foi confirmado.");
  }
  revalidatePath("/admin/creditos-ia");
  revalidatePath("/creditos");
}
