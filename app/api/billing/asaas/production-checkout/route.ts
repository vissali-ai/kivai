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

function testMode() {
  return process.env.KIVAI_ASAAS_TEST_ONLY === "true";
}

function allowlistedForTest(userId: string) {
  const allowed = process.env.KIVAI_ASAAS_TEST_USER_ID ?? "";
  return UUID.test(allowed) && userId === allowed;
}
function rolloutReady() {
  // Explicit and mutually exclusive switches. A test cannot silently open
  // the recurring checkout to every free-tier account.
  if (testMode()) return UUID.test(process.env.KIVAI_ASAAS_TEST_USER_ID ?? "");
  return process.env.KIVAI_ASAAS_PUBLIC_SALES === "true";
}
function checkoutReady() {
  return productionCheckoutConfigured() &&
    process.env.KIVAI_ASAAS_PRODUCTION_ROUTE === "true" &&
    recurringProcessingConfigured() &&
    rolloutReady();
}

// In test mode, only the authenticated test account can see that the
// recurring checkout is ready. No credentials or test IDs are exposed.
export async function GET(request: Request) {
  if (!checkoutReady()) return Response.json({ enabled: false }, { headers });
  if (!testMode()) return Response.json({ enabled: true }, { headers });
  try {
    const user = await authenticateBillingUser(request);
    const allowed = allowlistedForTest(user.id);
    return Response.json({ enabled: allowed, pilotOnly: allowed }, { headers });
  } catch {
    return Response.json({ enabled: false }, { headers });
  }
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

  // Defence in depth: POST never trusts the public readiness response.
  if (testMode() && !allowlistedForTest(user.id)) {
    return respond(403, "Checkout de validação restrito.");
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
  // A controlled real-money pilot must never create a higher-priced or
  // annual recurring commitment by clicking a different button.
  if (testMode() && (plan !== "pro" || billing !== "monthly")) {
    return respond(403, "Piloto autorizado apenas para o plano Pro mensal.");
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
      baseUrl: "https://www.kivai.com.br",
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
