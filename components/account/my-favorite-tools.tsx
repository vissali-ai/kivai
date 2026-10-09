"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabaseUserFetch } from "@/lib/user-auth";

type Favorite = { user_id: string; tool_slug: string; tool_title: string; created_at: string };

export function MyFavoriteTools() {
  const [items, setItems] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removing, setRemoving] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let alive = true;
    supabaseUserFetch("/rest/v1/user_tool_favorites?select=user_id,tool_slug,tool_title,created_at&order=created_at.desc&limit=500")
      .then(async (response) => {
        if (!response.ok) throw new Error("Não foi possível carregar as ferramentas favoritas.");
        const rows = await response.json() as Favorite[];
        if (alive) { setItems(rows); setError(""); }
      })
      .catch((cause) => { if (alive) setError(cause instanceof Error ? cause.message : "Erro ao carregar favoritos."); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [retry]);

  useEffect(() => {
    const refresh = () => { setLoading(true); setRetry((value) => value + 1); };
    window.addEventListener("focus", refresh);
    window.addEventListener("kivai-favorites-changed", refresh);
    return () => { window.removeEventListener("focus", refresh); window.removeEventListener("kivai-favorites-changed", refresh); };
  }, []);

  async function remove(item: Favorite) {
    if (removing) return;
    setRemoving(item.tool_slug); setError("");
    try {
      const response = await supabaseUserFetch(`/rest/v1/user_tool_favorites?user_id=eq.${encodeURIComponent(item.user_id)}&tool_slug=eq.${encodeURIComponent(item.tool_slug)}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Não foi possível remover a ferramenta.");
      setItems((current) => current.filter((entry) => entry.tool_slug !== item.tool_slug));
      window.dispatchEvent(new Event("kivai-favorites-changed"));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erro ao remover favorito.");
    } finally { setRemoving(""); }
  }

  return (
    <section className="rounded-2xl border border-primary/25 bg-card p-5 sm:p-6" aria-labelledby="my-tools-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="my-tools-title" className="flex items-center gap-2 text-xl font-semibold"><Star className="size-5 text-primary" /> Minhas Ferramentas</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">Suas ferramentas favoritas, sempre disponíveis nesta conta. Não altera os benefícios do seu plano.</p>
        </div>
        <Button asChild variant="outline" size="sm"><Link href="/ferramentas">Explorar ferramentas <ArrowRight className="size-4" /></Link></Button>
      </div>
      {loading ? <p className="mt-4 text-sm text-muted-foreground">Carregando seus favoritos...</p>
        : items.length === 0 && !error ? <p className="mt-5 rounded-xl border border-dashed border-white/15 p-5 text-sm text-muted-foreground">Você ainda não adicionou nenhuma ferramenta. Abra uma ferramenta e clique em Salvar nos favoritos para encontrá-la aqui.</p>
        : null}
      {items.length > 0 ? <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => <div key={item.tool_slug} className="flex min-w-0 items-center gap-3 rounded-xl border border-white/10 bg-background/40 p-3">
          <Link className="min-w-0 flex-1 hover:text-primary" href={`/ferramentas/${item.tool_slug}`}>
            <span className="block truncate text-sm font-semibold">{item.tool_title}</span>
            <span className="mt-1 block text-xs text-muted-foreground">Abrir ferramenta</span>
          </Link>
          <button type="button" aria-label={`Remover ${item.tool_title} dos favoritos`} disabled={Boolean(removing)}
            onClick={() => void remove(item)} className="rounded-lg p-2 text-muted-foreground hover:bg-white/5 hover:text-red-400 disabled:opacity-40">
            <Trash2 aria-hidden="true" className="size-4" />
          </button>
        </div>)}
      </div> : null}
      {error ? <p role="alert" className="mt-3 text-sm text-red-400">{error} <button type="button" onClick={() => setRetry((value) => value + 1)} className="underline">Tentar novamente</button></p> : null}
    </section>
  );
}
