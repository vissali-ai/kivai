"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Award, CheckCircle2, Compass, RotateCw, Star, Target, Trophy } from "lucide-react";
import { supabaseUserFetch } from "@/lib/user-auth";

type Counts = {
  favorite_count: number;
  result_count: number;
  different_tools: number;
  active_days: number;
};

const EMPTY: Counts = { favorite_count: 0, result_count: 0, different_tools: 0, active_days: 0 };
const MAX_MILESTONES = 6;

export function AccountProgress({ userId, firstMissionDone }: {
  userId: string;
  firstMissionDone: boolean;
}) {
  const [counts, setCounts] = useState<Counts | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await supabaseUserFetch("/rest/v1/rpc/get_kivai_progress", { method: "POST", body: "{}" });
      if (!response.ok) throw new Error("Não foi possível atualizar as conquistas.");
      const data = await response.json() as Partial<Counts>[];
      const row = data[0] ?? EMPTY;
      setCounts({
        favorite_count: Number(row.favorite_count) || 0,
        result_count: Number(row.result_count) || 0,
        different_tools: Number(row.different_tools) || 0,
        active_days: Number(row.active_days) || 0,
      });
      setError("");
    } catch {
      setError("Não foi possível carregar seu progresso. Tente novamente.");
    }
  }, []);

  useEffect(() => {
    setCounts(null);
    const timeout = window.setTimeout(() => { void load(); }, 0);
    const refresh = () => { if (document.visibilityState === "visible") void load(); };
    window.addEventListener("focus", refresh);
    window.addEventListener("kivai-favorites-changed", refresh);
    window.addEventListener("kivai-progress-updated", refresh);
    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("kivai-favorites-changed", refresh);
      window.removeEventListener("kivai-progress-updated", refresh);
    };
  }, [userId, load]);

  const data = counts ?? EMPTY;
  const milestones = [
    { id: "mission", title: "Primeira missão", description: "Conclua a missão inicial do Meu Kivai.", count: firstMissionDone ? 1 : 0, target: 1, icon: Target },
    { id: "favorite", title: "Primeiro favorito", description: "Salve sua primeira ferramenta.", count: data.favorite_count, target: 1, icon: Star },
    { id: "collection", title: "Sua coleção", description: "Tenha três ferramentas favoritas.", count: data.favorite_count, target: 3, icon: Star },
    { id: "results", title: "Cinco resultados", description: "Registre resultados úteis de ferramentas.", count: data.result_count, target: 5, icon: Award },
    { id: "explorer", title: "Explorador", description: "Conclua tarefas em três ferramentas diferentes.", count: data.different_tools, target: 3, icon: Compass },
    { id: "rhythm", title: "Constância", description: "Conclua tarefas em três dias diferentes.", count: data.active_days, target: 3, icon: Trophy },
  ];
  const completed = counts ? milestones.filter(item => item.count >= item.target).length : 0;

  return (
    <section aria-labelledby="kivai-progress-title" className="rounded-2xl border border-primary/25 bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary"><Trophy className="size-4" /> Seu desenvolvimento</p>
          <h2 id="kivai-progress-title" className="mt-2 text-xl font-semibold">Conquistas e progresso</h2>
          <p className="mt-1.5 text-sm leading-6 text-muted-foreground">Pequenos marcos de atividades reais, no seu ritmo. Não interferem no plano nem geram créditos financeiros.</p>
        </div>
        <button type="button" onClick={() => void load()} className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs hover:border-primary/40"><RotateCw className="size-3.5" /> Atualizar</button>
      </div>
      {counts ? (
        <>
          <div className="mt-5 flex items-center justify-between gap-3 text-sm">
            <p><span className="font-semibold text-primary">{completed}</span> de {MAX_MILESTONES} marcos alcançados</p>
            <span className="text-xs text-muted-foreground">{Math.round(100 * completed / MAX_MILESTONES)}%</span>
          </div>
          <div role="progressbar" aria-label="Progresso nas conquistas" aria-valuemin={0} aria-valuemax={MAX_MILESTONES} aria-valuenow={completed} className="mt-2 h-2 overflow-hidden rounded-full bg-muted/70">
            <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${completed / MAX_MILESTONES * 100}%` }} />
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <div className="rounded-lg border border-border/80 p-3"><p className="text-lg font-semibold">{data.result_count}</p><p className="text-xs text-muted-foreground">Resultados registrados</p></div>
            <div className="rounded-lg border border-border/80 p-3"><p className="text-lg font-semibold">{data.different_tools}</p><p className="text-xs text-muted-foreground">Ferramentas concluídas</p></div>
            <div className="rounded-lg border border-border/80 p-3"><p className="text-lg font-semibold">{data.active_days}</p><p className="text-xs text-muted-foreground">Dias de atividade</p></div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {milestones.map(({ id, title, description, count, target, icon: Icon }) => {
              const done = count >= target;
              return (
                <article key={id} className={`rounded-xl border p-4 ${done ? "border-primary/40 bg-primary/[0.055]" : "border-border/80 bg-background/40"}`}>
                  <div className="flex items-start gap-2.5">
                    {done ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" aria-label="Alcançado" /> : <Icon className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />}
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold">{title}</h3>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
                      <p className="mt-2 text-xs font-medium text-primary">{done ? "Alcançado" : `${Math.min(count, target)} de ${target}`}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          <p className="mt-4 text-xs leading-5 text-muted-foreground">Cada ferramenta gera no máximo um registro por dia. Resultados anteriores a esta etapa não são contabilizados retroativamente. Favoritos refletem sua coleção atual.</p>
          <div className="mt-3 flex flex-wrap gap-4 text-sm">
            <Link href="/ferramentas" className="font-medium text-primary hover:underline">Descobrir ferramentas</Link>
            <Link href="/conta#my-tools-title" className="font-medium text-primary hover:underline">Meus favoritos</Link>
          </div>
        </>
      ) : <p className="mt-5 text-sm text-muted-foreground">{error || "Carregando seu progresso..."}</p>}
      {error && counts ? <p role="alert" className="mt-3 text-xs text-red-400">{error}</p> : null}
    </section>
  );
}
