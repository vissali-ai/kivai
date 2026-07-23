"use client";

import Link from "next/link";
import { useRef, useState } from "react";

import {
  ArrowLeft,
  Download,
  FileText,
  Minimize2,
  Upload,
} from "lucide-react";

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
  compressPdf,
  getPdfInfo,
} from "./pdf-utils";

export default function CompactarPdfClient() {
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);

  const [pages, setPages] = useState(0);

  const [size, setSize] = useState(0);

  const [loading, setLoading] = useState(false);

  const [quality, setQuality] = useState<
    "low" | "medium" | "high"
  >("medium");

  async function processFile(selected: File) {
    setFile(selected);

    const info = await getPdfInfo(selected);

    setPages(info.pages);

    setSize(info.size);
  }

  async function handleCompress() {
    if (!file) return;

    try {
      setLoading(true);

      const bytes = await compressPdf(
        file,
        quality
      );

      const arrayBuffer = new ArrayBuffer(
        bytes.byteLength
      );

      new Uint8Array(arrayBuffer).set(bytes);

      const blob = new Blob([arrayBuffer], {
        type: "application/pdf",
      });

      const url = URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = url;

      link.download =
        file.name.replace(
          /\.pdf$/i,
          ""
        ) + "-compactado.pdf";

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
            Compactar PDF
          </h1>

          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
            Reduza o tamanho do seu PDF mantendo a melhor qualidade possível.
          </p>

        </div>

        <Card className="mx-auto max-w-5xl">

          <CardHeader>

            <CardTitle>
              Selecione um PDF
            </CardTitle>

            <CardDescription>
              Escolha um arquivo PDF para compactar.
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
                        {(size / 1024 / 1024).toFixed(2)} MB
                      </p>

                      <p className="text-sm text-muted-foreground">
                        {pages} página
                        {pages > 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 rounded-lg border p-6">

                  <div className="mb-4 flex items-center gap-2">

                    <Minimize2 className="size-5 text-primary" />

                    <h3 className="font-semibold">
                      Nível de compactação
                    </h3>

                  </div>

                  <div className="space-y-3">

                    <label className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 hover:bg-muted/30">

                      <input
                        type="radio"
                        name="quality"
                        checked={quality === "low"}
                        onChange={() =>
                          setQuality("low")
                        }
                      />

                      <div>
                        <p className="font-medium">
                          Baixa compressão
                        </p>

                        <p className="text-sm text-muted-foreground">
                          Maior qualidade e menor redução de tamanho.
                        </p>
                      </div>

                    </label>

                    <label className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 hover:bg-muted/30">

                      <input
                        type="radio"
                        name="quality"
                        checked={quality === "medium"}
                        onChange={() =>
                          setQuality("medium")
                        }
                      />

                      <div>
                        <p className="font-medium">
                          Compressão média
                        </p>

                        <p className="text-sm text-muted-foreground">
                          Equilíbrio entre qualidade e tamanho.
                        </p>
                      </div>

                    </label>

                    <label className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 hover:bg-muted/30">

                      <input
                        type="radio"
                        name="quality"
                        checked={quality === "high"}
                        onChange={() =>
                          setQuality("high")
                        }
                      />

                      <div>
                        <p className="font-medium">
                          Alta compressão
                        </p>

                        <p className="text-sm text-muted-foreground">
                          Prioriza a redução do tamanho do arquivo.
                        </p>
                      </div>

                    </label>

                  </div>

                </div>

                <div className="mt-8 flex justify-end">

                  <Button
                    size="lg"
                    onClick={handleCompress}
                    disabled={loading}
                  >
                    {loading ? (
                      "Compactando..."
                    ) : (
                      <>
                        <Download className="mr-2 size-4" />
                        Compactar PDF
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