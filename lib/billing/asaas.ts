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
};

function getSettings() {
  const environment = process.env.ASAAS_ENVIRONMENT;
  return {
    enabled: process.env.KIVAI_ASAAS_RECURRING_SYNC === "true",
    key: process.env.ASAAS_API_KEY ?? "",
    webhookToken: process.env.ASAAS_WEBHOOK_TOKEN ?? "",
    environment,
    base: environment === "production" ? "https://api.asaas.com/v3" : "https://api-sandbox.asaas.com/v3",
  };
}

// Sandbox payments must never grant access in the existing production database.
export function asaasConfigurationIssue(): string | null {
  const settings = getSettings();
  if (!settings.enabled) return "Sincronização desativada: configure KIVAI_ASAAS_RECURRING_SYNC somente no ambiente de testes preparado.";
  if (!["sandbox", "production"].includes(settings.environment ?? "")) return "Defina ASAAS_ENVIRONMENT explicitamente como sandbox ou production.";
  if (settings.key.length <= 20 || settings.webhookToken.length < 32 || settings.webhookToken.length > 255
    || /\s/.test(settings.webhookToken) || settings.webhookToken === settings.key) return "Confira a chave Asaas e o token próprio do webhook.";
  if (process.env.VERCEL_ENV === "preview" && settings.environment !== "sandbox") return "O Preview deve usar credenciais Asaas Sandbox.";
  if (settings.environment === "sandbox") {
    const ref = process.env.KIVAI_ASAAS_SANDBOX_SUPABASE_REF ?? "";
    // This is the existing Kivai project, also used by the public login fallback.
    if (!/^[a-z]{20}$/.test(ref) || ref === "fphphknegwlgydwulehl") return "Identifique um projeto Supabase de testes separado em KIVAI_ASAAS_SANDBOX_SUPABASE_REF.";
    const expected = `https://${ref}.supabase.co`;
    const serverUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
    const browserUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
    if (serverUrl !== expected || browserUrl !== expected) return "O servidor e o login precisam apontar para o mesmo projeto Supabase de testes.";
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) return "Configure as chaves do banco de testes no servidor e no login.";
  }
  return null;
}

export function isAsaasSyncConfigured() {
  return asaasConfigurationIssue() === null;
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
