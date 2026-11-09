import "server-only";

import { blogConfig } from "@/lib/blog/config";

export type AuthenticatedBillingUser = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
};

/**
 * Autentica usuários Kivai por token Supabase Auth.
 * Independente de qualquer gateway de pagamento.
 */
export async function authenticateBillingUser(request: Request): Promise<AuthenticatedBillingUser> {
  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token || !blogConfig.supabaseUrl || !blogConfig.serviceRoleKey) throw new Error("UNAUTHORIZED");

  const response = await fetch(`${blogConfig.supabaseUrl}/auth/v1/user`, {
    headers: { apikey: blogConfig.serviceRoleKey, Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!response.ok) throw new Error("UNAUTHORIZED");
  const user = await response.json() as AuthenticatedBillingUser;
  if (!user.id) throw new Error("UNAUTHORIZED");
  return user;
}
