"use client";

import { useEffect, useState } from "react";
import { BookOpen, ExternalLink, Loader2, RotateCcw, Sparkles, WandSparkles } from "lucide-react";
import type { EditorialAiArticle, EditorialBase } from "@/lib/blog/editorial-ai";
import { Button } from "@/components/ui/button";
import { GeminiFreeModelPicker } from "@/components/admin/gemini-free-model-picker";

type EditorialAiPanelProps = {
  postId: string;
  sourceUrl: string;
  onApplyArticle: (article: EditorialAiArticle) => void;
  onApplyBase: (base: EditorialBase) => void;
};

function summarizeError(error: unknown) {
  return error instanceof Error ? error.message : "Não foi possível executar a IA editorial.";
}
async function getJson(response: Response) {
  const parsed = await response.json() as { error?: string; [key: string]: unknown };
  if (!response.ok) throw new Error(parsed.error || "Falha ao consultar a IA.");
  return parsed;
}

export function EditorialAiPanel({ postId, sourceUrl, onApplyArticle, onApplyBase }: EditorialAiPanelProps) {
  const endpoint = "/api/admin/posts/" + encodeURIComponent(postId) + "/editorial-ai";
  const [base, setBase] = useState<EditorialBase | null>(null);
  const [proposal, setProposal] = useState<EditorialAiArticle | null>(null);
  const [instructions, setInstructions] = useState("");
  const [baseModel, setBaseModel] = useState("auto");
  const [editorModel, setEditorModel] = useState("auto");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    void fetch(endpoint, { cache: "no-store" })
      .then(getJson)
      .then((result) => { if (active) setBase((result.base as EditorialBase | null) || null); })
      .catch((error) => { if (active) setMessage(summarizeError(error)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [endpoint]);

  async function execute(action: "prepare-base" | "personalize") {
    if (busy) return;
    setBusy(true);
    setMessage(action === "personalize" ? "Preparando sua versão editorial..." : "Lendo a fonte e preparando reportagem-base...");
    setProposal(null);
    try {
      const response = await fetch(endpoint, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, instructions: action === "personalize" ? instructions : "",
          model: action === "personalize" ? editorModel : baseModel }),
      });
      const result = await getJson(response);
      if (action === "personalize") {
        const article = result.article as EditorialAiArticle;
        if (!article?.contentHtml) throw new Error("O Gemini não retornou um texto completo.");
        setProposal(article);
        onApplyArticle(article);
        setMessage("Sua versão foi inserida no rascunho. Revise e clique em Salvar rascunho para persistir as alterações.");
      } else {
        const fetched = result.base as EditorialBase;
        if (!fetched?.baseHtml) throw new Error("Não foi possível guardar a reportagem-base.");
        setBase(fetched);
        setMessage("Reportagem-base completa preservada. Você pode consultá-la ou gerar sua versão.");
      }
    } catch (error) { setMessage(summarizeError(error)); }
    finally { setBusy(false); }
  }

  function confirmRestoreBase() {
    if (!base || !window.confirm("Colocar a reportagem-base no editor? Alterações ainda não salvas serão substituídas.")) return;
    onApplyBase(base);
    setMessage("Matéria-base aplicada. Para persistir as alterações, salve o rascunho.");
  }

  return <section className="min-w-0 space-y-4 rounded-lg border border-primary/30 bg-card p-4 sm:p-5">
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div><h2 className="flex items-center gap-2 text-base font-semibold"><WandSparkles className="size-4 text-primary"/>Editor-chefe Kivai · IA</h2>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">Editor de padrão jornalístico internacional: apuração rigorosa, precisão, imparcialidade e respeito às fontes. A identidade editorial do Kivai já é aplicada ao primeiro rascunho; novas reescritas são opcionais.</p></div>
      {sourceUrl && <a className="inline-flex items-center gap-1 text-xs text-primary underline" href={sourceUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="size-3"/>Fonte original</a>}
    </div>
    {loading ? <p className="text-xs text-muted-foreground">Carregando reportagem-base...</p> : !base ? <div className="space-y-2">
      <p className="text-sm text-muted-foreground">Etapa 1: prepare a reportagem completa a partir da fonte, já com a identidade editorial do Kivai. A etapa de reescrita é opcional.</p>
      <GeminiFreeModelPicker task="url" label="Modelo para reportagem-base" value={baseModel} onChange={setBaseModel}/>
      <Button variant="secondary" disabled={busy || !sourceUrl} onClick={() => void execute("prepare-base")}>
        {busy ? <Loader2 className="mr-2 size-4 animate-spin"/> : <BookOpen className="mr-2 size-4"/>}
        Etapa 1 · Preparar reportagem completa
      </Button>
    </div> : <>
      <details className="rounded-md border border-border p-3">
        <summary className="cursor-pointer text-sm font-medium">Etapa 1 · Consultar reportagem-base completa preservada</summary>
        <p className="mt-2 text-xs text-muted-foreground">Esta é a reportagem gerada com o padrão jornalístico e a identidade editorial do Kivai, a partir dos fatos acessíveis da fonte. Não é uma cópia literal da reportagem do veículo.</p>
        <h3 className="mt-3 font-semibold">{base.baseTitle}</h3>
        {base.baseSubtitle && <p className="text-sm text-muted-foreground">{base.baseSubtitle}</p>}
        <div className="prose prose-sm mt-3 max-w-none text-foreground dark:prose-invert" dangerouslySetInnerHTML={{ __html: base.baseHtml }} />
        {base.researchNotes && <p className="mt-2 border-t border-border pt-2 text-xs text-amber-300">Pontos a conferir: {base.researchNotes}</p>}
        <Button size="sm" className="mt-3" variant="outline" onClick={confirmRestoreBase}><RotateCcw className="mr-1 size-4"/>Repor matéria-base no editor</Button>
      </details>
      <div className="space-y-1 border-t border-border pt-3">
        <h3 className="text-sm font-semibold">Etapa 2 (opcional) · Ajustar no meu estilo</h3>
        <p className="text-xs text-muted-foreground">Opcional: peça ajustes adicionais ao agente. Ele criará outra versão no estilo editorial do Kivai e a inserirá nos campos do rascunho, sem publicar.</p>
      </div>
      <label className="block space-y-1.5 text-sm"><span className="font-medium">Comando para o editor-chefe (opcional)</span>
        <textarea value={instructions} onChange={(event) => setInstructions(event.target.value)}
          maxLength={1200} rows={3} className="w-full rounded-md border border-input bg-background p-3 text-sm"
          placeholder="Ex.: destaque as consequências para pequenos negócios, use um lide mais direto e evite listas."/>
        <span className="block text-xs text-muted-foreground">{instructions.length}/1200 · A IA respeitará o estilo editorial de Marcus mesmo sem orientações extras.</span>
      </label>
      <GeminiFreeModelPicker task="text" label="Modelo do editor-chefe" value={editorModel} onChange={setEditorModel}/>
      <Button disabled={busy} onClick={() => void execute("personalize")}>
        {busy ? <Loader2 className="mr-2 size-4 animate-spin"/> : <Sparkles className="mr-2 size-4"/>}
        {busy ? "Gerando versão..." : "Reescrever no meu estilo"}
      </Button>
    </>}
    <p role="status" aria-live="polite" className="text-xs text-muted-foreground">{message}</p>
    {proposal && <div className="space-y-3 rounded-md border border-primary/40 bg-background p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-primary">Prévia da minha versão</p>
      <h3 className="text-lg font-semibold">{proposal.title}</h3>
      {proposal.subtitle && <p className="text-sm text-muted-foreground">{proposal.subtitle}</p>}
      <div className="prose prose-sm max-w-none text-foreground dark:prose-invert" dangerouslySetInnerHTML={{ __html: proposal.contentHtml }}/>
      <p className="text-xs text-muted-foreground">SEO: {proposal.seoTitle} · {proposal.metaDescription}</p>
      <p className="text-xs text-muted-foreground">Esta versão já foi inserida nos campos do editor. A reportagem-base continua preservada. Revise e use Salvar rascunho para gravar as mudanças; nada é publicado automaticamente.</p>
    </div>}
  </section>;
}
