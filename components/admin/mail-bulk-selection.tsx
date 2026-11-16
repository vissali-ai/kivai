"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Scope = "inbox" | "sent" | "discarded";
type SelectionContextValue = { selected: string[]; toggle: (value: string) => void };
const SelectionContext = createContext<SelectionContextValue | null>(null);

export function MailBulkProvider({ scope, values, children }: { scope: Scope; values: string[]; children: React.ReactNode }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const value = useMemo(() => ({ selected, toggle: (item: string) => setSelected(current => current.includes(item) ? current.filter(value => value !== item) : [...current, item]) }), [selected]);
  async function remove(deleteAll: boolean) {
    const description = deleteAll ? "todos os e-mails desta aba" : `${selected.length} e-mail(s) selecionado(s)`;
    if (!window.confirm(`A exclusão será definitiva e não poderá ser desfeita. Deseja excluir ${description}?`)) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin/communication/bulk-delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scope, ids: selected, deleteAll }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Não foi possível excluir os e-mails.");
      setSelected([]);
      setMessage(deleteAll ? "Todos os e-mails desta aba foram excluídos definitivamente." : `${Number(result.deletedInbox ?? 0) + Number(result.deletedSent ?? 0)} e-mail(s) excluído(s) definitivamente.`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao excluir.");
    } finally { setBusy(false); }
  }
  return <SelectionContext.Provider value={value}>
    <section className="mb-3 border border-border bg-muted/40 p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-xs text-muted-foreground"><input type="checkbox" checked={values.length > 0 && values.every(item => selected.includes(item))} onChange={event => setSelected(event.target.checked ? values : [])} />Selecionar todos os exibidos ({values.length})</label>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={busy || selected.length === 0} onClick={() => void remove(false)} className="border border-destructive/40 px-3 py-2 text-xs font-semibold text-destructive disabled:opacity-40">{busy ? "Excluindo..." : `Excluir selecionados (${selected.length})`}</button>
          <button type="button" disabled={busy} onClick={() => void remove(true)} className="bg-destructive px-3 py-2 text-xs font-semibold text-destructive-foreground disabled:opacity-40">{busy ? "Excluindo..." : "Excluir tudo definitivamente"}</button>
        </div>
      </div>
      {message ? <p role="status" className="mt-2 text-xs text-muted-foreground">{message}</p> : null}
    </section>
    {children}
  </SelectionContext.Provider>;
}

export function MailBulkCheckbox({ value }: { value: string }) {
  const context = useContext(SelectionContext);
  if (!context) return null;
  return <input type="checkbox" aria-label="Selecionar e-mail para exclusão definitiva" checked={context.selected.includes(value)} onChange={() => context.toggle(value)} className="size-4 accent-primary" />;
}
