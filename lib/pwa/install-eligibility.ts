// Preferência local do navegador: somente contagem/horários, nunca arquivos ou dados da tarefa.
const USAGE_KEY = "kivai_pwa_engagement_v1";
const DISMISS_KEY = "kivai_pwa_install_dismiss_until";
const DAY = 24 * 60 * 60 * 1000;

type Usage = { firstAt: number; lastAt: number; count: number; lastSlug: string };

export function recordSuccessfulToolUse(slug: string) {
  if (typeof window === "undefined" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return;
  try {
    const now = Date.now();
    const raw = window.localStorage.getItem(USAGE_KEY);
    const stored: Partial<Usage> = raw ? JSON.parse(raw) as Partial<Usage> : {};
    const lastAt = typeof stored.lastAt === "number" ? stored.lastAt : 0;
    if (stored.lastSlug === slug && now - lastAt < 60_000) return;
    const count = Math.min(3, Math.max(0, Number(stored.count) || 0) + 1);
    const firstAt = typeof stored.firstAt === "number" && stored.firstAt > 0 ? stored.firstAt : now;
    window.localStorage.setItem(USAGE_KEY, JSON.stringify({ firstAt, lastAt: now, count, lastSlug: slug }));
  } catch {
    // O processamento continua funcionando mesmo quando o navegador bloqueia storage.
  }
}

export function isEligibleForInstallOffer(now = Date.now(), pathname = "") {
  if (typeof window === "undefined") return false;
  try {
    if (now < Number(window.localStorage.getItem(DISMISS_KEY) || 0)) return false;
    const raw = window.localStorage.getItem(USAGE_KEY);
    if (!raw) return false;
    const stats: Partial<Usage> = JSON.parse(raw) as Partial<Usage>;
    // Nunca sobrepor o convite ao resultado que acabou de ser gerado.
    if (pathname === `/ferramentas/${stats.lastSlug}`) return false;
    return Number(stats.count) >= 2 || (Number(stats.count) >= 1 && now - Number(stats.firstAt) >= DAY);
  } catch {
    return false;
  }
}

export function deferInstallOffer(days = 30) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(DISMISS_KEY, String(Date.now() + days * DAY)); } catch { /* armazenamento opcional */ }
}
