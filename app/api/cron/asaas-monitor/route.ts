import "server-only";
import { timingSafeEqual } from "node:crypto";
import { supabaseRest } from "@/lib/blog/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const headers = { "Cache-Control": "no-store" };
type ReviewEvent = { provider_event_id: string; event_type: string; created_at: string };
type PaidCheckout = { id: string; checkout_paid_at: string; subscription_verified_at: string | null };
function respond(status: number, payload: object) {
  return Response.json(payload, { status, headers });
}
function enabled() {
  return process.env.VERCEL_ENV === "production" &&
    process.env.ASAAS_ENVIRONMENT === "production" &&
    process.env.KIVAI_ASAAS_MONITORING === "true" &&
    (process.env.CRON_SECRET ?? "").length >= 32 &&
    (process.env.RESEND_API_KEY ?? "").length >= 20 &&
    /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(process.env.KIVAI_ASAAS_ALERT_EMAIL ?? "");
}
function authorized(header: string | null) {
  const expected = "Bearer " + (process.env.CRON_SECRET ?? "");
  if (!header) return false;
  const left = Buffer.from(header);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}
export async function GET(request: Request) {
  // Read-only, opt-in operational monitor. No payments, refunds, access
  // changes, retries, or changes to the recurring subscription state.
  if (!enabled()) return respond(200, { enabled: false, checked: 0 });
  if (!authorized(request.headers.get("authorization"))) {
    return respond(401, { error: "Não autorizado." });
  }
  const now = new Date();
  const reviewCutoff = new Date(now.getTime() - 15 * 60_000).toISOString();
  const checkoutCutoff = new Date(now.getTime() - 90 * 60_000).toISOString();
  try {
    const [reviewEvents, unverifiedPaidCheckouts] = await Promise.all([
      supabaseRest<ReviewEvent[]>(
        "kivai_recurring_webhook_inbox?select=provider_event_id,event_type,created_at" +
        "&processing_status=eq.manual_review" +
        "&created_at=lte." + encodeURIComponent(reviewCutoff) +
        "&order=created_at.asc&limit=50"
      ),
      supabaseRest<PaidCheckout[]>(
        "kivai_asaas_checkout_intents?select=id,checkout_paid_at,subscription_verified_at" +
        "&checkout_paid_at=not.is.null&subscription_verified_at=is.null" +
        "&checkout_paid_at=lte." + encodeURIComponent(checkoutCutoff) +
        "&order=checkout_paid_at.asc&limit=50"
      ),
    ]);
    if (!Array.isArray(reviewEvents) || !Array.isArray(unverifiedPaidCheckouts)) {
      throw Error("ASAAS_MONITOR_INVALID_DB_RESPONSE");
    }
    const counts = {
      manualReview: reviewEvents.length,
      paidCheckoutUnverified: unverifiedPaidCheckouts.length,
    };
    if (counts.manualReview === 0 && counts.paidCheckoutUnverified === 0) {
      return respond(200, { enabled: true, alert: false, ...counts });
    }
    // No identifiers, emails or card information in notification body.
    const body = [
      "Kivai Asaas: existem ocorrências financeiras que exigem revisão.",
      "Eventos em revisão há mais de 15 min: " + counts.manualReview,
      "Checkouts pagos sem assinatura verificada há mais de 90 min: " + counts.paidCheckoutUnverified,
      "Verifique os logs do Asaas, os webhooks e a conciliação no Supabase.",
      "Nenhum pagamento ou acesso foi alterado por este monitor.",
    ].join("\n");
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + process.env.RESEND_API_KEY,
        "Content-Type": "application/json",
        "Idempotency-Key": "kivai-asaas-ops-" + now.toISOString().slice(0, 10),
      },
      body: JSON.stringify({
        from: "Kivai <contato@kivai.com.br>",
        to: [process.env.KIVAI_ASAAS_ALERT_EMAIL],
        subject: "[Kivai] Revisão financeira Asaas pendente",
        text: body,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) throw Error("ASAAS_MONITOR_DELIVERY_FAILED_" + response.status);
    return respond(200, { enabled: true, alert: true, ...counts });
  } catch {
    console.error("asaas_operational_monitor_failed");
    return respond(503, { error: "Falha na verificação ou notificação operacional." });
  }
}
