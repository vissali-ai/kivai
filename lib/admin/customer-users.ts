import "server-only";

import { blogConfig } from "@/lib/blog/config";
import { supabaseRest } from "@/lib/blog/supabase";

export type AdminCustomer = {
  id: string; email: string; createdAt: string; lastSignInAt: string | null; fullName: string | null; phone: string | null;
  planCode: "free" | "pro" | "agency"; lifecycleStage: string; customerScore: number; marketingTags: string[];
  subscriptionStatus: string | null; billingCycle: "monthly" | "annual" | null; periodEnd: string | null; testAccess: boolean;
  authProvider: string; contractedServices: string[]; adminNotes: string | null;
};

type AuthUser = { id: string; email?: string; created_at: string; last_sign_in_at?: string | null; app_metadata?: { provider?: string; providers?: string[] } };
type AuthUsersResponse = { users?: AuthUser[] };
type ProfileRow = { user_id: string; full_name: string | null; phone: string | null; plan_code: "free" | "pro" | "agency"; lifecycle_stage: string; customer_score: number; marketing_tags: string[] | null; contracted_services: string[] | null; admin_notes: string | null };
type SubscriptionRow = { user_id: string; plan_code: "free" | "pro" | "agency"; current_period_start: string | null; status: string; billing_cycle: "monthly" | "annual" | null; current_period_end: string | null; test_access: boolean };

async function authAdminFetch(path: string, init: RequestInit = {}) {
  const response = await fetch(`${blogConfig.supabaseUrl}/auth/v1/admin/${path}`, { ...init, cache: "no-store", headers: { apikey: blogConfig.serviceRoleKey, Authorization: `Bearer ${blogConfig.serviceRoleKey}`, "Content-Type": "application/json", ...init.headers } });
  if (!response.ok) throw new Error(`Supabase Auth (${response.status}): ${await response.text()}`);
  return response;
}

async function listAuthUsers(): Promise<AuthUser[]> {
  const users: AuthUser[] = [];
  for (let page = 1; ; page += 1) {
    const response = await authAdminFetch(`users?page=${page}&per_page=1000`);
    const batch = ((await response.json()) as AuthUsersResponse).users ?? [];
    users.push(...batch);
    if (batch.length < 1000) return users;
  }
}

async function listAllRows<T>(path: string): Promise<T[]> {
  const rows: T[] = [];
  for (let offset = 0; ; offset += 1000) {
    const batch = await supabaseRest<T[]>(`${path}&limit=1000&offset=${offset}`);
    rows.push(...batch);
    if (batch.length < 1000) return rows;
  }
}

function hasCurrentAccess(row: SubscriptionRow, now: number) {
  return row.status === "active" && Date.parse(row.current_period_start ?? "") <= now && Date.parse(row.current_period_end ?? "") > now;
}

export async function listAdminCustomers(): Promise<AdminCustomer[]> {
  const [users, profiles, subscriptions] = await Promise.all([
    listAuthUsers(),
    listAllRows<ProfileRow>("user_profiles?select=user_id,full_name,phone,plan_code,lifecycle_stage,customer_score,marketing_tags,contracted_services,admin_notes&order=user_id.asc"),
    listAllRows<SubscriptionRow>("user_subscriptions?select=user_id,plan_code,status,billing_cycle,current_period_start,current_period_end,test_access&order=updated_at.desc,created_at.desc,id.desc"),
  ]);
  const profileMap = new Map(profiles.map((row) => [row.user_id, row]));
  const subscriptionMap = new Map<string, SubscriptionRow>();
  const now = Date.now();
  for (const row of subscriptions) {
    const current = subscriptionMap.get(row.user_id);
    if (!current || (!hasCurrentAccess(current, now) && hasCurrentAccess(row, now))) subscriptionMap.set(row.user_id, row);
  }
  return users.map((user) => {
    const profile = profileMap.get(user.id); const subscription = subscriptionMap.get(user.id);
    const providers = user.app_metadata?.providers ?? (user.app_metadata?.provider ? [user.app_metadata.provider] : []);
    return { id: user.id, email: user.email ?? "", createdAt: user.created_at, lastSignInAt: user.last_sign_in_at ?? null, fullName: profile?.full_name ?? null, phone: profile?.phone ?? null, planCode: subscription && hasCurrentAccess(subscription, now) ? subscription.plan_code : "free", lifecycleStage: profile?.lifecycle_stage ?? "free", customerScore: profile?.customer_score ?? 0, marketingTags: profile?.marketing_tags ?? [], subscriptionStatus: subscription?.status ?? null, billingCycle: subscription?.billing_cycle ?? null, periodEnd: subscription?.current_period_end ?? null, testAccess: Boolean(subscription?.test_access), authProvider: providers.includes("email") ? "email" : providers[0] ?? "unknown", contractedServices: profile?.contracted_services ?? [], adminNotes: profile?.admin_notes ?? null };
  });
}

export async function listRegisteredEmailUsers() {
  const users = await listAuthUsers();
  return users
    .filter((user) => Boolean(user.email?.trim()))
    .map((user) => ({ id: user.id, email: user.email!.trim().toLowerCase() }));
}

export async function listNewsletterRecipients() {
  const [users, profiles, preferences] = await Promise.all([
    listRegisteredEmailUsers(),
    listAllRows<{ user_id: string; full_name: string | null }>("user_profiles?select=user_id,full_name&order=user_id.asc"),
    listAllRows<{ user_id: string; marketing_opt_out: boolean }>("customer_email_preferences?select=user_id,marketing_opt_out&order=user_id.asc"),
  ]);
  const profileMap = new Map(profiles.map((row) => [row.user_id, row]));
  const preferenceMap = new Map(preferences.map((row) => [row.user_id, row.marketing_opt_out]));
  return users
    .map((user) => ({
      ...user,
      name: profileMap.get(user.id)?.full_name ?? null,
      marketingOptOut: preferenceMap.get(user.id) ?? false,
    }))
    .filter((user) => !user.marketingOptOut);
}

export async function deleteAuthCustomer(userId: string) { await authAdminFetch(`users/${encodeURIComponent(userId)}`, { method: "DELETE" }); }
