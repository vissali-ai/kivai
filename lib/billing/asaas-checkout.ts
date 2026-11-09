/**
 * Preparação do payload para Checkout recorrente hospedado no Asaas.
 * Não cria checkout, não concede acesso e não substitui o fluxo atual.
 * Apenas dados provenientes do servidor devem ser passados a esta função.
 */
export type KivaiPaidPlan = "pro" | "agency";
export type KivaiBillingCycle = "monthly" | "annual";

type Input = {
  plan: KivaiPaidPlan;
  billing: KivaiBillingCycle;
  amountBrl: number;
  externalReference: string;
  nextDueDate: string;
  baseUrl: string;
};

export function buildAsaasRecurringCheckout(input: Input) {
  if (!["pro", "agency"].includes(input.plan)) throw new Error("INVALID_PLAN");
  if (!["monthly", "annual"].includes(input.billing)) throw new Error("INVALID_CYCLE");
  if (!Number.isFinite(input.amountBrl) || input.amountBrl <= 0 ||
      Math.round(input.amountBrl * 100) !== input.amountBrl * 100) {
    throw new Error("INVALID_AMOUNT");
  }
  if (!/^[a-zA-Z0-9_-]{8,120}$/.test(input.externalReference)) throw new Error("INVALID_REFERENCE");
  if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(input.nextDueDate)) throw new Error("INVALID_DATE");
  const url = new URL(input.baseUrl);
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash) {
    throw new Error("INVALID_BASE_URL");
  }
  const origin = url.origin;
  const path = input.baseUrl.replace(/\/$/, "");
  if (path !== origin) throw new Error("INVALID_BASE_URL");
  const planName = input.plan === "pro" ? "Pro" : "Agency";
  const cycleName = input.billing === "annual" ? "anual" : "mensal";
  return {
    billingTypes: ["CREDIT_CARD"],
    chargeTypes: ["RECURRENT"],
    minutesToExpire: 60,
    externalReference: input.externalReference,
    callback: {
      successUrl: `${origin}/conta?pagamento=pendente`,
      cancelUrl: `${origin}/planos?pagamento=cancelado`,
      expiredUrl: `${origin}/planos?pagamento=expirado`,
    },
    items: [{
      name: `Kivai ${planName} ${cycleName}`,
      description: `Assinatura ${cycleName} Kivai ${planName}`,
      quantity: 1,
      value: input.amountBrl,
    }],
    subscription: {
      cycle: input.billing === "annual" ? "YEARLY" : "MONTHLY",
      nextDueDate: input.nextDueDate,
    },
  };
}
