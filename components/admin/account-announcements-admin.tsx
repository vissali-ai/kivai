"use client";

import { FormEvent, useState } from "react";
import { BellRing, Pencil, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AccountAnnouncement, Audience } from "@/lib/account/announcements";

type Draft = Pick<AccountAnnouncement, "title" | "body" | "link_url" | "audience" | "enabled" | "start_at" | "end_at">;
const blank: Draft = {
  title: "", body: "", link_url: null, audience: "all", enabled: true, start_at: null, end_at: null,
};
const audienceLabels: Record<Audience, string> = {
  all: "Todos os planos", free: "Plano Grátis", pro: "Plano Pro", agency: "Plano Agency",
};

function toLocalInput(value: string | null) {
  if (!value) return "";
  const d = new Date(value);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
function fromLocalInput(value: string) { return value ? new Date(value).toISOString() : null; }

export function AccountAnnouncementsAdmin({ initialNotices }: { initialNotices: AccountAnnouncement[] }) {
  const [notices, setNotices] = useState(initialNotices);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(blank);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState(false);

  function startNew() { setEditingId(null); setDraft({ ...blank }); setFeedback(""); }
  function startEdit(notice: AccountAnnouncement) {
    setEditingId(notice.id);
    setDraft({
      title: notice.title, body: notice.body, link_url: notice.link_url, audience: notice.audience,
      enabled: notice.enabled, start_at: notice.start_at, end_at: notice.end_at,
    });
    setFeedback("");
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setFeedback("");
    try {
      const response = await fetch("/api/admin/account-announcements", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, ...(editingId ? { id: editingId } : {}) }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Não foi possível salvar o aviso.");
      const saved = payload as AccountAnnouncement;
      setNotices((current) => [saved, ...current.filter((notice) => notice.id !== saved.id)]);
      setEditingId(saved.id); setError(false); setFeedback("Aviso salvo com sucesso.");
    } catch (cause) {
      setError(true); setFeedback(cause instanceof Error ? cause.message : "Falha ao salvar aviso.");
    } finally { setBusy(false); }
  }

  async function remove(id: string) {
    if (!window.confirm("Excluir este aviso definitivamente?")) return;
    setBusy(true); setFeedback("");
    try {
      const response = await fetch("/api/admin/account-announcements", {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Não foi possível excluir o aviso.");
      setNotices((current) => current.filter((notice) => notice.id !== id));
      if (editingId === id) startNew();
      setError(false); setFeedback("Aviso excluído.");
    } catch (cause) {
      setError(true); setFeedback(cause instanceof Error ? cause.message : "Falha ao excluir.");
    } finally { setBusy(false); }
  }

  return <section className="rounded-2xl border border-white/10 bg-card p-5 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-semibold"><BellRing className="size-5 text-primary" /> Avisos no painel dos usuários</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">Crie avisos internos para todos ou para um plano específico, sem modificar permissões ou benefícios.</p>
      </div>
      <Button size="sm" variant="outline" type="button" onClick={startNew}><Plus className="size-4" /> Novo aviso</Button>
    </div>
    <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <form onSubmit={save} className="grid content-start gap-3 rounded-xl border border-white/10 p-4">
        <p className="text-sm font-semibold">{editingId ? "Editar aviso" : "Criar aviso"}</p>
        <label className="grid gap-1 text-sm"><span>Título</span>
          <Input required minLength={3} maxLength={140} value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} />
        </label>
        <label className="grid gap-1 text-sm"><span>Mensagem</span>
          <textarea required minLength={3} maxLength={1500} rows={4} className="w-full rounded-md border border-input bg-background p-3 text-sm" value={draft.body} onChange={(event) => setDraft((current) => ({ ...current, body: event.target.value }))} />
        </label>
        <label className="grid gap-1 text-sm"><span>Público</span>
          <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={draft.audience} onChange={(event) => setDraft((current) => ({ ...current, audience: event.target.value as Audience }))}>
            {Object.entries(audienceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm"><span>Link interno (opcional)</span>
          <Input placeholder="/ferramentas" value={draft.link_url ?? ""} onChange={(event) => setDraft((current) => ({ ...current, link_url: event.target.value || null }))} />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm"><span>Mostrar a partir de (opcional)</span>
            <Input type="datetime-local" value={toLocalInput(draft.start_at)} onChange={(event) => setDraft((current) => ({ ...current, start_at: fromLocalInput(event.target.value) }))} />
          </label>
          <label className="grid gap-1 text-sm"><span>Ocultar após (opcional)</span>
            <Input type="datetime-local" value={toLocalInput(draft.end_at)} onChange={(event) => setDraft((current) => ({ ...current, end_at: fromLocalInput(event.target.value) }))} />
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={draft.enabled} onChange={(event) => setDraft((current) => ({ ...current, enabled: event.target.checked }))} className="size-4 accent-primary" /> Aviso ativo
        </label>
        <Button disabled={busy} type="submit"><Save className="size-4" />{busy ? "Salvando..." : "Salvar aviso"}</Button>
        {feedback ? <p role="status" className={error ? "text-sm text-red-400" : "text-sm text-emerald-400"}>{feedback}</p> : null}
      </form>
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Avisos cadastrados ({notices.length})</h3>
        {!notices.length ? <p className="text-sm text-muted-foreground">Nenhum aviso cadastrado.</p> : null}
        <div className="max-h-[520px] space-y-2 overflow-y-auto pr-1">
          {notices.map((notice) => <article key={notice.id} className={`rounded-xl border p-3 ${notice.id === editingId ? "border-primary/50" : "border-white/10"}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{notice.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{audienceLabels[notice.audience]} · {notice.enabled ? "Ativo" : "Desativado"}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button type="button" aria-label={`Editar ${notice.title}`} onClick={() => startEdit(notice)} className="rounded-lg p-2 text-muted-foreground hover:text-primary"><Pencil className="size-4" /></button>
                <button type="button" disabled={busy} aria-label={`Excluir ${notice.title}`} onClick={() => void remove(notice.id)} className="rounded-lg p-2 text-muted-foreground hover:text-red-400 disabled:opacity-50"><Trash2 className="size-4" /></button>
              </div>
            </div>
            <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{notice.body}</p>
          </article>)}
        </div>
      </div>
    </div>
  </section>;
}
