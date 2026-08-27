"use client";

import { getCurrentUser, getStoredSession, supabaseUserFetch } from "@/lib/user-auth";

export type KivaiPlanCode = "free" | "pro" | "agency";

export type ProSnapshotPayload = {
  followers: string[];
  following: string[];
};

export type ProHistoryComparison = {
  enabled: boolean;
  firstSnapshot: boolean;
  snapshotId?: string;
  previousAnalyzedAt?: string | null;
  newFollowers: string[];
  unfollowers: string[];
};

type SocialAccount = {
  id: string;
  username: string;
  follower_count: number | null;
  following_count: number | null;
};

type SnapshotRow = {
  id: string;
  storage_path: string | null;
  analyzed_at: string;
};

const ACCOUNT_LIMIT: Record<Exclude<KivaiPlanCode, "free">, number> = { pro: 5, agency: 20 };
const FOLLOWER_LIMIT: Record<Exclude<KivaiPlanCode, "free">, number | null> = { pro: 500000, agency: null };

function cleanUsername(value: string) {
  return value.trim().replace(/^@/, "").toLowerCase();
}

async function parseJsonResponse<T>(response: Response, fallback: T): Promise<T> {
  try { return await response.json() as T; } catch { return fallback; }
}

export async function getAuthenticatedPlan(): Promise<{ userId: string; plan: KivaiPlanCode } | null> {
  const session = getStoredSession();
  if (!session?.access_token) return null;
  const user = await getCurrentUser(session);
  if (!user?.id) return null;
  const response = await supabaseUserFetch(`/rest/v1/user_profiles?select=plan_code&user_id=eq.${encodeURIComponent(user.id)}&limit=1`);
  if (!response.ok) return { userId: user.id, plan: "free" };
  const rows = await parseJsonResponse<Array<{ plan_code?: KivaiPlanCode }>>(response, []);
  return { userId: user.id, plan: rows[0]?.plan_code ?? "free" };
}

async function getOrCreateAccount(params: {
  userId: string;
  plan: "pro" | "agency";
  username: string;
  followerCount: number;
  followingCount: number;
}) {
  const username = cleanUsername(params.username);
  if (!username || username.includes(" ")) throw new Error("Informe o @ do perfil do Instagram que está sendo analisado.");

  const listResponse = await supabaseUserFetch("/rest/v1/social_accounts?select=id,username,follower_count,following_count&platform=eq.instagram&order=updated_at.desc");
  if (!listResponse.ok) throw new Error("Não foi possível verificar suas contas salvas.");
  const accounts = await parseJsonResponse<SocialAccount[]>(listResponse, []);
  const existing = accounts.find((item) => item.username.toLowerCase() === username);
  if (existing) return existing;

  if (accounts.length >= ACCOUNT_LIMIT[params.plan]) {
    throw new Error(`Seu plano ${params.plan === "pro" ? "Pro" : "Agency"} permite até ${ACCOUNT_LIMIT[params.plan]} contas do Instagram.`);
  }

  const response = await supabaseUserFetch("/rest/v1/social_accounts", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      user_id: params.userId,
      platform: "instagram",
      username,
      follower_count: params.followerCount,
      following_count: params.followingCount,
      last_analyzed_at: new Date().toISOString(),
    }),
  });
  if (!response.ok) {
    const payload = await parseJsonResponse<{ message?: string }>(response, {});
    throw new Error(payload.message || "Não foi possível cadastrar esta conta do Instagram.");
  }
  const rows = await parseJsonResponse<SocialAccount[]>(response, []);
  if (!rows[0]) throw new Error("Não foi possível cadastrar esta conta do Instagram.");
  return rows[0];
}

async function gzipJson(value: unknown) {
  if (typeof CompressionStream === "undefined") throw new Error("Seu navegador não oferece o recurso necessário para salvar o histórico Pro. Atualize o navegador e tente novamente.");
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream("gzip"));
  return new Blob([await new Response(stream).arrayBuffer()], { type: "application/gzip" });
}

async function gunzipJson(blob: Blob): Promise<ProSnapshotPayload> {
  if (typeof DecompressionStream === "undefined") throw new Error("Seu navegador não oferece o recurso necessário para comparar o histórico Pro.");
  const stream = blob.stream().pipeThrough(new DecompressionStream("gzip"));
  return JSON.parse(await new Response(stream).text()) as ProSnapshotPayload;
}

