"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Copy, Download, List, Pencil, Plus, Trash2, X } from "lucide-react";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "kivai:calendario-editorial:v1";
const networks = ["Instagram", "Facebook", "TikTok", "YouTube", "LinkedIn", "X", "Threads", "Pinterest", "Outra"] as const;
const formats = ["Post", "Imagem", "Carrossel", "Reels", "Stories", "Vídeo", "Shorts", "Live", "Texto", "Artigo", "Enquete", "Outro"] as const;
const objectives = ["Alcance", "Engajamento", "Conversão", "Vendas", "Tráfego", "Autoridade", "Relacionamento", "Educação", "Entretenimento", "Lançamento"] as const;
const statuses = ["Ideia", "Planejado", "Em produção", "Em revisão", "Aprovado", "Agendado", "Publicado"] as const;
const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const monthFormatter = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });
const dateFormatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

type Publication = {
  id: string; date: string; title: string; network: string; format: string; objective: string;
  status: string; caption: string; cta: string; hashtags: string; observations: string; createdAt: string; updatedAt: string;
};
type FormState = Omit<Publication, "id" | "createdAt" | "updatedAt">;
type Modal = { kind: "form"; mode: "create" | "edit" | "duplicate"; item?: Publication } | { kind: "view" | "delete" | "move"; item: Publication } | null;
type Filters = { network: string; format: string; status: string; objective: string };

const emptyForm: FormState = { date: "", title: "", network: "", format: "", objective: "", status: "Ideia", caption: "", cta: "", hashtags: "", observations: "" };
const emptyFilters: Filters = { network: "", format: "", status: "", objective: "" };

function dateKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function parseDate(value: string) { const [y, m, d] = value.split("-").map(Number); return new Date(y, m - 1, d); }
function monthKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`; }
function uid() { return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`; }
function validPublication(value: unknown): value is Publication {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<Publication>;
  return ["id", "date", "title", "network", "format", "objective", "status"].every((key) => typeof item[key as keyof Publication] === "string");
}
function statusClass(status: string) {
  if (status === "Publicado") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  if (status === "Agendado" || status === "Aprovado") return "border-primary/30 bg-primary/10 text-primary";
  if (status === "Em produção" || status === "Em revisão") return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300";
  return "border-border bg-muted/60 text-muted-foreground";
}
function csvCell(value: string) { return `"${value.replaceAll('"', '""')}"`; }

