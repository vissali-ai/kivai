"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ContentAiFrame, useContentAi } from "@/components/tools/content-ai-shared";
import { AI_NETWORKS, AI_OBJECTIVES, contentAssistantInput, type CalendarSuggestion } from "@/lib/ai/content-assistant";
import type { AssistantCopy } from "@/lib/ai/content-assistant-copy";

export function CalendarAi({ copy, startDate, onApply, existingCount }: {
  copy: AssistantCopy; startDate: string; existingCount: number; onApply: (items: CalendarSuggestion[]) => void;
}) {
  const [briefing, setBriefing] = useState({ theme: "", audience: "", network: "Instagram", objective: "Engajamento", tone: "Profissional", startDate, count: 5, intervalDays: 2 });
  const [consent, setConsent] = useState(false);
  const [result, setResult] = useState<{ fingerprint: string; items: CalendarSuggestion[] } | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [applied, setApplied] = useState<number[]>([]);
  const [feedback, setFeedback] = useState("");
  const ai = useContentAi();
  const fingerprint = JSON.stringify(briefing);
  const visible = result?.fingerprint === fingerprint ? result.items : null;
  const input = contentAssistantInput.safeParse({ ...briefing, kind: "calendar", consent: true });
  function update(key: keyof typeof briefing, value: string | number) { setBriefing(current => ({ ...current, [key]: value })); }
  async function generate() {
    if (!input.success || !consent) return;
    setFeedback("");
    const output = await ai.generate(input.data);
    if (output?.kind === "calendar") { setResult({ fingerprint, items: output.items }); setSelected(output.items.map((_, index) => index)); setApplied([]); }
  }
  const pending = selected.filter(index => !applied.includes(index));
  return <div className="space-y-4">
    <ContentAiFrame copy={copy} consent={consent} onConsent={setConsent} loading={ai.loading} error={ai.error} disabled={!input.success} onGenerate={() => void generate()}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tema, negócio ou campanha"><textarea value={briefing.theme} maxLength={600} rows={3} onChange={event => update("theme", event.target.value)} placeholder="Ex.: cafeteria de bairro, divulgar cafés especiais" className="border border-border bg-background p-3" /></Field>
        <Field label="Público do calendário"><textarea value={briefing.audience} maxLength={400} rows={3} onChange={event => update("audience", event.target.value)} placeholder="Ex.: pessoas que trabalham perto da cafeteria" className="border border-border bg-background p-3" /></Field>
        <Field label="Rede social das sugestões"><select value={briefing.network} onChange={event => update("network", event.target.value)} className="min-h-10 border border-border bg-background px-3">{AI_NETWORKS.map(value => <option key={value}>{value}</option>)}</select></Field>
        <Field label="Objetivo das sugestões"><select value={briefing.objective} onChange={event => update("objective", event.target.value)} className="min-h-10 border border-border bg-background px-3">{AI_OBJECTIVES.map(value => <option key={value}>{value}</option>)}</select></Field>
        <Field label="Tom de comunicação da IA"><select value={briefing.tone} onChange={event => update("tone", event.target.value)} className="min-h-10 border border-border bg-background px-3">{["Profissional", "Educativo", "Descontraído", "Conversacional", "Direto"].map(value => <option key={value}>{value}</option>)}</select></Field>
        <Field label="Primeira data sugerida"><input type="date" value={briefing.startDate} onChange={event => update("startDate", event.target.value)} className="min-h-10 border border-border bg-background px-3" /></Field>
        <Field label="Quantidade de sugestões"><select value={briefing.count} onChange={event => update("count", Number(event.target.value))} className="min-h-10 border border-border bg-background px-3">{[3, 5, 7].map(value => <option key={value} value={value}>{value} publicações</option>)}</select></Field>
        <Field label="Intervalo entre publicações"><select value={briefing.intervalDays} onChange={event => update("intervalDays", Number(event.target.value))} className="min-h-10 border border-border bg-background px-3">{[1, 2, 3, 7].map(value => <option key={value} value={value}>{value === 1 ? "Todos os dias" : `A cada ${value} dias`}</option>)}</select></Field>
      </div>
      <p className="text-xs leading-5 text-muted-foreground">Somente este briefing será enviado. Seu calendário existente não é enviado à IA. As datas seguem o intervalo escolhido e podem coincidir com publicações já cadastradas.</p>
    </ContentAiFrame>
    {result && !visible && <p role="status" className="text-sm text-muted-foreground">O briefing mudou. Gere novamente para usar as novas opções.</p>}
    {visible && <section data-print-hide className="space-y-4 border border-border bg-card p-4 sm:p-6" aria-label="Publicações sugeridas" aria-live="polite">
      <h3 className="font-semibold">Escolha o que adicionar ao calendário</h3>
      <p className="text-sm text-muted-foreground">Os itens entram como Ideia. Você poderá editar data, legenda e formato; suas publicações atuais serão mantidas.</p>
      <div className="grid gap-3 md:grid-cols-2">{visible.map((item, index) => <article key={index} className="min-w-0 space-y-2 border border-border p-4">
        <label className="flex items-start gap-2 font-medium"><input type="checkbox" checked={selected.includes(index)} disabled={applied.includes(index)} onChange={event => setSelected(current => event.target.checked ? [...current, index] : current.filter(value => value !== index))} className="mt-1 size-4 shrink-0" />{item.title}</label>
        <p className="text-xs text-muted-foreground">{item.date.split("-").reverse().join("/")} · {item.network} · {item.format}{applied.includes(index) ? " · Adicionado" : ""}</p>
        <p className="whitespace-pre-wrap break-words text-sm leading-6">{item.caption}</p><p className="text-sm"><strong>CTA:</strong> {item.cta}</p>
        {item.observations && <p className="text-xs leading-5 text-muted-foreground">Produção: {item.observations}</p>}
      </article>)}</div>
      {existingCount + pending.length > 1000 && <p role="alert" className="text-sm text-destructive">O calendário pode ter até 1.000 publicações para salvar na conta. Selecione menos itens.</p>}
      <Button type="button" variant="outline" disabled={ai.loading || !pending.length || existingCount + pending.length > 1000} onClick={() => {
        onApply(pending.map(index => visible[index]));
        setApplied(current => [...current, ...pending]); setSelected([]);
        setFeedback(`${pending.length} publicações adicionadas. Revise no calendário abaixo e salve na conta quando quiser.`);
      }}>Adicionar selecionadas ({pending.length})</Button>
    </section>}
    {feedback && <p role="status" className="text-sm text-primary">{feedback}</p>}
  </div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="grid min-w-0 gap-1.5 text-sm font-medium">{label}{children}</label>; }
