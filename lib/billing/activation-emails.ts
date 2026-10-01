import "server-only";
import { supabaseRest } from "@/lib/blog/supabase";
import { deliverCustomerEmail } from "@/lib/marketing/email-delivery";
export async function retryActivationEmails() {
  const rows = await supabaseRest<Array<{ id: string; status: string }>>("customer_communications?select=id,status&metadata->>kind=eq.subscription_activation&status=in.(ready,failed)&order=created_at.asc&limit=50");
  let sent = 0;
  for (const row of rows) {
    try {
      if (row.status === "failed") await supabaseRest(`customer_communications?id=eq.${row.id}&status=eq.failed`, { method: "PATCH", body: JSON.stringify({ status: "ready" }) });
      const result = await deliverCustomerEmail(row.id);
      if (result.status === "sent") sent++;
    } catch { console.error("activation_email_retry_failed", row.id); }
  }
  return { checked: rows.length, sent };
}
