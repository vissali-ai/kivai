"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  Download,
  FileText,
  Trash2,
  Upload,
} from "lucide-react";

import { AdSlot } from "@/components/ads/ad-slot";

import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  mergePdfs,
  getPdfPageCount,
  type PdfFile,
} from "./pdf-utils";

export default function UnirPdfsClient() {
  const inputRef = useRef<HTMLInputElement>(null);

  const [pdfs, setPdfs] = useState<PdfFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);

  function formatBytes(bytes: number) {
    if (bytes === 0) return "0 B";

    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat(
      (bytes / Math.pow(k, i)).toFixed(2)
    )} ${sizes[i]}`;
  }

  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files);

      const novos: PdfFile[] = [];

      for (const file of list) {
        if (file.type !== "application/pdf") continue;

        try {
          const pages = await getPdfPageCount(file);

          novos.push({
            id: crypto.randomUUID(),
            file,
            pages,
            size: file.size,
          });
        } catch (error) {
          console.error("Erro ao ler PDF:", file.name, error);
        }
      }

      setPdfs((old) => [...old, ...novos]);
    },
    []
  );

  async function handleMerge() {
    if (pdfs.length < 2) return;

    try {
      setLoading(true);

      const bytes = await mergePdfs(
        pdfs.map((pdf) => pdf.file)
      );

      const arrayBuffer = new ArrayBuffer(bytes.byteLength);

      new Uint8Array(arrayBuffer).set(bytes);

      const blob = new Blob([arrayBuffer], {
        type: "application/pdf",
      });

      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;
      link.download = "pdf-unido.pdf";

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert("Não foi possível unir os PDFs.");
    } finally {
      setLoading(false);
    }
  }

  function moveUp(index: number) {
    if (index === 0) return;

    const copy = [...pdfs];

    [copy[index - 1], copy[index]] = [
      copy[index],
      copy[index - 1],
    ];

    setPdfs(copy);
  }

  function moveDown(index: number) {
    if (index === pdfs.length - 1) return;

    const copy = [...pdfs];

    [copy[index], copy[index + 1]] = [
      copy[index + 1],
      copy[index],
    ];

    setPdfs(copy);
  }

  function remove(id: string) {
    setPdfs((old) =>
      old.filter((pdf) => pdf.id !== id)
    );
  }

  return (
    <section className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">

        <div className="mb-8">
          <Link
            href="/ferramentas/pdfs"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Voltar para PDFs
          </Link>
        </div>

        <div className="mb-10 max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-wider text-primary">
            DOCUMENTOS
          </p>

          <h1 className="mt-3 font-heading text-3xl font-semibold sm:text-4xl lg:text-5xl">
            Unir PDFs
          </h1>

          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
            Junte vários arquivos PDF em um único documento de forma rápida e segura.
          </p>
        </div>

        <Card className="mx-auto max-w-5xl">
          <CardHeader>
            <CardTitle>Selecione os PDFs</CardTitle>

            <CardDescription>
              Escolha dois ou mais arquivos PDF para unir.
            </CardDescription>
          </CardHeader>

          <CardContent>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={async (e) => {
                e.preventDefault();

                setDragActive(false);

                await processFiles(e.dataTransfer.files);
              }}
              onClick={() => inputRef.current?.click()}
              className={`cursor-pointer rounded-lg border border-dashed border-primary/40 bg-muted/20 p-10 text-center transition hover:bg-muted/30 ${
                dragActive ? "border-primary bg-primary/5" : ""
              }`}
            >
              <Upload className="mx-auto mb-4 size-8 text-primary" />

              <p className="font-medium">
                Clique ou arraste os PDFs aqui
              </p>

              <p className="mt-2 text-sm text-muted-foreground">
                Selecione dois ou mais arquivos PDF
              </p>

              <input
                ref={inputRef}
                type="file"
                hidden
                multiple
                accept="application/pdf"
                onChange={(e) => {
                  if (!e.target.files) return;

                  processFiles(e.target.files);
                }}
              />
            </div>
                        {pdfs.length > 0 && (
              <>
                <div className="mt-8 overflow-hidden rounded-lg border">
                  <div className="border-b p-4">
                    <h2 className="font-semibold">
                      Arquivos selecionados
                    </h2>

                    <p className="text-sm text-muted-foreground">
                      {pdfs.length} arquivo(s)
                    </p>
                  </div>

                  <div className="divide-y">
                    {pdfs.map((pdf, index) => (
                      <div
                        key={pdf.id}
                        className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="rounded-lg bg-primary/10 p-3">
                            <FileText className="size-5 text-primary" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">
                              {pdf.file.name}
                            </p>

                            <p className="text-sm text-muted-foreground">
                              {(pdf.size / 1024 / 1024).toFixed(2)} MB
                            </p>

                            <p className="text-sm text-muted-foreground">
                              {pdf.pages} página
                              {pdf.pages > 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => moveUp(index)}
                            disabled={index === 0}
                          >
                            <ArrowUp className="size-4" />
                          </Button>

                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => moveDown(index)}
                            disabled={index === pdfs.length - 1}
                          >
                            <ArrowDown className="size-4" />
                          </Button>

                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => remove(pdf.id)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <Button
                    size="lg"
                    onClick={handleMerge}
                    disabled={
                      pdfs.length < 2 || loading
                    }
                  >
                    {loading ? (
                      "Unindo PDFs..."
                    ) : (
                      <>
                        <Download className="size-4" />
                        Unir PDFs
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
                      </CardContent>
        </Card>

        <div className="mx-auto mt-8 max-w-5xl">
          <AdSlot variant="banner" />
        </div>

      </div>
    </section>
  );
}