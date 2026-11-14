"use client";

import { openFilePicker } from "@/lib/browser/file-picker";
import { useRef, useState } from "react";
import Image from "next/image";
import { Download, FileText, RefreshCw, RotateCw, Trash2 } from "lucide-react";

import { ToolUploadArea } from "@/components/tools/tool-upload-area";
import { ToolDownloadResult, type ToolDownload } from "@/components/tools/tool-download-result";
import { ToolActionBar } from "@/components/tools/tool-action-bar";
import { ToolErrorMessage } from "@/components/tools/tool-error-message";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { ToolProcessingStatus, type ToolStatus } from "@/components/tools/tool-processing-status";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatFileSize } from "@/lib/tool-files";

import { getPdfInfo, rotatePdf } from "./pdf-utils";

type RotationAngle = 0 | 90 | 180 | 270;

function friendlyError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : "";

  if (message.includes("encrypted") || message.includes("password")) {
    return "Este PDF possui proteção e não pôde ser processado. Use um arquivo desbloqueado que você tenha autorização para editar.";
  }

  return "Não foi possível abrir ou girar este PDF. Verifique se o arquivo é válido e tente novamente.";
}

export default function GirarPdfClient() {
  const replaceRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState(0);
  const [size, setSize] = useState(0);
  const [angle, setAngle] = useState<RotationAngle>(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<ToolDownload | null>(null);
  const [status, setStatus] = useState<ToolStatus>("idle");
  const [stage, setStage] = useState("Lendo o PDF");
  const [error, setError] = useState<string | null>(null);

  function reset() {
    if (status === "processing") return;
    setResult(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setFile(null);
    setPages(0);
    setSize(0);
    setAngle(0);
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
      const info = await getPdfInfo(selected);
      setFile(selected);
      setPages(info.pages);
      setSize(info.size);
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
      const loadingTask = pdfjs.getDocument({ data: new Uint8Array(await selected.arrayBuffer()) });
      const pdf = await loadingTask.promise;
      const firstPage = await pdf.getPage(1);
      const viewport = firstPage.getViewport({ scale: 0.65 });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
      const context = canvas.getContext("2d", { alpha: false });
      if (!context) throw new Error("preview-failed");
      await firstPage.render({ canvas, canvasContext: context, viewport, background: "white" }).promise;
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("preview-failed")), "image/jpeg", 0.8));
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(blob));
      await pdf.cleanup();
      setStatus("ready");
    } catch (reason) {
      setFile(null);
      setError(friendlyError(reason));
      setStatus("error");
    }
  }

  async function handleRotate() {
    if (!file || status === "processing") return;

    setError(null);
    setResult(null);
    setStatus("processing");
    setStage(`Girando todas as páginas em ${angle}°`);

    try {
      const bytes = await rotatePdf(file, angle);
      const arrayBuffer = new ArrayBuffer(bytes.byteLength);
      new Uint8Array(arrayBuffer).set(bytes);

      const blob = new Blob([arrayBuffer], { type: "application/pdf" });
      setResult({ blob, name: `${file.name.replace(/\.pdf$/i, "")}-girado.pdf` });

      setStatus("success");
      setStage("PDF girado pronto para baixar");
    } catch (reason) {
      setError(friendlyError(reason));
      setStatus("error");
    }
  }

  return (
    <ToolPageShell
      title="Girar PDF"
      description="Gire todas as páginas do PDF em 90°, 180° ou 270° e gere uma nova cópia com a orientação corrigida."
      categoryName="PDF"
      categoryHref="/ferramentas/pdfs"
      breadcrumbRootName="Início"
      breadcrumbRootHref="/"
      showPrivacyNotice={false}
    >
      <Card className="mx-auto max-w-5xl">
        <CardHeader>
          <CardTitle>Selecione um PDF</CardTitle>
          <CardDescription>
            Gire a visualização em intervalos de 90° e aplique o resultado a todas as páginas.
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
              {previewUrl && <div className="flex min-h-64 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/20 p-6"><div className="relative h-[32rem] w-full max-w-2xl transition-transform duration-200" style={{ transform: `rotate(${angle}deg)` }}><Image src={previewUrl} alt="Prévia da primeira página girada" fill unoptimized className="object-contain" /></div></div>}
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

              <fieldset disabled={status === "processing"} className="rounded-lg border border-border p-4 sm:p-5">
                <legend className="px-2 font-heading font-medium">Girar visualização</legend>
                <div className="flex flex-wrap gap-3">
                  <Button type="button" variant="outline" onClick={() => { setAngle((current) => ((current + 90) % 360) as RotationAngle); setResult(null); setStatus("ready"); }}><RotateCw className="size-4" />Girar à direita</Button>
                  <Button type="button" variant="outline" onClick={() => { setAngle((current) => ((current + 270) % 360) as RotationAngle); setResult(null); setStatus("ready"); }}><RotateCw className="size-4 -scale-x-100" />Girar à esquerda</Button>
                  <Button type="button" variant="outline" onClick={() => { setAngle((current) => ((current + 180) % 360) as RotationAngle); setResult(null); setStatus("ready"); }}><RotateCw className="size-4" />Girar 180°</Button>
                </div>

                <div className="mt-4 flex gap-3 rounded-lg border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
                  <RotateCw className="mt-0.5 size-4 shrink-0 text-primary" />
                  <p className="leading-6">
                    A rotação mostrada na prévia será aplicada a todas as páginas do documento.
                  </p>
                </div>
              </fieldset>

              <ToolActionBar>
                <Button size="lg" onClick={handleRotate} disabled={status === "processing"}>
                  <Download className="size-4" />
                  {status === "processing" ? "Girando PDF..." : "Girar PDF"}
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
