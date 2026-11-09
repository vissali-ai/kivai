import { authenticateBillingUser } from "@/lib/auth/authenticated-billing-user";
import { supabaseRest } from "@/lib/blog/supabase";
import { buildAsaasRecurringCheckout } from "@/lib/billing/asaas-checkout";
import { nextAsaasFirstDueDate } from "@/lib/billing/asaas-first-due-date";
import {
  createAsaasProductionCheckout,
  productionCheckoutConfigured,
} from "@/lib/billing/asaas-production-checkout-provider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const headers = { "Cache-Control": "private, no-store" };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EXTERNAL_REFERENCE = /^kivai_asaas_[0-9a-f-]{36}$/;

type Reservation = { id: string; external_reference: string; existing: boolean; state: string };
type Claim = {
  id: string;
  external_reference: string;
  plan_code: "pro" | "agency";
  billing_cycle: "monthly" | "annual";
  expected_amount_brl: number | string;
};
type Finalized = { id: string; provider_checkout_id: string; state: string };

function respond(status: number, error: string) {
  return Response.json({ error }, { status, headers });
}
function recurringProcessingConfigured(): boolean {
  // Configuration gates do not prove a provider webhook was actually registered.
  // This prevents creating a recurring contract with both processing paths off.
  return process.env.ASAAS_ENVIRONMENT === "production" &&
    process.env.KIVAI_ASAAS_RECURRING_SYNC === "true" &&
    process.env.KIVAI_ASAAS_PRODUCTION_LIFECYCLE === "true" &&
    process.env.KIVAI_ASAAS_VERIFIED_AUTO_LINK === "true" &&
    (process.env.ASAAS_WEBHOOK_TOKEN ?? "").length >= 32;
}

function checkoutReady() {
  return productionCheckoutConfigured() &&
    process.env.KIVAI_ASAAS_PRODUCTION_ROUTE === "true" &&
    recurringProcessingConfigured();
}

// Public readiness exposes no configuration values or API credentials.
// The checkout remains inaccessible until all reconciliation gates pass.
export async function GET() {
  return Response.json({ enabled: checkoutReady() }, { headers });
}

export async function POST(request: Request) {
  // The checkout remains disabled until both webhooks and verified auto-link
  // are configured; redirects never grant entitlement.
  if (!checkoutReady()) {
    return respond(503, "Checkout recorrente indisponível.");
  }

  let user: Awaited<ReturnType<typeof authenticateBillingUser>>;
  try {
    user = await authenticateBillingUser(request);
    if (!UUID.test(user.id)) throw Error("INVALID_USER");
  } catch {
    return respond(401, "Faça login para continuar.");
  }

  if (Number(request.headers.get("content-length") || 0) > 4096) return respond(413, "Solicitação muito grande.");
  const raw = await request.text();
  if (Buffer.byteLength(raw, "utf8") > 4096) return respond(413, "Solicitação muito grande.");
  let input: unknown;
  try { input = JSON.parse(raw); } catch { return respond(400, "Solicitação inválida."); }
  if (!input || typeof input !== "object" || Array.isArray(input)) return respond(400, "Solicitação inválida.");
  const { plan, billing } = input as Record<string, unknown>;
  if ((plan !== "pro" && plan !== "agency") || (billing !== "monthly" && billing !== "annual")) {
    return respond(400, "Plano ou periodicidade inválidos.");
  }

  try {
    // Server-authoritative price, active-contract protection, in-flight InfinitePay
    // guard and unique reservation live in the service-role RPC.
    const reserved = await supabaseRest<Reservation>("rpc/kivai_reserve_asaas_checkout", {
      method: "POST",
      body: JSON.stringify({ p_user_id: user.id, p_plan_code: plan, p_billing_cycle: billing }),
    });
    if (!reserved || !UUID.test(reserved.id) || !EXTERNAL_REFERENCE.test(reserved.external_reference)) {
      throw Error("INVALID_CHECKOUT_RESERVATION");
    }
    if (reserved.existing || reserved.state !== "reserved") {
      return respond(409, "Já existe uma contratação em andamento. Solicite conferência antes de tentar novamente.");
    }

    // The claim is atomic; an ambiguous provider timeout is never retried.
    const claim = await supabaseRest<Claim>("rpc/kivai_claim_asaas_checkout", {
      method: "POST",
      body: JSON.stringify({ p_id: reserved.id, p_user_id: user.id }),
    });
    if (!claim || claim.id !== reserved.id || claim.external_reference !== reserved.external_reference ||
        claim.plan_code !== plan || claim.billing_cycle !== billing) {
      throw Error("CHECKOUT_CLAIM_MISMATCH");
    }
    const payload = buildAsaasRecurringCheckout({
      plan: claim.plan_code,
      billing: claim.billing_cycle,
      amountBrl: Number(claim.expected_amount_brl),
      externalReference: claim.external_reference,
      nextDueDate: nextAsaasFirstDueDate(),
      baseUrl: "https://kivai.com.br",
    });
    const checkout = await createAsaasProductionCheckout(payload);
    const finalized = await supabaseRest<Finalized>("rpc/kivai_finalize_asaas_checkout", {
      method: "POST",
      body: JSON.stringify({
        p_id: claim.id,
        p_user_id: user.id,
        p_external_reference: claim.external_reference,
        p_provider_checkout_id: checkout.id,
      }),
    });
    if (finalized.state !== "created" || finalized.provider_checkout_id !== checkout.id) {
      throw Error("CHECKOUT_FINALIZE_MISMATCH");
    }

    // A created checkout is NOT a paid subscription.
    return Response.json({
      checkoutUrl: `https://asaas.com/checkoutSession/show?id=${encodeURIComponent(checkout.id)}`,
      checkoutId: checkout.id,
      status: "awaiting_payment",
    }, { headers });
  } catch (error) {
    console.error("asaas_production_checkout_requires_review",
      error instanceof Error ? error.message.slice(0, 100) : "unknown");
    return respond(503, "Contratação não finalizada. Solicite conferência antes de tentar novamente.");
  }
}
