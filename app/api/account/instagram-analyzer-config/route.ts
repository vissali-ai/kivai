import { NextResponse } from "next/server";
import { blogConfig } from "@/lib/blog/config";
import { getAccountAccess } from "@/lib/billing/access";
import { getInstagramAnalyzerConfig } from "@/lib/instagram-follow-analyzer-config";
import { getInstagramAnalyzerPlanVariants } from "@/lib/instagram-analyzer-plan-variants";

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
  const user = (await response.json()) as AuthUser;
  if (!user.id) throw new Error("UNAUTHORIZED");
  return user;
}

export async function GET(request: Request) {
  try {
    const user = await authenticate(request);
    const { plan } = await getAccountAccess(user.id);
    if (plan !== "pro" && plan !== "agency") {
      return NextResponse.json({ error: "Conteúdo exclusivo de plano pago." }, { status: 403 });
    }

    const base = await getInstagramAnalyzerConfig();
    const variants = await getInstagramAnalyzerPlanVariants(base);
    const config = plan === "agency" ? variants.agency : variants.pro;

    return NextResponse.json({ plan, config }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });
    }
    console.error("instagram_paid_config_failed", message);
    return NextResponse.json({ error: "Não foi possível carregar a experiência do seu plano." }, { status: 500 });
  }
}
