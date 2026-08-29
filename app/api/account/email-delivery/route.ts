import { NextResponse } from "next/server";
import { blogConfig } from "@/lib/blog/config";
import { deliverPendingAccountWelcome } from "@/lib/marketing/email-delivery";

type AuthUser = { id: string };

async function authenticate(request: Request): Promise<AuthUser> {
  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token || !blogConfig.supabaseUrl || !blogConfig.serviceRoleKey) throw new Error("UNAUTHORIZED");
  const response = await fetch(`${blogConfig.supabaseUrl}/auth/v1/user`, {
    headers: { apikey: blogConfig.serviceRoleKey, Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!response.ok) throw new Error("UNAUTHORIZED");
  const user = await response.json() as AuthUser;
  if (!user.id) throw new Error("UNAUTHORIZED");
  return user;
}

export async function POST(request: Request) {
  try {
    const user = await authenticate(request);
    const result = await deliverPendingAccountWelcome(user.id);
    return NextResponse.json({ ok: result.status !== "failed", status: result.status }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN";
    if (message === "UNAUTHORIZED") return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });
    console.error("account_welcome_delivery_failed", message);
    return NextResponse.json({ error: "Não foi possível processar o e-mail de boas-vindas." }, { status: 500 });
  }
}
