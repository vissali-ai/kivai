import "server-only";

import {
  createCipheriv, createDecipheriv, createHash, randomBytes,
} from "node:crypto";
import { supabaseRest } from "@/lib/blog/supabase";

export const GOOGLE_ADS_SCOPE = "https://www.googleapis.com/auth/adwords";
export const GOOGLE_ADS_API_VERSION = "v26";

const GOOGLE_OAUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GOOGLE_ADS_API_ORIGIN = "https://googleads.googleapis.com";
const CANONICAL_CALLBACK = "https://kivai.com.br/api/integrations/google-ads/callback";

type GoogleTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  error?: string;
};

type ConnectionRow = {
  id: string;
  user_id: string;
  refresh_token_encrypted: string;
  connected_at: string;
};

type StateRow = { user_id: string; code_verifier: string };

export type GoogleAdsLinkedAccount = {
  customerId: string;
  loginCustomerId: string | null;
  name: string;
  manager: boolean;
  currencyCode: string | null;
  timeZone: string | null;
};

export type GoogleAdsCampaignMetrics = {
  id: string;
  name: string;
  channel: string;
  clicks: number;
  impressions: number;
  cost: number;
  conversions: number;
  conversionValue: number;
};

export class GoogleAdsConnectionError extends Error {
  constructor(public readonly code: string, public readonly status = 400) {
    super(code);
    this.name = "GoogleAdsConnectionError";
  }
}

function clientId() { return process.env.GOOGLE_ADS_CLIENT_ID ?? ""; }
function clientSecret() { return process.env.GOOGLE_ADS_CLIENT_SECRET ?? ""; }
function redirectUri() { return process.env.GOOGLE_ADS_REDIRECT_URI ?? ""; }
function keyMaterial() {
  // Segredo exclusivo; nunca usar NEXT_PUBLIC_* ou a mesma chave do login Supabase.
  const raw = process.env.GOOGLE_ADS_TOKEN_ENCRYPTION_KEY ?? "";
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) throw new GoogleAdsConnectionError("ENCRYPTION_KEY_MISSING", 503);
  return key;
}

export function googleAdsConnectionReadiness() {
  const oauth = Boolean(clientId() && clientSecret() &&
    redirectUri() === CANONICAL_CALLBACK);
  let encryption = false;
  try { keyMaterial(); encryption = true; } catch { /* Não revelar credenciais */ }
  return { oauth, encryption, ready: oauth && encryption };
}