async function uploadSnapshot(path: string, payload: ProSnapshotPayload) {
  const blob = await gzipJson(payload);
  const response = await supabaseUserFetch(`/storage/v1/object/social-snapshots/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/gzip", "x-upsert": "true" },
    body: blob,
  });
  if (!response.ok) throw new Error("Não foi possível armazenar o snapshot privado da análise.");
}

async function downloadSnapshot(path: string) {
  const response = await supabaseUserFetch(`/storage/v1/object/authenticated/social-snapshots/${path}`, {
    method: "GET",
    headers: { "Content-Type": "application/octet-stream" },
  });
  if (!response.ok) throw new Error("Não foi possível carregar o snapshot anterior.");
  return gunzipJson(await response.blob());
}

function compare(previous: ProSnapshotPayload | null, current: ProSnapshotPayload) {
  if (!previous) return { newFollowers: [] as string[], unfollowers: [] as string[] };
  const before = new Set(previous.followers);
  const now = new Set(current.followers);
  return {
    newFollowers: current.followers.filter((username) => !before.has(username)).sort(),
    unfollowers: previous.followers.filter((username) => !now.has(username)).sort(),
  };
}

export async function saveProAnalysis(params: {
  userId: string;
  plan: "pro" | "agency";
  instagramUsername: string;
  sourceFilename: string;
  followers: string[];
  following: string[];
  mutualCount: number;
  notFollowingBackCount: number;
  notFollowedBackCount: number;
  interactionSummary?: Record<string, unknown>;
}): Promise<ProHistoryComparison> {
  const limit = FOLLOWER_LIMIT[params.plan];
  if (limit && params.followers.length > limit) {
    throw new Error(`O plano Pro analisa até ${limit.toLocaleString("pt-BR")} seguidores por perfil.`);
  }

  const account = await getOrCreateAccount({
    userId: params.userId,
    plan: params.plan,
    username: params.instagramUsername,
    followerCount: params.followers.length,
    followingCount: params.following.length,
  });

  const previousResponse = await supabaseUserFetch(`/rest/v1/social_snapshots?select=id,storage_path,analyzed_at&social_account_id=eq.${encodeURIComponent(account.id)}&order=analyzed_at.desc&limit=1`);
  const previousRows = previousResponse.ok ? await parseJsonResponse<SnapshotRow[]>(previousResponse, []) : [];
  const previousRow = previousRows[0] ?? null;
  const previousPayload = previousRow?.storage_path ? await downloadSnapshot(previousRow.storage_path).catch(() => null) : null;

  const currentPayload: ProSnapshotPayload = { followers: params.followers, following: params.following };
  const changes = compare(previousPayload, currentPayload);
  const snapshotId = crypto.randomUUID();
  const storagePath = `${params.userId}/${account.id}/${snapshotId}.json.gz`;
  await uploadSnapshot(storagePath, currentPayload);

  const insertResponse = await supabaseUserFetch("/rest/v1/social_snapshots", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      id: snapshotId,
      user_id: params.userId,
      social_account_id: account.id,
      source: "meta_export",
      source_filename: params.sourceFilename,
      follower_count: params.followers.length,
      following_count: params.following.length,
      mutual_count: params.mutualCount,
      not_following_back_count: params.notFollowingBackCount,
      not_followed_back_count: params.notFollowedBackCount,
      new_followers_count: previousPayload ? changes.newFollowers.length : null,
      unfollowers_count: previousPayload ? changes.unfollowers.length : null,
      storage_path: storagePath,
      analysis_summary: {
        ...params.interactionSummary,
        newFollowersSample: changes.newFollowers.slice(0, 5000),
        unfollowersSample: changes.unfollowers.slice(0, 5000),
      },
      analyzed_at: new Date().toISOString(),
    }),
  });
  if (!insertResponse.ok) throw new Error("O arquivo foi analisado, mas não foi possível salvar o histórico Pro.");

  await supabaseUserFetch(`/rest/v1/social_accounts?id=eq.${encodeURIComponent(account.id)}`, {
    method: "PATCH",
    body: JSON.stringify({
      follower_count: params.followers.length,
      following_count: params.following.length,
      last_analyzed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }),
  }).catch(() => undefined);

  return {
    enabled: true,
    firstSnapshot: !previousPayload,
    snapshotId,
    previousAnalyzedAt: previousRow?.analyzed_at ?? null,
    newFollowers: changes.newFollowers,
    unfollowers: changes.unfollowers,
  };
}
