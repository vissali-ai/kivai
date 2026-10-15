import { confirmCreditWebhook } from "@/lib/ai/credit-purchases";

export const runtime = "nodejs";
export const maxDuration = 30;
export const dynamic = "force-dynamic";

function reply(success: boolean, message: string | null, status: number) {
  return Response.json({ success, message }, {
    status, headers: { "Cache-Control": "no-store" },
  });
}

// The webhook body is untrusted. We always verify the order, transaction,
// and paid amount with InfinitePay /payment_check before granting any credits.
export async function POST(request: Request) {
  if (Number(request.headers.get("content-length") || 0) > 8192) {
    return reply(false, "Payload muito grande.", 413);
  }
  const raw = await request.text();
  if (Buffer.byteLength(raw, "utf8") > 8192) return reply(false, "Payload muito grande.", 413);

  let payload: unknown;
  try { payload = JSON.parse(raw); }
  catch { return reply(false, "Payload inválido.", 400); }
  if (!payload || typeof payload !== "object") return reply(false, "Payload inválido.", 400);
  const data = payload as Record<string, unknown>;
  const ref = typeof data.order_nsu === "string" ? data.order_nsu : "";
  const transaction = typeof data.transaction_nsu === "string" ? data.transaction_nsu : "";
  const slug = typeof data.invoice_slug === "string" ? data.invoice_slug :
    typeof data.slug === "string" ? data.slug : "";

  if (!/^kivai-ai-[a-f0-9-]{36}$/i.test(ref) || transaction.length < 8 ||
      transaction.length > 150 || slug.length < 2 || slug.length > 150) {
    return reply(false, "Referência inválida.", 400);
  }
  try {
    const result = await confirmCreditWebhook(ref, transaction, slug);
    if (!result.paid) return reply(false, "Pagamento ainda não confirmado.", 400);
    return reply(true, null, 200);
  } catch {
    console.warn("[kivai-credit] InfinitePay payment confirmation pending or failed");
    return reply(false, "Não foi possível confirmar o pagamento.", 400);
  }
}
