"use client";

import { useMemo, useState } from "react";
import { Plus, Save, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { InstagramAnalyzerConfig } from "@/lib/instagram-follow-analyzer-config";

const fieldClass = "block space-y-1.5 text-sm";
const textareaClass = "min-h-24 w-full rounded-md border border-input bg-background p-3 text-sm";
const blocks = [
  ["hero", "Topo da página"],
  ["tutorial", "Passo a passo"],
  ["upload", "Área de upload/análise"],
  ["summaryPlans", "Cards resumidos de planos"],
  ["audience", "Para quem é"],
  ["plans", "Explicação detalhada dos planos"],
  ["faq", "Dúvidas frequentes"],
  ["privacy", "Privacidade e uso dos dados"],
] as const;

type Plan = "free" | "pro";
type Variants = Record<Plan, InstagramAnalyzerConfig>;

async function imageDimensions(file: File) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = reject;
    image.src = objectUrl;
  });
}

export function InstagramPlanVariantEditor({ initialVariants }: { initialVariants: Variants }) {
  const [variants, setVariants] = useState(initialVariants);
  const [activePlan, setActivePlan] = useState<Plan>("free");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploadingStep, setUploadingStep] = useState<number | null>(null);

  const draft = variants[activePlan];
  const planLabel = activePlan === "free" ? "Grátis" : "Pro";
  const accent = activePlan === "pro" ? "border-primary/30 bg-primary/[0.025]" : "border-white/10 bg-card";

  function update(mutator: (current: InstagramAnalyzerConfig) => InstagramAnalyzerConfig) {
    setVariants((current) => ({ ...current, [activePlan]: mutator(current[activePlan]) }));
  }

  function setField<K extends keyof InstagramAnalyzerConfig>(key: K, value: InstagramAnalyzerConfig[K]) {
    update((current) => ({ ...current, [key]: value }));
  }

  function setVisibility(key: string, value: boolean) {
    update((current) => ({
      ...current,
      sectionVisibility: { ...current.sectionVisibility, [key]: value },
    }));
  }

  function setStep(index: number, field: "title" | "description" | "imageUrl", value: string) {
    update((current) => ({
      ...current,
      tutorialSteps: current.tutorialSteps.map((step, i) => (i === index ? { ...step, [field]: value } : step)),
    }));
  }

  function addStep() {
    update((current) => ({
      ...current,
      tutorialSteps: [...current.tutorialSteps, { title: "Novo passo", description: "", imageUrl: "" }],
    }));
  }

  function removeStep(index: number) {
    update((current) => ({
      ...current,
      tutorialSteps: current.tutorialSteps.filter((_, i) => i !== index),
    }));
  }

  function setFaq(index: number, field: "question" | "answer", value: string) {
    update((current) => ({
      ...current,
      faqItems: current.faqItems.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    }));
  }

  function addFaq() {
    update((current) => ({
      ...current,
      faqItems: [...current.faqItems, { question: "Nova dúvida", answer: "" }],
    }));
  }

  function removeFaq(index: number) {
    update((current) => ({ ...current, faqItems: current.faqItems.filter((_, i) => i !== index) }));
  }

  async function uploadStepImage(index: number, file?: File) {
    if (!file) return;
    setUploadingStep(index);
    setMessage("");
    try {
      const dimensions = await imageDimensions(file);
      const data = new FormData();
      data.set("file", file);
      data.set("width", String(dimensions.width));
      data.set("height", String(dimensions.height));
      data.set("alt", `Tutorial Instagram ${planLabel} - passo ${index + 1}`);
      data.set("source", "own");
      const response = await fetch("/api/admin/media", { method: "POST", body: data });
      const result = (await response.json()) as { error?: string; url?: string };
      if (!response.ok || !result.url) throw new Error(result.error || "Não foi possível enviar a imagem.");
      setStep(index, "imageUrl", result.url);
      setMessage(`Imagem do passo ${index + 1} da versão ${planLabel} enviada. Salve a versão para publicar.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível enviar a imagem.");
    } finally {
      setUploadingStep(null);
    }
  }

  async function save() {
    setBusy(true);
    setMessage(`Salvando versão ${planLabel}...`);
    try {
      const response = await fetch("/api/admin/instagram-follow-analyzer-plan-variants", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: activePlan, config: draft }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Não foi possível salvar esta versão.");
      setVariants((current) => ({ ...current, [activePlan]: result as InstagramAnalyzerConfig }));
      setMessage(`Versão ${planLabel} salva. A mesma URL exibirá este conteúdo para usuários deste plano.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível salvar esta versão.");
    } finally {
      setBusy(false);
    }
  }

  const privacyText = useMemo(() => draft.privacyItems.join("\n"), [draft.privacyItems]);
  const planItems = activePlan === "free" ? draft.freePlanDetail : draft.proPlanDetail;

  return (
    <main className="mx-auto mt-8 max-w-6xl space-y-6 border-t border-white/10 pt-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Personalização por plano</p>
          <h2 className="mt-1 text-2xl font-semibold">Conteúdo diferente para Grátis e Pro</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            A URL pública continua a mesma. O conteúdo Grátis é a versão padrão para visitantes e SEO. Usuários autenticados no Pro recebem a versão Pro. A aba Agency será adicionada quando esse painel for implantado.
          </p>
        </div>
        <Button type="button" onClick={save} disabled={busy}><Save />{busy ? "Salvando..." : `Salvar versão ${planLabel}`}</Button>
      </header>

      <div className="flex gap-2" role="tablist" aria-label="Plano editado">
        <Button type="button" variant={activePlan === "free" ? "default" : "outline"} onClick={() => setActivePlan("free")}>Conta Grátis</Button>
        <Button type="button" variant={activePlan === "pro" ? "default" : "outline"} onClick={() => setActivePlan("pro")}>Conta Pro</Button>
        <Button type="button" variant="outline" disabled title="Será liberado quando o plano Agency estiver pronto">Agency em breve</Button>
      </div>

      {message ? <p role="status" className="border border-white/10 bg-muted/10 p-3 text-sm">{message}</p> : null}

      <fieldset className={`space-y-4 rounded-xl border p-4 sm:p-6 ${accent}`}>
        <legend className="px-1 font-semibold">Blocos visíveis na versão {planLabel}</legend>
        <p className="text-xs leading-5 text-muted-foreground">Você pode esconder blocos inteiros sem afetar a outra versão. As regras de acesso e os limites do plano continuam protegidos no sistema.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {blocks.map(([key, label]) => (
            <label key={key} className="flex items-center justify-between gap-3 border border-white/10 bg-card p-3 text-sm">
              <span>{label}</span>
              <input type="checkbox" className="size-4" checked={draft.sectionVisibility[key] !== false} onChange={(event) => setVisibility(key, event.target.checked)} />
            </label>
          ))}
        </div>
      </fieldset>

      <section className="grid gap-4 rounded-xl border border-white/10 bg-card p-4 sm:grid-cols-2 sm:p-6">
        <div className="sm:col-span-2"><h3 className="font-semibold">Topo da versão {planLabel}</h3></div>
        <label className={fieldClass}><span>Texto superior</span><Input value={draft.eyebrow} onChange={(e) => setField("eyebrow", e.target.value)} /></label>
        <label className={fieldClass}><span>Título principal</span><Input value={draft.pageTitle} onChange={(e) => setField("pageTitle", e.target.value)} /></label>
        <label className={`${fieldClass} sm:col-span-2`}><span>Descrição principal</span><textarea className={textareaClass} value={draft.heroDescription} onChange={(e) => setField("heroDescription", e.target.value)} /></label>
        <label className={fieldClass}><span>Badge 1</span><Input value={draft.badgeOne} onChange={(e) => setField("badgeOne", e.target.value)} /></label>
        <label className={fieldClass}><span>Badge 2</span><Input value={draft.badgeTwo} onChange={(e) => setField("badgeTwo", e.target.value)} /></label>
      </section>

      <section className="space-y-5 rounded-xl border border-primary/20 bg-card p-4 sm:p-6">
        <div><h3 className="font-semibold">Passo a passo da versão {planLabel}</h3><p className="mt-1 text-xs text-muted-foreground">Cada plano pode ter quantidade de passos, textos e imagens diferentes.</p></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={fieldClass}><span>Chamada pequena</span><Input value={draft.tutorialKicker} onChange={(e) => setField("tutorialKicker", e.target.value)} /></label>
          <label className={fieldClass}><span>Título</span><Input value={draft.tutorialTitle} onChange={(e) => setField("tutorialTitle", e.target.value)} /></label>
          <label className={`${fieldClass} sm:col-span-2`}><span>Descrição</span><textarea className={textareaClass} value={draft.tutorialDescription} onChange={(e) => setField("tutorialDescription", e.target.value)} /></label>
          <label className={fieldClass}><span>Texto do botão Meta</span><Input value={draft.metaButtonLabel} onChange={(e) => setField("metaButtonLabel", e.target.value)} /></label>
          <label className={fieldClass}><span>Link da Meta</span><Input type="url" value={draft.metaUrl} onChange={(e) => setField("metaUrl", e.target.value)} /></label>
        </div>

        <div className="space-y-5">
          {draft.tutorialSteps.map((step, index) => (
            <article key={`${activePlan}-${index}`} className="grid gap-4 rounded-lg border border-white/10 bg-muted/5 p-4 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Passo {index + 1}</p><Button type="button" size="sm" variant="ghost" onClick={() => removeStep(index)}><Trash2 className="size-4" />Remover</Button></div>
                <label className={fieldClass}><span>Título</span><Input value={step.title} onChange={(e) => setStep(index, "title", e.target.value)} /></label>
                <label className={fieldClass}><span>Descrição</span><textarea className={textareaClass} value={step.description} onChange={(e) => setStep(index, "description", e.target.value)} /></label>
                <label className={fieldClass}><span>URL da imagem</span><Input value={step.imageUrl} onChange={(e) => setStep(index, "imageUrl", e.target.value)} /></label>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input px-3 py-2 text-sm hover:bg-muted/20"><Upload className="size-4" />{uploadingStep === index ? "Enviando..." : "Enviar/substituir imagem"}<input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={uploadingStep === index} onChange={(e) => uploadStepImage(index, e.target.files?.[0])} /></label>
              </div>
              <div className="flex min-h-52 items-center justify-center border border-white/10 bg-black/20 p-3">{step.imageUrl ? <img src={step.imageUrl} alt={`Prévia ${planLabel} passo ${index + 1}`} className="max-h-96 w-auto max-w-full object-contain" /> : <p className="text-center text-xs text-muted-foreground">Nenhuma imagem configurada.</p>}</div>
            </article>
          ))}
        </div>
        <Button type="button" variant="outline" onClick={addStep}><Plus />Adicionar passo</Button>
        <label className={fieldClass}><span>Texto final do tutorial</span><Input value={draft.finalCta} onChange={(e) => setField("finalCta", e.target.value)} /></label>
      </section>

      <section className="grid gap-4 rounded-xl border border-white/10 bg-card p-4 sm:grid-cols-2 sm:p-6">
        <div className="sm:col-span-2"><h3 className="font-semibold">Área de análise</h3></div>
        <label className={fieldClass}><span>Título</span><Input value={draft.uploadTitle} onChange={(e) => setField("uploadTitle", e.target.value)} /></label>
        <label className={fieldClass}><span>Texto do seletor</span><Input value={draft.uploadLabel} onChange={(e) => setField("uploadLabel", e.target.value)} /></label>
        <label className={`${fieldClass} sm:col-span-2`}><span>Descrição</span><textarea className={textareaClass} value={draft.uploadDescription} onChange={(e) => setField("uploadDescription", e.target.value)} /></label>
      </section>

      <section className="grid gap-4 rounded-xl border border-white/10 bg-card p-4 sm:grid-cols-2 sm:p-6">
        <div className="sm:col-span-2"><h3 className="font-semibold">Conteúdo complementar</h3></div>
        <label className={fieldClass}><span>Título “Para quem é”</span><Input value={draft.audienceTitle} onChange={(e) => setField("audienceTitle", e.target.value)} /></label>
        <label className={fieldClass}><span>Título da explicação dos planos</span><Input value={draft.plansTitle} onChange={(e) => setField("plansTitle", e.target.value)} /></label>
        <label className={`${fieldClass} sm:col-span-2`}><span>Descrição “Para quem é”</span><textarea className={textareaClass} value={draft.audienceDescription} onChange={(e) => setField("audienceDescription", e.target.value)} /></label>
        <label className={fieldClass}><span>Descrição do Grátis</span><textarea className={textareaClass} value={draft.freeDescription} onChange={(e) => setField("freeDescription", e.target.value)} /></label>
        <label className={fieldClass}><span>Descrição do Pro</span><textarea className={textareaClass} value={draft.proDescription} onChange={(e) => setField("proDescription", e.target.value)} /></label>
        <label className={`${fieldClass} sm:col-span-2`}><span>Itens do plano {planLabel}, um por linha</span><textarea className={textareaClass} value={planItems.join("\n")} onChange={(e) => setField(activePlan === "free" ? "freePlanDetail" : "proPlanDetail", e.target.value.split("\n").map((item) => item.trim()).filter(Boolean))} /></label>
      </section>

      <section className="space-y-4 rounded-xl border border-white/10 bg-card p-4 sm:p-6">
        <div className="flex items-center justify-between gap-3"><h3 className="font-semibold">FAQ da versão {planLabel}</h3><Button type="button" size="sm" variant="outline" onClick={addFaq}><Plus />Adicionar dúvida</Button></div>
        {draft.faqItems.map((item, index) => (
          <div key={`${activePlan}-faq-${index}`} className="grid gap-3 border border-white/10 p-4 sm:grid-cols-[1fr_1.5fr_auto]">
            <Input value={item.question} onChange={(e) => setFaq(index, "question", e.target.value)} placeholder="Pergunta" />
            <textarea className={textareaClass} value={item.answer} onChange={(e) => setFaq(index, "answer", e.target.value)} placeholder="Resposta" />
            <Button type="button" size="sm" variant="ghost" onClick={() => removeFaq(index)}><Trash2 className="size-4" /></Button>
          </div>
        ))}
      </section>

      <section className="grid gap-4 rounded-xl border border-white/10 bg-card p-4 sm:grid-cols-2 sm:p-6">
        <div className="sm:col-span-2"><h3 className="font-semibold">Privacidade da versão {planLabel}</h3></div>
        <label className={fieldClass}><span>Título</span><Input value={draft.privacyTitle} onChange={(e) => setField("privacyTitle", e.target.value)} /></label>
        <label className={fieldClass}><span>Texto do link</span><Input value={draft.privacyLinkLabel} onChange={(e) => setField("privacyLinkLabel", e.target.value)} /></label>
        <label className={`${fieldClass} sm:col-span-2`}><span>Descrição</span><textarea className={textareaClass} value={draft.privacyDescription} onChange={(e) => setField("privacyDescription", e.target.value)} /></label>
        <label className={`${fieldClass} sm:col-span-2`}><span>Itens, um por linha</span><textarea className={textareaClass} value={privacyText} onChange={(e) => setField("privacyItems", e.target.value.split("\n").map((item) => item.trim()).filter(Boolean))} /></label>
      </section>
    </main>
  );
}
