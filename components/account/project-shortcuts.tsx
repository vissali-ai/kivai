"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowDown, ArrowRight, ArrowUp, Check, FolderPlus, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getStoredSession } from "@/lib/user-auth";

export type ProjectShortcut = { kind: string; label: string; href: string };
type Props = { entries: ProjectShortcut[]; userId: string | null; hasProjects: boolean };
const defaults = ["post_creator", "calendar", "briefing", "social_report"];

async function syncShortcuts(method: "GET" | "PUT", toolKinds?: string[]) {
  const token = getStoredSession()?.access_token;
  if (!token) throw new Error("Entre na sua conta para personalizar os atalhos.");
  const response = await fetch("/api/account/project-shortcuts", {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    ...(toolKinds ? { body: JSON.stringify({ toolKinds }) } : {}),
    cache: "no-store",
  });
  const data = await response.json() as { toolKinds?: string[]; error?: string };
  if (!response.ok || !Array.isArray(data.toolKinds)) throw new Error(data.error || "Não foi possível salvar seus atalhos.");
  return data.toolKinds;
}

export function ProjectShortcuts({ entries, userId, hasProjects }: Props) {
  const [selected, setSelected] = useState<string[]>(defaults);
  const [draft, setDraft] = useState<string[]>(defaults);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(Boolean(userId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const byKind = new Map(entries.map(entry => [entry.kind, entry]));
  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    let active = true;
    setLoading(true);
    syncShortcuts("GET").then(kinds => {
      if (!active) return;
      const valid = kinds.filter(kind => byKind.has(kind)).slice(0, 6);
      if (valid.length) {
        setSelected(valid);
        setDraft(valid);
      }
      setError("");
    }).catch(() => {
      if (active) setError("Não foi possível carregar seus atalhos personalizados. As sugestões padrão continuam disponíveis.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [userId, retry]); // Entries are the stable catalog provided by the library.

  function move(kind: string, direction: -1 | 1) {
    setDraft(current => {
      const index = current.indexOf(kind);
      const target = index + direction;
      if (index === -1 || target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }
  function toggle(kind: string) {
    setError("");
    setDraft(current => {
      if (current.includes(kind)) return current.filter(item => item !== kind);
      return current.length === 6 ? current : [...current, kind];
    });
  }
  async function save() {
    if (!userId || saving || draft.length === 0 || draft.length > 6) return;
    setSaving(true);
    setError("");
    try {
      const value = await syncShortcuts("PUT", draft);
      setSelected(value);
      setDraft(value);
      setEditing(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível salvar a seleção.");
    } finally { setSaving(false); }
  }

  return <section aria-labelledby="create-project-shortcuts-title" className="rounded-2xl border border-border bg-background/40 p-4 sm:p-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <FolderPlus className="size-5 shrink-0 text-primary" aria-hidden="true" />
          <h3 id="create-project-shortcuts-title" className="text-lg font-semibold">{hasProjects ? "Criar novo projeto" : "Crie seu primeiro projeto"}</h3>
        </div>
        <p className="mt-1.5 text-sm leading-6 text-muted-foreground">Escolha uma ferramenta para começar. Personalize os atalhos que aparecem aqui.</p>
      </div>
      {userId ? <Button size="sm" variant="outline" disabled={loading || saving} onClick={() => {
        setDraft([...selected]); setEditing(value => !value); setError("");
      }}><Settings2 className="size-4" />{editing ? "Fechar edição" : "Personalizar"}</Button> : null}
    </div>
    {loading ? <p role="status" className="mt-3 text-xs text-muted-foreground">Carregando sua seleção...</p> : null}
    {error ? <div className="mt-3 flex flex-wrap items-center gap-2 text-sm"><p role="alert" className="text-destructive">{error}</p>{!editing && userId ? <Button size="sm" variant="outline" onClick={() => { setError(""); setRetry(value => value + 1); }}>Tentar novamente</Button> : null}</div> : null}

    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
      {selected.map(kind => {
        const entry = byKind.get(kind);
        if (!entry) return null;
        return <Link key={kind} href={entry.href} className="flex min-h-20 min-w-0 flex-col justify-between gap-2 rounded-xl border border-border bg-card p-3 text-sm font-medium transition-colors hover:border-primary/50 hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          <span className="break-words leading-5">{entry.label}</span>
          <ArrowRight className="size-4 text-primary" aria-hidden="true" />
        </Link>;
      })}
    </div>

    {editing ? <div className="mt-5 space-y-4 rounded-xl border border-border bg-card p-3 sm:p-4">
      <div><h4 className="text-sm font-semibold">Escolha até 6 ferramentas</h4><p className="mt-1 text-xs text-muted-foreground">{draft.length}/6 selecionadas. Use as setas para definir a ordem.</p></div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {entries.map(entry => {
          const checked = draft.includes(entry.kind);
          return <button key={entry.kind} type="button" aria-pressed={checked} disabled={saving || (!checked && draft.length === 6)} onClick={() => toggle(entry.kind)} className={`flex min-h-11 items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors disabled:opacity-40 ${checked ? "border-primary/50 bg-primary/10" : "border-border hover:bg-accent"}`}>
            <span className={`flex size-4 shrink-0 items-center justify-center rounded border ${checked ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/50"}`}>{checked ? <Check className="size-3" aria-hidden="true" /> : null}</span>
            <span className="min-w-0 flex-1">{entry.label}</span>
          </button>;
        })}
      </div>
      {draft.length ? <div className="space-y-2">
        <h4 className="text-sm font-medium">Ordem dos atalhos</h4>
        {draft.map((kind, index) => <div key={kind} className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm">
          <span className="min-w-0 flex-1 break-words">{index + 1}. {byKind.get(kind)?.label}</span>
          <Button size="sm" variant="outline" disabled={saving || index === 0} aria-label={`Subir ${byKind.get(kind)?.label}`} onClick={() => move(kind, -1)}><ArrowUp className="size-4" /></Button>
          <Button size="sm" variant="outline" disabled={saving || index === draft.length - 1} aria-label={`Descer ${byKind.get(kind)?.label}`} onClick={() => move(kind, 1)}><ArrowDown className="size-4" /></Button>
        </div>)}
      </div> : <p role="status" className="text-sm text-destructive">Selecione pelo menos uma ferramenta.</p>}
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" disabled={saving} onClick={() => { setEditing(false); setDraft([...selected]); setError(""); }}>Cancelar</Button>
        <Button disabled={saving || !draft.length} onClick={() => void save()}>{saving ? "Salvando..." : "Salvar minha seleção"}</Button>
      </div>
    </div> : null}

    <details className="mt-4 rounded-lg border border-border/70 p-3">
      <summary className="min-h-8 cursor-pointer text-sm font-medium text-primary">Ver todas as ferramentas compatíveis</summary>
      <nav aria-label="Todas as ferramentas com projetos salvos" className="mt-3 flex flex-wrap gap-2">
        {entries.map(entry => <Link key={entry.kind} href={entry.href} className="inline-flex min-h-10 items-center rounded-lg border border-border px-3 py-2 text-sm text-foreground hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">{entry.label}</Link>)}
      </nav>
    </details>
  </section>;
}
