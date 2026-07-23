"use client";

import Link from "next/link";
import { useState } from "react";
import { jsPDF } from "jspdf";
import {
  ArrowLeft,
  FileImage,
  FileText,
  RotateCcw,
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

export default function ImagensParaPdfClient() {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  function handleFiles(event: React.ChangeEvent<HTMLInputElement>) {
    if (!event.target.files) return;

    setFiles(Array.from(event.target.files));
  }

  function limpar() {
    setFiles([]);
  }

  async function gerarPdf() {
    if (!files.length) return;

    setLoading(true);

    const pdf = new jsPDF();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();

        reader.onload = () => resolve(reader.result as string);

        reader.readAsDataURL(file);
      });

      const img = await new Promise<HTMLImageElement>((resolve) => {
        const image = new Image();

        image.onload = () => resolve(image);

        image.src = dataUrl;
      });

      const largura = pdf.internal.pageSize.getWidth();
      const altura = (img.height * largura) / img.width;

      if (i > 0) pdf.addPage();

      pdf.addImage(
        dataUrl,
        "JPEG",
        0,
        0,
        largura,
        altura
      );
    }

    pdf.save("nexion-tools.pdf");

    setLoading(false);
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
            Imagens para PDF
          </h1>

          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
            Transforme imagens JPG, PNG e WebP em um único arquivo PDF.
          </p>
        </div>

        <Card className="mx-auto max-w-5xl">

          <CardHeader>
            <CardTitle>Selecione suas imagens</CardTitle>

            <CardDescription>
              Você pode selecionar uma ou várias imagens.
            </CardDescription>
          </CardHeader>

          <CardContent>

            <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-primary/40 bg-muted/20 p-10 transition hover:bg-muted/30">

              <Upload className="mb-4 size-8 text-primary" />

              <span className="font-medium">
                Clique para escolher imagens
              </span>

              <span className="mt-2 text-sm text-muted-foreground">
                JPG • PNG • WebP
              </span>

              <input
                multiple
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleFiles}
              />

            </label>

            {files.length > 0 && (

              <div className="mt-8">

                <h3 className="mb-4 font-semibold">
                  Imagens selecionadas ({files.length})
                </h3>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">

                  {files.map((file) => (

                    <div
                      key={file.name}
                      className="flex items-center gap-3 rounded-lg border p-3"
                    >
                      <FileImage className="size-5 text-primary" />

                      <div className="min-w-0">

                        <p className="truncate text-sm font-medium">
                          {file.name}
                        </p>

                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>

                      </div>

                    </div>

                  ))}

                </div>

                <div className="mt-8 flex flex-wrap gap-3">

                  <Button onClick={gerarPdf} disabled={loading}>

                    <FileText className="size-4" />

                    {loading
                      ? "Gerando PDF..."
                      : "Gerar PDF"}

                  </Button>

                  <Button
                    variant="outline"
                    onClick={limpar}
                  >
                    <RotateCcw className="size-4" />
                    Limpar
                  </Button>

                </div>

              </div>

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