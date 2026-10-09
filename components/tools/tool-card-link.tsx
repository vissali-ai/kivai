"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Loader2, Star } from "lucide-react";
import { getCurrentUser, getStoredSession, supabaseUserFetch } from "@/lib/user-auth";

const FavoritesContext = createContext<{
  saved: Set<string>; loading: boolean;
  toggle: (slug: string, title: string) => Promise<void>;
} | null>(null);

export function CardFavoritesProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [saved, setSaved] = useState<Set<string>>(() => new Set());
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const pending = useRef(new Set<string>());
  const userId = useRef("");
  const loadError = useRef(false);

  useEffect(() => {
    const refresh = () => setRevision(value => value + 1);
    window.addEventListener("focus", refresh);
    window.addEventListener("kivai-favorites-changed", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("kivai-favorites-changed", refresh);
    };
  }, []);

  useEffect(() => {
    let alive = true;
    const timer = window.setTimeout(async () => {
      setLoading(true); loadError.current = false; userId.current = "";
      try {
        if (pathname.startsWith("/admin") || !getStoredSession()?.access_token) {
          if (alive) setSaved(new Set());
          return;
        }
        const user = await getCurrentUser();
        if (!alive) return;
        if (!user?.id) { setSaved(new Set()); return; }
        const response = await supabaseUserFetch(`/rest/v1/user_tool_favorites?select=tool_slug&user_id=eq.${encodeURIComponent(user.id)}&limit=500`);
        if (!response.ok) throw new Error("favorites unavailable");
        const rows = await response.json() as Array<{ tool_slug: string }>;
        if (alive) { userId.current = user.id; setSaved(new Set(rows.map(row => row.tool_slug))); }
      } catch { if (alive) loadError.current = true; }
      finally { if (alive) setLoading(false); }
    }, 0);
    return () => { alive = false; window.clearTimeout(timer); };
  }, [pathname, revision]);

  async function toggle(slug: string, title: string) {
    if (loading || pending.current.has(slug)) return;
    if (loadError.current) {
      setRevision(value => value + 1);
      throw new Error("Não foi possível carregar os favoritos. Tente novamente.");
    }
    if (!userId.current) {
      router.push(`/conta/login?next=${encodeURIComponent(`/ferramentas/${slug}?favorite=1`)}`);
      return;
    }
    pending.current.add(slug);
    try {
      const response = saved.has(slug)
        ? await supabaseUserFetch(`/rest/v1/user_tool_favorites?user_id=eq.${encodeURIComponent(userId.current)}&tool_slug=eq.${encodeURIComponent(slug)}`, { method: "DELETE" })
        : await supabaseUserFetch("/rest/v1/user_tool_favorites?on_conflict=user_id,tool_slug", {
          method: "POST", headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
          body: JSON.stringify({ user_id: userId.current, tool_slug: slug, tool_title: title }),
        });
      if (!response.ok) throw new Error("Não foi possível atualizar. Tente novamente.");
      setSaved(current => { const next = new Set(current); if (saved.has(slug)) next.delete(slug); else next.add(slug); return next; });
      window.dispatchEvent(new Event("kivai-favorites-changed"));
    } finally { pending.current.delete(slug); }
  }

  return <FavoritesContext.Provider value={{ saved, loading, toggle }}>{children}</FavoritesContext.Provider>;
}

// The link and button are siblings: no nested interactive elements or accidental navigation.
export function ToolCardLink({ href, toolTitle, children, className = "", prefetch = false, favoriteEnabled = true }: {
  href: string; toolTitle: string; children: ReactNode; className?: string; prefetch?: boolean; favoriteEnabled?: boolean;
}) {
  const favorites = useContext(FavoritesContext);
  const slug = href.split("/").filter(Boolean).pop() ?? "";
  const saved = favorites?.saved.has(slug) ?? false;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const label = `${saved ? "Remover" : "Adicionar"} ${toolTitle} ${saved ? "dos" : "aos"} favoritos`;
  async function toggle() {
    if (!favorites || busy) return;
    setBusy(true); setError("");
    try { await favorites.toggle(slug, toolTitle); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Tente novamente."); }
    finally { setBusy(false); }
  }
  return <article className={`relative flex flex-col ${className.replace("sm:aspect-square", "")}`}>
    <Link href={href} prefetch={prefetch} className="flex-1 after:absolute after:inset-0 focus-visible:outline-2 focus-visible:outline-primary">{children}</Link>
    {favoriteEnabled ? <div className="relative z-10 mt-3 flex items-center justify-end gap-2">
      {error ? <span role="alert" className="text-xs text-red-400">{error}</span> : null}
      <button type="button" title={label} aria-label={label} aria-pressed={saved} disabled={!favorites || favorites.loading || busy}
        onClick={() => void toggle()} className={`inline-flex size-10 shrink-0 items-center justify-center rounded-full border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 ${saved ? "border-primary/50 bg-primary/15 text-primary" : "border-white/15 bg-background text-muted-foreground hover:border-primary hover:text-primary"}`}>
        {busy ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : <Star aria-hidden="true" className={`size-4 ${saved ? "fill-current" : ""}`} />}
      </button>
    </div> : null}
  </article>;
}
