"use client";

import Link from "next/link";
import { useRef, useState } from "react";

import {
  ArrowLeft,
  Download,
  FileText,
  Scissors,
  Upload,
} from "lucide-react";

import JSZip from "jszip";

import { AdSlot } from "@/components/ads/AdSlot";

import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  getPdfPageCount,
  splitPdfAllPages,
} from "./pdf-utils";

export default function DividirPdfClient() {
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);

  const [pages, setPages] = useState(0);

  const [loading, setLoading] = useState(false);

  async function processFile(selected: File) {
    setFile(selected);

    const total = await getPdfPageCount(selected);

    setPages(total);
  }

  async function handleSplit() {
    if (!file) return;

    try {
      setLoading(true);

      const arquivos =
        await splitPdfAllPages(file);

      const zip = new JSZip();

      arquivos.forEach((pdf) => {
        zip.file(pdf.name, pdf.bytes);
      });

      const blob = await zip.generateAsync({
        type: "blob",
      });

      const url =
        URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = url;

      link.download =
        file.name.replace(
          /\.pdf$/i,
          ""
        ) + "-dividido.zip";

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
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
            Dividir PDF
          </h1>

          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
            Divida um PDF em páginas individuais de forma rápida e segura.
          </p>

        </div>

        <Card className="mx-auto max-w-5xl">

          <CardHeader>

            <CardTitle>
              Selecione um PDF
            </CardTitle>

            <CardDescription>
              Escolha um arquivo PDF para dividir.
            </CardDescription>

          </CardHeader>

          <CardContent>

            <div
              onClick={() =>
                inputRef.current?.click()
              }
              className="cursor-pointer rounded-lg border border-dashed border-primary/40 bg-muted/20 p-10 text-center transition hover:bg-muted/30"
            >

              <Upload className="mx-auto mb-4 size-8 text-primary" />

              <p className="font-medium">
                Clique para selecionar um PDF
              </p>

              <p className="mt-2 text-sm text-muted-foreground">
                Arquivos .pdf
              </p>

              <input
                ref={inputRef}
                hidden
                type="file"
                accept="application/pdf"
                onChange={(e) => {
                  if (!e.target.files?.length)
                    return;

                  processFile(
                    e.target.files[0]
                  );
                }}
              />

            </div>
                        {file && (
              <>
                <div className="mt-8 rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <FileText className="size-5 text-primary" />

                    <div>
                      <p className="font-medium">
                        {file.name}
                      </p>

                      <p className="text-sm text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>

                      <p className="text-sm text-muted-foreground">
                        {pages} página
                        {pages > 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 rounded-lg border bg-muted/20 p-4">
                  <div className="flex items-start gap-3">
                    <Scissors className="mt-0.5 size-5 text-primary" />

                    <div>
                      <h3 className="font-semibold">
                        Modo de divisão
                      </h3>

                      <p className="mt-1 text-sm text-muted-foreground">
                        Cada página será salva como um
                        arquivo PDF independente.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <Button
                    size="lg"
                    onClick={handleSplit}
                    disabled={loading}
                  >
                    {loading ? (
                      "Dividindo PDF..."
                    ) : (
                      <>
                        <Download className="mr-2 size-4" />
                        Dividir PDF
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