export default function CalendarioEditorialClient() {
  const [items, setItems] = useState<Publication[]>([]);
  const [ready, setReady] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<Date | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [modal, setModal] = useState<Modal>(null);

  useEffect(() => {
    const now = new Date();
    /* Hydration deliberately loads browser-only state in one pass. */
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDate(dateKey(now));
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
      if (Array.isArray(stored)) setItems(stored.filter(validPublication));
    } catch { localStorage.removeItem(STORAGE_KEY); }
    setReady(true);
  }, []);
  useEffect(() => { if (ready) localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }, [items, ready]);

  const filtered = useMemo(() => items.filter((item) =>
    (!filters.network || item.network === filters.network) && (!filters.format || item.format === filters.format) &&
    (!filters.status || item.status === filters.status) && (!filters.objective || item.objective === filters.objective)), [items, filters]);
  const byDate = useMemo(() => filtered.reduce<Record<string, Publication[]>>((map, item) => { (map[item.date] ??= []).push(item); return map; }, {}), [filtered]);
  const monthItems = useMemo(() => currentMonth ? filtered.filter((item) => item.date.startsWith(monthKey(currentMonth))).sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title)) : [], [filtered, currentMonth]);
  const days = useMemo(() => {
    if (!currentMonth) return [];
    const first = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const last = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const result: Date[] = [];
    for (let i = first.getDay(); i > 0; i--) result.push(new Date(first.getFullYear(), first.getMonth(), 1 - i));
    for (let d = 1; d <= last.getDate(); d++) result.push(new Date(first.getFullYear(), first.getMonth(), d));
    let trailingDay = 1;
    while (result.length % 7) result.push(new Date(last.getFullYear(), last.getMonth(), last.getDate() + trailingDay++));
    return result;
  }, [currentMonth]);

  function navigate(offset: number) {
    if (!currentMonth) return;
    const next = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1);
    setCurrentMonth(next); setSelectedDate(dateKey(next));
  }
  function today() { const now = new Date(); setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1)); setSelectedDate(dateKey(now)); }
  function save(form: FormState, mode: "create" | "edit" | "duplicate", source?: Publication) {
    const now = new Date().toISOString();
    if (mode === "edit" && source) setItems((all) => all.map((item) => item.id === source.id ? { ...item, ...form, updatedAt: now } : item));
    else setItems((all) => [...all, { ...form, id: uid(), createdAt: now, updatedAt: now }]);
    setSelectedDate(form.date); const d = parseDate(form.date); setCurrentMonth(new Date(d.getFullYear(), d.getMonth(), 1)); setModal(null);
  }
  function remove(item: Publication) { setItems((all) => all.filter((entry) => entry.id !== item.id)); setModal(null); }
  function move(item: Publication, nextDate: string) {
    if (!nextDate) return;
    const now = new Date().toISOString(); setItems((all) => all.map((entry) => entry.id === item.id ? { ...entry, date: nextDate, updatedAt: now } : entry));
    setSelectedDate(nextDate); const d = parseDate(nextDate); setCurrentMonth(new Date(d.getFullYear(), d.getMonth(), 1)); setModal(null);
  }
  function exportCsv() {
    const headers = ["Data", "Título/tema", "Rede social", "Formato", "Objetivo", "Status", "Legenda/notas", "CTA", "Hashtags", "Observações"];
    const rows = items.slice().sort((a, b) => a.date.localeCompare(b.date)).map((item) => [item.date, item.title, item.network, item.format, item.objective, item.status, item.caption, item.cta, item.hashtags, item.observations]);
    const blob = new Blob(["\ufeff", [headers, ...rows].map((row) => row.map(csvCell).join(";")).join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = "calendario-editorial-kivai.csv"; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  return <ToolPageShell title="Calendário Editorial para Redes Sociais" description="Planeje, organize e acompanhe publicações de diferentes redes sociais em um calendário mensal simples e completo." categoryName="Social Media" categoryHref="/ferramentas/social-media" breadcrumbRootName="Início" breadcrumbRootHref="/" privacyMessage="Seu calendário fica salvo somente neste navegador e neste dispositivo. Nenhum planejamento é enviado ao Kivai.">
    <Card className="mx-auto max-w-6xl">
      <CardHeader className="gap-3 sm:flex sm:flex-row sm:items-start sm:justify-between">
        <div><CardTitle className="text-base">Planejamento editorial</CardTitle><CardDescription>Crie quantas publicações precisar, acompanhe o status e exporte o planejamento em CSV.</CardDescription></div>
        <div className="flex flex-wrap gap-2"><Button onClick={() => setModal({ kind: "form", mode: "create" })}><Plus />Nova publicação</Button><Button variant="outline" onClick={exportCsv} disabled={!items.length}><Download />Exportar CSV</Button></div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 rounded-none border border-border p-4 sm:grid-cols-2 lg:grid-cols-4">
          <Filter label="Rede social" value={filters.network} options={networks} onChange={(network) => setFilters({ ...filters, network })} />
          <Filter label="Formato" value={filters.format} options={formats} onChange={(format) => setFilters({ ...filters, format })} />
          <Filter label="Status" value={filters.status} options={statuses} onChange={(status) => setFilters({ ...filters, status })} />
          <Filter label="Objetivo" value={filters.objective} options={objectives} onChange={(objective) => setFilters({ ...filters, objective })} />
          {Object.values(filters).some(Boolean) && <Button className="sm:col-span-2 lg:col-span-4 lg:justify-self-start" variant="ghost" onClick={() => setFilters(emptyFilters)}><X />Limpar filtros</Button>}
        </div>
        <div className="flex flex-col gap-3 border-y border-border py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2"><Button variant="outline" size="icon" aria-label="Mês anterior" onClick={() => navigate(-1)}><ChevronLeft /></Button><Button variant="outline" onClick={today}>Hoje</Button><Button variant="outline" size="icon" aria-label="Próximo mês" onClick={() => navigate(1)}><ChevronRight /></Button></div>
          <h2 className="font-heading text-lg font-semibold capitalize" aria-live="polite">{currentMonth ? monthFormatter.format(currentMonth) : "Carregando calendário"}</h2>
          <div className="flex gap-2"><Button variant={view === "calendar" ? "secondary" : "ghost"} aria-pressed={view === "calendar"} onClick={() => setView("calendar")}><CalendarDays />Calendário</Button><Button variant={view === "list" ? "secondary" : "ghost"} aria-pressed={view === "list"} onClick={() => setView("list")}><List />Lista</Button></div>
        </div>
        {!ready ? <p className="py-12 text-center text-muted-foreground">Carregando seu planejamento…</p> : view === "calendar" ? <CalendarView days={days} currentMonth={currentMonth!} byDate={byDate} selectedDate={selectedDate} onSelect={setSelectedDate} onView={(item) => setModal({ kind: "view", item })} onAdd={(date) => { setSelectedDate(date); setModal({ kind: "form", mode: "create" }); }} /> : <ListView items={monthItems} onView={(item) => setModal({ kind: "view", item })} />}
        {ready && !items.length && <EmptyState onAdd={() => setModal({ kind: "form", mode: "create" })} />}
        {ready && items.length > 0 && filtered.length === 0 && <div className="border border-dashed border-border p-8 text-center"><p className="font-medium">Nenhuma publicação corresponde aos filtros.</p><Button variant="link" onClick={() => setFilters(emptyFilters)}>Limpar filtros</Button></div>}
      </CardContent>
    </Card>
    {modal && <PublicationModal modal={modal} selectedDate={selectedDate} onClose={() => setModal(null)} onSave={save} onDelete={(item) => setModal({ kind: "delete", item })} onRemove={remove} onEdit={(item) => setModal({ kind: "form", mode: "edit", item })} onDuplicate={(item) => setModal({ kind: "form", mode: "duplicate", item })} onMoveOpen={(item) => setModal({ kind: "move", item })} onMove={move} />}
  </ToolPageShell>;
}

function Filter({ label, value, options, onChange }: { label: string; value: string; options: readonly string[]; onChange: (value: string) => void }) {
  return <label className="grid gap-1.5 text-sm font-medium">{label}<select className="min-h-10 min-w-0 border border-border bg-background px-3 text-foreground" value={value} onChange={(event) => onChange(event.target.value)}><option value="">Todos</option>{options.map((option) => <option key={option}>{option}</option>)}</select></label>;
}

function CalendarView({ days, currentMonth, byDate, selectedDate, onSelect, onView, onAdd }: { days: Date[]; currentMonth: Date; byDate: Record<string, Publication[]>; selectedDate: string; onSelect: (date: string) => void; onView: (item: Publication) => void; onAdd: (date: string) => void }) {
  const selectedItems = byDate[selectedDate] ?? [];
  return <div className="space-y-5">
    <div className="grid grid-cols-7 border-l border-t border-border" role="grid" aria-label={`Calendário de ${monthFormatter.format(currentMonth)}`}>
      {weekDays.map((day) => <div key={day} role="columnheader" className="border-b border-r border-border px-1 py-2 text-center text-xs font-medium text-muted-foreground">{day}</div>)}
      {days.map((day) => { const key = dateKey(day); const dayItems = byDate[key] ?? []; const active = selectedDate === key; const outside = day.getMonth() !== currentMonth.getMonth(); return <div key={key} role="gridcell" className={cn("min-h-16 border-b border-r border-border p-1 sm:min-h-32 sm:p-2", outside && "bg-muted/20 text-muted-foreground", active && "ring-1 ring-inset ring-primary")}>
        <button type="button" className="flex min-h-7 w-full items-center justify-between text-left text-xs font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" aria-label={`${dateFormatter.format(day)}${dayItems.length ? `, ${dayItems.length} publicações` : ""}`} onClick={() => onSelect(key)}><span>{day.getDate()}</span>{dayItems.length > 0 && <span className="rounded-full bg-primary/15 px-1.5 text-[10px] text-primary sm:hidden">{dayItems.length}</span>}</button>
        <div className="hidden space-y-1 sm:block">{dayItems.slice(0, 3).map((item) => <button key={item.id} type="button" onClick={() => onView(item)} className={cn("block w-full truncate border px-1.5 py-1 text-left text-[10px]", statusClass(item.status))} title={`${item.title} — ${item.status}`}>{item.title}</button>)}{dayItems.length > 3 && <button type="button" className="text-[10px] text-primary" onClick={() => onSelect(key)}>+ {dayItems.length - 3} publicações</button>}</div>
        <button type="button" className="mt-1 hidden text-[10px] text-muted-foreground hover:text-primary sm:inline" onClick={() => onAdd(key)}>+ adicionar</button>
      </div>; })}
    </div>
    <div className="border border-border p-4"><div className="mb-3 flex items-center justify-between gap-3"><div><h3 className="font-medium">{selectedDate ? dateFormatter.format(parseDate(selectedDate)) : "Selecione uma data"}</h3><p className="text-xs text-muted-foreground">{selectedItems.length} {selectedItems.length === 1 ? "publicação" : "publicações"}</p></div><Button size="sm" onClick={() => onAdd(selectedDate)} disabled={!selectedDate}><Plus />Adicionar</Button></div>{selectedItems.length ? <div className="grid gap-2 sm:grid-cols-2">{selectedItems.map((item) => <PublicationRow key={item.id} item={item} onView={onView} />)}</div> : <p className="border border-dashed border-border p-5 text-sm text-muted-foreground">Nenhuma publicação planejada para esta data.</p>}</div>
  </div>;
}

function ListView({ items, onView }: { items: Publication[]; onView: (item: Publication) => void }) {
  if (!items.length) return <div className="border border-dashed border-border p-8 text-center text-muted-foreground">Nenhuma publicação neste mês.</div>;
  return <div className="space-y-2">{items.map((item) => <PublicationRow key={item.id} item={item} onView={onView} showDate />)}</div>;
}
function PublicationRow({ item, onView, showDate = false }: { item: Publication; onView: (item: Publication) => void; showDate?: boolean }) {
  return <button type="button" onClick={() => onView(item)} className="flex w-full min-w-0 items-center justify-between gap-3 border border-border p-3 text-left transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"><div className="min-w-0"><p className="truncate font-medium">{item.title}</p><p className="mt-1 truncate text-xs text-muted-foreground">{showDate ? `${dateFormatter.format(parseDate(item.date))} · ` : ""}{item.network} · {item.format} · {item.objective}</p></div><span className={cn("shrink-0 border px-2 py-1 text-[10px]", statusClass(item.status))}>{item.status}</span></button>;
}
function EmptyState({ onAdd }: { onAdd: () => void }) { return <div className="border border-dashed border-border p-8 text-center sm:p-12"><CalendarDays className="mx-auto size-9 text-primary" /><h3 className="mt-4 text-base font-semibold">Seu calendário ainda está vazio</h3><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">Adicione a primeira publicação para transformar ideias em um plano editorial organizado por data, rede e objetivo.</p><Button className="mt-5" onClick={onAdd}><Plus />Criar primeira publicação</Button></div>; }

function PublicationModal({ modal, selectedDate, onClose, onSave, onDelete, onRemove, onEdit, onDuplicate, onMoveOpen, onMove }: { modal: Exclude<Modal, null>; selectedDate: string; onClose: () => void; onSave: (form: FormState, mode: "create" | "edit" | "duplicate", source?: Publication) => void; onDelete: (item: Publication) => void; onRemove: (item: Publication) => void; onEdit: (item: Publication) => void; onDuplicate: (item: Publication) => void; onMoveOpen: (item: Publication) => void; onMove: (item: Publication, date: string) => void }) {
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => { panelRef.current?.querySelector<HTMLElement>("input, select, textarea, button")?.focus(); }, [modal.kind]);
  function keyDown(event: React.KeyboardEvent) {
    if (event.key === "Escape") onClose();
    if (event.key !== "Tab" || !panelRef.current) return;
    const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])'));
    if (!focusable.length) return; const first = focusable[0], last = focusable.at(-1)!;
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-0 sm:items-center sm:p-6" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }} onKeyDown={keyDown}><div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="editorial-modal-title" className="max-h-[92dvh] w-full overflow-y-auto border border-border bg-background p-5 shadow-2xl sm:max-w-2xl sm:p-6">
    <div className="mb-5 flex items-start justify-between gap-4"><h2 id="editorial-modal-title" className="font-heading text-xl font-semibold">{modal.kind === "form" ? (modal.mode === "create" ? "Nova publicação" : modal.mode === "edit" ? "Editar publicação" : "Duplicar publicação") : modal.kind === "view" ? modal.item.title : modal.kind === "move" ? "Mover para outra data" : "Excluir publicação"}</h2><Button variant="ghost" size="icon" aria-label="Fechar" onClick={onClose}><X /></Button></div>
    {modal.kind === "form" && <PublicationForm mode={modal.mode} item={modal.item} selectedDate={selectedDate} onCancel={onClose} onSave={onSave} />}
    {modal.kind === "view" && <PublicationDetails item={modal.item} onEdit={onEdit} onDuplicate={onDuplicate} onMove={onMoveOpen} onDelete={onDelete} />}
    {modal.kind === "delete" && <div><p className="text-sm leading-6 text-muted-foreground">Tem certeza de que deseja excluir “{modal.item.title}”? Esta ação não pode ser desfeita.</p><div className="mt-6 flex flex-wrap justify-end gap-2"><Button variant="outline" onClick={onClose}>Cancelar</Button><Button variant="destructive" onClick={() => onRemove(modal.item)}><Trash2 />Excluir definitivamente</Button></div></div>}
    {modal.kind === "move" && <MoveForm item={modal.item} onCancel={onClose} onMove={onMove} />}
  </div></div>;
}

function PublicationForm({ mode, item, selectedDate, onCancel, onSave }: { mode: "create" | "edit" | "duplicate"; item?: Publication; selectedDate: string; onCancel: () => void; onSave: (form: FormState, mode: "create" | "edit" | "duplicate", source?: Publication) => void }) {
  const source: FormState = item ? { date: item.date, title: mode === "duplicate" ? `${item.title} (cópia)` : item.title, network: item.network, format: item.format, objective: item.objective, status: mode === "duplicate" ? "Ideia" : item.status, caption: item.caption ?? "", cta: item.cta ?? "", hashtags: item.hashtags ?? "", observations: item.observations ?? "" } : { ...emptyForm, date: selectedDate || dateKey(new Date()) };
  const [form, setForm] = useState<FormState>(source); const [errors, setErrors] = useState<Record<string, string>>({});
  function submit(event: React.FormEvent) { event.preventDefault(); const next: Record<string, string> = {}; for (const field of ["date", "title", "network", "format", "objective", "status"] as const) if (!form[field].trim()) next[field] = "Campo obrigatório."; setErrors(next); if (!Object.keys(next).length) onSave({ ...form, title: form.title.trim() }, mode, item); }
  const update = (field: keyof FormState, value: string) => { setForm({ ...form, [field]: value }); if (errors[field]) setErrors({ ...errors, [field]: "" }); };
  return <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
    <Field label="Data" error={errors.date}><input type="date" value={form.date} onChange={(e) => update("date", e.target.value)} aria-invalid={!!errors.date} /></Field>
    <Field label="Título ou tema" error={errors.title}><input value={form.title} maxLength={120} onChange={(e) => update("title", e.target.value)} placeholder="Ex.: Bastidores do novo projeto" aria-invalid={!!errors.title} /></Field>
    <Field label="Rede social" error={errors.network}><Select value={form.network} options={networks} placeholder="Selecione a rede" onChange={(value) => update("network", value)} invalid={!!errors.network} /></Field>
    <Field label="Formato" error={errors.format}><Select value={form.format} options={formats} placeholder="Selecione o formato" onChange={(value) => update("format", value)} invalid={!!errors.format} /></Field>
    <Field label="Objetivo" error={errors.objective}><Select value={form.objective} options={objectives} placeholder="Selecione o objetivo" onChange={(value) => update("objective", value)} invalid={!!errors.objective} /></Field>
    <Field label="Status" error={errors.status}><Select value={form.status} options={statuses} placeholder="Selecione o status" onChange={(value) => update("status", value)} invalid={!!errors.status} /></Field>
    <Field label="Legenda ou notas" className="sm:col-span-2"><textarea rows={4} value={form.caption} onChange={(e) => update("caption", e.target.value)} placeholder="Rascunho da legenda, roteiro ou pontos principais" /></Field>
    <Field label="Chamada para ação (CTA)"><input value={form.cta} onChange={(e) => update("cta", e.target.value)} placeholder="Ex.: Salve este post" /></Field>
    <Field label="Hashtags"><input value={form.hashtags} onChange={(e) => update("hashtags", e.target.value)} placeholder="#marketing #conteudo" /></Field>
    <Field label="Observações" className="sm:col-span-2"><textarea rows={3} value={form.observations} onChange={(e) => update("observations", e.target.value)} placeholder="Responsável, link de referência ou detalhes opcionais" /></Field>
    <div className="flex flex-wrap justify-end gap-2 sm:col-span-2"><Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button><Button type="submit">{mode === "edit" ? "Salvar alterações" : mode === "duplicate" ? "Criar cópia" : "Adicionar publicação"}</Button></div>
  </form>;
}
function Field({ label, error, className, children }: { label: string; error?: string; className?: string; children: React.ReactNode }) { return <label className={cn("grid gap-1.5 text-sm font-medium [&_input]:min-h-10 [&_input]:min-w-0 [&_input]:border [&_input]:border-border [&_input]:bg-background [&_input]:px-3 [&_textarea]:min-w-0 [&_textarea]:border [&_textarea]:border-border [&_textarea]:bg-background [&_textarea]:p-3", className)}>{label}{children}{error && <span className="text-xs text-destructive">{error}</span>}</label>; }
function Select({ value, options, placeholder, onChange, invalid }: { value: string; options: readonly string[]; placeholder: string; onChange: (value: string) => void; invalid?: boolean }) { return <select className="min-h-10 min-w-0 border border-border bg-background px-3" value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={invalid}><option value="">{placeholder}</option>{options.map((option) => <option key={option}>{option}</option>)}</select>; }

function PublicationDetails({ item, onEdit, onDuplicate, onMove, onDelete }: { item: Publication; onEdit: (item: Publication) => void; onDuplicate: (item: Publication) => void; onMove: (item: Publication) => void; onDelete: (item: Publication) => void }) {
  const details = [["Data", dateFormatter.format(parseDate(item.date))], ["Rede social", item.network], ["Formato", item.format], ["Objetivo", item.objective], ["Status", item.status], ["Legenda ou notas", item.caption], ["CTA", item.cta], ["Hashtags", item.hashtags], ["Observações", item.observations]];
  return <div><dl className="grid gap-4 sm:grid-cols-2">{details.filter(([, value]) => value).map(([label, value]) => <div key={label} className={cn("border-b border-border pb-3", ["Legenda ou notas", "Observações"].includes(label) && "sm:col-span-2")}><dt className="text-xs font-medium text-muted-foreground">{label}</dt><dd className="mt-1 whitespace-pre-wrap text-sm">{value}</dd></div>)}</dl><div className="mt-6 flex flex-wrap gap-2"><Button onClick={() => onEdit(item)}><Pencil />Editar</Button><Button variant="outline" onClick={() => onDuplicate(item)}><Copy />Duplicar</Button><Button variant="outline" onClick={() => onMove(item)}><CalendarDays />Mover para outra data</Button><Button variant="destructive" onClick={() => onDelete(item)}><Trash2 />Excluir</Button></div></div>;
}
function MoveForm({ item, onCancel, onMove }: { item: Publication; onCancel: () => void; onMove: (item: Publication, date: string) => void }) { const [date, setDate] = useState(item.date); return <form onSubmit={(e) => { e.preventDefault(); onMove(item, date); }}><Field label="Nova data"><input type="date" required value={date} onChange={(e) => setDate(e.target.value)} /></Field><p className="mt-3 text-sm text-muted-foreground">A publicação será mantida com todos os dados e movida para a data escolhida.</p><div className="mt-6 flex justify-end gap-2"><Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button><Button type="submit">Mover publicação</Button></div></form>; }
