"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertAdminApi } from "@/lib/blog/auth";
import { supabaseRest } from "@/lib/blog/supabase";

function revalidateCommunicationQueue() {
  revalidatePath("/admin/marketing");
  revalidatePath("/admin/marketing/fila");
  revalidatePath("/admin/marketing/fila/entrada");
  revalidatePath("/admin/marketing/fila/enviados");
  revalidatePath("/admin/marketing/fila/descartados");
}

export async function discardCommunicationLog(formData: FormData) {
  await assertAdminApi();
  const communicationId = String(formData.get("communicationId") ?? "").trim();
  if (!communicationId) throw new Error("Comunicação inválida.");

  await supabaseRest(`customer_communications?id=eq.${encodeURIComponent(communicationId)}`, {
    method: "PATCH",
    body: JSON.stringify({ discarded_at: new Date().toISOString() }),
  });

  revalidateCommunicationQueue();
}

export async function deleteCommunicationLog(formData: FormData) {
  await assertAdminApi();
  const communicationId = String(formData.get("communicationId") ?? "").trim();
  if (!communicationId) throw new Error("Comunicação inválida.");

  await supabaseRest(`customer_communications?id=eq.${encodeURIComponent(communicationId)}`, {
    method: "DELETE",
  });

  revalidateCommunicationQueue();
}

export async function restoreCommunicationLog(formData: FormData) {
  await assertAdminApi();
  const communicationId = String(formData.get("communicationId") ?? "").trim();
  if (!communicationId) throw new Error("Comunicação inválida.");

  await supabaseRest(`customer_communications?id=eq.${encodeURIComponent(communicationId)}`, {
    method: "PATCH",
    body: JSON.stringify({ discarded_at: null }),
  });

  revalidateCommunicationQueue();
}

export async function markInboxMessageRead(formData: FormData) {
  await assertAdminApi();
  const messageId = String(formData.get("messageId") ?? "").trim();
  if (!messageId) throw new Error("Mensagem inválida.");

  await supabaseRest(`customer_inbox_messages?id=eq.${encodeURIComponent(messageId)}`, {
    method: "PATCH",
    body: JSON.stringify({ is_read: true }),
  });

  revalidateCommunicationQueue();
}

export async function discardInboxMessage(formData: FormData) {
  await assertAdminApi();
  const messageId = String(formData.get("messageId") ?? "").trim();
  if (!messageId) throw new Error("Mensagem inválida.");

  await supabaseRest(`customer_inbox_messages?id=eq.${encodeURIComponent(messageId)}`, {
    method: "PATCH",
    body: JSON.stringify({ discarded_at: new Date().toISOString(), is_read: true }),
  });

  revalidateCommunicationQueue();
  redirect("/admin/marketing/fila/entrada");
}

export async function deleteInboxMessage(formData: FormData) {
  await assertAdminApi();
  const messageId = String(formData.get("messageId") ?? "").trim();
  if (!messageId) throw new Error("Mensagem inválida.");

  await supabaseRest(`customer_inbox_messages?id=eq.${encodeURIComponent(messageId)}`, {
    method: "DELETE",
  });

  revalidateCommunicationQueue();
}

export async function restoreInboxMessage(formData: FormData) {
  await assertAdminApi();
  const messageId = String(formData.get("messageId") ?? "").trim();
  if (!messageId) throw new Error("Mensagem inválida.");

  await supabaseRest(`customer_inbox_messages?id=eq.${encodeURIComponent(messageId)}`, {
    method: "PATCH",
    body: JSON.stringify({ discarded_at: null }),
  });

  revalidateCommunicationQueue();
}
