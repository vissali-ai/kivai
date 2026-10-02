"use server";

import { revalidatePath } from "next/cache";
import { assertAdminApi } from "@/lib/blog/auth";
import { supabaseRest } from "@/lib/blog/supabase";

export async function deleteCommunicationLog(formData: FormData) {
  await assertAdminApi();
  const communicationId = String(formData.get("communicationId") ?? "").trim();
  if (!communicationId) throw new Error("Comunicação inválida.");

  await supabaseRest(`customer_communications?id=eq.${encodeURIComponent(communicationId)}`, {
    method: "DELETE",
  });

  revalidatePath("/admin/marketing");
}


export async function markInboxMessageRead(formData: FormData) {
  await assertAdminApi();
  const messageId = String(formData.get("messageId") ?? "").trim();
  if (!messageId) throw new Error("Mensagem inválida.");

  await supabaseRest(`customer_inbox_messages?id=eq.${encodeURIComponent(messageId)}`, {
    method: "PATCH",
    body: JSON.stringify({ is_read: true }),
  });

  revalidatePath("/admin/marketing/fila");
}

export async function deleteInboxMessage(formData: FormData) {
  await assertAdminApi();
  const messageId = String(formData.get("messageId") ?? "").trim();
  if (!messageId) throw new Error("Mensagem inválida.");

  await supabaseRest(`customer_inbox_messages?id=eq.${encodeURIComponent(messageId)}`, {
    method: "DELETE",
  });

  revalidatePath("/admin/marketing/fila");
}
