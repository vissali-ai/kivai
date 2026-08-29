import { NextResponse } from "next/server";
import { blogConfig } from "@/lib/blog/config";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

type AuthUser = { email?: string; app_metadata?: { provider?: string; providers?: string[] } };
type AuthUsersResponse = { users?: AuthUser[] };

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: unknown };
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email || !blogConfig.supabaseUrl || !blogConfig.serviceRoleKey) {
      return NextResponse.json({ ok: true });
    }

    const usersResponse = await fetch(`${blogConfig.supabaseUrl}/auth/v1/admin/users?page=1&per_page=1000`, {
      headers: { apikey: blogConfig.serviceRoleKey, Authorization: `Bearer ${blogConfig.serviceRoleKey}` },
      cache: "no-store",
    });
    if (!usersResponse.ok) return NextResponse.json({ ok: true });
    const users = (await usersResponse.json()) as AuthUsersResponse;
    const user = users.users?.find((item) => item.email?.toLowerCase() === email);
    const providers = user?.app_metadata?.providers ?? (user?.app_metadata?.provider ? [user.app_metadata.provider] : []);

    if (user && providers.includes("email")) {
      const origin = new URL(request.url).origin;
      await fetch(`${blogConfig.supabaseUrl}/auth/v1/recover?redirect_to=${encodeURIComponent(`${origin}/conta/redefinir-senha`)}`, {
        method: "POST",
        headers: { apikey: PUBLIC_KEY || blogConfig.serviceRoleKey, "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    }

    return NextResponse.json({ ok: true, message: "Se esta conta usa acesso por e-mail e senha, enviaremos as instruções para o endereço cadastrado." });
  } catch {
    return NextResponse.json({ ok: true, message: "Se esta conta usa acesso por e-mail e senha, enviaremos as instruções para o endereço cadastrado." });
  }
}
