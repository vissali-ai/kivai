"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, adminSessionMaxAge, createSessionToken, credentialsAreConfigured, validateCredentials } from "@/lib/blog/auth";

export type LoginState = { error: string; redirectTo: string };

export async function loginAction(_state: LoginState, formData: FormData): Promise<LoginState> {
  if (!credentialsAreConfigured()) return { error: "Configure ADMIN_EMAIL, ADMIN_PASSWORD e ADMIN_AUTH_SECRET no ambiente.", redirectTo: "" };
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!validateCredentials(email, password)) return { error: "E-mail ou senha inválidos.", redirectTo: "" };
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, createSessionToken(), {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax",
    path: "/", maxAge: adminSessionMaxAge,
  });
  const next = String(formData.get("next") ?? "/admin/blog");
  return { error: "", redirectTo: next.startsWith("/admin/") ? next : "/admin/blog" };
}

export async function logoutAction() {
  (await cookies()).delete(ADMIN_COOKIE);
  redirect("/login");
}
