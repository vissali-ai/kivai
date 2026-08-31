"use client";

import { openFilePicker } from "@/lib/browser/file-picker";
import { useRef, useState } from "react";
import { Download, FileText, Minimize2, RefreshCw, Trash2, Upload } from "lucide-react";

import { ToolActionBar } from "@/components/tools/tool-action-bar";
import { ToolErrorMessage } from "@/components/tools/tool-error-message";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { ToolProcessingStatus, type ToolStatus } from "@/components/tools/tool-processing-status";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatFileSize } from "@/lib/tool-files";

import { compressPdf, getPdfInfo } from "./pdf-utils";

type Quality = "low" | "medium" | "high";

function friendlyError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : "";

  if (message.includes("encrypted") || message.includes("password")) {
    return "Este PDF possui proteção e não pôde ser processado. Use um arquivo desbloqueado que você tenha autorização para editar.";
  }

  return "Não foi possível abrir ou compactar este PDF. Verifique o arquivo e tente novamente.";
}

export default function CompactarPdfClient() {
  const inputRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState(0);
  const [size, setSize] = useState(0);
  const [quality, setQuality] = useState<Quality>("medium");
  const [status, setStatus] = useState<ToolStatus>("idle");
  const [stage, setStage] = useState("Lendo o PDF");
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  function reset() {
    setFile(null);
    setPages(0);
    setSize(0);
    setQuality("medium");
    setStatus("idle");
    setStage("Lendo o PDF");
    setError(null);
  }

  async function processFile(selected: File) {
    if (status === "processing") return;

    setError(null);

    if (selected.name.split(".").pop()?.toLowerCase() !== "pdf") {
      setError("Selecione um arquivo no formato PDF.");
      setStatus("error");
      return;
    }

    setStatus("processing");
    setStage("Lendo o PDF");

    try {
      const info = await getPdfInfo(selected);
      setFile(selected);
      setPages(info.pages);
      setSize(info.size);
      setStatus("ready");
    } catch (reason) {
      setFile(null);
      setError(friendlyError(reason));
      setStatus("error");
    }
  }

  async function handleCompress() {
    if (!file || status === "processing") return;

    setError(null);
    setStatus("processing");
    setStage(quality === "low" ? "Otimizando a estrutura do PDF" : "Compactando as páginas do PDF");

    try {
      const bytes = await compressPdf(file, quality);
      const arrayBuffer = new ArrayBuffer(bytes.byteLength);
      new Uint8Array(arrayBuffer).set(bytes);

      const blob = new Blob([arrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `${file.name.replace(/\.pdf$/i, "")}-compactado.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setStatus("success");
      setStage("PDF compactado e download iniciado");
    } catch (reason) {
      setError(friendlyError(reason));
      setStatus("error");
    }
  }

  return (
    <ToolPageShell
      title="Compactar PDF"
      description="Reduza o tamanho de um PDF escolhendo entre otimização estrutural ou compactação por rasterização das páginas."
      categoryName="PDF"
      categoryHref="/ferramentas/pdfs"
      breadcrumbRootName="Início"
      breadcrumbRootHref="/"
      privacyMessage="A leitura e a compactação do PDF acontecem localmente no navegador. Seus arquivos não são enviados ao Kivai."
    >
      <Card className="mx-auto max-w-5xl">
        <CardHeader>
          <CardTitle>Selecione um PDF</CardTitle>
          <CardDescription>
            Escolha um arquivo PDF e defina o nível de compactação antes de gerar a nova versão.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {!file && status !== "processing" && (
            <>
              <input
                id="compactar-pdf-file"
                ref={inputRef}
                type="file"
                accept="application/pdf,.pdf"
                className="sr-only"
                onChange={(event) => {
                  const selected = event.target.files?.[0];
                  if (selected) void processFile(selected);
                  event.target.value = "";
                }}
              />

              <div
                onClick={() => openFilePicker(inputRef.current)}
                onDragEnter={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragOver={(event) => event.preventDefault()}
                onDragLeave={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragging(false);
                  const selected = event.dataTransfer.files?.[0];
                  if (selected) void processFile(selected);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") openFilePicker(inputRef.current);
                }}
                className={`flex min-h-64 cursor-pointer flex-col items-center justify-center border border-dashed p-6 text-center outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30 sm:p-10 ${
                  dragging ? "border-primary bg-primary/5" : "border-border bg-muted/20 hover:bg-muted/40"
                }`}
              >
                <span className="flex size-14 items-center justify-center border border-border bg-background">
                  <Upload className="size-5" />
                </span>
                <p className="mt-5 font-heading text-lg font-medium">Clique ou arraste o PDF</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Formato aceito: PDF</p>
              </div>
            </>
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
                    {formatFileSize(size)} · {pages} {pages === 1 ? "página" : "páginas"}
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

              <fieldset disabled={status === "processing"} className="rounded-lg border border-border p-4 sm:p-5">
                <legend className="px-2 font-heading font-medium">Nível de compactação</legend>

                <div className="mt-2 grid gap-3">
                  <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-4 hover:bg-muted/30">
                    <input
                      className="mt-1"
                      type="radio"
                      name="quality"
                      checked={quality === "low"}
                      onChange={() => setQuality("low")}
                    />
                    <div>
                      <p className="font-medium">Baixa compressão</p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        Otimiza a estrutura do arquivo e preserva texto, vetores e links. A redução pode ser pequena.
                      </p>
                    </div>
                  </label>

                  <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-4 hover:bg-muted/30">
                    <input
                      className="mt-1"
                      type="radio"
                      name="quality"
                      checked={quality === "medium"}
                      onChange={() => setQuality("medium")}
                    />
                    <div>
                      <p className="font-medium">Compressão média</p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        Rasteriza as páginas com resolução equilibrada para priorizar uma redução maior do arquivo.
                      </p>
                    </div>
                  </label>

                  <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-4 hover:bg-muted/30">
                    <input
                      className="mt-1"
                      type="radio"
                      name="quality"
                      checked={quality === "high"}
                      onChange={() => setQuality("high")}
                    />
                    <div>
                      <p className="font-medium">Alta compressão</p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        Rasteriza em resolução menor para priorizar a redução do tamanho do PDF.
                      </p>
                    </div>
                  </label>
                </div>

                {quality !== "low" && (
                  <div className="mt-4 flex gap-3 rounded-lg border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
                    <Minimize2 className="mt-0.5 size-4 shrink-0 text-primary" />
                    <p className="leading-6">
                      Na compactação média ou alta, cada página vira uma imagem. Textos deixam de ser selecionáveis e links, formulários e assinaturas digitais não são preservados.
                    </p>
                  </div>
                )}
              </fieldset>

              <ToolActionBar>
                <Button size="lg" onClick={handleCompress} disabled={status === "processing"}>
                  <Download className="size-4" />
                  {status === "processing" ? "Compactando..." : "Compactar PDF"}
                </Button>
              </ToolActionBar>
            </>
          )}
        </CardContent>
      </Card>
    </ToolPageShell>
  );
}
