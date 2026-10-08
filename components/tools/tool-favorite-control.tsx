"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { Star } from "lucide-react";
import { getToolBySlug, toolCategories } from "@/lib/tools";
import { getCurrentUser, getStoredSession, supabaseUserFetch } from "@/lib/user-auth";

type AccountState = "loading" | "guest" | "member";

// Texto curto e dinâmico conforme a ferramenta e o estado da conta.
function invitationText(name: string, accountState: AccountState, saved: boolean) {
  if (accountState === "guest") {
    return `Faça login e salve ${name} nos favoritos do seu painel. Explore o Kivai e monte sua coleção de ferramentas.`;
  }
  if (accountState === "member" && saved) {
    return `${name} já está no seu painel. Explore o Kivai e favorite outras ferramentas.`;
  }
  return `Salve ${name} nos favoritos do seu painel. Explore o Kivai e monte sua coleção de ferramentas.`;
}

export function ToolFavoriteControl() {
  const pathname = usePathname();
  const match = /^\/ferramentas\/([a-z0-9]+(?:-[a-z0-9]+)*)\/?$/.exec(pathname);
  const slug = match?.[1] ?? "";
  const isHub = toolCategories.some((category) => category.href === pathname);
  const eligible = Boolean(slug) && !isHub;
  const tool = getToolBySlug(slug);
  const defaultTitle = tool?.name || slug.split("-").map((part) => part[0]?.toUpperCase() + part.slice(1)).join(" ");
  const title = defaultTitle;
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [state, setState] = useState<AccountState>("loading");
  const [userId, setUserId] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const invitation = invitationText(title, state, saved);

  // O slot está abaixo do processamento e antes do conteúdo editorial completo.
  // Ferramentas antigas sem slot recebem o convite após a área principal.
  useEffect(() => {
    if (!eligible) {
      setPortalTarget(null);
      return;
    }
    let fallback: HTMLDivElement | null = null;
    let current: HTMLElement | null = null;

    const position = () => {
      const slot = document.querySelector<HTMLElement>("[data-kivai-favorite-slot]");
      if (slot) {
        if (fallback) { fallback.remove(); fallback = null; }
        if (current !== slot) { current = slot; setPortalTarget(slot); }
        return;
      }
      const toolArea = document.querySelector<HTMLElement>("main")
        ?? document.querySelector<HTMLElement>("body > section.min-h-screen");
      if (!toolArea) return;
      if (!fallback) {
        fallback = document.createElement("div");
        fallback.className = "mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 lg:px-8";
        fallback.setAttribute("data-kivai-favorite-fallback", slug);
        toolArea.insertAdjacentElement("afterend", fallback);
      }
      if (current !== fallback) { current = fallback; setPortalTarget(fallback); }
    };

    const observer = new MutationObserver(() => {
      if (!current?.isConnected || (!document.querySelector("[data-kivai-favorite-slot]") && !fallback)
          || (fallback && document.querySelector("[data-kivai-favorite-slot]"))) {
        position();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    position();
    return () => {
      observer.disconnect();
      fallback?.remove();
      setPortalTarget(null);
    };
  }, [slug, eligible]);

  useEffect(() => {
    if (!eligible) return;
    let alive = true;
    async function load() {
      setState("loading"); setSaved(false); setUserId(""); setError("");
      const session = getStoredSession();
      if (!session?.access_token) { if (alive) setState("guest"); return; }
      try {
        const user = await getCurrentUser(session);
        if (!user?.id) { if (alive) setState("guest"); return; }
        const response = await supabaseUserFetch(
          `/rest/v1/user_tool_favorites?select=tool_slug&user_id=eq.${encodeURIComponent(user.id)}&tool_slug=eq.${encodeURIComponent(slug)}&limit=1`
        );
        if (!response.ok) throw new Error("Não foi possível carregar seus favoritos.");
        const rows = await response.json() as Array<{ tool_slug: string }>;
        let isSaved = rows.length > 0;
        if (new URLSearchParams(window.location.search).get("favorite") === "1") {
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
  }, [slug, eligible, title]);

  if (!eligible || !portalTarget) return null;

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
  const query = encodeURIComponent(returnPath);
  return createPortal(
    <aside aria-label="Adicionar ferramenta aos favoritos" className="rounded-lg border border-primary/20 bg-primary/[0.035] px-3 py-2.5 text-left sm:px-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex min-w-0 items-start gap-2">
          <Star className={`mt-0.5 size-4 shrink-0 text-primary ${saved ? "fill-primary" : ""}`} aria-hidden="true" />
          <p className="text-xs leading-5 text-foreground sm:text-sm">{invitation}</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2 pl-6 sm:pl-0">
          {state === "guest" ? <>
            <Link className="inline-flex min-h-8 items-center rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90" href={`/conta/login?next=${query}`}>Entrar e salvar</Link>
            <Link className="inline-flex min-h-8 items-center rounded-md border border-primary/25 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-primary/10" href={`/conta/cadastro?next=${query}`}>Criar conta</Link>
          </> : state === "member" ? (
            <button type="button" disabled={saving || !userId} onClick={toggle} aria-pressed={saved} className="inline-flex min-h-8 items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">
              <Star aria-hidden="true" className={`size-3.5 ${saved ? "fill-current" : ""}`} />
              {saving ? "Salvando..." : saved ? "Remover favorito" : "Salvar favorito"}
            </button>
          ) : <span className="text-xs text-muted-foreground">Verificando sua conta...</span>}
        </div>
      </div>
      {error ? <p role="alert" className="mt-1 pl-6 text-xs text-red-400">{error}</p> : null}
    </aside>,
    portalTarget
  );
}
