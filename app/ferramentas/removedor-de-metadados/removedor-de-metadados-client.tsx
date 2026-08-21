"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Download,
  FileImage,
  Loader2,
  RotateCcw,
  ShieldCheck,
  ShieldOff,
  Upload,
} from "lucide-react";

import { AdSlot } from "@/components/ads/AdSlot";
import { ToolPageBreadcrumb } from "@/components/tools/tool-page-breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const MAX_FILE_SIZE = 40 * 1024 * 1024;
const MAX_PIXELS = 40_000_000;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type ImageInfo = {
  width: number;
  height: number;
};

type CleanResult = {
  blob: Blob;
  url: string;
  fileName: string;
};

function formatBytes(bytes: number) {
  if (bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;
  return `${value >= 10 || index === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[index]}`;
}

function extensionForMime(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

function outputName(type: string) {
  return `imagem-sem-metadados.${extensionForMime(type)}`;
}

async function decodeImage(file: File) {
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return createImageBitmap(file);
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string) {
  return new Promise<Blob>((resolve, reject) => {
    const quality = type === "image/png" ? undefined : 0.98;
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Não foi possível gerar a imagem limpa."));
          return;
        }
        resolve(blob);
      },
      type,
      quality,
    );
  });
}

export default function RemovedorDeMetadadosClient() {
  const inputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [imageInfo, setImageInfo] = useState<ImageInfo | null>(null);
  const [result, setResult] = useState<CleanResult | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reduction = useMemo(() => {
    if (!file || !result) return null;
    if (file.size === 0) return null;
    return ((file.size - result.blob.size) / file.size) * 100;
  }, [file, result]);

  useEffect(() => {
    return () => {
      if (sourceUrl) URL.revokeObjectURL(sourceUrl);
      if (result?.url) URL.revokeObjectURL(result.url);
    };
  }, [sourceUrl, result]);

  useEffect(() => {
    if (!result) return;
    resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [result]);

  function clearResult() {
    if (result?.url) URL.revokeObjectURL(result.url);
    setResult(null);
  }

  async function selectFile(selected: File | null) {
    setError(null);
    clearResult();

    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    setSourceUrl(null);
    setFile(null);
    setImageInfo(null);

    if (!selected) return;

    if (!ACCEPTED_TYPES.has(selected.type)) {
      setError("Use uma imagem JPG, PNG ou WebP.");
      return;
    }

    if (selected.size <= 0) {
      setError("O arquivo selecionado está vazio.");
      return;
    }

    if (selected.size > MAX_FILE_SIZE) {
      setError(`O arquivo deve ter no máximo ${formatBytes(MAX_FILE_SIZE)}.`);
      return;
    }

    let bitmap: ImageBitmap | null = null;
    try {
      bitmap = await decodeImage(selected);
      const pixels = bitmap.width * bitmap.height;
      if (!bitmap.width || !bitmap.height || pixels > MAX_PIXELS) {
        setError("A imagem ultrapassa o limite de 40 megapixels desta versão.");
        return;
      }

      setFile(selected);
      setImageInfo({ width: bitmap.width, height: bitmap.height });
      setSourceUrl(URL.createObjectURL(selected));
    } catch {
      setError("Não foi possível abrir esta imagem. Verifique se o arquivo não está corrompido.");
    } finally {
      bitmap?.close();
    }
  }

  async function removeMetadata() {
    if (!file) return;

    setProcessing(true);
    setError(null);
    clearResult();

    let bitmap: ImageBitmap | null = null;
    try {
      bitmap = await decodeImage(file);

      if (bitmap.width * bitmap.height > MAX_PIXELS) {
        throw new Error("A imagem ultrapassa o limite de pixels.");
      }

      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;

      const context = canvas.getContext("2d", { alpha: file.type !== "image/jpeg" });
      if (!context) throw new Error("Canvas indisponível.");

      if (file.type === "image/jpeg") {
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
      }

      context.drawImage(bitmap, 0, 0);
      const blob = await canvasToBlob(canvas, file.type);

      if (blob.type !== file.type) {
        throw new Error("O navegador não oferece exportação no formato original.");
      }

      const url = URL.createObjectURL(blob);

      setResult({
        blob,
        url,
        fileName: outputName(blob.type),
      });
    } catch {
      setError(
        "Não foi possível recriar a imagem neste formato. Tente outro navegador moderno ou converta a imagem para JPG, PNG ou WebP antes de repetir a operação.",
      );
    } finally {
      bitmap?.close();
      setProcessing(false);
    }
  }

  function downloadResult() {
    if (!result) return;
    const anchor = document.createElement("a");
    anchor.href = result.url;
    anchor.download = result.fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }

  function reset() {
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    if (result?.url) URL.revokeObjectURL(result.url);
    setFile(null);
    setSourceUrl(null);
    setImageInfo(null);
    setResult(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <section className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-6xl px-4 pb-12 pt-20 sm:px-6 sm:pt-24 lg:px-8 lg:pb-16">
        <ToolPageBreadcrumb
          items={[
            { label: "Início", href: "/" },
            { label: "Ferramentas", href: "/ferramentas" },
            { label: "Imagens", href: "/ferramentas/imagens" },
            { label: "Removedor de Metadados" },
          ]}
        />

        <div className="mb-8 max-w-3xl sm:mb-10">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary sm:text-sm">IMAGENS</p>
          <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
            Removedor de Metadados
          </h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
            Crie uma nova cópia da imagem sem carregar os metadados incorporados do arquivo original.
          </p>
          <p className="mt-3 flex max-w-xl items-start gap-2 text-sm leading-6 text-muted-foreground sm:items-center">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary sm:mt-0" aria-hidden="true" />
            Processamento local no navegador para JPG, PNG e WebP.
          </p>
        </div>

        <Card className="mx-auto max-w-5xl">
          <CardHeader className="p-5 sm:p-6">
            <CardTitle>Selecione uma imagem</CardTitle>
            <CardDescription>
              Compatível com JPG, PNG e WebP. A imagem é processada diretamente no navegador.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-0 sm:p-6 sm:pt-0" aria-busy={processing}>
            <label
              className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-primary/40 bg-muted/20 p-6 text-center transition hover:bg-muted/30 focus-within:border-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-primary/30 sm:min-h-48 sm:p-10"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                void selectFile(event.dataTransfer.files?.[0] ?? null);
              }}
            >
              <Upload className="mb-4 size-8 text-primary" aria-hidden="true" />
              <span className="font-medium">Clique ou arraste uma imagem para esta área</span>
              <span className="mt-2 text-sm leading-6 text-muted-foreground">
                JPG, PNG ou WebP, até {formatBytes(MAX_FILE_SIZE)} e 40 megapixels
              </span>
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                className="sr-only"
                aria-label="Selecionar imagem JPG, PNG ou WebP"
                onChange={(event) => void selectFile(event.currentTarget.files?.[0] ?? null)}
              />
            </label>

            {error && (
              <div
                role="alert"
                className="mt-5 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm leading-6 text-destructive"
              >
                {error}
              </div>
            )}

            {file && sourceUrl && imageInfo && (
              <div className="mt-6 space-y-6">
                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
                  <div className="overflow-hidden rounded-xl border border-border bg-muted/10 p-2 sm:p-3">
                    <img
                      src={sourceUrl}
                      alt="Prévia da imagem selecionada"
                      className="mx-auto max-h-[360px] w-auto max-w-full rounded-lg object-contain sm:max-h-[520px]"
                    />
                  </div>

                  <dl className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-muted/10 p-4 sm:grid-cols-4 lg:grid-cols-1">
                    <div className="col-span-2 sm:col-span-1 lg:col-span-1">
                      <dt className="text-xs uppercase tracking-wide text-muted-foreground">Arquivo</dt>
                      <dd className="mt-1 break-all text-sm font-medium">{file.name}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-muted-foreground">Formato</dt>
                      <dd className="mt-1 text-sm font-medium">{file.type.replace("image/", "").toUpperCase()}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-muted-foreground">Dimensões</dt>
                      <dd className="mt-1 text-sm font-medium">{imageInfo.width} × {imageInfo.height} px</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-muted-foreground">Tamanho original</dt>
                      <dd className="mt-1 text-sm font-medium">{formatBytes(file.size)}</dd>
                    </div>
                  </dl>
                </div>

                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm leading-6 text-muted-foreground">
                  <div className="flex gap-3">
                    <ShieldOff className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                    <p>
                      A ferramenta decodifica os pixels e gera um novo arquivo. Com isso, os blocos de metadados herdados do original, como EXIF, GPS, XMP e IPTC quando presentes, não são copiados para a nova imagem.
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:flex sm:flex-wrap">
                  <Button className="w-full sm:w-auto" onClick={removeMetadata} disabled={processing}>
                    {processing ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <ShieldOff className="size-4" aria-hidden="true" />}
                    {processing ? "Removendo..." : "Remover metadados"}
                  </Button>
                  <Button className="w-full sm:w-auto" variant="outline" onClick={reset} disabled={processing}>
                    <RotateCcw className="size-4" aria-hidden="true" />
                    Limpar
                  </Button>
                </div>

                {processing ? (
                  <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
                    Recriando a imagem no seu navegador...
                  </p>
                ) : null}
              </div>
            )}

            {result && file && (
              <div
                ref={resultRef}
                className="mt-6 rounded-xl border border-primary/25 bg-primary/5 p-5"
                role="status"
                aria-live="polite"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-foreground">Nova imagem pronta</p>
                    <p className="mt-1 break-words text-sm leading-6 text-muted-foreground">
                      {result.fileName} · {formatBytes(result.blob.size)}
                      {reduction !== null
                        ? ` · ${reduction >= 0 ? `${reduction.toFixed(1)}% menor` : `${Math.abs(reduction).toFixed(1)}% maior`}`
                        : ""}
                    </p>
                  </div>
                  <Button className="w-full sm:w-auto" onClick={downloadResult}>
                    <Download className="size-4" aria-hidden="true" />
                    Baixar imagem limpa
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mx-auto mt-8 grid max-w-5xl gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-muted/10 p-4">
            <ShieldCheck className="size-5 text-primary" aria-hidden="true" />
            <p className="mt-3 text-sm font-medium">Processamento local</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">A imagem permanece no dispositivo durante a operação.</p>
          </div>
          <div className="rounded-xl border border-border bg-muted/10 p-4">
            <ShieldOff className="size-5 text-primary" aria-hidden="true" />
            <p className="mt-3 text-sm font-medium">Sem dados herdados</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">O novo arquivo não reutiliza os blocos de metadados do original.</p>
          </div>
          <div className="rounded-xl border border-border bg-muted/10 p-4">
            <FileImage className="size-5 text-primary" aria-hidden="true" />
            <p className="mt-3 text-sm font-medium">Formato preservado</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">JPG continua JPG, PNG continua PNG e WebP continua WebP em navegadores compatíveis.</p>
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-5xl">
          <AdSlot variant="banner" />
        </div>
      </div>
    </section>
  );
}
