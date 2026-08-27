import { NextResponse } from "next/server";
import { authenticateBillingUser, completeRecurringSetup } from "@/lib/billing/sumup";

export async function POST(request: Request) {
  try {
    const user = await authenticateBillingUser(request);
    const body = await request.json() as { reference?: string };
    if (!body.reference) return NextResponse.json({ error: "Referência de pagamento ausente." }, { status: 400 });
    return NextResponse.json(await completeRecurringSetup(user, body.reference));
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN";
    if (message === "UNAUTHORIZED") return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });
    if (["TOKEN_NOT_READY", "PAYMENT_NOT_CONFIRMED"].includes(message)) return NextResponse.json({ error: "A autorização foi recebida, mas o pagamento ainda não foi confirmado. Aguarde alguns segundos e tente novamente." }, { status: 409 });
    console.error("sumup_complete_recurring_failed", message);
    return NextResponse.json({ error: "Não foi possível confirmar a assinatura agora." }, { status: 502 });
  }
}
