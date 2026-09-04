import { NextResponse } from "next/server";
import { createAdminSession, adminCookieOptions, TRAFEGO_ADMIN_COOKIE } from "@/lib/trafego/admin";

export async function POST(request: Request) {
  const password = process.env.TRAFEGO_ADMIN_PASSWORD;
  const sessionSecret = process.env.TRAFEGO_ADMIN_SESSION_SECRET;
  if (!password || !sessionSecret) {
    return NextResponse.json({ error: "Painel de tráfego não configurado." }, { status: 503 });
  }

  try {
    const body = (await request.json()) as { password?: unknown };
    if (typeof body.password !== "string" || body.password.length === 0 || body.password !== password) {
      return NextResponse.json({ error: "Senha inválida." }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(TRAFEGO_ADMIN_COOKIE, createAdminSession(), adminCookieOptions());
    return response;
  } catch {
    return NextResponse.json({ error: "Não foi possível autenticar." }, { status: 400 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(TRAFEGO_ADMIN_COOKIE, "", { ...adminCookieOptions(), maxAge: 0 });
  return response;
}
