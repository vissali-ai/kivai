import { authenticateBillingUser } from "@/lib/billing/sumup";
import { createCreditCheckout } from "@/lib/ai/credit-purchases";
import { aiCreditSalesEnabled, isAiCreditPackCode } from "@/lib/ai/packs";
export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  let userId: string;
  try { userId = (await authenticateBillingUser(request)).id; }
  catch { return Response.json({ error: "Faça login para comprar créditos." }, { status: 401 }); }
  if (!aiCreditSalesEnabled()) {
    return Response.json({ error: "A compra de créditos estará disponível em breve." }, { status: 503 });
  }
  const payload = await request.json().catch(() => null) as { pack?: unknown } | null;
  if (!isAiCreditPackCode(payload?.pack)) {
    return Response.json({ error: "Pacote inválido." }, { status: 400 });
  }
  try {
    const result = await createCreditCheckout(userId, payload.pack);
    return Response.json(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    console.error("[kivai-ai] Could not create credit checkout");
    return Response.json({ error: "Não foi possível iniciar o pagamento agora." }, { status: 503 });
  }
}
