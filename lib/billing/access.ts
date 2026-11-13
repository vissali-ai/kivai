import "server-only";
import { supabaseRest } from "@/lib/blog/supabase";
import type { PlanCode } from "@/lib/billing/plan-benefits";
export type AccessSubscription = { plan_code: PlanCode; status: string; current_period_start: string | null; current_period_end: string | null; billing_cycle: string | null; provider: string | null; test_access: boolean };
export async function getAccountAccess(userId: string) {
  const [plan, subscriptions, testOverrides] = await Promise.all([
    supabaseRest<PlanCode>("rpc/kivai_effective_plan", { method: "POST", body: JSON.stringify({ p_user_id: userId }) }),
    supabaseRest<AccessSubscription[]>(`user_subscriptions?select=plan_code,status,current_period_start,current_period_end,billing_cycle,provider,test_access&user_id=eq.${encodeURIComponent(userId)}&order=updated_at.desc,created_at.desc,id.desc`),
    userId === "c07f6709-a9a3-45c0-9a89-22076649fd37"
      ? supabaseRest<Array<{plan_code:PlanCode}>>(`kivai_test_plan_settings?select=plan_code&user_id=eq.${encodeURIComponent(userId)}&limit=1`)
      : Promise.resolve([] as Array<{plan_code:PlanCode}>),
  ]);
  const now = Date.now();
  const active = subscriptions.find(row => row.plan_code === plan && row.status === "active" && Date.parse(row.current_period_start ?? "") <= now && Date.parse(row.current_period_end ?? "") > now);
  return { plan, subscription: active ?? subscriptions[0] ?? null, testMode: testOverrides.length > 0 };
}
