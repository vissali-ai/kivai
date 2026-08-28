import "server-only";

import { supabaseRest } from "@/lib/blog/supabase";

type SubscriptionRow = {
  id: string;
  user_id: string;
  current_period_end: string | null;
};

export async function expireDueExternalSubscriptions() {
  const now = new Date();
  const rows = await supabaseRest<SubscriptionRow[]>(`user_subscriptions?select=id,user_id,current_period_end&provider=eq.sumup_external&status=eq.active&current_period_end=lte.${encodeURIComponent(now.toISOString())}&limit=200`);
  const expired: string[] = [];

  for (const subscription of rows) {
    await supabaseRest(`user_subscriptions?id=eq.${encodeURIComponent(subscription.id)}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "past_due", updated_at: now.toISOString() }),
    });
    await supabaseRest(`user_profiles?user_id=eq.${encodeURIComponent(subscription.user_id)}`, {
      method: "PATCH",
      body: JSON.stringify({ plan_code: "free", updated_at: now.toISOString() }),
    });
    expired.push(subscription.id);
  }

  return { checkedAt: now.toISOString(), expiredCount: expired.length, expired };
}
