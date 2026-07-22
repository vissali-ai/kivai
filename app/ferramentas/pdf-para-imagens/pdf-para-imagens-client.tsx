"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  Download,
  FileImage,
  FileText,
  RotateCcw,
  Upload,
} from "lucide-react";

import JSZip from "jszip";

import { AdSlot } from "@/components/ads/ad-slot";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function PdfParaImagensClient() {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<"png" | "jpg">("png");
  const [totalPages, setTotalPages] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);

  const [images, setImages] = useState<string[]>([]);

  async function handleFile(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    if (!event.target.files?.length) return;

    const selectedFile = event.target.files[0];

    setFile(selectedFile);

    try {
      const pdfjs = await import("pdfjs-dist");

      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url
      ).toString();

      const pdf = await pdfjs.getDocument({
        data: await selectedFile.arrayBuffer(),
      }).promise;

      setTotalPages(pdf.numPages);
    } catch (error) {
      console.error(error);
      setTotalPages(null);
    }
  }

  function limpar() {
    setFile(null);
    setImages([]);
    setLoading(false);
    setTotalPages(null);
  }

  async function converterPdf() {
    if (!file) return;

    setLoading(true);

    try {
      const pdfjs = await import("pdfjs-dist");

      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url
      ).toString();

      const pdf = await pdfjs.getDocument({
        data: await file.arrayBuffer(),
      }).promise;

      const novasImagens: string[] = [];

      for (
        let pageNumber = 1;
        pageNumber <= pdf.numPages;
        pageNumber++
      ) {
        const page = await pdf.getPage(pageNumber);

        const viewport = page.getViewport({
          scale: 2,
        });

        const canvas = document.createElement("canvas");

        const context = canvas.getContext("2d");

        if (!context) {
          throw new Error("Canvas não suportado.");
        }

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
          canvas,
          canvasContext: context,
          viewport,
        }).promise;

        const image =
          format === "png"
            ? canvas.toDataURL("image/png")
            : canvas.toDataURL("image/jpeg", 0.95);

        novasImagens.push(image);
      }

      setImages(novasImagens);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function baixarTodas() {
    if (!images.length) return;

    const zip = new JSZip();

    for (let i = 0; i < images.length; i++) {
      const response = await fetch(images[i]);

      const blob = await response.blob();

      zip.file(
        `pagina-${i + 1}.${format}`,
        blob
      );
    }

    const zipBlob = await zip.generateAsync({
      type: "blob",
    });

    const url = URL.createObjectURL(zipBlob);

    const link = document.createElement("a");

    link.href = url;

    link.download =
      `${file?.name.replace(/\.pdf$/i, "") ?? "pdf"}-imagens.zip`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
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
        PDF para Imagens
      </h1>

      <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
        Extraia todas as páginas de um PDF e converta para PNG ou JPG.
      </p>
    </div>

    <Card className="mx-auto max-w-5xl">
      <CardHeader>
        <CardTitle>Selecione um PDF</CardTitle>

        <CardDescription>
          Escolha um arquivo PDF para converter em imagens.
        </CardDescription>
      </CardHeader>

      <CardContent>

        <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-primary/40 bg-muted/20 p-10 transition hover:bg-muted/30">

          <Upload className="mb-4 size-8 text-primary" />

          <span className="font-medium">
            Clique para selecionar um PDF
          </span>

          <span className="mt-2 text-sm text-muted-foreground">
            Arquivos .pdf
          </span>

          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleFile}
          />

        </label>

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

                  {totalPages !== null && (
                    <p className="text-sm text-muted-foreground">
                      {totalPages} página{totalPages > 1 ? "s" : ""}
                    </p>
                  )}

                  <p className="text-sm text-muted-foreground">
                    Saída: {format.toUpperCase()}
                  </p>

                </div>

              </div>

            </div>

            <div className="mt-8">

              <h3 className="mb-4 font-semibold">
                Formato de saída
              </h3>

              <div className="flex gap-3">

                <Button
                  variant={format === "png" ? "default" : "outline"}
                  onClick={() => setFormat("png")}
                >
                  PNG
                </Button>

                <Button
                  variant={format === "jpg" ? "default" : "outline"}
                  onClick={() => setFormat("jpg")}
                >
                  JPG
                </Button>

              </div>

            </div>

            <div className="mt-8 flex flex-wrap gap-3">

              <Button
                onClick={converterPdf}
                disabled={loading}
              >
                <FileImage className="size-4" />

                {loading
                  ? "Convertendo..."
                  : "Converter"}

              </Button>

              <Button
                variant="outline"
                onClick={limpar}
              >
                <RotateCcw className="size-4" />
                Limpar
              </Button>

              {images.length > 0 && (

                <Button
                  variant="secondary"
                  onClick={baixarTodas}
                >
                  <Download className="size-4" />
                  Baixar todas
                </Button>

              )}

            </div>

          </>

        )}

      </CardContent>

    </Card>
          {images.length > 0 && (
        <div className="mt-10">

          <h3 className="mb-1 text-lg font-semibold">
            Pré-visualização
          </h3>

          <p className="mb-5 text-sm text-muted-foreground">
            {images.length} imagem{images.length > 1 ? "s" : ""} gerada
            {images.length > 1 ? "s" : ""}
          </p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

            {images.map((image, index) => (

              <div
                key={index}
                className="rounded-xl border bg-card p-3 shadow-sm"
              >

                <h4 className="mb-3 text-sm font-semibold">
                  Página {index + 1} de {images.length}
                </h4>

                <img
                  src={image}
                  alt={`Página ${index + 1}`}
                  className="h-80 w-full rounded border bg-white object-contain"
                />

                <Button
                  asChild
                  className="mt-3 w-full"
                >
                  <a
                    href={image}
                    download={`pagina-${index + 1}.${format}`}
                  >
                    Baixar {format.toUpperCase()}
                  </a>
                </Button>

              </div>

            ))}

          </div>

        </div>
      )}

      <div className="mx-auto mt-8 max-w-5xl">
        <AdSlot variant="banner" />
      </div>

    </div>
  </section>
);
}