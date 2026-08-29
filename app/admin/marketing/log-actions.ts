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
