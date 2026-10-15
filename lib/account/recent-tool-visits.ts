// Histórico local e limitado ao dispositivo, separado por conta e somente com slugs públicos.
import { getToolBySlug } from "@/lib/tools";

const MAX_RECENT_TOOLS = 6;
function storageKey(userId: string) {
  return `kivai_recent_tools_v1:${userId}`;
}

export function readRecentToolSlugs(userId: string): string[] {
  if (!userId || typeof window === "undefined") return [];
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(storageKey(userId)) ?? "[]");
    if (!Array.isArray(value)) return [];
    return [...new Set(value.filter((slug): slug is string =>
      typeof slug === "string" && Boolean(getToolBySlug(slug)?.available),
    ))].slice(0, MAX_RECENT_TOOLS);
  } catch {
    return [];
  }
}

export function rememberRecentTool(userId: string, slug: string) {
  if (!userId || !getToolBySlug(slug)?.available || typeof window === "undefined") return;
  const next = [slug, ...readRecentToolSlugs(userId).filter((item) => item !== slug)].slice(0, MAX_RECENT_TOOLS);
  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(next));
    window.dispatchEvent(new Event("kivai-recent-tools-changed"));
  } catch {
    // Navegação e processamento funcionam normalmente sem armazenamento local.
  }
}
