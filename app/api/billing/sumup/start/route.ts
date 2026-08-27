import { NextResponse } from "next/server";
import { authenticateBillingUser, startCheckout, type BillingCycle } from "@/lib/billing/sumup";

export async function POST(request: Request) {
  try {
    const user = await authenticateBillingUser(request);
    const body = await request.json() as { plan?: string; billing?: string };
    const billing = body.billing === "annual" ? "annual" : body.billing === "monthly" ? "monthly" : null;
    if (!billing) return NextResponse.json({ error: "Periodicidade inválida." }, { status: 400 });
    const origin = new URL(request.url).origin;
    return NextResponse.json(await startCheckout({ user, planCode: body.plan ?? "", billingCycle: billing as BillingCycle, origin }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN";
    if (message === "UNAUTHORIZED") return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });
    if (["INVALID_PLAN", "INVALID_AMOUNT"].includes(message)) return NextResponse.json({ error: "Plano ou valor inválido." }, { status: 400 });
    if (message === "PAYMENT_UNAVAILABLE") return NextResponse.json({ error: "Não foi possível iniciar o pagamento agora. Tente novamente em instantes." }, { status: 503 });
    console.error("sumup_start_failed", message);
    return NextResponse.json({ error: "Não foi possível iniciar o pagamento. Tente novamente." }, { status: 502 });
  }
}
