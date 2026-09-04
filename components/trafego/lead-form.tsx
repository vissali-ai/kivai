"use client";

import { FormEvent, useMemo, useState } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";

const socialOptions = ["Instagram", "Facebook", "TikTok", "LinkedIn", "YouTube"];

function initialAttribution() {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get("utm_source") || "",
    utm_medium: params.get("utm_medium") || "",
    utm_campaign: params.get("utm_campaign") || "",
    utm_term: params.get("utm_term") || "",
    utm_content: params.get("utm_content") || "",
    landing_page: window.location.pathname,
    referrer: document.referrer || "",
  };
}

export function TrafegoLeadForm() {
  const [step, setStep] = useState(1);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const attribution = useMemo(initialAttribution, []);
  const [form, setForm] = useState<Record<string, string | boolean | string[]>>({
    name: "", company: "", email: "", phone: "", segment: "", city: "", state: "", website: "", instagram: "",
    has_domain: "", has_website: "", has_landing_page: "", has_google_ads: "", has_google_business: "", has_analytics: "", has_tag_manager: "", has_search_console: "", has_social_media: "",
    social_networks: [], objective: "", currently_advertising: "", monthly_budget: "", message: "", website_url: "",
    honeypot: "", privacy_consent: false,
  });

  function update(key: string, value: string | boolean | string[]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleSocial(network: string) {
    const current = Array.isArray(form.social_networks) ? form.social_networks : [];
    update("social_networks", current.includes(network) ? current.filter((item) => item !== network) : [...current, network]);
  }

  function next() {
    setError("");
    if (!form.name || !form.company || !form.phone || !form.email) {
      setError("Preencha nome, empresa, WhatsApp e e-mail para continuar.");
      return;
    }
    setStep(2);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!form.privacy_consent) {
      setError("É necessário aceitar o aviso de privacidade para enviar a análise.");
      return;
    }
    setSending(true);
    try {
      const response = await fetch("/api/trafego/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, ...attribution }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível enviar o formulário.");
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar o formulário.");
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/[0.06] p-8"><span className="flex size-12 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-300"><Check className="size-6" /></span><h3 className="mt-6 text-2xl font-semibold">Solicitação recebida.</h3><p className="mt-3 text-sm leading-7 text-white/55">Obrigado pelo contexto. A análise será feita antes de qualquer proposta para entender o que realmente faz sentido para sua empresa.</p></div>;
  }

  return <form onSubmit={submit} className="rounded-3xl border border-white/10 bg-white/[0.025] p-5 shadow-2xl shadow-black/20 sm:p-7">
    <div className="flex items-center gap-2"><span className={`h-1 flex-1 rounded-full ${step >= 1 ? "bg-violet-400" : "bg-white/10"}`} /><span className={`h-1 flex-1 rounded-full ${step >= 2 ? "bg-violet-400" : "bg-white/10"}`} /></div>
    <p className="mt-5 text-xs font-medium uppercase tracking-[0.16em] text-violet-300">Etapa {step} de 2</p>
    {step === 1 ? <>
      <h3 className="mt-2 text-2xl font-semibold">Vamos entender seu cenário.</h3>
      <p className="mt-2 text-sm leading-6 text-white/45">Esses dados servem para qualificar a análise inicial.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label="Seu nome *" value={String(form.name)} onChange={(v) => update("name", v)} />
        <Field label="Empresa *" value={String(form.company)} onChange={(v) => update("company", v)} />
        <Field label="WhatsApp *" value={String(form.phone)} onChange={(v) => update("phone", v)} inputMode="tel" />
        <Field label="E-mail *" value={String(form.email)} onChange={(v) => update("email", v)} type="email" />
        <Field label="Segmento" value={String(form.segment)} onChange={(v) => update("segment", v)} />
        <Field label="Cidade" value={String(form.city)} onChange={(v) => update("city", v)} />
        <Field label="Estado" value={String(form.state)} onChange={(v) => update("state", v)} maxLength={2} />
        <Field label="Site" value={String(form.website)} onChange={(v) => update("website", v)} />
        <Field label="Instagram" value={String(form.instagram)} onChange={(v) => update("instagram", v)} />
      </div>
      <button type="button" onClick={next} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-500 px-5 py-3.5 text-sm font-semibold transition hover:bg-violet-400">Continuar <ArrowRight className="size-4" /></button>
    </> : <>
      <h3 className="mt-2 text-2xl font-semibold">Agora, sobre sua operação.</h3>
      <div className="mt-6 grid gap-5">
        <Choice label="Você já anuncia no Google Ads?" value={String(form.has_google_ads)} onChange={(v) => update("has_google_ads", v)} />
        <Choice label="Sua empresa tem Google Business Profile?" value={String(form.has_google_business)} onChange={(v) => update("has_google_business", v)} />
        <Choice label="Você tem uma landing page?" value={String(form.has_landing_page)} onChange={(v) => update("has_landing_page", v)} />
        <Choice label="Sua empresa possui redes sociais?" value={String(form.has_social_media)} onChange={(v) => update("has_social_media", v)} />
        {String(form.has_social_media) === "sim" && <div><p className="mb-2 text-xs text-white/45">Quais canais?</p><div className="flex flex-wrap gap-2">{socialOptions.map((network) => <button type="button" key={network} onClick={() => toggleSocial(network)} className={`rounded-lg border px-3 py-2 text-xs transition ${Array.isArray(form.social_networks) && form.social_networks.includes(network) ? "border-violet-400/40 bg-violet-400/10 text-violet-200" : "border-white/10 text-white/50 hover:border-white/20"}`}>{network}</button>)}</div></div>}
        <Choice label="Está anunciando atualmente em alguma plataforma?" value={String(form.currently_advertising)} onChange={(v) => update("currently_advertising", v)} />
        <div><label className="mb-2 block text-xs text-white/45">Orçamento mensal aproximado de mídia</label><select value={String(form.monthly_budget)} onChange={(e) => update("monthly_budget", e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#101017] px-3 py-3 text-sm text-white outline-none focus:border-violet-400/50"><option value="">Selecione</option><option>Até R$ 1.000</option><option>R$ 1.000 a R$ 3.000</option><option>R$ 3.000 a R$ 5.000</option><option>R$ 5.000 a R$ 10.000</option><option>Acima de R$ 10.000</option><option>Ainda não defini</option></select></div>
        <div><label className="mb-2 block text-xs text-white/45">Objetivo principal</label><select value={String(form.objective)} onChange={(e) => update("objective", e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#101017] px-3 py-3 text-sm text-white outline-none focus:border-violet-400/50"><option value="">Selecione</option><option>Gerar mais leads</option><option>Gerar mais vendas</option><option>Gerar agendamentos</option><option>Receber mais pedidos de orçamento</option><option>Aumentar visitas</option><option>Outro</option></select></div>
        <div><label className="mb-2 block text-xs text-white/45">O que você gostaria de melhorar?</label><textarea value={String(form.message)} onChange={(e) => update("message", e.target.value)} rows={4} maxLength={1200} className="w-full resize-none rounded-xl border border-white/10 bg-[#101017] px-3 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-violet-400/50" placeholder="Conte brevemente o que está acontecendo hoje e o que você busca." /></div>
        <input aria-hidden tabIndex={-1} autoComplete="off" value={String(form.honeypot)} onChange={(e) => update("honeypot", e.target.value)} className="hidden" />
        <label className="flex gap-3 text-xs leading-5 text-white/45"><input type="checkbox" checked={Boolean(form.privacy_consent)} onChange={(e) => update("privacy_consent", e.target.checked)} className="mt-1 accent-violet-500" />Concordo com o tratamento dos dados enviados para contato e análise da solicitação.</label>
      </div>
      {error && <p className="mt-4 rounded-xl border border-red-400/20 bg-red-400/[0.06] px-3 py-2.5 text-xs text-red-200">{error}</p>}
      <div className="mt-6 grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => setStep(1)} className="rounded-xl border border-white/10 px-5 py-3.5 text-sm font-semibold text-white/70 transition hover:bg-white/[0.04]">Voltar</button><button disabled={sending} type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-500 px-5 py-3.5 text-sm font-semibold transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60">{sending ? <><Loader2 className="size-4 animate-spin" /> Enviando...</> : <>Enviar para análise <ArrowRight className="size-4" /></>}</button></div>
    </>}
  </form>;
}

function Field({ label, value, onChange, type = "text", inputMode, maxLength }: { label: string; value: string; onChange: (value: string) => void; type?: string; inputMode?: "text" | "tel" | "email" | "url"; maxLength?: number }) {
  return <label><span className="mb-2 block text-xs text-white/45">{label}</span><input required={label.includes("*")} type={type} inputMode={inputMode} maxLength={maxLength} value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#101017] px-3 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-violet-400/50" /></label>;
}

function Choice({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <div><p className="mb-2 text-xs text-white/45">{label}</p><div className="flex gap-2"><button type="button" onClick={() => onChange("sim")} className={`rounded-lg border px-4 py-2 text-xs ${value === "sim" ? "border-violet-400/40 bg-violet-400/10 text-violet-200" : "border-white/10 text-white/50"}`}>Sim</button><button type="button" onClick={() => onChange("nao")} className={`rounded-lg border px-4 py-2 text-xs ${value === "nao" ? "border-violet-400/40 bg-violet-400/10 text-violet-200" : "border-white/10 text-white/50"}`}>Não</button></div></div>;
}
