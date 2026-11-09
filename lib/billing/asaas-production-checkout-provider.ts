import "server-only";

/**
 * Preparação do transporte de Checkout recorrente Asaas em produção.
 * Chamado somente pela rota autenticada de produção, que exige flags
 * independentes para checkout, lifecycle, sincronização e vinculação.
 * Nenhum redirect é confirmação financeira.
 */
type CheckoutPayload = {
  billingTypes: string[];
  chargeTypes: string[];
  minutesToExpire: number;
  externalReference: string;
  callback: { successUrl: string; cancelUrl: string; expiredUrl: string };
  items: Array<{ name: string; description: string; quantity: number; value: number }>;
  subscription: { cycle: string; nextDueDate: string };
};
type Created = { id: string; status?: string };

export function productionCheckoutConfigured() {
  return process.env.VERCEL_ENV === "production" &&
    process.env.ASAAS_ENVIRONMENT === "production" &&
    process.env.KIVAI_ASAAS_PRODUCTION_CHECKOUT === "true" &&
    (process.env.ASAAS_API_KEY ?? "").length >= 20;
}

export async function createAsaasProductionCheckout(
  payload: CheckoutPayload,
  dependencies: { fetchImpl?: typeof fetch } = {}
): Promise<Created> {
  if (!productionCheckoutConfigured()) throw Error("ASAAS_PRODUCTION_CHECKOUT_DISABLED");
  if (payload.chargeTypes.length !== 1 || payload.chargeTypes[0] !== "RECURRENT" ||
      payload.billingTypes.length !== 1 || payload.billingTypes[0] !== "CREDIT_CARD" ||
      !/^kivai_asaas_[0-9a-f-]{36}$/.test(payload.externalReference) ||
      !["MONTHLY", "YEARLY"].includes(payload.subscription.cycle) ||
      !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(payload.subscription.nextDueDate) ||
      !Number.isInteger(payload.minutesToExpire) || payload.minutesToExpire < 10 ||
      payload.minutesToExpire > 1440 ||
      payload.items.length !== 1 || payload.items[0].quantity !== 1 ||
      !Number.isFinite(payload.items[0].value) || payload.items[0].value <= 0) {
    throw Error("INVALID_PRODUCTION_CHECKOUT_PAYLOAD");
  }
  for (const value of [payload.callback.successUrl, payload.callback.cancelUrl, payload.callback.expiredUrl]) {
    const callback = new URL(value);
    if (callback.protocol !== "https:" || callback.hostname !== "www.kivai.com.br" ||
        callback.username || callback.password) throw Error("INVALID_PRODUCTION_CALLBACK");
  }
  // Sem retry automático: timeout de criação exige conciliação manual por externalReference.
  const response = await (dependencies.fetchImpl ?? fetch)("https://api.asaas.com/v3/checkouts", {
    method: "POST",
    headers: {
      access_token: process.env.ASAAS_API_KEY!,
      accept: "application/json",
      "content-type": "application/json",
      "User-Agent": "Kivai/1.0 (production-subscriptions)",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw Error(`ASAAS_PRODUCTION_CHECKOUT_HTTP_${response.status}`);
  const data = await response.json() as { id?: unknown; status?: unknown };
  if (typeof data.id !== "string" || !/^[a-zA-Z0-9_-]{4,120}$/.test(data.id)) {
    throw Error("ASAAS_PRODUCTION_CHECKOUT_INVALID_RESPONSE");
  }
  return {
    id: data.id,
    ...(typeof data.status === "string" ? { status: data.status } : {}),
  };
}
