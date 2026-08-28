import { NextResponse } from "next/server";
import { blogConfig } from "@/lib/blog/config";
import { supabaseRest } from "@/lib/blog/supabase";

type BillingCycle = "monthly" | "annual";
type PaidPlanCode = "pro" | "agency";
type AuthUser = { id: string; email?: string; user_metadata?: Record<string, unknown> };

type RequestRow = {
  id: string;
  user_id: string;
  plan_code: PaidPlanCode;
  billing_cycle: BillingCycle;
  status: string;
};

const paymentLinks: Record<PaidPlanCode, Record<BillingCycle, string>> = {
  pro: {
    monthly: "https://pay.sumup.com/b2c/QCQIWOP0",
    annual: "https://pay.sumup.com/b2c/Q4QPYZFA",
  },
  agency: {
    monthly: "https://pay.sumup.com/b2c/QYY1WQHF",
    annual: "https://pay.sumup.com/b2c/Q13MYNQA",
  },
};

const prices: Record<PaidPlanCode, Record<BillingCycle, number>> = {
  pro: { monthly: 19.9, annual: 199 },
  agency: { monthly: 59.9, annual: 599 },
};

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

function normalizePlan(value: unknown): PaidPlanCode | null {
  return value === "pro" || value === "agency" ? value : null;
}

function normalizeBilling(value: unknown): BillingCycle | null {
  return value === "monthly" || value === "annual" ? value : null;
}

export async function POST(request: Request) {
  try {
    const user = await authenticate(request);
    const body = await request.json() as { plan?: unknown; billing?: unknown };
    const plan = normalizePlan(body.plan);
    const billing = normalizeBilling(body.billing);
    if (!plan || !billing) return NextResponse.json({ error: "Plano ou periodicidade inválidos." }, { status: 400 });

    const existing = await supabaseRest<RequestRow[]>(`subscription_requests?select=id,user_id,plan_code,billing_cycle,status&user_id=eq.${encodeURIComponent(user.id)}&plan_code=eq.${plan}&billing_cycle=eq.${billing}&status=in.(awaiting_payment,payment_reported)&order=created_at.desc&limit=1`);
    if (existing[0]) {
      return NextResponse.json({ requestId: existing[0].id, paymentLink: paymentLinks[plan][billing], existing: true });
    }

    const profiles = await supabaseRest<Array<{ full_name: string | null }>>(`user_profiles?select=full_name&user_id=eq.${encodeURIComponent(user.id)}&limit=1`);
    const metadata = user.user_metadata ?? {};
    const fullName = profiles[0]?.full_name?.trim() || String(metadata.full_name ?? metadata.name ?? "").trim();
    const created = await supabaseRest<Array<{ id: string }>>("subscription_requests", {
      method: "POST",
      body: JSON.stringify({
        user_id: user.id,
        customer_email: user.email ?? "",
        customer_name: fullName || null,
        plan_code: plan,
        billing_cycle: billing,
        amount_brl: prices[plan][billing],
        payment_provider: "sumup",
        payment_link: paymentLinks[plan][billing],
        status: "awaiting_payment",
      }),
    });

    return NextResponse.json({ requestId: created[0]?.id, paymentLink: paymentLinks[plan][billing], existing: false });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN";
    if (message === "UNAUTHORIZED") return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });
    console.error("subscription_request_create_failed", message);
    return NextResponse.json({ error: "Não foi possível registrar a contratação." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await authenticate(request);
    const body = await request.json() as { requestId?: string };
    const requestId = String(body.requestId ?? "");
    if (!requestId) return NextResponse.json({ error: "Solicitação inválida." }, { status: 400 });

    const rows = await supabaseRest<RequestRow[]>(`subscription_requests?select=id,user_id,plan_code,billing_cycle,status&id=eq.${encodeURIComponent(requestId)}&user_id=eq.${encodeURIComponent(user.id)}&limit=1`);
    const row = rows[0];
    if (!row) return NextResponse.json({ error: "Solicitação não encontrada." }, { status: 404 });
    if (row.status === "payment_reported") return NextResponse.json({ ok: true });
    if (row.status !== "awaiting_payment") return NextResponse.json({ error: "Esta solicitação não pode mais ser alterada." }, { status: 409 });

    const now = new Date().toISOString();
    await supabaseRest(`subscription_requests?id=eq.${encodeURIComponent(row.id)}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "payment_reported", payment_reported_at: now, updated_at: now }),
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN";
    if (message === "UNAUTHORIZED") return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });
    console.error("subscription_request_report_failed", message);
    return NextResponse.json({ error: "Não foi possível informar o pagamento." }, { status: 500 });
  }
}
