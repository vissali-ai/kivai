import { NextResponse } from "next/server";
import { blogConfig } from "@/lib/blog/config";
import { supabaseRest } from "@/lib/blog/supabase";

type AuthUser = { id: string };

async function authenticate(request: Request): Promise<AuthUser> {
  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token) throw new Error("UNAUTHORIZED");
  const response = await fetch(`${blogConfig.supabaseUrl}/auth/v1/user`, { headers: { apikey: blogConfig.serviceRoleKey, Authorization: `Bearer ${token}` }, cache: "no-store" });
  if (!response.ok) throw new Error("UNAUTHORIZED");
  const user = await response.json() as AuthUser;
  if (!user.id) throw new Error("UNAUTHORIZED");
  return user;
}

function normalizeBrazilWhatsapp(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) return digits;
  return "";
}

export async function POST(request: Request) {
  try {
    const user = await authenticate(request);
    const body = await request.json().catch(() => ({})) as { phone?: string };
    const phone = normalizeBrazilWhatsapp(String(body.phone ?? ""));
    if (!phone) return NextResponse.json({ error: "WhatsApp inválido." }, { status: 400 });
    await supabaseRest(`user_profiles?user_id=eq.${encodeURIComponent(user.id)}`, { method: "PATCH", body: JSON.stringify({ phone, updated_at: new Date().toISOString() }) });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });
    return NextResponse.json({ error: "Não foi possível salvar o WhatsApp." }, { status: 500 });
  }
}
