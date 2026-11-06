import { asaasGet, isAsaasSyncConfigured, matchesAsaasWebhookToken, type AsaasPayment } from "@/lib/billing/asaas";
import { supabaseRest } from "@/lib/blog/supabase";

export const runtime = "nodejs";
export const maxDuration = 30;
export const dynamic = "force-dynamic";

type InboxRow = { provider_event_id: string; processing_status: string };
type ProviderLink = {
  provider_subscription_id: string;
  state: string;
  expected_amount_brl: number | string;
  plan_code: "pro" | "agency";
  billing_cycle: "monthly" | "annual";
};
function reply(status: number, message: string) {
  return Response.json({ message }, { status, headers: { "Cache-Control": "no-store" } });
}
async function markEvent(id: string, status: "applied" | "duplicate" | "manual_review" | "ignored", error = "") {
  await supabaseRest(`kivai_recurring_webhook_inbox?provider_event_id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ processing_status: status, last_error: error.slice(0, 160) || null, processed_at: new Date().toISOString() }),
  });
}

export async function POST(request: Request) {
  // Desligado por padrão. Nenhum evento InfinitePay passa por esta rota.
  if (!isAsaasSyncConfigured()) return reply(503, "Integração recorrente indisponível.");
  if (!matchesAsaasWebhookToken(request.headers.get("asaas-access-token"))) {
    return reply(401, "Não autorizado.");
  }
  if (Number(request.headers.get("content-length") || 0) > 12000) return reply(413, "Evento muito grande.");
  const raw = await request.text();
  if (Buffer.byteLength(raw, "utf8") > 12000) return reply(413, "Evento muito grande.");

  let input: unknown;
  try { input = JSON.parse(raw); }
  catch { return reply(400, "Evento inválido."); }
  if (!input || typeof input !== "object" || Array.isArray(input)) return reply(400, "Evento inválido.");
  const body = input as Record<string, unknown>;
  const id = typeof body.id === "string" ? body.id : "";
  const kind = typeof body.event === "string" ? body.event : "";
  const paymentObject = body.payment && typeof body.payment === "object" ? body.payment as Record<string, unknown> : {};
  const subscriptionObject = body.subscription && typeof body.subscription === "object" ? body.subscription as Record<string, unknown> : {};
  const paymentId = typeof paymentObject.id === "string" ? paymentObject.id : "";
  const subscriptionId = typeof paymentObject.subscription === "string"
    ? paymentObject.subscription
    : typeof subscriptionObject.id === "string" ? subscriptionObject.id : "";
  if (id.length < 5 || id.length > 160 || kind.length < 5 || kind.length > 90) return reply(400, "Identificação inválida.");

  try {
    const recorded = await supabaseRest<InboxRow[]>(
      "kivai_recurring_webhook_inbox?on_conflict=provider_event_id", {
      method: "POST",
      headers: { Prefer: "resolution=ignore-duplicates,return=representation" },
      body: JSON.stringify({
        provider_event_id: id,
        event_type: kind,
        provider_payment_id: paymentId || null,
        provider_subscription_id: subscriptionId || null,
      }),
    });
    if (!recorded.length) {
      const existing = await supabaseRest<InboxRow[]>(`kivai_recurring_webhook_inbox?select=provider_event_id,processing_status&provider_event_id=eq.${encodeURIComponent(id)}&limit=1`);
      if (existing[0] && existing[0].processing_status !== "pending") return reply(200, "Evento já recebido.");
    }

    // Nenhum evento que não represente pagamento confirmado concede acesso.
    if (!["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED"].includes(kind)) {
      if (kind.includes("REFUND") || kind.includes("CHARGEBACK") || kind.startsWith("SUBSCRIPTION_") || kind === "PAYMENT_OVERDUE") {
        await markEvent(id, "manual_review", "Revisar situação financeira no provedor.");
      } else {
        await markEvent(id, "ignored");
      }
      return reply(200, "Evento registrado.");
    }

    if (!/^pay_[a-zA-Z0-9_-]{4,120}$/.test(paymentId)) {
      await markEvent(id, "manual_review", "Identificador de cobrança inválido.");
      return reply(200, "Evento recebido para conferência.");
    }
    // Segurança: nunca confiar somente no payload recebido no webhook.
    const verified = await asaasGet<AsaasPayment>(`/payments/${paymentId}`);
    if (verified.id !== paymentId || !["CONFIRMED", "RECEIVED"].includes(verified.status)) {
      await markEvent(id, "manual_review", "Pagamento ainda não confirmado na API.");
      return reply(200, "Evento recebido para conferência.");
    }
    if (!verified.subscription || typeof verified.subscription !== "string") {
      await markEvent(id, "manual_review", "Cobrança sem assinatura de origem.");
      return reply(200, "Evento recebido para conferência.");
    }
    const links = await supabaseRest<ProviderLink[]>(
      `kivai_recurring_provider_links?select=provider_subscription_id,state,expected_amount_brl,plan_code,billing_cycle&provider_subscription_id=eq.${encodeURIComponent(verified.subscription)}&state=eq.active&limit=1`
    );
    if (!links[0]) {
      await markEvent(id, "manual_review", "Assinatura sem vínculo de usuário aprovado.");
      return reply(200, "Evento recebido para conferência.");
    }
    if (Number(verified.value).toFixed(2) !== Number(links[0].expected_amount_brl).toFixed(2)) {
      await markEvent(id, "manual_review", "Divergência no valor da cobrança.");
      return reply(200, "Evento recebido para conferência.");
    }
    try {
      const applied = await supabaseRest<{ applied: boolean }>(
        "rpc/kivai_apply_asaas_paid_charge", {
          method: "POST",
          body: JSON.stringify({
            p_payment_id: paymentId,
            p_subscription_id: verified.subscription,
            p_amount_brl: Number(verified.value),
            p_event_id: id,
          }),
        });
      await markEvent(id, applied.applied ? "applied" : "duplicate");
      return reply(200, applied.applied ? "Pagamento aplicado." : "Pagamento já processado.");
    } catch (error) {
      console.error("asaas_apply_payment_needs_review", error instanceof Error ? error.message.slice(0, 180) : "unknown");
      await markEvent(id, "manual_review", "Não foi possível conciliar acesso com segurança.");
      return reply(200, "Cobrança registrada para conferência.");
    }
  } catch (error) {
    console.error("asaas_webhook_processing_error", error instanceof Error ? error.message.slice(0, 180) : "unknown");
    // Não confirmar quando nem mesmo a persistência do evento for garantida.
    return reply(503, "Falha temporária ao registrar o evento.");
  }
}
