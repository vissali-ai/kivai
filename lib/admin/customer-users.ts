import "server-only";

import { blogConfig } from "@/lib/blog/config";
import { supabaseRest } from "@/lib/blog/supabase";

export type AdminCustomer = {
  id: string;
  email: string;
  createdAt: string;
  lastSignInAt: string | null;
  fullName: string | null;
  phone: string | null;
  planCode: "free" | "pro" | "agency";
  lifecycleStage: string;
  customerScore: number;
  marketingTags: string[];
  subscriptionStatus: string | null;
  billingCycle: "monthly" | "annual" | null;
  periodEnd: string | null;
  testAccess: boolean;
};

type AuthUser = {
  id: string;
  email?: string;
  created_at: string;
  last_sign_in_at?: string | null;
};

type AuthUsersResponse = { users?: AuthUser[] };

type ProfileRow = {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  plan_code: "free" | "pro" | "agency";
  lifecycle_stage: string;
  customer_score: number;
  marketing_tags: string[] | null;
};

type SubscriptionRow = {
  user_id: string;
  status: string;
  billing_cycle: "monthly" | "annual" | null;
  current_period_end: string | null;
  test_access: boolean;
};

async function authAdminFetch(path: string, init: RequestInit = {}) {
  const response = await fetch(`${blogConfig.supabaseUrl}/auth/v1/admin/${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      apikey: blogConfig.serviceRoleKey,
      Authorization: `Bearer ${blogConfig.serviceRoleKey}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  if (!response.ok) throw new Error(`Supabase Auth (${response.status}): ${await response.text()}`);
  return response;
}

export async function listAdminCustomers(): Promise<AdminCustomer[]> {
  const auth = await authAdminFetch("users?page=1&per_page=1000");
  const authData = await auth.json() as AuthUsersResponse;
  const users = authData.users ?? [];
  const [profiles, subscriptions] = await Promise.all([
    supabaseRest<ProfileRow[]>("user_profiles?select=user_id,full_name,phone,plan_code,lifecycle_stage,customer_score,marketing_tags"),
    supabaseRest<SubscriptionRow[]>("user_subscriptions?select=user_id,status,billing_cycle,current_period_end,test_access&order=created_at.desc"),
  ]);
  const profileMap = new Map(profiles.map((row) => [row.user_id, row]));
  const subscriptionMap = new Map<string, SubscriptionRow>();
  for (const row of subscriptions) if (!subscriptionMap.has(row.user_id)) subscriptionMap.set(row.user_id, row);
  return users.map((user) => {
    const profile = profileMap.get(user.id);
    const subscription = subscriptionMap.get(user.id);
    return {
      id: user.id,
      email: user.email ?? "",
      createdAt: user.created_at,
      lastSignInAt: user.last_sign_in_at ?? null,
      fullName: profile?.full_name ?? null,
      phone: profile?.phone ?? null,
      planCode: profile?.plan_code ?? "free",
      lifecycleStage: profile?.lifecycle_stage ?? "lead",
      customerScore: profile?.customer_score ?? 0,
      marketingTags: profile?.marketing_tags ?? [],
      subscriptionStatus: subscription?.status ?? null,
      billingCycle: subscription?.billing_cycle ?? null,
      periodEnd: subscription?.current_period_end ?? null,
      testAccess: Boolean(subscription?.test_access),
    };
  });
}

export async function deleteAuthCustomer(userId: string) {
  await authAdminFetch(`users/${encodeURIComponent(userId)}`, { method: "DELETE" });
}
