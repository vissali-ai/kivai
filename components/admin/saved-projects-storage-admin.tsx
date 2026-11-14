"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type Project = { id: string; user_id: string; kind: string; title: string; updated_at: string; bytes: number };
const formatBytes = (value: number) => value >= 1024 * 1024 ? `${(value / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(value / 1024)} KB`;

export function SavedProjectsStorageAdmin() {
  const [items, setItems] = useState<Project[] | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Project | null>(null);
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin/saved-projects-storage", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Falha na consulta.");
      setItems(data.projects as Project[]);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Falha na consulta."); }
    finally { setBusy(false); }
  }
  async function remove() {
    if (!selected || confirm !== "EXCLUIR DEFINITIVAMENTE") return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin/saved-projects-storage", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: selected.id, userId: selected.user_id, confirm }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Falha na exclusão.");
      setSelected(null); setConfirm(""); setMessage("Projeto excluído permanentemente."); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Falha na exclusão."); }
    finally { setBusy(false); }
  }
  const filtered = (items ?? []).filter(item => `${item.title} ${item.kind} ${item.user_id}`.toLowerCase().includes(query.toLowerCase()));

  return <section className="space-y-4 border border-border bg-card p-5" aria-label="Projetos salvos dos usuários">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-semibold">Projetos salvos</h2><p className="mt-1 text-sm text-muted-foreground">Inventário mínimo e exclusão individual. O conteúdo dos projetos não é exibido.</p></div><Button variant="outline" disabled={busy} onClick={() => void load()}>{busy ? "Consultando…" : "Atualizar inventário"}</Button></div>
    {message ? <p role="status" className="text-sm text-muted-foreground">{message}</p> : null}
    {items ? <><label className="block text-sm">Buscar por título, tipo ou identificador do usuário<input value={query} onChange={event => setQuery(event.target.value)} className="mt-1 w-full border border-border bg-background p-3" /></label>
      <div className="max-h-[460px] space-y-2 overflow-y-auto">{filtered.map(project => <div key={project.id} className="flex flex-wrap items-center gap-3 border border-border p-3"><div className="min-w-0 flex-1"><p className="font-medium">{project.title}</p><p className="break-all text-xs text-muted-foreground">{project.kind} · Conta {project.user_id} · {formatBytes(project.bytes)} · {project.updated_at.slice(0, 10)}</p></div><Button variant="destructive" size="sm" onClick={() => { setSelected(project); setConfirm(""); }}>Excluir</Button></div>)}{filtered.length === 0 ? <p className="p-6 text-center text-sm text-muted-foreground">Nenhum projeto encontrado.</p> : null}</div>
    </> : null}
    {selected ? <div className="space-y-3 border border-destructive/40 p-4"><p className="text-sm font-semibold">Excluir definitivamente “{selected.title}”?</p><p className="text-xs text-muted-foreground">Essa ação não pode ser desfeita. Ela exclui somente este projeto e os registros dependentes.</p><label className="block text-sm">Digite EXCLUIR DEFINITIVAMENTE<input value={confirm} onChange={event => setConfirm(event.target.value)} className="mt-1 w-full border border-border bg-background p-2" /></label><div className="flex gap-2"><Button variant="destructive" disabled={busy || confirm !== "EXCLUIR DEFINITIVAMENTE"} onClick={() => void remove()}>Excluir permanentemente</Button><Button variant="outline" onClick={() => { setSelected(null); setConfirm(""); }}>Cancelar</Button></div></div> : null}
  </section>;
}
