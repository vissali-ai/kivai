"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Lead = {
  id: string;
  created_at: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  segment: string;
  city: string;
  state: string;
  website: string;
  instagram: string;
  objective: string;
  currently_advertising: string;
  monthly_budget: string;
  message: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  landing_page: string;
  referrer: string;
  status: string;
  admin_notes: string;
};

const STATUS_LABELS: Record<string, string> = {
  new: "Novo",
  contacted: "Contatado",
  negotiation: "Em negociação",
  won: "Cliente",
  lost: "Perdido",
};

export function TrafegoAdmin() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selected, setSelected] = useState<Lead | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loadLeads = useCallback(async () => {
    setLoading(true);
    setError("");
    const response = await fetch("/api/admin/trafego/leads", { cache: "no-store" });
    if (response.status === 401) {
      setAuthenticated(false);
      setLoading(false);
      return;
    }
    const data = await response.json();
    if (!response.ok) setError(data.error ?? "Não foi possível carregar os leads.");
    else {
      setAuthenticated(true);
      setLeads(data.leads ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadLeads();
  }, [loadLeads]);

  async function login(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/admin/trafego/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Não foi possível entrar.");
      return;
    }
    setPassword("");
    await loadLeads();
  }

  async function updateLead(id: string, patch: { status?: string; admin_notes?: string }) {
    const response = await fetch("/api/admin/trafego/leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Não foi possível atualizar o lead.");
      return;
    }
    await loadLeads();
    setSelected((current) => current ? { ...current, ...patch } : current);
  }

  async function logout() {
    await fetch("/api/admin/trafego/login", { method: "DELETE" });
    setAuthenticated(false);
    setSelected(null);
    setLeads([]);
  }

  const filteredLeads = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return leads;
    return leads.filter((lead) => [lead.name, lead.company, lead.email, lead.phone, lead.segment, lead.city].some((value) => value?.toLowerCase().includes(term)));
  }, [leads, search]);

  if (!authenticated) {
    return (
      <main className="min-h-[70vh] bg-background px-4 py-16">
        <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
          <h1 className="text-2xl font-semibold">Painel de Leads</h1>
          <p className="mt-2 text-sm text-muted-foreground">Área administrativa protegida para os leads de tráfego.</p>
          <form onSubmit={login} className="mt-6 space-y-4">
            <label className="block text-sm font-medium">Senha<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-primary" autoComplete="current-password" required /></label>
            {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
            <button className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground">Entrar</button>
          </form>
        </div>
      </main>
    );
  }

  const counts = Object.keys(STATUS_LABELS).map((status) => ({ status, count: leads.filter((lead) => lead.status === status).length }));

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-sm font-medium text-primary">Kivai Tráfego</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Leads</h1><p className="mt-2 text-sm text-muted-foreground">Acompanhe e qualifique as oportunidades recebidas pela landing page.</p></div>
          <button onClick={logout} className="rounded-xl border border-border px-4 py-2 text-sm">Sair</button>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-5">
          {counts.map(({ status, count }) => <div key={status} className="rounded-2xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">{STATUS_LABELS[status]}</p><p className="mt-1 text-2xl font-bold">{count}</p></div>)}
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome, empresa, e-mail ou telefone" className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary" /><button onClick={() => void loadLeads()} disabled={loading} className="rounded-xl border border-border px-5 py-3 text-sm">{loading ? "Atualizando..." : "Atualizar"}</button></div>
        {error && <p className="mt-4 text-sm text-destructive" role="alert">{error}</p>}

        <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
          <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b border-border bg-muted/30"><tr><th className="px-4 py-3 font-medium">Lead</th><th className="px-4 py-3 font-medium">Segmento</th><th className="px-4 py-3 font-medium">Origem</th><th className="px-4 py-3 font-medium">Orçamento</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">Data</th></tr></thead><tbody className="divide-y divide-border">{filteredLeads.map((lead) => <tr key={lead.id} onClick={() => setSelected(lead)} className="cursor-pointer hover:bg-muted/20"><td className="px-4 py-4"><p className="font-medium">{lead.name}</p><p className="text-xs text-muted-foreground">{lead.company}</p></td><td className="px-4 py-4">{lead.segment || "Não informado"}</td><td className="px-4 py-4">{lead.utm_source || "Direto"}</td><td className="px-4 py-4">{lead.monthly_budget || "Não informado"}</td><td className="px-4 py-4"><span className="rounded-full border border-border px-2.5 py-1 text-xs">{STATUS_LABELS[lead.status] ?? lead.status}</span></td><td className="px-4 py-4 text-muted-foreground">{new Date(lead.created_at).toLocaleDateString("pt-BR")}</td></tr>)}{filteredLeads.length === 0 && <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">Nenhum lead encontrado.</td></tr>}</tbody></table></div>
        </div>
      </div>

      {selected && <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}><section className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-border bg-card p-5 sm:rounded-3xl sm:p-7"><div className="flex items-start justify-between gap-4"><div><p className="text-sm text-primary">{STATUS_LABELS[selected.status] ?? selected.status}</p><h2 className="mt-1 text-2xl font-bold">{selected.name}</h2><p className="mt-1 text-sm text-muted-foreground">{selected.company}</p></div><button onClick={() => setSelected(null)} className="rounded-lg border border-border px-3 py-1.5 text-sm">Fechar</button></div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">{[["WhatsApp/Telefone", selected.phone], ["E-mail", selected.email], ["Segmento", selected.segment], ["Cidade/UF", `${selected.city}${selected.state ? `/${selected.state}` : ""}`], ["Site", selected.website], ["Instagram", selected.instagram], ["Objetivo", selected.objective], ["Situação atual", selected.currently_advertising], ["Orçamento", selected.monthly_budget], ["Origem", `${selected.utm_source || "Direto"}${selected.utm_campaign ? ` / ${selected.utm_campaign}` : ""}`]].map(([label, value]) => <div key={label} className="rounded-xl border border-border p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 break-words text-sm">{value || "Não informado"}</p></div>)}</div>
        <div className="mt-4 rounded-xl border border-border p-4"><p className="text-xs text-muted-foreground">Mensagem</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{selected.message || "Não informado"}</p></div>
        <div className="mt-4"><label className="text-sm font-medium">Status<select value={selected.status} onChange={(event) => void updateLead(selected.id, { status: event.target.value })} className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"><option value="new">Novo</option><option value="contacted">Contatado</option><option value="negotiation">Em negociação</option><option value="won">Cliente</option><option value="lost">Perdido</option></select></label></div>
        <div className="mt-4"><label className="text-sm font-medium">Observações internas<textarea defaultValue={selected.admin_notes} onBlur={(event) => void updateLead(selected.id, { admin_notes: event.target.value })} rows={4} className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary" placeholder="Anote informações importantes do atendimento..." /></label></div>
        <div className="mt-5 flex flex-wrap gap-3"><a href={`https://wa.me/${selected.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground">Abrir WhatsApp</a><a href={`mailto:${selected.email}`} className="rounded-xl border border-border px-4 py-3 text-sm">Enviar e-mail</a></div>
      </section></div>}
    </main>
  );
}
