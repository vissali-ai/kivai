import { NextResponse } from "next/server";
import { authenticateBillingUser, confirmHostedCheckout } from "@/lib/billing/sumup";

export async function POST(request: Request) {
  try {
    const user = await authenticateBillingUser(request);
    const body = await request.json() as { reference?: string };
    if (!body.reference) return NextResponse.json({ error: "Referência de pagamento ausente." }, { status: 400 });
    return NextResponse.json(await confirmHostedCheckout(user, body.reference));
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN";
    if (message === "UNAUTHORIZED") return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });
    console.error("sumup_confirm_failed", message);
    return NextResponse.json({ error: "Não foi possível confirmar o pagamento agora." }, { status: 502 });
  }
}
