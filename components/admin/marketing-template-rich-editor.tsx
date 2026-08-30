"use client";

import { useMemo, useState } from "react";
import { Monitor, Smartphone } from "lucide-react";
import { EmailRichEditor } from "@/app/admin/marketing/email-marketing/email-rich-editor";

type UserOption = { id: string; email: string; name: string | null };
type TemplateValue = {
  title: string;
  description: string;
  subject: string;
  message: string;
  ctaLabel: string;
  ctaUrl: string;
  secondaryCtaLabel: string;
  secondaryCtaUrl: string;
  enabled: boolean;
};

export function MarketingTemplateRichEditor({ initial, automatic, users = [], saveAction, sendAction }: {
  initial: TemplateValue;
  automatic: boolean;
  users?: UserOption[];
  saveAction: (formData: FormData) => Promise<void>;
  sendAction?: (formData: FormData) => Promise<void>;
}) {
  const [value, setValue] = useState(initial);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const previewHtml = useMemo(() => ({ __html: value.message || "<p style='color:#7f8292'>Escreva o conteúdo para visualizar o e-mail.</p>" }), [value.message]);

  return <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(420px,.9fr)]">
    <div className="space-y-5">
      <form action={saveAction} className="space-y-5 border border-white/10 bg-card p-5 sm:p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-1.5 text-sm"><span>Nome interno</span><input name="title" required maxLength={160} value={value.title} onChange={(e) => setValue((current) => ({ ...current, title: e.target.value }))} className="h-10 border border-white/10 bg-background px-3" /></label>
          <label className="grid gap-1.5 text-sm"><span>Assunto</span><input name="subject" required maxLength={200} value={value.subject} onChange={(e) => setValue((current) => ({ ...current, subject: e.target.value }))} className="h-10 border border-white/10 bg-background px-3" /></label>
        </div>
        <label className="grid gap-1.5 text-sm"><span>Descrição interna</span><textarea name="description" rows={3} maxLength={1500} value={value.description} onChange={(e) => setValue((current) => ({ ...current, description: e.target.value }))} className="border border-white/10 bg-background p-3 leading-6" /></label>
        <div><span className="mb-1.5 block text-sm">Conteúdo do e-mail</span><EmailRichEditor value={value.message} onChange={(message) => setValue((current) => ({ ...current, message }))} /><input type="hidden" name="message" value={value.message} /></div>
        <div className="grid gap-4 md:grid-cols-2"><label className="grid gap-1.5 text-sm"><span>Texto do botão principal</span><input name="ctaLabel" maxLength={80} value={value.ctaLabel} onChange={(e) => setValue((current) => ({ ...current, ctaLabel: e.target.value }))} className="h-10 border border-white/10 bg-background px-3" /></label><label className="grid gap-1.5 text-sm"><span>Link do botão principal</span><input name="ctaUrl" type="url" value={value.ctaUrl} onChange={(e) => setValue((current) => ({ ...current, ctaUrl: e.target.value }))} placeholder="https://..." className="h-10 border border-white/10 bg-background px-3" /></label></div>
        <div className="grid gap-4 md:grid-cols-2"><label className="grid gap-1.5 text-sm"><span>Texto do segundo botão <small className="font-normal text-muted-foreground">opcional</small></span><input name="secondaryCtaLabel" maxLength={80} value={value.secondaryCtaLabel} onChange={(e) => setValue((current) => ({ ...current, secondaryCtaLabel: e.target.value }))} className="h-10 border border-white/10 bg-background px-3" /></label><label className="grid gap-1.5 text-sm"><span>Link do segundo botão</span><input name="secondaryCtaUrl" type="url" value={value.secondaryCtaUrl} onChange={(e) => setValue((current) => ({ ...current, secondaryCtaUrl: e.target.value }))} placeholder="https://..." className="h-10 border border-white/10 bg-background px-3" /></label></div>
        <label className="flex items-center gap-2 text-sm"><input name="enabled" type="checkbox" checked={value.enabled} onChange={(e) => setValue((current) => ({ ...current, enabled: e.target.checked }))} />Template ativo</label>
        <button className="h-10 bg-primary px-5 text-sm font-semibold text-primary-foreground">Salvar template</button>
      </form>

      {!automatic && sendAction ? <form action={sendAction} className="space-y-4 border border-primary/20 bg-primary/[0.04] p-5">
        <input type="hidden" name="subject" value={value.subject} /><input type="hidden" name="message" value={value.message} /><input type="hidden" name="ctaLabel" value={value.ctaLabel} /><input type="hidden" name="ctaUrl" value={value.ctaUrl} /><input type="hidden" name="secondaryCtaLabel" value={value.secondaryCtaLabel} /><input type="hidden" name="secondaryCtaUrl" value={value.secondaryCtaUrl} />
        <div><p className="font-semibold">Enviar este e-mail manualmente</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Revise a prévia ao lado e escolha o destinatário. O envio respeita a preferência de marketing do usuário.</p></div>
        <label className="grid gap-1.5 text-sm"><span>Destinatário</span><select name="userId" required className="h-10 border border-white/10 bg-background px-3"><option value="">Selecionar usuário</option>{users.map((user) => <option key={user.id} value={user.id}>{user.name ? `${user.name} · ` : ""}{user.email}</option>)}</select></label>
        <label className="flex items-start gap-3 border border-red-400/20 bg-red-500/[0.04] p-3 text-sm"><input name="confirmSend" type="checkbox" className="mt-1" /><span><strong>Confirmo o envio deste e-mail.</strong><span className="mt-1 block text-xs text-muted-foreground">O disparo começa imediatamente após clicar em enviar.</span></span></label>
        <button className="h-10 bg-primary px-5 text-sm font-semibold text-primary-foreground">Enviar e-mail agora</button>
      </form> : null}
    </div>

    <section className="h-fit border border-white/10 bg-card p-4 sm:p-5 xl:sticky xl:top-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Prévia</p><h2 className="mt-1 font-semibold">Como o e-mail ficará</h2></div><div className="flex border border-white/10"><button type="button" onClick={() => setPreviewMode("desktop")} className={`inline-flex h-9 items-center gap-2 px-3 text-xs font-semibold ${previewMode === "desktop" ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}><Monitor className="size-4" />Desktop</button><button type="button" onClick={() => setPreviewMode("mobile")} className={`inline-flex h-9 items-center gap-2 px-3 text-xs font-semibold ${previewMode === "mobile" ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}><Smartphone className="size-4" />Mobile</button></div></div>
      <div className="overflow-auto border border-white/10 bg-[#090a10] p-3 sm:p-5"><div className={`mx-auto transition-all ${previewMode === "mobile" ? "max-w-[360px]" : "max-w-[640px]"}`}><div className="rounded-[18px] border border-[#252836] bg-[#0f1119] p-6 text-white sm:p-8"><div className="mb-6 inline-block rounded-full border border-[#343861] px-3 py-2 text-[11px] font-extrabold tracking-[0.12em] text-[#9ca1ff]">KIVAI</div><h1 className="mb-5 text-2xl font-bold leading-tight sm:text-[32px]">{value.subject || "Assunto do e-mail"}</h1><div className="email-template-preview text-[15px] leading-7 text-[#d8d9e3]" dangerouslySetInnerHTML={previewHtml} />{value.ctaLabel || value.secondaryCtaLabel ? <div className="mt-6 flex flex-wrap gap-2">{value.ctaLabel ? <span className="inline-block rounded-[10px] bg-[#6d72ff] px-5 py-3 text-sm font-extrabold text-white">{value.ctaLabel}</span> : null}{value.secondaryCtaLabel ? <span className="inline-block rounded-[10px] bg-[#6d72ff] px-5 py-3 text-sm font-extrabold text-white">{value.secondaryCtaLabel}</span> : null}</div> : null}<div className="mt-7 text-xs leading-5 text-[#8f92a3]">Ferramentas inteligentes para resultados reais.<br /><span className="text-[#9aa0ff]">kivai.com.br</span> · <span className="text-[#9aa0ff]">WhatsApp</span></div></div></div></div>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">A prévia representa o layout Kivai. Pequenas diferenças podem ocorrer entre Gmail, Outlook e outros clientes de e-mail.</p>
    </section>
  </div>;
}
