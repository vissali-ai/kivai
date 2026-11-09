import "server-only";

type CheckoutPayload = {
  billingTypes: string[];
  chargeTypes: string[];
  minutesToExpire: number;
  externalReference: string;
  callback: { successUrl: string; cancelUrl: string; expiredUrl: string };
  items: Array<{ name: string; description: string; quantity: number; value: number }>;
  subscription: { cycle: string; nextDueDate: string };
};

export type AsaasCheckoutCreated = { id: string; status?: string };

/**
 * Não disponibilizar esta função por uma rota pública até existir um registro
 * durável de intenção de checkout e reconciliação segura de eventos.
 * Usa uma chave EXCLUSIVA do sandbox; nunca usa ASAAS_API_KEY de produção.
 */
export async function createAsaasSandboxCheckout(
  payload: CheckoutPayload,
  dependencies: { fetchImpl?: typeof fetch; apiKey?: string } = {}
): Promise<AsaasCheckoutCreated> {
  if (process.env.ASAAS_ENVIRONMENT !== "sandbox" ||
      process.env.KIVAI_ASAAS_SANDBOX_CHECKOUT !== "true") {
    throw new Error("ASAAS_SANDBOX_CHECKOUT_DISABLED");
  }
  const apiKey = dependencies.apiKey ?? process.env.ASAAS_SANDBOX_API_KEY ?? "";
  if (apiKey.length < 20) throw new Error("ASAAS_SANDBOX_KEY_MISSING");
  if (!payload.externalReference || payload.chargeTypes.length !== 1 ||
      payload.chargeTypes[0] !== "RECURRENT" ||
      payload.billingTypes.length !== 1 || payload.billingTypes[0] !== "CREDIT_CARD") {
    throw new Error("INVALID_SANDBOX_PAYLOAD");
  }
  // Checkout creation is NOT payment confirmation and is never retried automatically.
  const response = await (dependencies.fetchImpl ?? fetch)("https://api-sandbox.asaas.com/v3/checkouts", {
    method: "POST",
    headers: {
      access_token: apiKey,
      accept: "application/json",
      "content-type": "application/json",
      "User-Agent": "Kivai/1.0 (sandbox-subscriptions)",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) {
    throw new Error(`ASAAS_SANDBOX_CHECKOUT_HTTP_${response.status}`);
  }
  const checkout = await response.json() as { id?: unknown; status?: unknown };
  if (typeof checkout.id !== "string" || !/^[a-zA-Z0-9_-]{4,120}$/.test(checkout.id)) {
    throw new Error("ASAAS_SANDBOX_CHECKOUT_INVALID_RESPONSE");
  }
  return {
    id: checkout.id,
    ...(typeof checkout.status === "string" ? { status: checkout.status } : {}),
  };
}
