"use client";

import { useState } from "react";
import { Download, FileText, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolUploadArea } from "@/components/tools/tool-upload-area";

const panel = "space-y-4 rounded-2xl border border-border bg-card p-5 sm:p-7";
const selectClass = "mt-2 min-h-12 w-full rounded-lg border border-input bg-background px-3";

function download(bytes: Uint8Array, name: string) {
  const url = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: "application/pdf" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export default function DuplexClient() {
  const [file, setFile] = useState<{ name: string; bytes: Uint8Array; count: number } | null>(null);
  const [mode, setMode] = useState<"manual" | "auto">("manual");
  const [reverseOrder, setReverseOrder] = useState(false);
  const [rotateBack, setRotateBack] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ fronts: Uint8Array; backs: Uint8Array } | null>(null);

  async function upload(files: File[]) {
    const selected = files[0];
    if (!selected) return;
    setFile(null);
    setResult(null);
    setError("");
    setBusy(true);
    try {
      if (!/\.pdf$/i.test(selected.name)) throw new Error("Selecione somente arquivos PDF.");
      if (selected.size > 50 * 1024 * 1024) throw new Error("O limite é 50 MB.");
      const bytes = new Uint8Array(await selected.arrayBuffer());
      const { loadPrintPdf } = await import("@/lib/duplex-print/pdf");
      const doc = await loadPrintPdf(bytes);
      setFile({ name: selected.name, bytes, count: doc.getPageCount() });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível abrir este PDF.");
    } finally {
      setBusy(false);
    }
  }

  async function prepareManual() {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const { prepareManual: createPrintFiles } = await import("@/lib/duplex-print/pdf");
      setResult(await createPrintFiles(file.bytes, reverseOrder, rotateBack));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível preparar os PDFs.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <fieldset disabled={busy} aria-busy={busy} className="min-w-0 space-y-6">
      <section className={panel}>
        <h2 className="text-xl font-semibold">1. Envie o PDF</h2>
        <p className="text-sm text-muted-foreground">Envie um único arquivo. A ferramenta separa as páginas automaticamente.</p>
        <ToolUploadArea accept=".pdf,application/pdf" formats="PDF" maxSizeLabel="50 MB · até 500 páginas" disabled={busy} onFilesSelected={upload} />
        {file && <p className="break-words text-sm" role="status"><strong>{file.name}</strong> · {file.count} {file.count === 1 ? "página" : "páginas"}</p>}
      </section>

      {file && <>
        <section className={panel}>
          <h2 className="text-xl font-semibold">2. Como sua impressora imprime?</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={`cursor-pointer rounded-xl border p-4 ${mode === "manual" ? "border-primary bg-primary/5" : "border-border"}`}>
              <span className="flex items-start gap-3"><input type="radio" name="duplex-mode" value="manual" checked={mode === "manual"} onChange={() => { setMode("manual"); setResult(null); }} className="mt-1 size-4 accent-primary" /><span><strong className="block">Preciso virar as folhas</strong><span className="mt-1 block text-sm text-muted-foreground">Gera um PDF de frentes e outro de versos.</span></span></span>
            </label>
            <label className={`cursor-pointer rounded-xl border p-4 ${mode === "auto" ? "border-primary bg-primary/5" : "border-border"}`}>
              <span className="flex items-start gap-3"><input type="radio" name="duplex-mode" value="auto" checked={mode === "auto"} onChange={() => { setMode("auto"); setResult(null); }} className="mt-1 size-4 accent-primary" /><span><strong className="block">Minha impressora faz frente e verso</strong><span className="mt-1 block text-sm text-muted-foreground">Baixa o PDF original para imprimir normalmente.</span></span></span>
            </label>
          </div>

          {mode === "manual" ? <>
            <div className="rounded-xl bg-muted/40 p-4 text-sm leading-6">
              <p className="font-medium">Como imprimir</p>
              <ol className="mt-2 list-decimal space-y-1 pl-5">
                <li>Imprima o arquivo <strong>Frentes</strong>, uma cópia, sem duplex.</li>
                <li>Recoloque a pilha na bandeja sem mudar a ordem.</li>
                <li>Imprima o arquivo <strong>Versos</strong>, também sem duplex.</li>
              </ol>
              <p className="mt-3 text-muted-foreground">A posição de recolocar o papel varia por impressora. Faça primeiro um teste com poucas páginas.</p>
            </div>

            <details className="rounded-lg border border-border p-4">
              <summary className="cursor-pointer font-medium">Ajustar à minha impressora (opcional)</summary>
              <div className="mt-4 space-y-4">
                <label className="flex items-start gap-3 text-sm leading-6"><input type="checkbox" checked={reverseOrder} onChange={event => { setReverseOrder(event.target.checked); setResult(null); }} className="mt-1 size-4 accent-primary" /><span><strong className="block">Minha impressora inverte a ordem das folhas</strong><span className="text-muted-foreground">Inverte a sequência do PDF de versos.</span></span></label>
                <label className="flex items-start gap-3 text-sm leading-6"><input type="checkbox" checked={rotateBack} onChange={event => { setRotateBack(event.target.checked); setResult(null); }} className="mt-1 size-4 accent-primary" /><span><strong className="block">O verso sai de cabeça para baixo</strong><span className="text-muted-foreground">Gira as páginas do PDF de versos em 180°.</span></span></label>
              </div>
            </details>

            <Button type="button" size="lg" className="w-full" onClick={() => void prepareManual()}>
              <FileText className="size-5" />{busy ? "Preparando arquivos…" : "Preparar frentes e versos"}
            </Button>
          </> : <>
            <p className="text-sm leading-6 text-muted-foreground">Baixe o PDF, abra em um leitor e ative “Imprimir nos dois lados”. Selecione a borda longa para abrir como livro ou a curta para abrir como calendário.</p>
            <Button type="button" size="lg" className="w-full" onClick={() => download(file.bytes, file.name)}><Download className="size-5" />Baixar PDF para imprimir</Button>
          </>}
        </section>

        {result && <section className={panel} aria-live="polite">
          <h2 className="text-xl font-semibold">3. Seus arquivos estão prontos</h2>
          <p className="text-sm text-muted-foreground">O PDF de frentes contém as páginas 1, 3, 5… O de versos contém as páginas 2, 4, 6…{file.count % 2 === 1 ? " Incluímos uma página em branco no final dos versos." : ""}</p>
          <Button type="button" size="lg" className="w-full whitespace-normal" onClick={() => download(result.fronts, "frentes.pdf")}><Download className="size-5 shrink-0" />Baixar PDF de frentes</Button>
          <Button type="button" size="lg" variant="outline" className="w-full whitespace-normal" onClick={() => download(result.backs, "versos.pdf")}><Download className="size-5 shrink-0" />Baixar PDF de versos</Button>
        </section>}
      </>}

      {error && <p role="alert" className="rounded-xl border border-destructive p-4 text-destructive">{error}</p>}
      {busy && <p role="status" className="sr-only">Preparando arquivo…</p>}
      {file && <Button type="button" variant="ghost" onClick={() => { setFile(null); setResult(null); setError(""); }}><RotateCcw className="size-4" />Escolher outro PDF</Button>}
    </fieldset>
  );
}
