"use client";

import JSZip from "jszip";
import { Download, FileText, RefreshCw, Scissors, Trash2 } from "lucide-react";
import { useRef, useState } from "react";

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

import { getPdfPageCount, splitPdfAllPages } from "./pdf-utils";

function friendlyError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : "";

  if (message.includes("encrypted") || message.includes("password")) {
    return "Este PDF possui proteção e não pôde ser processado. Use um arquivo desbloqueado que você tenha autorização para editar.";
  }

  return "Não foi possível abrir ou dividir este PDF. Verifique se o arquivo é válido e tente novamente.";
}

export default function DividirPdfClient() {
  const replaceRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState(0);
  const [result, setResult] = useState<ToolDownload | null>(null);
  const [status, setStatus] = useState<ToolStatus>("idle");
  const [stage, setStage] = useState("Lendo o PDF");
  const [error, setError] = useState<string | null>(null);

  function reset() {
    if (status === "processing") return;
    setResult(null);
    setFile(null);
    setPages(0);
    setStatus("idle");
    setStage("Lendo o PDF");
    setError(null);
  }

  async function processFile(selected: File) {
    if (status === "processing") return;

    setError(null);
    setResult(null);

    if (selected.name.split(".").pop()?.toLowerCase() !== "pdf") {
      setError("Selecione um arquivo no formato PDF.");
      setStatus("error");
      return;
    }

    setStatus("processing");
    setStage("Lendo o PDF");

    try {
      const total = await getPdfPageCount(selected);
      setFile(selected);
      setPages(total);
      setStatus("ready");
    } catch (reason) {
      setFile(null);
      setPages(0);
      setError(friendlyError(reason));
      setStatus("error");
    }
  }

  async function handleSplit() {
    if (!file || status === "processing") return;

    setError(null);
    setResult(null);
    setStatus("processing");
    setStage("Separando as páginas do PDF");

    try {
      const arquivos = await splitPdfAllPages(file);
      const zip = new JSZip();

      arquivos.forEach((pdf) => {
        zip.file(pdf.name, pdf.bytes);
      });

      setStage("Preparando o arquivo ZIP");
      const blob = await zip.generateAsync({ type: "blob" });
      setResult({ blob, name: `${file.name.replace(/\.pdf$/i, "")}-dividido.zip` });

      setStatus("success");
      setStage("ZIP pronto para baixar");
    } catch (reason) {
      setError(friendlyError(reason));
      setStatus("error");
    }
  }

  return (
    <ToolPageShell
      title="Dividir PDF"
      description="Separe todas as páginas de um PDF em arquivos individuais e baixe o conjunto em um único ZIP."
      categoryName="PDF"
      categoryHref="/ferramentas/pdfs"
      breadcrumbRootName="Início"
      breadcrumbRootHref="/"
      privacyMessage="A leitura e a divisão do PDF acontecem localmente no navegador. Seus arquivos não são enviados ao Kivai."
    >
      <Card className="mx-auto max-w-5xl">
        <CardHeader>
          <CardTitle>Selecione um PDF</CardTitle>
          <CardDescription>
            Cada página será criada como um PDF independente e reunida em um arquivo ZIP para download.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {!file && status !== "processing" && (
            <ToolUploadArea accept="application/pdf,.pdf" formats="PDF" label="Selecionar PDF" processingMode="local" onFilesSelected={(files) => files[0] && void processFile(files[0])} />
          )}

          <ToolProcessingStatus status={status} message={stage} />
          <ToolErrorMessage message={error} />

          {file && (
            <>
              <section
                aria-label="PDF selecionado"
                className="flex min-w-0 flex-col gap-4 rounded-lg border border-border p-4 sm:flex-row sm:items-center"
              >
                <span className="flex size-12 shrink-0 items-center justify-center border border-border bg-muted/20">
                  <FileText className="size-5 text-primary" />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{file.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatFileSize(file.size)} · {pages} {pages === 1 ? "página" : "páginas"}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={reset} disabled={status === "processing"}>
                    <Trash2 className="size-4" />
                    Remover
                  </Button>

                  <input
                    ref={replaceRef}
                    type="file"
                    disabled={status === "processing"}
                    accept="application/pdf,.pdf"
                    className="sr-only"
                    onChange={(event) => {
                      const selected = event.target.files?.[0];
                      if (selected) void processFile(selected);
                      event.target.value = "";
                    }}
                  />

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openFilePicker(replaceRef.current)}
                    disabled={status === "processing"}
                  >
                    <RefreshCw className="size-4" />
                    Substituir
                  </Button>
                </div>
              </section>

              <div className="flex gap-3 rounded-lg border border-border bg-muted/20 p-4">
                <Scissors className="mt-0.5 size-5 shrink-0 text-primary" />
                <div>
                  <h3 className="font-heading font-medium">Como o arquivo será dividido</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    As {pages} {pages === 1 ? "página será salva" : "páginas serão salvas"} separadamente como
                    {pages === 1 ? " um PDF independente" : " PDFs independentes"}. O download final será um ZIP com todos os arquivos.
                  </p>
                </div>
              </div>

              <ToolActionBar>
                <Button size="lg" onClick={handleSplit} disabled={status === "processing"}>
                  <Download className="size-4" />
                  {status === "processing" ? "Dividindo PDF..." : "Dividir PDF"}
                </Button>
              </ToolActionBar>
            </>
          )}
          {result && <ToolDownloadResult result={result} onReset={reset} label="Baixar ZIP" title="Páginas prontas para baixar" />}
        </CardContent>
      </Card>
    </ToolPageShell>
  );
}
