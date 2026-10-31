"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ContentAiFrame, useContentAi } from "@/components/tools/content-ai-shared";
import { contentAssistantInput, type PlannerSuggestion } from "@/lib/ai/content-assistant";
import type { AssistantCopy } from "@/lib/ai/content-assistant-copy";

export function PlannerAi({ plan, copy, onApply }: {
  plan: { theme: string; audience: string; objective: string; networks: string[]; format: string; tone: string; message: string; hook: string; topics: string[]; cta: string };
  copy: AssistantCopy; onApply: (suggestion: PlannerSuggestion, replace: boolean) => void;
}) {
  const [replace, setReplace] = useState(false);
  const [result, setResult] = useState<{ fingerprint: string; suggestion: PlannerSuggestion } | null>(null);
  const [feedback, setFeedback] = useState("");
  const ai = useContentAi();
  const fingerprint = JSON.stringify(plan);
  const visible = result?.fingerprint === fingerprint ? result.suggestion : null;
  const input = contentAssistantInput.safeParse({ kind: "planner", theme: plan.theme, audience: plan.audience, objective: plan.objective, networks: plan.networks, format: plan.format, tone: plan.tone || "Profissional", message: plan.message, consent: true });
  async function generate() {
    if (!input.success) return;
    setFeedback("");
    const output = await ai.generate(input.data);
    if (output?.kind === "planner") setResult({ fingerprint, suggestion: output.suggestion });
  }
  return <div className="space-y-4">
    <ContentAiFrame copy={copy} consent={true} onConsent={() => {}} loading={ai.loading} error={ai.error} disabled={!input.success} onGenerate={() => void generate()}>
      {!input.success && <p className="text-sm text-muted-foreground">Preencha tema (até 600 caracteres), público (até 400), objetivo e pelo menos uma rede no formulário abaixo. A mensagem principal pode ter até 1.600 caracteres.</p>}
    </ContentAiFrame>
    {result && !visible && !feedback && <p role="status" className="text-sm text-muted-foreground">O briefing mudou. Gere novas sugestões para usar os dados atuais.</p>}
    {visible && <section data-print-hide className="space-y-4 border border-border bg-card p-4 sm:p-6" aria-label="Sugestão de briefing" aria-live="polite">
      <h3 className="font-semibold">Revise antes de aplicar</h3>
      <dl className="space-y-3 text-sm leading-6"><div><dt className="font-semibold">Mensagem central</dt><dd>{visible.message}</dd></div><div><dt className="font-semibold">Gancho</dt><dd>{visible.hook}</dd></div><div><dt className="font-semibold">Roteiro</dt><dd><ol className="list-decimal space-y-1 pl-5">{visible.topics.map((topic, index) => <li key={index}>{topic}</li>)}</ol></dd></div><div><dt className="font-semibold">Chamada para ação</dt><dd>{visible.cta}</dd></div></dl>
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={replace} onChange={event => setReplace(event.target.checked)} className="mt-1 size-4 shrink-0" />Substituir também mensagem, gancho, tópicos e CTA já preenchidos. Desmarcado, apenas campos vazios serão completados.</label>
      <Button type="button" variant="outline" disabled={ai.loading} onClick={() => { onApply(visible, replace); setResult(null); setFeedback("Sugestões aplicadas. Edite os campos do planejamento e salve na conta quando quiser."); }}>Aplicar ao planejamento</Button>
    </section>}
    {feedback && <p role="status" className="text-sm text-primary">{feedback}</p>}
  </div>;
}
