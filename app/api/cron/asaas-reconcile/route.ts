import "server-only";

import { timingSafeEqual } from "node:crypto";
import { asaasGet, isAsaasSyncConfigured, type AsaasPayment, type AsaasSubscription } from "@/lib/billing/asaas";
import { supabaseRest } from "@/lib/blog/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const noStore = { "Cache-Control": "no-store" };
const ID = /^[a-zA-Z0-9_-]{4,120}$/;
const REF = /^kivai_asaas_[0-9a-f-]{36}$/;
const PAYMENT = /^pay_[a-zA-Z0-9_-]{4,120}$/;
const CUSTOMER = /^cus_[a-zA-Z0-9_-]{4,120}$/;

type EventRow = {
  provider_event_id: string;
  event_type: string;
  provider_payment_id: string | null;
  provider_subscription_id: string | null;
};
type ProviderLink = {
  provider_subscription_id: string;
  expected_amount_brl: number | string;
  state: string;
};

function configured() {
  return process.env.VERCEL_ENV === "production" &&
    process.env.ASAAS_ENVIRONMENT === "production" &&
    process.env.KIVAI_ASAAS_RECURRING_SYNC === "true" &&
    process.env.KIVAI_ASAAS_PRODUCTION_LIFECYCLE === "true" &&
    process.env.KIVAI_ASAAS_VERIFIED_AUTO_LINK === "true" &&
    process.env.KIVAI_ASAAS_RECONCILIATION === "true" &&
    (process.env.CRON_SECRET ?? "").length >= 32 &&
    (process.env.ASAAS_WEBHOOK_TOKEN ?? "").length >= 32 &&
    isAsaasSyncConfigured();
}
function authorized(received: string | null) {
  const expected = "Bearer " + (process.env.CRON_SECRET ?? "");
  if (!received || !process.env.CRON_SECRET) return false;
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
function reply(status: number, data: object) {
  return Response.json(data, { status, headers: noStore });
}
function sameAmount(a: unknown, b: unknown) {
  return typeof a === "number" && Number.isFinite(a) &&
    Number.isFinite(Number(b)) && a > 0 &&
    a.toFixed(2) === Number(b).toFixed(2);
}

export async function GET(request: Request) {
  // Never run outside an explicitly authorized production cron.
  if (!configured()) return reply(200, { enabled: false, checked: 0 });
  if (!authorized(request.headers.get("authorization"))) {
    return reply(401, { error: "Não autorizado." });
  }
  try {
    const pending = await supabaseRest<EventRow[]>(
      "kivai_recurring_webhook_inbox?select=provider_event_id,event_type,provider_payment_id,provider_subscription_id" +
      "&processing_status=eq.manual_review&event_type=in.(PAYMENT_CONFIRMED,PAYMENT_RECEIVED)" +
      "&order=created_at.asc&limit=8",
    );
    let applied = 0;
    let duplicate = 0;
    let unresolved = 0;
    for (const row of pending) {
      const paymentId = row.provider_payment_id;
      if (!paymentId || !PAYMENT.test(paymentId) ||
          typeof row.provider_event_id !== "string" ||
          row.provider_event_id.length < 5 || row.provider_event_id.length > 160) {
        unresolved++;
        continue;
      }
      try {
        // Re-read both payment and subscription from the Asaas API.
        const payment = await asaasGet<AsaasPayment>("/payments/" + paymentId);
        if (payment.id !== paymentId ||
            !["CONFIRMED", "RECEIVED"].includes(payment.status) ||
            !payment.subscription || !ID.test(payment.subscription) ||
            (row.provider_subscription_id && row.provider_subscription_id !== payment.subscription) ||
            (payment.billingType && payment.billingType !== "CREDIT_CARD")) {
          unresolved++;
          continue;
        }
        const subscription = await asaasGet<AsaasSubscription>("/subscriptions/" + payment.subscription);
        if (subscription.id !== payment.subscription ||
            subscription.status !== "ACTIVE" ||
            subscription.billingType !== "CREDIT_CARD" ||
            !CUSTOMER.test(subscription.customer) ||
            !subscription.externalReference || !REF.test(subscription.externalReference) ||
            !["MONTHLY", "YEARLY"].includes(subscription.cycle) ||
            !sameAmount(payment.value, subscription.value)) {
          unresolved++;
          continue;
        }
        // Promotion requires a paid checkout and verified SUBSCRIPTION_CREATED
        // stored in the database; it never trusts event order or user input.
        const promotion = await supabaseRest<{ linked: boolean }>(
          "rpc/kivai_promote_asaas_verified_subscription", {
            method: "POST",
            body: JSON.stringify({
              p_external_reference: subscription.externalReference,
              p_subscription_id: subscription.id,
              p_customer_id: subscription.customer,
              p_amount_brl: subscription.value,
              p_cycle: subscription.cycle,
            }),
          },
        );
        if (!promotion.linked) {
          unresolved++;
          continue;
        }
        const links = await supabaseRest<ProviderLink[]>(
          "kivai_recurring_provider_links?select=provider_subscription_id,expected_amount_brl,state" +
          "&provider_subscription_id=eq." + encodeURIComponent(subscription.id) + "&state=eq.active&limit=1",
        );
        if (!links[0] || links[0].provider_subscription_id !== subscription.id ||
            !sameAmount(payment.value, links[0].expected_amount_brl)) {
          unresolved++;
          continue;
        }
        const result = await supabaseRest<{ applied: boolean }>("rpc/kivai_apply_asaas_paid_charge", {
          method: "POST",
          body: JSON.stringify({
            p_payment_id: paymentId,
            p_subscription_id: subscription.id,
            p_amount_brl: payment.value,
            p_event_id: row.provider_event_id,
          }),
        });
        await supabaseRest(
          "kivai_recurring_webhook_inbox?provider_event_id=eq." + encodeURIComponent(row.provider_event_id) +
          "&processing_status=eq.manual_review", {
            method: "PATCH",
            body: JSON.stringify({
              processing_status: result.applied ? "applied" : "duplicate",
              last_error: null,
              processed_at: new Date().toISOString(),
            }),
          },
        );
        if (result.applied) applied++; else duplicate++;
      } catch {
        // Keep event in manual_review; never retry an actual charge creation.
        unresolved++;
        console.error("asaas_reconcile_event_needs_review");
      }
    }
    return reply(200, { checked: pending.length, applied, duplicate, unresolved });
  } catch {
    return reply(503, { error: "Não foi possível consultar a fila." });
  }
}
