import { authenticateBillingUser } from "@/lib/auth/authenticated-billing-user";
import { supabaseRest } from "@/lib/blog/supabase";
import { buildAsaasRecurringCheckout } from "@/lib/billing/asaas-checkout";
import { createAsaasSandboxCheckout } from "@/lib/billing/asaas-checkout-provider";

export const runtime = "nodejs";
export const maxDuration = 30;
export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "private, no-store" };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type Reservation = { id: string; external_reference: string; existing: boolean; state: string };
type Claim = { id: string; external_reference: string; plan_code: "pro" | "agency"; billing_cycle: "monthly" | "annual"; expected_amount_brl: number | string };
type Finalized = { id: string; provider_checkout_id: string; state: string };

function sandboxEnabled() {
  return process.env.VERCEL_ENV === "preview" &&
    process.env.ASAAS_ENVIRONMENT === "sandbox" &&
    process.env.KIVAI_ASAAS_SANDBOX_CHECKOUT === "true" &&
    (process.env.ASAAS_SANDBOX_API_KEY ?? "").length >= 20;
}

function callbackOrigin() {
  const host = process.env.VERCEL_URL ?? "";
  if (!/^[a-z0-9-]+(?:\.[a-z0-9-]+)*\.vercel\.app$/i.test(host)) {
    throw new Error("INVALID_PREVIEW_ORIGIN");
  }
  return `https://${host}`;
}
function nextDueDate() {
  const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 19).replace("T", " ");
}

export async function POST(request: Request) {
  // Nunca cria uma cobrança real. Não há integração com ASAAS_API_KEY.
  if (!sandboxEnabled()) {
    return Response.json({ error: "Checkout de testes indisponível." }, { status: 503, headers: noStore });
  }
  let user: Awaited<ReturnType<typeof authenticateBillingUser>>;
  try { user = await authenticateBillingUser(request); }
  catch { return Response.json({ error: "Faça login para continuar." }, { status: 401, headers: noStore }); }

  const body = await request.json().catch(() => null) as { plan?: unknown; billing?: unknown } | null;
  if (!body || (body.plan !== "pro" && body.plan !== "agency") ||
      (body.billing !== "monthly" && body.billing !== "annual")) {
    return Response.json({ error: "Plano ou periodicidade inválidos." }, { status: 400, headers: noStore });
  }

  // A URL é derivada de variável Vercel confiável, jamais de host/header recebido.
  let origin: string;
  try { origin = callbackOrigin(); }
  catch { return Response.json({ error: "Ambiente de testes não configurado." }, { status: 503, headers: noStore }); }

  try {
    const reserved = await supabaseRest<Reservation>("rpc/kivai_reserve_asaas_checkout", {
      method: "POST", body: JSON.stringify({ p_user_id: user.id, p_plan_code: body.plan, p_billing_cycle: body.billing }),
    });
    if (!reserved?.id || !UUID.test(reserved.id) || !reserved.external_reference) throw Error("INVALID_RESERVATION");
    if (reserved.existing || reserved.state !== "reserved") {
      // Não repetir POST ao Asaas para uma criação em andamento ou conclusão ambígua.
      return Response.json({ error: "Já existe uma contratação em análise. Consulte o atendimento antes de tentar novamente." }, { status: 409, headers: noStore });
    }

    const claimed = await supabaseRest<Claim>("rpc/kivai_claim_asaas_checkout", {
      method: "POST", body: JSON.stringify({ p_id: reserved.id, p_user_id: user.id }),
    });
    if (claimed.id !== reserved.id || claimed.external_reference !== reserved.external_reference) throw Error("CLAIM_MISMATCH");
    const payload = buildAsaasRecurringCheckout({
      plan: claimed.plan_code,
      billing: claimed.billing_cycle,
      amountBrl: Number(claimed.expected_amount_brl),
      externalReference: claimed.external_reference,
      nextDueDate: nextDueDate(),
      baseUrl: origin,
    });
    // Uma única tentativa. Timeouts mantêm a reserva em 'creating' até conciliação.
    const created = await createAsaasSandboxCheckout(payload);
    const completed = await supabaseRest<Finalized>("rpc/kivai_finalize_asaas_checkout", {
      method: "POST",
      body: JSON.stringify({
        p_id: claimed.id, p_user_id: user.id,
        p_external_reference: claimed.external_reference,
        p_provider_checkout_id: created.id,
      }),
    });
    if (completed.state !== "created" || completed.provider_checkout_id !== created.id) throw Error("FINALIZE_MISMATCH");
    const checkoutUrl = `https://asaas.com/checkoutSession/show?id=${encodeURIComponent(created.id)}`;
    return Response.json({ checkoutUrl, checkoutId: created.id, status: "awaiting_payment" }, { headers: noStore });
  } catch (error) {
    // Não expõe detalhes internos, chaves ou dados de outros usuários.
    console.error("asaas_sandbox_checkout_requires_review", error instanceof Error ? error.message.slice(0, 100) : "unknown");
    return Response.json({ error: "Não foi possível finalizar a contratação de teste. Antes de tentar novamente, solicite a conferência da reserva." }, {
      status: 503, headers: noStore,
    });
  }
}
