"use client";

import {
  ArrowDown,
  ArrowUp,
  Download,
  FilePlus2,
  FileText,
  Layers3,
  Trash2,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";

import { ToolUploadArea } from "@/components/tools/tool-upload-area";
import { ToolDownloadResult, type ToolDownload } from "@/components/tools/tool-download-result";
import { ToolActionBar } from "@/components/tools/tool-action-bar";
import { ToolErrorMessage } from "@/components/tools/tool-error-message";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { ToolProcessingStatus, type ToolStatus } from "@/components/tools/tool-processing-status";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { openFilePicker } from "@/lib/browser/file-picker";
import { formatFileSize } from "@/lib/tool-files";

import { getPdfPageCount, mergePdfs, type PdfFile } from "./pdf-utils";

function friendlyError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : "";

  if (message.includes("encrypted") || message.includes("password")) {
    return "Um dos PDFs possui proteção e não pôde ser aberto. Adicione somente arquivos desbloqueados que você tenha autorização para editar.";
  }

  return "Não foi possível ler um dos PDFs. Verifique se o arquivo é válido, não está corrompido e tente novamente.";
}

export default function UnirPdfsClient() {
  const addMoreRef = useRef<HTMLInputElement>(null);

  const [pdfs, setPdfs] = useState<PdfFile[]>([]);
  const [result, setResult] = useState<ToolDownload | null>(null);
  const [status, setStatus] = useState<ToolStatus>("idle");
  const [stage, setStage] = useState("Aguardando os PDFs");
  const [error, setError] = useState<string | null>(null);

  const processFiles = useCallback(async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (!list.length || status === "processing") return;

    setError(null);
    setResult(null);
    setStatus("processing");
    setStage(list.length > 1 ? "Lendo os PDFs selecionados" : "Lendo o PDF selecionado");

    const novos: PdfFile[] = [];
    let failed = 0;
    let lastError: unknown = null;

    for (const file of list) {
      const extension = file.name.split(".").pop()?.toLowerCase();
      if (extension !== "pdf") {
        failed += 1;
        continue;
      }

      try {
        const pages = await getPdfPageCount(file);
        novos.push({
          id: crypto.randomUUID(),
          file,
          pages,
          size: file.size,
        });
      } catch (reason) {
        failed += 1;
        lastError = reason;
      }
    }

    if (novos.length) {
      setPdfs((old) => [...old, ...novos]);
      setStatus("ready");
      setStage(
        novos.length > 1
          ? `${novos.length} PDFs adicionados à sequência`
          : "PDF adicionado à sequência"
      );

      if (failed) {
        setError(
          `${failed} ${failed === 1 ? "arquivo não pôde" : "arquivos não puderam"} ser adicionado. Use PDFs válidos e sem proteção que impeça a leitura.`
        );
      }
      return;
    }

    setStatus("error");
    setStage("Não foi possível adicionar os arquivos");
    setError(lastError ? friendlyError(lastError) : "Selecione arquivos no formato PDF.");
  }, [status]);

  async function handleMerge() {
    if (pdfs.length < 2 || status === "processing") return;

    setError(null);
    setResult(null);
    setStatus("processing");
    setStage("Copiando as páginas na ordem definida");

    try {
      const bytes = await mergePdfs(pdfs.map((pdf) => pdf.file));
      const arrayBuffer = new ArrayBuffer(bytes.byteLength);
      new Uint8Array(arrayBuffer).set(bytes);

      const blob = new Blob([arrayBuffer], { type: "application/pdf" });
      setResult({ blob, name: "pdf-unido.pdf" });

      setStatus("success");
      setStage("PDF unido pronto para baixar");
    } catch (reason) {
      setError(friendlyError(reason));
      setStatus("error");
      setStage("Não foi possível concluir a união");
    }
  }

  function moveUp(index: number) {
    if (index === 0 || status === "processing") return;
    setResult(null);

    setPdfs((current) => {
      const copy = [...current];
      [copy[index - 1], copy[index]] = [copy[index], copy[index - 1]];
      return copy;
    });
    setStatus("ready");
    setStage("Ordem dos documentos atualizada");
  }

  function moveDown(index: number) {
    if (index === pdfs.length - 1 || status === "processing") return;
    setResult(null);

    setPdfs((current) => {
      const copy = [...current];
      [copy[index], copy[index + 1]] = [copy[index + 1], copy[index]];
      return copy;
    });
    setStatus("ready");
    setStage("Ordem dos documentos atualizada");
  }

  function remove(id: string) {
    if (status === "processing") return;
    setResult(null);

    setPdfs((current) => {
      const next = current.filter((pdf) => pdf.id !== id);
      setStatus(next.length ? "ready" : "idle");
      setStage(next.length ? "Sequência atualizada" : "Aguardando os PDFs");
      return next;
    });
    setError(null);
  }

  function reset() {
    if (status === "processing") return;
    setResult(null);
    setPdfs([]);
    setStatus("idle");
    setStage("Aguardando os PDFs");
    setError(null);
  }

  const totalPages = pdfs.reduce((sum, pdf) => sum + pdf.pages, 0);

  return (
    <ToolPageShell
      title="Unir PDFs"
      description="Monte um único PDF a partir de vários documentos, ajuste a ordem antes de unir e mantenha as páginas na sequência escolhida."
      categoryName="PDF"
      categoryHref="/ferramentas/pdfs"
      breadcrumbRootName="Início"
      breadcrumbRootHref="/"
      privacyMessage="A leitura e a união dos PDFs acontecem localmente no navegador. Os documentos não são enviados ao Kivai."
    >
      <Card className="mx-auto max-w-5xl">
        <CardHeader>
          <CardTitle>Monte a sequência dos documentos</CardTitle>
          <CardDescription>
            Adicione pelo menos dois PDFs e organize a ordem em que eles aparecerão no arquivo final.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {pdfs.length === 0 && status !== "processing" && (
            <ToolUploadArea accept="application/pdf,.pdf" formats="PDF" multiple label="Selecionar PDFs" processingMode="local" onFilesSelected={(files) => void processFiles(files)} />
          )}

          <ToolProcessingStatus status={status} message={stage} />
          <ToolErrorMessage message={error} />

          {pdfs.length > 0 && (
            <>
              <section aria-label="Sequência dos PDFs" className="overflow-hidden rounded-lg border border-border">
                <div className="flex flex-col gap-3 border-b border-border bg-muted/10 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="font-heading font-medium">Ordem do PDF final</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {pdfs.length} {pdfs.length === 1 ? "documento" : "documentos"} · {totalPages} {totalPages === 1 ? "página" : "páginas"} no total
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <input
                      ref={addMoreRef}
                      type="file"
                    disabled={status === "processing"}
                      className="sr-only"
                      multiple
                      accept="application/pdf,.pdf"
                      onChange={(event) => {
                        if (event.target.files?.length) void processFiles(event.target.files);
                        event.target.value = "";
                      }}
                    />

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openFilePicker(addMoreRef.current)}
                      disabled={status === "processing"}
                    >
                      <FilePlus2 className="size-4" />
                      Adicionar PDFs
                    </Button>

                    <Button variant="outline" size="sm" onClick={reset} disabled={status === "processing"}>
                      <Trash2 className="size-4" />
                      Limpar lista
                    </Button>
                  </div>
                </div>

                <div className="divide-y divide-border">
                  {pdfs.map((pdf, index) => (
                    <div
                      key={pdf.id}
                      className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center border border-border bg-muted/20 text-sm font-semibold text-primary">
                          {index + 1}
                        </span>
                        <FileText className="size-5 shrink-0 text-primary" />

                        <div className="min-w-0">
                          <p className="truncate font-medium">{pdf.file.name}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {formatFileSize(pdf.size)} · {pdf.pages} {pdf.pages === 1 ? "página" : "páginas"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => moveUp(index)}
                          disabled={index === 0 || status === "processing"}
                          aria-label={`Mover ${pdf.file.name} para cima`}
                          title="Mover para cima"
                        >
                          <ArrowUp className="size-4" />
                        </Button>

                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => moveDown(index)}
                          disabled={index === pdfs.length - 1 || status === "processing"}
                          aria-label={`Mover ${pdf.file.name} para baixo`}
                          title="Mover para baixo"
                        >
                          <ArrowDown className="size-4" />
                        </Button>

                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => remove(pdf.id)}
                          disabled={status === "processing"}
                          aria-label={`Remover ${pdf.file.name}`}
                          title="Remover da sequência"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <div className="flex gap-3 rounded-lg border border-border bg-muted/20 p-4">
                <Layers3 className="mt-0.5 size-5 shrink-0 text-primary" />
                <div>
                  <h3 className="font-heading font-medium">A ordem da lista define o documento final</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    O primeiro PDF abre o novo arquivo e os seguintes entram logo depois, respeitando a sequência acima. As páginas são copiadas para o novo documento sem rasterização proposital.
                  </p>
                </div>
              </div>

              <ToolActionBar>
                <Button
                  size="lg"
                  onClick={handleMerge}
                  disabled={pdfs.length < 2 || status === "processing"}
                >
                  <Download className="size-4" />
                  {status === "processing" ? "Unindo PDFs..." : "Criar PDF unido"}
                </Button>
              </ToolActionBar>
            </>
          )}
          {result && <ToolDownloadResult result={result} onReset={reset} />}
        </CardContent>
      </Card>
    </ToolPageShell>
  );
}
