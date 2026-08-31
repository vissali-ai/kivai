"use client";

import { FileImage, FileText, Plus, Trash2, Upload } from "lucide-react";
import { jsPDF } from "jspdf";
import { useRef, useState } from "react";

import { ToolActionBar } from "@/components/tools/tool-action-bar";
import { ToolErrorMessage } from "@/components/tools/tool-error-message";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { ToolProcessingStatus, type ToolStatus } from "@/components/tools/tool-processing-status";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { openFilePicker } from "@/lib/browser/file-picker";
import { formatFileSize } from "@/lib/tool-files";

const acceptedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

function validateImages(selected: File[]) {
  return selected.filter((file) => acceptedTypes.has(file.type));
}

async function fileToDataUrl(file: File) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error(`Não foi possível ler ${file.name}.`));
    reader.readAsDataURL(file);
  });
}

async function dataUrlToImage(dataUrl: string) {
  return await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Não foi possível abrir uma das imagens selecionadas."));
    image.src = dataUrl;
  });
}

export default function ImagensParaPdfClient() {
  const inputRef = useRef<HTMLInputElement>(null);
  const addRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<ToolStatus>("idle");
  const [stage, setStage] = useState("Selecione suas imagens");
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  function addFiles(selected: File[]) {
    const valid = validateImages(selected);

    if (!valid.length) {
      setError("Selecione imagens nos formatos JPG, PNG ou WebP.");
      setStatus("error");
      return;
    }

    setFiles((current) => [...current, ...valid]);
    setError(valid.length !== selected.length ? "Alguns arquivos foram ignorados porque não estão em JPG, PNG ou WebP." : null);
    setStatus("ready");
    setStage(`${files.length + valid.length} ${files.length + valid.length === 1 ? "imagem selecionada" : "imagens selecionadas"}`);
  }

  function removeFile(index: number) {
    setFiles((current) => {
      const next = current.filter((_, currentIndex) => currentIndex !== index);
      setStatus(next.length ? "ready" : "idle");
      setStage(next.length ? `${next.length} ${next.length === 1 ? "imagem selecionada" : "imagens selecionadas"}` : "Selecione suas imagens");
      return next;
    });
    setError(null);
  }

  function reset() {
    setFiles([]);
    setStatus("idle");
    setStage("Selecione suas imagens");
    setError(null);
  }

  async function gerarPdf() {
    if (!files.length || status === "processing") return;

    setError(null);
    setStatus("processing");
    setStage("Montando as páginas do PDF");

    try {
      const pdf = new jsPDF();

      for (let i = 0; i < files.length; i++) {
        setStage(`Processando imagem ${i + 1} de ${files.length}`);

        const dataUrl = await fileToDataUrl(files[i]);
        const img = await dataUrlToImage(dataUrl);

        if (i > 0) pdf.addPage();

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const scale = Math.min(pageWidth / img.width, pageHeight / img.height);
        const width = img.width * scale;
        const height = img.height * scale;
        const x = (pageWidth - width) / 2;
        const y = (pageHeight - height) / 2;

        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        const context = canvas.getContext("2d");
        if (!context) throw new Error("Não foi possível preparar uma das imagens para o PDF.");

        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(img, 0, 0);

        const jpegData = canvas.toDataURL("image/jpeg", 0.92);
        pdf.addImage(jpegData, "JPEG", x, y, width, height);
      }

      setStage("Preparando o download");
      pdf.save("kivai-imagens.pdf");
      setStatus("success");
      setStage("PDF gerado e download iniciado");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível gerar o PDF. Revise as imagens e tente novamente.");
      setStatus("error");
    }
  }

  return (
    <ToolPageShell
      title="Imagens para PDF"
      description="Reúna fotos, digitalizações e artes em um PDF A4, com uma imagem por página e na mesma sequência em que os arquivos foram selecionados."
      categoryName="PDF"
      categoryHref="/ferramentas/pdfs"
      breadcrumbRootName="Início"
      breadcrumbRootHref="/"
      privacyMessage="As imagens são abertas e inseridas no PDF localmente no navegador. Os arquivos não são enviados ao Kivai."
    >
      <Card className="mx-auto max-w-5xl">
        <CardHeader>
          <CardTitle>Monte seu PDF com imagens</CardTitle>
          <CardDescription>
            Selecione arquivos JPG, PNG ou WebP. Cada imagem ocupará uma página A4 na ordem em que foi adicionada.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <input
            id="imagens-para-pdf-files"
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="sr-only"
            onChange={(event) => {
              if (event.target.files) addFiles(Array.from(event.target.files));
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
              addFiles(Array.from(event.dataTransfer.files));
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
            <p className="mt-5 font-heading text-lg font-medium">Clique ou arraste suas imagens</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Formatos aceitos: JPG, PNG e WebP</p>
          </div>

          <ToolProcessingStatus status={status} message={stage} />
          <ToolErrorMessage message={error} />

          {files.length > 0 && (
            <>
              <section aria-label="Imagens selecionadas" className="space-y-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-heading font-medium">Sequência das páginas</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {files.length} {files.length === 1 ? "imagem" : "imagens"}. A primeira da lista será a primeira página do PDF.
                    </p>
                  </div>

                  <input
                    ref={addRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="sr-only"
                    onChange={(event) => {
                      if (event.target.files) addFiles(Array.from(event.target.files));
                      event.target.value = "";
                    }}
                  />

                  <Button variant="outline" size="sm" onClick={() => openFilePicker(addRef.current)} disabled={status === "processing"}>
                    <Plus className="size-4" />
                    Adicionar imagens
                  </Button>
                </div>

                <div className="space-y-2">
                  {files.map((file, index) => (
                    <div
                      key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
                      className="flex min-w-0 items-center gap-3 rounded-lg border border-border p-3"
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center border border-border bg-muted/20 text-sm font-medium">
                        {index + 1}
                      </span>
                      <FileImage className="size-5 shrink-0 text-primary" />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{file.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeFile(index)}
                        disabled={status === "processing"}
                        aria-label={`Remover ${file.name}`}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </section>

              <div className="flex gap-3 rounded-lg border border-border bg-muted/20 p-4">
                <FileText className="mt-0.5 size-5 shrink-0 text-primary" />
                <div>
                  <h3 className="font-heading font-medium">Como o documento será montado</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Cada imagem será centralizada em uma página A4, preservando a proporção. Áreas transparentes recebem fundo branco durante a criação do PDF.
                  </p>
                </div>
              </div>

              <ToolActionBar>
                <Button size="lg" onClick={gerarPdf} disabled={status === "processing"}>
                  <FileText className="size-4" />
                  {status === "processing" ? "Gerando PDF..." : "Gerar PDF"}
                </Button>

                <Button variant="outline" size="lg" onClick={reset} disabled={status === "processing"}>
                  <Trash2 className="size-4" />
                  Limpar tudo
                </Button>
              </ToolActionBar>
            </>
          )}
        </CardContent>
      </Card>
    </ToolPageShell>
  );
}
