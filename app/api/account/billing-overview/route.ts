import { authenticateBillingUser } from "@/lib/auth/authenticated-billing-user";
import { getAccountAccess } from "@/lib/billing/access";
import { supabaseRest } from "@/lib/blog/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CreditOrder = {
  id: string;
  pack_code: string;
  credits: number;
  amount_cents: number;
  status: string;
  created_at: string;
  paid_at: string | null;
};
type PlanRequest = {
  id: string;
  plan_code: string;
  billing_cycle: string;
  status: string;
  created_at: string;
};
type ChangeRequest = {
  id: string;
  action: string;
  state: string;
  requested_at: string;
  target_plan: string;
  target_cycle: string | null;
};
export async function GET(request: Request) {
  let userId: string;
  try {
    userId = (await authenticateBillingUser(request)).id;
  } catch {
    return Response.json({ error: "Faça login para consultar suas cobranças." }, {
      status: 401, headers: { "Cache-Control": "private, no-store" },
    });
  }
  try {
    const [access, orders, requests, changes] = await Promise.all([
      getAccountAccess(userId),
      supabaseRest<CreditOrder[]>(`ai_credit_orders?select=id,pack_code,credits,amount_cents,status,created_at,paid_at&user_id=eq.${encodeURIComponent(userId)}&order=created_at.desc&limit=20`),
      supabaseRest<PlanRequest[]>(`subscription_requests?select=id,plan_code,billing_cycle,status,created_at&user_id=eq.${encodeURIComponent(userId)}&order=created_at.desc&limit=10`),
      supabaseRest<ChangeRequest[]>(`kivai_subscription_change_requests?select=id,action,state,requested_at,target_plan,target_cycle&user_id=eq.${encodeURIComponent(userId)}&order=requested_at.desc&limit=10`),
    ]);
    return Response.json({
      plan: access.plan,
      subscription: access.subscription,
      testMode: access.testMode,
      creditOrders: orders,
      planRequests: requests,
      changeRequests: changes,
      recurringManagementReady: false,
      servicesBillingReady: false,
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    console.error("billing_overview_read_failed");
    return Response.json({ error: "Não foi possível carregar suas cobranças." }, {
      status: 503, headers: { "Cache-Control": "private, no-store" },
    });
  }
}
