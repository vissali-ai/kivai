"use client";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://fphphknegwlgydwulehl.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_KDt8whhimaeknpeeT0Emjg_DvvwA33Z";
const STORAGE_KEY = "kivai_user_session";
const OAUTH_NEXT_KEY = "kivai_oauth_next";

export type KivaiAuthSession = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  expires_at?: number;
  token_type?: string;
  user?: {
    id: string;
    email?: string;
    user_metadata?: Record<string, unknown>;
  };
};

type AuthError = { error?: string; error_description?: string; msg?: string; message?: string };

function authHeaders(accessToken?: string) {
  return {
    apikey: SUPABASE_PUBLISHABLE_KEY,
    "Content-Type": "application/json",
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };
}

function getErrorMessage(payload: AuthError, fallback: string) {
  return payload.error_description || payload.msg || payload.message || payload.error || fallback;
}

export function saveSession(session: KivaiAuthSession) {
  if (typeof window === "undefined") return;
  const expiresAt = session.expires_at ?? (session.expires_in ? Math.floor(Date.now() / 1000) + session.expires_in : undefined);
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...session, expires_at: expiresAt }));
}

export function getStoredSession(): KivaiAuthSession | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as KivaiAuthSession;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function clearSession() {
  if (typeof window !== "undefined") localStorage.removeItem(STORAGE_KEY);
}

export function consumeOAuthNext() {
  if (typeof window === "undefined") return "/conta";
  const value = sessionStorage.getItem(OAUTH_NEXT_KEY);
  sessionStorage.removeItem(OAUTH_NEXT_KEY);
  return value?.startsWith("/") ? value : "/conta";
}

export async function signInWithPassword(email: string, password: string) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ email, password }),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(getErrorMessage(payload, "Não foi possível entrar."));
  saveSession(payload as KivaiAuthSession);
  return payload as KivaiAuthSession;
}

export async function signUpWithPassword(name: string, email: string, password: string) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ email, password, data: { full_name: name } }),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(getErrorMessage(payload, "Não foi possível criar sua conta."));
  if (payload.access_token) saveSession(payload as KivaiAuthSession);
  return payload as KivaiAuthSession;
}

export function signInWithGoogle(next = "/conta") {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(OAUTH_NEXT_KEY, next.startsWith("/") ? next : "/conta");
  const callback = new URL("/conta/callback", window.location.origin);
  const authorize = new URL(`${SUPABASE_URL}/auth/v1/authorize`);
  authorize.searchParams.set("provider", "google");
  authorize.searchParams.set("redirect_to", callback.toString());
  window.location.assign(authorize.toString());
}

export async function getCurrentUser(session = getStoredSession()) {
  if (!session?.access_token) return null;
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: authHeaders(session.access_token),
  });
  if (!response.ok) return null;
  return response.json();
}

export async function signOut() {
  const session = getStoredSession();
  if (session?.access_token) {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
      method: "POST",
      headers: authHeaders(session.access_token),
    }).catch(() => undefined);
  }
  clearSession();
}

export async function supabaseUserFetch(path: string, init: RequestInit = {}) {
  const session = getStoredSession();
  if (!session?.access_token) throw new Error("Faça login para continuar.");
  return fetch(`${SUPABASE_URL}${path}`, {
    ...init,
    headers: {
      ...authHeaders(session.access_token),
      ...(init.headers ?? {}),
    },
  });
}
