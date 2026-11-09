import "server-only";
import { timingSafeEqual } from "node:crypto";

export type AsaasPayment = {
  id: string;
  subscription?: string | null;
  value: number;
  status: string;
  billingType?: string;
};
export type AsaasCustomer = { id: string; email?: string; cpfCnpj?: string };
export type AsaasSubscription = {
  id: string;
  customer: string;
  status: string;
  value: number;
  cycle: "MONTHLY" | "YEARLY" | string;
  billingType: string;
  externalReference?: string | null;
};

function getSettings() {
  // A Preview deployment cannot call the production payment API, and
  // a production deployment cannot silently fall back to Sandbox.
  const environment = process.env.ASAAS_ENVIRONMENT;
  const deployment = process.env.VERCEL_ENV;
  const validPair = (environment === "production" && deployment === "production") ||
    (environment === "sandbox" && deployment === "preview");
  return {
    enabled: validPair && process.env.KIVAI_ASAAS_RECURRING_SYNC === "true",
    key: process.env.ASAAS_API_KEY ?? "",
    webhookToken: process.env.ASAAS_WEBHOOK_TOKEN ?? "",
    base: environment === "production" ? "https://api.asaas.com/v3" : "https://api-sandbox.asaas.com/v3",
  };
}

export function isAsaasSyncConfigured() {
  const settings = getSettings();
  return settings.enabled && settings.key.length > 20 && settings.webhookToken.length >= 32;
}

export function matchesAsaasWebhookToken(received: string | null) {
  const expected = getSettings().webhookToken;
  if (!isAsaasSyncConfigured() || !expected || !received) return false;
  const left = Buffer.from(expected);
  const right = Buffer.from(received);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function asaasGet<T>(route: string): Promise<T> {
  const settings = getSettings();
  if (!isAsaasSyncConfigured()) throw Error("ASAAS_NOT_CONFIGURED");
  if (!/^\/(payments|subscriptions|customers)\/[a-zA-Z0-9_-]{4,120}$/.test(route)) throw Error("ASAAS_INVALID_RESOURCE");
  const response = await fetch(settings.base + route, {
    headers: {
      access_token: settings.key,
      accept: "application/json",
      "User-Agent": "Kivai/1.0 (subscription-sync)",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw Error(`ASAAS_VERIFY_FAILED_${response.status}`);
  return await response.json() as T;
}
