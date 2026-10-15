import { authenticateBillingUser } from "@/lib/billing/sumup";
import { confirmCreditCheckout } from "@/lib/ai/credit-purchases";
export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  let userId: string;
  try { userId = (await authenticateBillingUser(request)).id; }
  catch { return Response.json({ error: "Faça login para confirmar seu pagamento." }, { status: 401 }); }
  const payload = await request.json().catch(() => null) as { orderId?: unknown; transactionNsu?: unknown; slug?: unknown } | null;
  const id = typeof payload?.orderId === "string" ? payload.orderId : "";
  if (!/^[a-f0-9-]{36}$/i.test(id)) return Response.json({ error: "Pedido inválido." }, { status: 400 });
  try {
    const result = await confirmCreditCheckout(
      userId, id,
      typeof payload?.transactionNsu === "string" ? payload.transactionNsu : "",
      typeof payload?.slug === "string" ? payload.slug : "",
    );
    return Response.json(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    console.error("[kivai-ai] Could not confirm credit checkout");
    return Response.json({ error: "Não foi possível confirmar o pagamento. Tente novamente em alguns instantes." }, { status: 503 });
  }
}
