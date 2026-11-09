import "server-only";
import { timingSafeEqual } from "node:crypto";
import { asaasGet, type AsaasSubscription } from "@/lib/billing/asaas";
import { supabaseRest } from "@/lib/blog/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const IDENTIFIER = /^[a-zA-Z0-9_-]{4,120}$/;
const REFERENCE = /^kivai_asaas_[0-9a-f-]{36}$/;
const headers = { "Cache-Control": "no-store" };
function reply(status: number, message: string) {
  return Response.json({ message }, { status, headers });
}

// This flag must never be set before migrations and an independent
// review of the webhook, financial reconciliation and legacy contracts.
function enabled() {
  return process.env.VERCEL_ENV === "production" &&
    process.env.ASAAS_ENVIRONMENT === "production" &&
    process.env.KIVAI_ASAAS_PRODUCTION_LIFECYCLE === "true" &&
    process.env.KIVAI_ASAAS_RECURRING_SYNC === "true" &&
    (process.env.ASAAS_API_KEY ?? "").length > 20 &&
    (process.env.ASAAS_WEBHOOK_TOKEN ?? "").length >= 32;
}
function authenticated(token: string | null) {
  const expected = process.env.ASAAS_WEBHOOK_TOKEN ?? "";
  if (!token || !expected) return false;
  const left = Buffer.from(token);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}
export async function POST(request: Request) {
  if (!enabled()) return reply(503, "Lifecycle de produção indisponível.");
  if (!authenticated(request.headers.get("asaas-access-token"))) {
    return reply(401, "Não autorizado.");
  }
  if (Number(request.headers.get("content-length") || 0) > 12000) return reply(413, "Evento muito grande.");
  const raw = await request.text();
  if (Buffer.byteLength(raw, "utf8") > 12000) return reply(413, "Evento muito grande.");
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { return reply(400, "Evento inválido."); }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return reply(400, "Evento inválido.");
  const data = parsed as Record<string, unknown>;
  const id = typeof data.id === "string" ? data.id : "";
  const kind = typeof data.event === "string" ? data.event : "";
  if (id.length < 5 || id.length > 160 || kind.length < 5 || kind.length > 90) {
    return reply(400, "Identificação inválida.");
  }

  // Asaas documents authenticated CHECKOUT_PAID as the checkout completion event.
  // The service-only RPC accepts it only for a persisted checkout ID and deduplicates
  // by event ID. It does NOT activate the paid plan; that requires a separately
  // verified PAYMENT_CONFIRMED/RECEIVED in the financial webhook.
  if (kind === "CHECKOUT_PAID") {
    const checkout = data.checkout && typeof data.checkout === "object" && !Array.isArray(data.checkout)
      ? data.checkout as Record<string, unknown> : {};
    const checkoutId = typeof checkout.id === "string" ? checkout.id : "";
    if (!IDENTIFIER.test(checkoutId) || checkout.status !== "PAID") {
      return reply(400, "Checkout inválido.");
    }
    try {
      const result = await supabaseRest<{ linked?: boolean }>("rpc/kivai_record_asaas_checkout_lifecycle", {
        method: "POST",
        body: JSON.stringify({
          p_event_id: id,
          p_checkout_id: checkoutId,
          p_event_type: "CHECKOUT_PAID",
        }),
      });
      return reply(200, result.linked ? "Checkout registrado para conciliação." : "Checkout encaminhado à conferência.");
    } catch {
      console.error("asaas_production_checkout_lifecycle_persist_failed");
      return reply(503, "Falha temporária ao registrar o checkout.");
    }
  }
  if (kind !== "SUBSCRIPTION_CREATED") return reply(200, "Evento não conciliado automaticamente.");

  const subscription = data.subscription && typeof data.subscription === "object" && !Array.isArray(data.subscription)
    ? data.subscription as Record<string, unknown> : {};
  const subscriptionId = typeof subscription.id === "string" ? subscription.id : "";
  if (!IDENTIFIER.test(subscriptionId)) return reply(400, "Assinatura inválida.");

  try {
    // API lookup is authoritative; never infer a user from webhook data,
    // email, payment amount, arrival order, or a callback redirect.
    const verified = await asaasGet<AsaasSubscription>(`/subscriptions/${subscriptionId}`);
    if (verified.id !== subscriptionId || verified.status !== "ACTIVE" ||
        !IDENTIFIER.test(verified.customer) ||
        !Number.isFinite(verified.value) || verified.value <= 0 ||
        !["MONTHLY", "YEARLY"].includes(verified.cycle) ||
        verified.billingType !== "CREDIT_CARD") {
      return reply(200, "Assinatura requer conferência manual.");
    }
    if (!verified.externalReference || !REFERENCE.test(verified.externalReference)) {
      await supabaseRest("rpc/kivai_record_asaas_unmatched_subscription", {
        method: "POST",
        body: JSON.stringify({ p_event_id: id, p_subscription_id: subscriptionId }),
      });
      return reply(200, "Assinatura sem referência verificável.");
    }
    // The service-only RPC enforces matching checkout intent, amount,
    // cycle and customer identity. It DOES NOT grant any plan entitlement.
    const result = await supabaseRest<{ linked?: boolean }>("rpc/kivai_record_asaas_subscription_candidate", {
      method: "POST",
      body: JSON.stringify({
        p_event_id: id,
        p_subscription_id: verified.id,
        p_external_reference: verified.externalReference,
        p_customer_id: verified.customer,
        p_amount_brl: verified.value,
        p_cycle: verified.cycle,
      }),
    });
    return reply(200, result.linked ? "Assinatura registrada para conciliação." : "Conciliação manual necessária.");
  } catch {
    console.error("asaas_production_lifecycle_needs_review");
    return reply(503, "Falha temporária na verificação de assinatura.");
  }
}