export function ensureGoogleAdsConfigured() {
  const status = googleAdsConnectionReadiness();
  if (!status.ready) throw new GoogleAdsConnectionError("INTEGRATION_NOT_CONFIGURED", 503);
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function encryptGoogleAdsRefreshToken(token: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", keyMaterial(), iv);
  const payload = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  return ["g1", iv.toString("base64url"), cipher.getAuthTag().toString("base64url"),
    payload.toString("base64url")].join(".");
}

function decryptGoogleAdsRefreshToken(encrypted: string) {
  const [version, iv, tag, data, extra] = encrypted.split(".");
  if (version !== "g1" || !iv || !tag || !data || extra !== undefined)
    throw new GoogleAdsConnectionError("BAD_ENCRYPTED_TOKEN", 503);
  try {
    const decipher = createDecipheriv(
      "aes-256-gcm", keyMaterial(), Buffer.from(iv, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([
      decipher.update(Buffer.from(data, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    throw new GoogleAdsConnectionError("TOKEN_DECRYPTION_FAILED", 503);
  }
}

export async function makeGoogleAdsConsentUrl(userId: string) {
  ensureGoogleAdsConfigured();
  const state = randomBytes(32).toString("base64url");
  const verifier = randomBytes(48).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");

  await supabaseRest("google_ads_oauth_states", {
    method: "POST",
    body: JSON.stringify({
      state_hash: sha256(state), user_id: userId, code_verifier: verifier,
    }),
  });

  const url = new URL(GOOGLE_OAUTH_ENDPOINT);
  url.searchParams.set("client_id", clientId());
  url.searchParams.set("redirect_uri", redirectUri());
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", GOOGLE_ADS_SCOPE);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent select_account");
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

async function requestGoogleToken(parameters: Record<string, string>): Promise<GoogleTokenResponse> {
  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    body: new URLSearchParams({
      client_id: clientId(), client_secret: clientSecret(), ...parameters,
    }),
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    signal: AbortSignal.timeout(15_000),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new GoogleAdsConnectionError("GOOGLE_TOKEN_EXCHANGE_FAILED", 502);
  }
  const payload = await response.json() as GoogleTokenResponse;
  if (!payload.access_token) throw new GoogleAdsConnectionError("GOOGLE_TOKEN_MISSING", 502);
  return payload;
}

export async function finishGoogleAdsConsent(state: string, code: string) {
  ensureGoogleAdsConfigured();
  if (!/^[A-Za-z0-9_-]{40,90}$/.test(state) ||
      !code || code.length > 2_048) {
    throw new GoogleAdsConnectionError("INVALID_OAUTH_STATE", 400);
  }

  // Banco exclui a autorização em uma única transação (single-use).
  const rows = await supabaseRest<StateRow[]>("rpc/consume_google_ads_oauth_state", {
    method: "POST",
    body: JSON.stringify({ p_state_hash: sha256(state) }),
  });
  const context = rows?.[0];
  if (!context?.user_id || !context.code_verifier) {
    throw new GoogleAdsConnectionError("EXPIRED_OAUTH_STATE", 400);
  }

  const tokens = await requestGoogleToken({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri(),
    code_verifier: context.code_verifier,
  });
  if (!tokens.refresh_token) throw new GoogleAdsConnectionError("REFRESH_TOKEN_MISSING", 409);
  if (tokens.scope && !tokens.scope.split(" ").includes(GOOGLE_ADS_SCOPE))
    throw new GoogleAdsConnectionError("GOOGLE_SCOPE_MISSING", 403);

  const encrypted = encryptGoogleAdsRefreshToken(tokens.refresh_token);
  await supabaseRest("google_ads_connections", {
    method: "POST",
    body: JSON.stringify({ user_id: context.user_id, refresh_token_encrypted: encrypted }),
  });
}

export async function googleAdsConnectionsForUser(userId: string) {
  const rows = await supabaseRest<Array<Pick<ConnectionRow, "id" | "connected_at">>>(
    "google_ads_connections?select=id,connected_at&user_id=eq." +
    encodeURIComponent(userId) + "&order=connected_at.desc&limit=8",
  );
  return rows;
}

async function getGoogleAdsAccessToken(connectionId: string, userId: string) {
  const rows = await supabaseRest<ConnectionRow[]>(
    "google_ads_connections?select=id,user_id,refresh_token_encrypted,connected_at" +
    "&id=eq." + encodeURIComponent(connectionId) +
    "&user_id=eq." + encodeURIComponent(userId) + "&limit=1",
  );
  const conn = rows[0];
  if (!conn) throw new GoogleAdsConnectionError("CONNECTION_NOT_FOUND", 404);
  const tokens = await requestGoogleToken({
    grant_type: "refresh_token",
    refresh_token: decryptGoogleAdsRefreshToken(conn.refresh_token_encrypted),
  });
  return tokens.access_token as string;
}

export async function deleteGoogleAdsConnection(connectionId: string, userId: string) {
  await supabaseRest(
    "google_ads_connections?id=eq." + encodeURIComponent(connectionId) +
    "&user_id=eq." + encodeURIComponent(userId),
    { method: "DELETE", headers: { Prefer: "return=minimal" } },
  );
}

async function googleAdsFetch<T>(
  accessToken: string, path: string, input?: {
    query: string;
    loginCustomerId?: string | null;
  },
): Promise<T> {
  const response = await fetch(GOOGLE_ADS_API_ORIGIN + "/" + GOOGLE_ADS_API_VERSION + path, {
    method: input ? "POST" : "GET",
    headers: {
      Authorization: "Bearer " + accessToken,
      "Content-Type": "application/json",
      ...(input?.loginCustomerId ? { "login-customer-id": input.loginCustomerId } : {}),
    },
    ...(input ? { body: JSON.stringify({ query: input.query }) } : {}),
    signal: AbortSignal.timeout(18_000),
    cache: "no-store",
  });
  if (!response.ok) {
    // Nunca devolver tokens ou conteúdo da API em logs/erros para o cliente.
    throw new GoogleAdsConnectionError(
      response.status === 401 ? "GOOGLE_AUTH_EXPIRED" :
      response.status === 403 ? "GOOGLE_ADS_PERMISSION_DENIED" :
      response.status === 429 ? "GOOGLE_ADS_QUOTA" : "GOOGLE_ADS_API_FAILED",
      response.status === 429 ? 429 : 502,
    );
  }
  return response.json() as Promise<T>;
}

type GoogleAdsQueryResult = {
  results?: Array<Record<string, unknown>>;
  nextPageToken?: string;
};

async function adsSearch(
  accessToken: string, customerId: string,
  query: string, loginCustomerId?: string | null,
) {
  return googleAdsFetch<GoogleAdsQueryResult>(
    accessToken, "/customers/" + customerId + "/googleAds:search",
    { query, loginCustomerId },
  );
}

function googleAdsId(value: string): string {
  const digits = value.replace(/-/g, "");
  if (!/^\d{10}$/.test(digits)) throw new GoogleAdsConnectionError("INVALID_CUSTOMER_ID");
  return digits;
}

type CustomerRow = {
  id?: string;
  descriptiveName?: string;
  manager?: boolean;
  currencyCode?: string;
  timeZone?: string;
  level?: number;
  status?: string;
};

function normalizeCustomer(customer: CustomerRow, loginCustomerId: string | null): GoogleAdsLinkedAccount | null {
  if (!customer.id || !/^\d{10}$/.test(String(customer.id))) return null;
  return {
    customerId: String(customer.id),
    loginCustomerId,
    name: customer.descriptiveName?.slice(0, 180) || "Conta " + customer.id,
    manager: Boolean(customer.manager),
    currencyCode: customer.currencyCode || null,
    timeZone: customer.timeZone || null,
  };
}

export async function listGoogleAdsAccounts(connectionId: string, userId: string) {
  ensureGoogleAdsConfigured();
  const token = await getGoogleAdsAccessToken(connectionId, userId);
  const direct = await googleAdsFetch<{ resourceNames?: string[] }>(
    token, "/customers:listAccessibleCustomers",
  );
  const roots = (direct.resourceNames ?? []).slice(0, 12)
    .map(x => x.match(/^customers\/(\d{10})$/)?.[1]).filter((x): x is string => !!x);
  if (!roots.length) return { accounts: [] as GoogleAdsLinkedAccount[], partial: false };

  const rootResults = await Promise.allSettled(roots.map(async id => {
    const result = await adsSearch(token, id,
      "SELECT customer.id, customer.descriptive_name, customer.manager, " +
      "customer.currency_code, customer.time_zone FROM customer LIMIT 1");
    return normalizeCustomer((result.results?.[0]?.customer || {}) as CustomerRow, null);
  }));
  const known = new Map<string, GoogleAdsLinkedAccount>();
  const managers: GoogleAdsLinkedAccount[] = [];
  let partial = (direct.resourceNames?.length ?? 0) > 12;
  rootResults.forEach(result => {
    if (result.status !== "fulfilled" || !result.value) { partial = true; return; }
    known.set(result.value.customerId, result.value);
    if (result.value.manager) managers.push(result.value);
  });

  const descendants = await Promise.allSettled(managers.slice(0, 8).map(async manager => {
    const query = "SELECT customer_client.id, customer_client.descriptive_name, " +
      "customer_client.manager, customer_client.currency_code, " +
      "customer_client.time_zone, customer_client.level, customer_client.status " +
      "FROM customer_client WHERE customer_client.level <= 3 LIMIT 500";
    return {
      managerId: manager.customerId,
      result: await adsSearch(token, manager.customerId, query, manager.customerId),
    };
  }));
  if (managers.length > 8) partial = true;
  for (const outcome of descendants) {
    if (outcome.status !== "fulfilled") { partial = true; continue; }
    const { managerId, result } = outcome.value;
    if (result.nextPageToken) partial = true;
    for (const row of result.results ?? []) {
      const candidate = normalizeCustomer((row.customerClient ?? {}) as CustomerRow, managerId);
      if (!candidate || known.has(candidate.customerId)) continue;
      known.set(candidate.customerId, candidate);
      if (known.size >= 250) { partial = true; break; }
    }
  }

  return { accounts: [...known.values()].sort((a, b) => Number(a.manager) - Number(b.manager) || a.name.localeCompare(b.name, "pt-BR")), partial };
}

function safeMetric(value: unknown): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export async function googleAdsCampaignReport(
  connectionId: string, userId: string,
  customerIdInput: string, loginCustomerIdInput: string | null,
  from: string, to: string,
) {
  const customerId = googleAdsId(customerIdInput);
  const loginCustomerId = loginCustomerIdInput ? googleAdsId(loginCustomerIdInput) : null;
  // Revalida autorização e associação da conta em toda consulta, nunca confia em
  // identificadores de conta fornecidos pelo navegador.
  const discovered = await listGoogleAdsAccounts(connectionId, userId);
  const account = discovered.accounts.find(x =>
    x.customerId === customerId && x.loginCustomerId === loginCustomerId && !x.manager);
  if (!account) throw new GoogleAdsConnectionError("CUSTOMER_NOT_AUTHORIZED", 403);
  const token = await getGoogleAdsAccessToken(connectionId, userId);

  const query = "SELECT campaign.id, campaign.name, campaign.advertising_channel_type, " +
    "metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions, " +
    "metrics.conversions_value FROM campaign " +
    "WHERE segments.date BETWEEN '" + from + "' AND '" + to + "' " +
    "AND campaign.status != 'REMOVED' ORDER BY metrics.cost_micros DESC LIMIT 500";

  const result = await adsSearch(token, customerId, query, loginCustomerId);
  if (result.nextPageToken) {
    throw new GoogleAdsConnectionError("TOO_MANY_CAMPAIGNS", 413);
  }
  const campaigns = (result.results ?? []).map((row, idx): GoogleAdsCampaignMetrics => {
    const data = (row.campaign ?? {}) as Record<string, unknown>;
    const metrics = (row.metrics ?? {}) as Record<string, unknown>;
    return {
      id: String(data.id ?? idx), name: String(data.name ?? "Campanha").slice(0, 180),
      channel: String(data.advertisingChannelType ?? "UNKNOWN"),
      clicks: safeMetric(metrics.clicks),
      impressions: safeMetric(metrics.impressions),
      cost: safeMetric(metrics.costMicros) / 1_000_000,
      conversions: safeMetric(metrics.conversions),
      conversionValue: safeMetric(metrics.conversionsValue),
    };
  });

  return {
    account, from, to, campaigns,
    totals: campaigns.reduce((sum, item) => ({
      impressions: sum.impressions + item.impressions,
      clicks: sum.clicks + item.clicks,
      cost: sum.cost + item.cost,
      conversions: sum.conversions + item.conversions,
      conversionValue: sum.conversionValue + item.conversionValue,
    }), { impressions: 0, clicks: 0, cost: 0, conversions: 0, conversionValue: 0 }),
  };
}
