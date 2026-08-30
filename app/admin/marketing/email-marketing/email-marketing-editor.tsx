"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { Monitor, Smartphone, Send, Save, RotateCcw } from "lucide-react";
import { sendCustomEmailCampaign, type CampaignActionState } from "./actions";

type Counts = { all: number; free: number; pro: number; agency: number; active: number; trial: number };
type Draft = {
  campaignName: string;
  audience: string;
  subject: string;
  preheader: string;
  eyebrow: string;
  headline: string;
  message: string;
  highlight: string;
  ctaLabel: string;
  ctaUrl: string;
};

const EMPTY_DRAFT: Draft = {
  campaignName: "",
  audience: "all",
  subject: "",
  preheader: "",
  eyebrow: "NOVIDADES KIVAI",
  headline: "",
  message: "",
  highlight: "",
  ctaLabel: "Acessar o Kivai",
  ctaUrl: "https://www.kivai.com.br",
};
const STORAGE_KEY = "kivai-admin-email-marketing-draft-v1";

export function EmailMarketingEditor({ counts }: { counts: Counts }) {
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [saved, setSaved] = useState(false);
  const initialState: CampaignActionState = { ok: false, message: "" };
  const [state, formAction, pending] = useActionState(sendCustomEmailCampaign, initialState);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setDraft({ ...EMPTY_DRAFT, ...JSON.parse(raw) });
    } catch {}
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1200);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [draft]);

  const audienceCount = useMemo(() => counts[draft.audience as keyof Counts] ?? counts.all, [counts, draft.audience]);
  const paragraphs = draft.message.split(/\n{2,}/).filter(Boolean);

  function field<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function resetDraft() {
    if (!window.confirm("Limpar todo o rascunho atual?")) return;
    setDraft(EMPTY_DRAFT);
    localStorage.removeItem(STORAGE_KEY);
  }

  return <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(420px,.9fr)]">
    <form action={formAction} className="space-y-5 border border-white/10 bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Composição</p><h2 className="mt-1 text-xl font-semibold">Criar e-mail marketing</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Monte a campanha, confira a prévia e confirme o disparo somente quando estiver pronta.</p></div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground"><Save className="size-4" />{saved ? "Rascunho salvo" : "Salvamento automático"}</div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-xs font-semibold">Nome interno da campanha<input name="campaignName" required value={draft.campaignName} onChange={(e) => field("campaignName", e.target.value)} placeholder="Ex.: Lançamento de nova ferramenta" className="h-10 border border-white/10 bg-background px-3 text-sm font-normal" /></label>
        <label className="grid gap-1.5 text-xs font-semibold">Público<select name="audience" value={draft.audience} onChange={(e) => field("audience", e.target.value)} className="h-10 border border-white/10 bg-background px-3 text-sm font-normal"><option value="all">Todos os cadastros ({counts.all})</option><option value="free">Plano Grátis ({counts.free})</option><option value="pro">Plano Pro ({counts.pro})</option><option value="agency">Plano Agency ({counts.agency})</option><option value="active">Assinantes ativos ({counts.active})</option><option value="trial">Teste/cortesia ({counts.trial})</option></select></label>
      </div>

      <label className="grid gap-1.5 text-xs font-semibold">Assunto do e-mail<input name="subject" required maxLength={180} value={draft.subject} onChange={(e) => field("subject", e.target.value)} placeholder="O texto que aparecerá na caixa de entrada" className="h-10 border border-white/10 bg-background px-3 text-sm font-normal" /></label>
      <label className="grid gap-1.5 text-xs font-semibold">Pré-header<input name="preheader" maxLength={220} value={draft.preheader} onChange={(e) => field("preheader", e.target.value)} placeholder="Complemento curto exibido após o assunto em muitos provedores" className="h-10 border border-white/10 bg-background px-3 text-sm font-normal" /></label>

      <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
        <label className="grid gap-1.5 text-xs font-semibold">Selo/categoria<input name="eyebrow" maxLength={80} value={draft.eyebrow} onChange={(e) => field("eyebrow", e.target.value)} className="h-10 border border-white/10 bg-background px-3 text-sm font-normal" /></label>
        <label className="grid gap-1.5 text-xs font-semibold">Título principal<input name="headline" required maxLength={180} value={draft.headline} onChange={(e) => field("headline", e.target.value)} placeholder="A mensagem principal da campanha" className="h-10 border border-white/10 bg-background px-3 text-sm font-normal" /></label>
      </div>

      <label className="grid gap-1.5 text-xs font-semibold">Conteúdo<textarea name="message" required rows={9} maxLength={10000} value={draft.message} onChange={(e) => field("message", e.target.value)} placeholder={'Escreva o e-mail livremente.\n\nSepare parágrafos deixando uma linha em branco.'} className="border border-white/10 bg-background p-3 text-sm font-normal leading-6" /></label>
      <label className="grid gap-1.5 text-xs font-semibold">Bloco de destaque <span className="font-normal text-muted-foreground">opcional</span><textarea name="highlight" rows={3} maxLength={1200} value={draft.highlight} onChange={(e) => field("highlight", e.target.value)} placeholder="Use para benefício, aviso, condição ou informação importante." className="border border-white/10 bg-background p-3 text-sm font-normal leading-6" /></label>

      <div className="grid gap-4 sm:grid-cols-[220px_1fr]">
        <label className="grid gap-1.5 text-xs font-semibold">Texto do botão<input name="ctaLabel" maxLength={70} value={draft.ctaLabel} onChange={(e) => field("ctaLabel", e.target.value)} className="h-10 border border-white/10 bg-background px-3 text-sm font-normal" /></label>
        <label className="grid gap-1.5 text-xs font-semibold">Link do botão<input name="ctaUrl" type="url" value={draft.ctaUrl} onChange={(e) => field("ctaUrl", e.target.value)} placeholder="https://..." className="h-10 border border-white/10 bg-background px-3 text-sm font-normal" /></label>
      </div>

      <div className="border border-primary/20 bg-primary/[0.04] p-4">
        <p className="text-sm font-semibold">Destinatários estimados: {audienceCount}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">O sistema respeita quem cancelou e-mails de marketing. Cada mensagem é enviada individualmente pelo Resend e mantém o link de descadastro.</p>
      </div>

      <label className="flex items-start gap-3 border border-red-400/20 bg-red-500/[0.04] p-4 text-sm"><input name="confirmSend" type="checkbox" className="mt-1" /><span><strong>Confirmo o envio desta campanha.</strong><span className="mt-1 block text-xs leading-5 text-muted-foreground">Ao clicar no botão abaixo, o envio começa imediatamente para o público selecionado. Revise assunto, conteúdo, links e quantidade de destinatários.</span></span></label>

      {state.message ? <div className={`border p-3 text-sm ${state.ok ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200" : "border-amber-400/30 bg-amber-500/10 text-amber-100"}`}>{state.message}</div> : null}

      <div className="flex flex-wrap gap-2"><button disabled={pending} className="inline-flex h-10 items-center gap-2 bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-50"><Send className="size-4" />{pending ? "Enviando campanha..." : "Enviar campanha agora"}</button><button type="button" onClick={resetDraft} className="inline-flex h-10 items-center gap-2 border border-white/10 px-4 text-sm font-semibold text-muted-foreground hover:text-foreground"><RotateCcw className="size-4" />Limpar rascunho</button></div>
    </form>

    <section className="h-fit border border-white/10 bg-card p-4 sm:p-5 xl:sticky xl:top-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Prévia</p><h2 className="mt-1 font-semibold">Como o e-mail ficará</h2></div><div className="flex border border-white/10"><button type="button" onClick={() => setPreviewMode("desktop")} className={`inline-flex h-9 items-center gap-2 px-3 text-xs font-semibold ${previewMode === "desktop" ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}><Monitor className="size-4" />Desktop</button><button type="button" onClick={() => setPreviewMode("mobile")} className={`inline-flex h-9 items-center gap-2 px-3 text-xs font-semibold ${previewMode === "mobile" ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}><Smartphone className="size-4" />Mobile</button></div></div>
      <div className="overflow-auto border border-white/10 bg-[#090a10] p-3 sm:p-5"><div className={`mx-auto transition-all ${previewMode === "mobile" ? "max-w-[360px]" : "max-w-[640px]"}`}><div className="rounded-[18px] border border-[#252836] bg-[#0f1119] p-6 text-white sm:p-8"><div className="mb-6 inline-block rounded-full border border-[#343861] px-3 py-2 text-[11px] font-extrabold tracking-[0.12em] text-[#9ca1ff]">KIVAI</div>{draft.eyebrow ? <div className="mb-3 text-[11px] font-extrabold tracking-[0.14em] text-[#7f86ff]">{draft.eyebrow.toUpperCase()}</div> : null}<h1 className="mb-5 text-2xl font-bold leading-tight sm:text-[32px]">{draft.headline || "Seu título principal aparecerá aqui"}</h1><div className="space-y-4 text-[15px] leading-7 text-[#d8d9e3]">{paragraphs.length ? paragraphs.map((p, i) => <p key={i} className="whitespace-pre-line">{p}</p>) : <p className="text-[#7f8292]">Escreva o conteúdo para visualizar a campanha.</p>}</div>{draft.highlight ? <div className="mt-6 rounded-xl border border-[#353a69] bg-[#15182a] p-4 text-sm leading-6 text-[#eef0ff] whitespace-pre-line">{draft.highlight}</div> : null}{draft.ctaLabel ? <div className="mt-6"><span className="inline-block rounded-[10px] bg-[#6d72ff] px-5 py-3 text-sm font-extrabold text-white">{draft.ctaLabel}</span></div> : null}<div className="mt-7 text-xs leading-5 text-[#8f92a3]">Ferramentas inteligentes para resultados reais.<br /><span className="text-[#9aa0ff]">kivai.com.br</span> · <span className="text-[#9aa0ff]">WhatsApp</span></div><div className="mt-6 border-t border-[#262936] pt-5 text-[11px] leading-5 text-[#8f92a3]">O link real de cancelamento de e-mails de marketing será inserido automaticamente para cada destinatário.</div></div></div></div>
      <div className="mt-3 border border-white/10 bg-background/40 p-3 text-xs leading-5 text-muted-foreground"><strong className="text-foreground">Assunto:</strong> {draft.subject || "Ainda não definido"}<br /><strong className="text-foreground">Pré-header:</strong> {draft.preheader || "Ainda não definido"}</div>
    </section>
  </div>;
}
