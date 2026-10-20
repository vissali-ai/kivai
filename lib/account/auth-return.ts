const STORAGE_KEY = "kivai_auth_return_path";
const MAX_AGE_MS = 24 * 60 * 60 * 1000;
const BASE_URL = "https://kivai.com.br";

export function normalizeAuthReturnPath(value: string | null | undefined): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//") || /[\\\x00-\x1f\x7f]/.test(value)) return null;
  try {
    const url = new URL(value, BASE_URL);
    if (url.origin !== BASE_URL || /^\/(?:admin|login)(?:\/|$)/.test(url.pathname)
      || /^\/conta\/(?:login|cadastro|callback)(?:\/|$)/.test(url.pathname)) return null;
    return url.pathname + url.search + url.hash;
  } catch {
    return null;
  }
}

export function rememberAuthReturnPath(path?: string) {
  if (typeof window === "undefined") return;
  const current = path ?? window.location.pathname + window.location.search + window.location.hash;
  const destination = normalizeAuthReturnPath(current);
  if (!destination) return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ destination, time: Date.now() }));
  } catch {
    // Browsers may block session storage.
  }
}

export function resolveAuthReturnPath(explicit?: string | null): string {
  if (explicit != null) return normalizeAuthReturnPath(explicit) ?? "/conta";
  if (typeof window === "undefined") return "/conta";
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return "/conta";
    const saved = JSON.parse(raw) as { destination?: string; time?: number };
    if (!saved.time || Date.now() - saved.time > MAX_AGE_MS) return "/conta";
    return normalizeAuthReturnPath(saved.destination) ?? "/conta";
  } catch {
    return "/conta";
  }
}
