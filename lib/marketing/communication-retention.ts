import "server-only";

import { supabaseRest } from "@/lib/blog/supabase";

export async function cleanupExpiredCommunicationLogs() {
  const cutoff = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString();
  const expired = await supabaseRest<Array<{ id: string }>>(
    `customer_communications?select=id&created_at=lt.${encodeURIComponent(cutoff)}&limit=1000`,
  );

  if (!expired.length) {
    return { deleted: 0, cutoff };
  }

  await supabaseRest(
    `customer_communications?created_at=lt.${encodeURIComponent(cutoff)}`,
    { method: "DELETE" },
  );

  return { deleted: expired.length, cutoff };
}
