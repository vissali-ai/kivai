"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Star } from "lucide-react";
import { getToolBySlug, toolCategories } from "@/lib/tools";
import { getCurrentUser, getStoredSession, supabaseUserFetch } from "@/lib/user-auth";

type AccountState = "loading" | "guest" | "member";

export function ToolFavoriteControl() {
  const pathname = usePathname();
  const match = /^\/ferramentas\/([a-z0-9]+(?:-[a-z0-9]+)*)\/?$/.exec(pathname);
  const slug = match?.[1] ?? "";
  const isHub = toolCategories.some((category) => category.href === pathname);
  const eligible = Boolean(slug) && !isHub;
  const title = getToolBySlug(slug)?.name || slug.split("-").map((part) => part[0]?.toUpperCase() + part.slice(1)).join(" ");
  const [state, setState] = useState<AccountState>("loading");
  const [userId, setUserId] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!eligible) return;
    let alive = true;
    async function load() {
      setState("loading"); setSaved(false); setError("");
      const session = getStoredSession();
      if (!session?.access_token) { if (alive) setState("guest"); return; }
      try {
        const user = await getCurrentUser(session);
        if (!user?.id) { if (alive) setState("guest"); return; }
        const response = await supabaseUserFetch(
          `/rest/v1/user_tool_favorites?select=tool_slug&user_id=eq.${encodeURIComponent(user.id)}&tool_slug=eq.${encodeURIComponent(slug)}&limit=1`
        );
        if (!response.ok) throw new Error("Não foi possível carregar seus favoritos.");
        const rows = await response.json() as Array<{tool_slug: string}>;
        let isSaved = rows.length > 0;
        if (window.location.search && new URLSearchParams(window.location.search).get("favorite") === "1") {
          if (!isSaved) {
            const add = await supabaseUserFetch("/rest/v1/user_tool_favorites?on_conflict=user_id,tool_slug", {
              method: "POST",
              headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
              body: JSON.stringify({ user_id: user.id, tool_slug: slug, tool_title: title }),
            });
            if (!add.ok) throw new Error("Não foi possível salvar a ferramenta.");
            isSaved = true;
          }
          const url = new URL(window.location.href);
          url.searchParams.delete("favorite");
          window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
        }
        if (!alive) return;
        setUserId(user.id); setSaved(isSaved); setState("member");
      } catch (cause) {
        if (alive) { setState("member"); setError(cause instanceof Error ? cause.message : "Falha ao consultar favoritos."); }
      }
    }
    void load();
    return () => { alive = false; };
  }, [slug, title, eligible]);

  if (!eligible) return null;

  async function toggle() {
    if (saving || !userId) return;
    setSaving(true); setError("");
    try {
      const response = saved
        ? await supabaseUserFetch(`/rest/v1/user_tool_favorites?user_id=eq.${encodeURIComponent(userId)}&tool_slug=eq.${encodeURIComponent(slug)}`, { method: "DELETE" })
        : await supabaseUserFetch("/rest/v1/user_tool_favorites?on_conflict=user_id,tool_slug", {
          method: "POST",
          headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
          body: JSON.stringify({ user_id: userId, tool_slug: slug, tool_title: title }),
        });
      if (!response.ok) throw new Error("Não foi possível atualizar os favoritos.");
      setSaved(!saved);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erro ao salvar.");
    } finally { setSaving(false); }
  }

  const returnPath = pathname + "?favorite=1";
  return (
    <div className="pointer-events-none fixed right-3 top-[4.6rem] z-40 flex max-w-[calc(100vw-1.5rem)] flex-col items-end gap-1 sm:right-6">
      <div className="pointer-events-auto flex items-center gap-2 rounded-xl border border-primary/30 bg-background/95 p-2 text-xs shadow-lg shadow-black/20 backdrop-blur-xl sm:p-2.5">
        <Star className={saved ? "size-4 fill-primary text-primary" : "size-4 text-primary"} aria-hidden="true" />
        {state === "guest" ? (
          <>
            <span className="hidden max-w-[165px] text-muted-foreground sm:inline">Salve esta ferramenta no seu painel</span>
            <Link className="rounded-lg bg-primary px-2.5 py-1.5 font-semibold text-primary-foreground hover:opacity-90" href={`/conta/login?next=${encodeURIComponent(returnPath)}`}>Entrar e favoritar</Link>
          </>
        ) : state === "member" ? (
          <button type="button" disabled={saving || !userId} onClick={toggle} aria-pressed={saved} className="rounded-lg px-1.5 py-1 font-semibold text-foreground hover:text-primary disabled:opacity-50">
            {saving ? "Salvando..." : saved ? "Salvo nos favoritos" : "Salvar nos favoritos"}
          </button>
        ) : <span className="px-2 py-1 text-muted-foreground">Favoritos</span>}
      </div>
      {error ? <p role="alert" className="pointer-events-auto max-w-64 rounded-lg bg-background p-2 text-xs text-red-400 shadow-lg">{error}</p> : null}
    </div>
  );
}
