"use client";

import { useRef, useState, type ClipboardEvent, type DragEvent } from "react";
import { Check, ClipboardPaste, ImageUp, LoaderCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getStoredSession } from "@/lib/user-auth";
import {
  IMPORTABLE_SOCIAL_METRICS,
  socialImportSources,
  type SocialImportMetricKey,
  type SocialImportResult,
  type SocialImportSource,
} from "@/lib/ai/social-report-import";
import { prepareSocialImportFiles, validateSocialImportSelection } from "@/lib/ai/social-report-import-client";
import { AiCreditBalance } from "@/components/tools/ai-credit-balance";

export type SocialReportImportApply = {
  metrics: Partial<Record<SocialImportMetricKey, number>>;
  network?: string;
  startDate?: string;
  endDate?: string;
};

type Props = {
  currentMetrics: Partial<Record<SocialImportMetricKey, string>>;
  currentNetwork: string;
  currentStartDate: string;
  currentEndDate: string;
  onApply: (data: SocialReportImportApply) => void;
};

export function SocialReportImporter({ currentMetrics, currentNetwork, currentStartDate, currentEndDate, onApply }: Props) {
  const picker = useRef<HTMLInputElement>(null);
  const inFlight = useRef(false);
  const [source, setSource] = useState<SocialImportSource>("Instagram Insights");
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SocialImportResult | null>(null);
  const [selected, setSelected] = useState<SocialImportMetricKey[]>([]);
  const [replaceDates, setReplaceDates] = useState(false);
  const [replaceNetwork, setReplaceNetwork] = useState(false);
  const [confirmMismatch, setConfirmMismatch] = useState(false);

  const periodAvailable = Boolean(result?.startDate && result?.endDate);
  const datesDiffer = periodAvailable && Boolean(
    (currentStartDate && currentStartDate !== result?.startDate) ||
    (currentEndDate && currentEndDate !== result?.endDate)
  );
  const networkDiffers = Boolean(result?.network && currentNetwork && result.network !== currentNetwork);
  const unresolvedConflict = (datesDiffer && !replaceDates && !confirmMismatch) ||
    (networkDiffers && !replaceNetwork && !confirmMismatch);

  function choose(next: File[]) {
    if (inFlight.current) return;
    setError("");
    setResult(null);
    setSelected([]);
    setConfirmMismatch(false);
    try {
      validateSocialImportSelection(next);
      setFiles(next);
    } catch (err) {
      setFiles([]);
      setError(err instanceof Error ? err.message : "Arquivos inválidos.");
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLTextAreaElement>) {
    const clipboard = event.clipboardData;
    const items = clipboard.items ? Array.from(clipboard.items) : [];
    const fromItems = items
      .filter(item => item.kind === "file" && item.type.startsWith("image/"))
      .map(item => item.getAsFile())
      .filter((file): file is File => file !== null);
    const fromFiles = Array.from(clipboard.files || []).filter(file => file.type.startsWith("image/"));
    const images = fromItems.length ? fromItems : fromFiles;
    if (!images.length) {
      event.preventDefault();
      setError("A área de transferência não contém um print. Copie uma imagem ou selecione um arquivo.");
      return;
    }
    event.preventDefault();
    const pasted = images.map((file, i) => new File(
      [file], `print-colado-${Date.now()}-${i + 1}.${file.type === "image/jpeg" ? "jpg" : file.type === "image/webp" ? "webp" : "png"}`,
      { type: file.type, lastModified: Date.now() }
    ));
    const canAppend = files.length > 0 && files.every(file => /\.(png|jpe?g|webp)$/i.test(file.name));
    choose(canAppend ? [...files, ...pasted] : pasted);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const dropped = Array.from(event.dataTransfer.files);
    if (!dropped.length) return;
    const canAppend = dropped.every(file => /\.(png|jpe?g|webp)$/i.test(file.name)) &&
      files.length > 0 && files.every(file => /\.(png|jpe?g|webp)$/i.test(file.name));
    choose(canAppend ? [...files, ...dropped] : dropped);
  }

  async function extract() {
    if (inFlight.current) return;
    setError("");
    setResult(null);
    const session = getStoredSession();
    if (!session?.access_token) { setError("Faça login no Kivai para importar indicadores com IA."); return; }
    inFlight.current = true;
    setLoading(true);
    try {
      const ready = await prepareSocialImportFiles(files);
      const response = await fetch("/api/ai/social-report/import", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          consent: true,
          source,
          networkHint: currentNetwork || "",
          files: ready,
        }),
        cache: "no-store",
      });
      const data = await response.json().catch(() => ({})) as { extracted?: SocialImportResult; error?: string };
      if (!response.ok || !data.extracted) {
        throw new Error(data.error || "Não foi possível identificar as métricas.");
      }
      setResult(data.extracted);
      setSelected(data.extracted.metrics.filter(m => !currentMetrics[m.key]?.trim()).map(m => m.key));
      setReplaceDates(!currentStartDate && !currentEndDate && Boolean(data.extracted.startDate && data.extracted.endDate));
      setReplaceNetwork(!currentNetwork && Boolean(data.extracted.network));
      setConfirmMismatch(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao interpretar o documento.");
    } finally {
      inFlight.current = false;
      setLoading(false);
      window.dispatchEvent(new Event("kivai:ai-credit-update"));
    }
  }

  function apply() {
    if (!result || !selected.length || unresolvedConflict) return;
    const metrics: Partial<Record<SocialImportMetricKey, number>> = {};
    for (const metric of result.metrics) {
      if (selected.includes(metric.key)) metrics[metric.key] = metric.value;
    }
    onApply({
      metrics,
      ...(replaceNetwork && result.network ? { network: result.network } : {}),
      ...(replaceDates && periodAvailable ? { startDate: result.startDate, endDate: result.endDate } : {}),
    });
    setResult(null);
    setFiles([]);
    setSelected([]);
    if (picker.current) picker.current.value = "";
  }

  return (
    <section data-print-hide className="space-y-4 border border-border bg-card p-4 sm:p-6" aria-labelledby="social-import-heading">
      <div className="flex items-start gap-3">
        <ImageUp className="mt-1 size-5 shrink-0 text-primary" aria-hidden="true" />
        <div>
          <h2 id="social-import-heading" className="text-lg font-semibold">Importar métricas com IA</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Envie prints do Instagram Insights ou Meta Business Suite, ou um relatório PDF, CSV ou Excel. Revise os números antes de preencher o formulário.
          </p>
        </div>
      </div>

      <label className="block max-w-md space-y-1.5 text-sm font-medium">
        Origem do relatório
        <select disabled={loading} className="min-h-11 w-full border border-input bg-background px-3 text-sm" value={source}
          onChange={(event) => { setSource(event.target.value as SocialImportSource); setResult(null); }}>
          {socialImportSources.map(value => <option value={value} key={value}>{value}</option>)}
        </select>
      </label>

      <div onDragOver={(event) => event.preventDefault()} onDrop={handleDrop}
        className="space-y-3 border border-dashed border-border bg-muted/20 p-3 sm:p-4">
        <input ref={picker} id="social-report-file-picker" className="sr-only"
          type="file" disabled={loading} accept=".png,.jpg,.jpeg,.webp,.pdf,.csv,.xlsx,image/png,image/jpeg,image/webp,application/pdf" multiple
          aria-label="Escolher arquivos para importar métricas"
          onChange={(event) => {
            choose(Array.from(event.currentTarget.files || []));
            event.currentTarget.value = "";
          }} />
        <label htmlFor="kivai-ai-clipboard" className="flex items-center gap-2 text-sm font-medium">
          <ClipboardPaste className="size-4 text-primary" aria-hidden="true" />
          Arraste, solte ou cole prints copiados
        </label>
        <textarea id="kivai-ai-clipboard" disabled={loading} rows={2} value="" onChange={() => {}}
          onPaste={handlePaste} autoComplete="off" autoCorrect="off" spellCheck={false}
          className="w-full resize-none border border-input bg-background p-3 text-sm outline-offset-2 focus-visible:outline-2 focus-visible:outline-ring"
          placeholder="Clique aqui e pressione Ctrl+V ou Cmd+V. No celular, toque e use Colar."
          aria-label="Área para colar imagens copiadas" />
        <p className="text-xs leading-5 text-muted-foreground">
          Até 3 prints juntos. Colagens sucessivas acrescentam imagens ao lote. Também aceitamos 1 PDF (até 2 MB), CSV ou Excel.
        </p>
        <Button type="button" variant="outline" onClick={() => picker.current?.click()} disabled={loading}
          className="min-h-11 w-full sm:w-auto">
          Escolher arquivos
        </Button>
      </div>
      {files.length > 0 && <p className="text-xs text-muted-foreground">Selecionados: {files.map(file => file.name).join(", ")}</p>}
      <AiCreditBalance />
      <p className="text-xs leading-5 text-muted-foreground">
        Ao clicar em Identificar indicadores, você solicita o envio dos arquivos selecionados a um serviço externo de IA.
        No nível gratuito, o provedor pode utilizar esses dados para melhorar seus produtos.
        Oculte informações pessoais ou confidenciais antes de enviar. O Kivai não armazena os arquivos desta importação.
      </p>

      <div className="flex justify-end">
        <Button type="button" className="w-full sm:w-auto" onClick={extract} disabled={loading || !files.length}>
          {loading ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Sparkles className="size-4" aria-hidden="true" />}
          {loading ? "Lendo indicadores…" : `Identificar indicadores · ${files.some(file => /\.(png|jpe?g|webp|pdf)$/i.test(file.name)) ? 2 : 1} crédito(s)`}
        </Button>
      </div>

      {error && <p role="alert" className="border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}

      {result && <div className="space-y-4 border-t border-border pt-5" aria-live="polite">
        <div>
          <h3 className="font-semibold">Revise antes de preencher</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            A IA identificou {result.metrics.length} indicador(es). Marque os valores que deseja utilizar. Valores já preenchidos não serão substituídos sem sua seleção.
          </p>
        </div>

        {result.warnings.length > 0 && <div className="space-y-1 border border-amber-500/35 p-3 text-sm">
          {result.warnings.map((warning, i) => <p key={i}>{warning}</p>)}
        </div>}

        <div className="space-y-2">
          {result.metrics.map(metric => {
            const wasFilled = Boolean(currentMetrics[metric.key]?.trim());
            return (
              <label key={metric.key} className="flex items-start gap-3 border border-border p-3 text-sm">
                <input className="mt-1 size-4 shrink-0" type="checkbox"
                  checked={selected.includes(metric.key)}
                  onChange={(event) => setSelected(prev => event.target.checked ? [...prev, metric.key] : prev.filter(k => k !== metric.key))}/>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <strong>{IMPORTABLE_SOCIAL_METRICS[metric.key]}</strong>
                    {wasFilled && <span className="text-xs text-amber-600">Já preenchido: {currentMetrics[metric.key]}. Selecionar substitui.</span>}
                  </span>
                  <span className="mt-1 block text-muted-foreground">Identificado: {metric.value.toLocaleString("pt-BR")}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">Fonte: {metric.evidence}</span>
                </span>
              </label>
            );
          })}
        </div>

        {periodAvailable ?
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" checked={replaceDates} onChange={event => { setReplaceDates(event.target.checked); setConfirmMismatch(false); }} className="mt-1 size-4" />
            <span>Usar período identificado: {result.startDate} a {result.endDate}{datesDiffer ? " (substitui o período atual)" : ""}</span>
          </label> :
          <p className="text-sm text-amber-600">O período completo não foi identificado. Confira e preencha manualmente as datas do relatório.</p>}

        {result.network ?
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" checked={replaceNetwork} onChange={event => { setReplaceNetwork(event.target.checked); setConfirmMismatch(false); }} className="mt-1 size-4" />
            <span>Usar rede social identificada: {result.network}{networkDiffers ? " (substitui a rede atual)" : ""}</span>
          </label> :
          <p className="text-sm text-amber-600">Não foi possível identificar a rede social. Confira e selecione manualmente.</p>}

        {((datesDiffer && !replaceDates) || (networkDiffers && !replaceNetwork)) &&
          <label className="flex items-start gap-2 border border-amber-500/35 p-3 text-sm">
            <input type="checkbox" checked={confirmMismatch} onChange={event => setConfirmMismatch(event.target.checked)} className="mt-1 size-4" />
            <span>Conferi as diferenças de rede ou período e quero manter os dados atuais do relatório ao aplicar os números.</span>
          </label>}

        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setResult(null)}>Cancelar</Button>
          <Button type="button" onClick={apply} disabled={!selected.length || unresolvedConflict}>
            <Check className="size-4" aria-hidden="true" /> Aplicar {selected.length} indicador(es) ao relatório
          </Button>
        </div>
      </div>}
    </section>
  );
}
