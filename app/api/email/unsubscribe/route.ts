import { NextResponse } from "next/server";
import { supabaseRest } from "@/lib/blog/supabase";

type PreferenceRow = {
  user_id: string;
  marketing_opt_out: boolean;
  unsubscribe_token: string;
};

async function unsubscribe(token: string) {
  if (!token) return false;
  const rows = await supabaseRest<PreferenceRow[]>(
    `customer_email_preferences?select=user_id,marketing_opt_out,unsubscribe_token&unsubscribe_token=eq.${encodeURIComponent(token)}&limit=1`
  );
  const row = rows[0];
  if (!row) return false;

  const now = new Date().toISOString();
  await supabaseRest(`customer_email_preferences?user_id=eq.${encodeURIComponent(row.user_id)}`, {
    method: "PATCH",
    body: JSON.stringify({ marketing_opt_out: true, unsubscribed_at: now, updated_at: now }),
  });

  if (!row.marketing_opt_out) {
    await supabaseRest("customer_marketing_events", {
      method: "POST",
      body: JSON.stringify({
        user_id: row.user_id,
        event_type: "marketing_email_unsubscribed",
        description: "Usuário optou por não receber mais e-mails de marketing.",
        metadata: { source: "one_click_unsubscribe" },
      }),
    });
  }
  return true;
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token")?.trim() ?? "";
  const ok = await unsubscribe(token);
  return new NextResponse(ok ? "Unsubscribed" : "Invalid token", { status: ok ? 200 : 404 });
}
