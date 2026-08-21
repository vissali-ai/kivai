"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import {
  Archive,
  ArrowLeft,
  Download,
  File,
  Loader2,
  RotateCcw,
  ShieldCheck,
  Trash2,
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

const MAX_TOTAL_SIZE = 300 * 1024 * 1024;
const MAX_FILES = 1000;

type CompressionLevel = 1 | 6 | 9;

type SelectedFile = {
  id: string;
  file: File;
};

function formatBytes(bytes: number) {
  if (bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;
  return `${value >= 10 || index === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[index]}`;
}

function sanitizeArchiveName(value: string) {
  const cleaned = value
    .replace(/\.zip$/i, "")
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned || "arquivos-kivai";
}

function getUniqueEntryName(name: string, usedNames: Set<string>) {
  const safeName = name.split(/[\\/]/).filter(Boolean).at(-1) || "arquivo";
  if (!usedNames.has(safeName.toLowerCase())) {
    usedNames.add(safeName.toLowerCase());
    return safeName;
  }

  const dotIndex = safeName.lastIndexOf(".");
  const hasExtension = dotIndex > 0;
  const base = hasExtension ? safeName.slice(0, dotIndex) : safeName;
  const extension = hasExtension ? safeName.slice(dotIndex) : "";

  let counter = 2;
  let candidate = `${base} (${counter})${extension}`;
  while (usedNames.has(candidate.toLowerCase())) {
    counter += 1;
    candidate = `${base} (${counter})${extension}`;
  }

  usedNames.add(candidate.toLowerCase());
  return candidate;
}

export default function CompactarArquivosZipClient() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [archiveName, setArchiveName] = useState("arquivos-kivai");
  const [compressionLevel, setCompressionLevel] = useState<CompressionLevel>(6);
  const [compressing, setCompressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState<number | null>(null);

  const totalSize = useMemo(
    () => files.reduce((total, item) => total + item.file.size, 0),
    [files],
  );

  function reset() {
    setFiles([]);
    setArchiveName("arquivos-kivai");
    setCompressionLevel(6);
    setCompressing(false);
    setProgress(0);
    setError(null);
    setResultSize(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function addFiles(incoming: File[]) {
    if (!incoming.length) return;

    setError(null);
    setResultSize(null);

    const currentFiles = files.map((item) => item.file);
    const combined = [...currentFiles, ...incoming];

    if (combined.length > MAX_FILES) {
      setError(`Selecione no máximo ${MAX_FILES.toLocaleString("pt-BR")} arquivos por ZIP.`);
      return;
    }

    const combinedSize = combined.reduce((total, file) => total + file.size, 0);
    if (combinedSize > MAX_TOTAL_SIZE) {
      setError(`O total selecionado ultrapassa o limite de ${formatBytes(MAX_TOTAL_SIZE)}.`);
      return;
    }

    const additions = incoming.map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
      file,
    }));

    setFiles((current) => [...current, ...additions]);
  }

  function removeFile(id: string) {
    setFiles((current) => current.filter((item) => item.id !== id));
    setResultSize(null);
  }

  async function createZip() {
    if (!files.length) {
      setError("Selecione pelo menos um arquivo para criar o ZIP.");
      return;
    }

    setCompressing(true);
    setProgress(0);
    setError(null);
    setResultSize(null);

    try {
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      const usedNames = new Set<string>();

      for (const item of files) {
        const entryName = getUniqueEntryName(item.file.name, usedNames);
        zip.file(entryName, item.file, {
          date: new Date(item.file.lastModified),
        });
      }

      const blob = await zip.generateAsync(
        {
          type: "blob",
          compression: "DEFLATE",
          compressionOptions: { level: compressionLevel },
          platform: "DOS",
        },
        (metadata) => {
          setProgress(Math.max(0, Math.min(100, Math.round(metadata.percent))));
        },
      );

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${sanitizeArchiveName(archiveName)}.zip`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);

      setResultSize(blob.size);
      setProgress(100);
    } catch {
      setError(
        "Não foi possível criar o ZIP. Reduza a quantidade ou o tamanho dos arquivos e tente novamente.",
      );
    } finally {
      setCompressing(false);
    }
  }

  return (
    <section className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-6xl px-4 pb-12 pt-24 sm:px-6 lg:px-8 lg:pb-16">
        <div className="mb-8">
          <Link
            href="/ferramentas/arquivos"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Voltar para Arquivos
          </Link>
        </div>

        <div className="mb-10 max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-wider text-primary">ARQUIVOS</p>
          <h1 className="mt-3 font-heading text-3xl font-semibold sm:text-4xl lg:text-5xl">
            Compactar Arquivos em ZIP
          </h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
            Junte vários arquivos em um único ZIP para organizar, armazenar ou compartilhar com mais facilidade.
          </p>
        </div>

        <Card className="mx-auto max-w-5xl">
          <CardHeader>
            <CardTitle>Selecione os arquivos</CardTitle>
            <CardDescription>
              A compactação acontece localmente no navegador. Seus arquivos não são enviados para nossos servidores.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <label
              className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-primary/40 bg-muted/20 p-10 text-center transition hover:bg-muted/30"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                addFiles(Array.from(event.dataTransfer.files));
              }}
            >
              <Upload className="mb-4 size-8 text-primary" />
              <span className="font-medium">Clique ou arraste arquivos para esta área</span>
              <span className="mt-2 text-sm text-muted-foreground">
                Até {MAX_FILES.toLocaleString("pt-BR")} arquivos e {formatBytes(MAX_TOTAL_SIZE)} no total
              </span>
              <input
                ref={inputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(event) => {
                  addFiles(Array.from(event.target.files ?? []));
                  event.currentTarget.value = "";
                }}
              />
            </label>

            {error && (
              <div className="mt-5 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm leading-6 text-destructive">
                {error}
              </div>
            )}

            {files.length > 0 && (
              <div className="mt-6 space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label htmlFor="zip-name" className="mb-2 block text-sm font-medium">
                      Nome do arquivo ZIP
                    </label>
                    <div className="flex items-center rounded-md border border-input bg-background">
                      <input
                        id="zip-name"
                        value={archiveName}
                        onChange={(event) => setArchiveName(event.target.value)}
                        maxLength={120}
                        className="h-10 min-w-0 flex-1 bg-transparent px-3 text-sm outline-none"
                      />
                      <span className="pr-3 text-sm text-muted-foreground">.zip</span>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="compression-level" className="mb-2 block text-sm font-medium">
                      Nível de compactação
                    </label>
                    <select
                      id="compression-level"
                      value={compressionLevel}
                      onChange={(event) => setCompressionLevel(Number(event.target.value) as CompressionLevel)}
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-primary"
                    >
                      <option value={1}>Rápida</option>
                      <option value={6}>Equilibrada</option>
                      <option value={9}>Máxima</option>
                    </select>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card">
                  <div className="flex flex-col gap-1 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-medium">
                      {files.length} arquivo{files.length === 1 ? "" : "s"} selecionado{files.length === 1 ? "" : "s"}
                    </p>
                    <p className="text-sm text-muted-foreground">{formatBytes(totalSize)} no total</p>
                  </div>
                  <ul className="max-h-80 divide-y divide-border overflow-y-auto">
                    {files.map((item) => (
                      <li key={item.id} className="flex items-center gap-3 p-4">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <File className="size-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{item.file.name}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{formatBytes(item.file.size)}</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={compressing}
                          onClick={() => removeFile(item.id)}
                          aria-label={`Remover ${item.file.name}`}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>

                {compressing && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Criando ZIP...</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-primary transition-[width]"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {resultSize !== null && !compressing && (
                  <div className="rounded-lg border border-primary/25 bg-primary/5 p-4 text-sm leading-6">
                    ZIP criado com {formatBytes(resultSize)}. O download foi iniciado automaticamente.
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  <Button onClick={createZip} disabled={compressing || files.length === 0}>
                    {compressing ? <Loader2 className="size-4 animate-spin" /> : <Archive className="size-4" />}
                    {compressing ? "Compactando..." : "Compactar em ZIP"}
                  </Button>
                  <Button variant="outline" onClick={reset} disabled={compressing}>
                    <RotateCcw className="size-4" />
                    Limpar
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mx-auto mt-8 grid max-w-5xl gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-muted/10 p-4">
            <ShieldCheck className="size-5 text-primary" />
            <p className="mt-3 text-sm font-medium">Processamento local</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">Os arquivos permanecem no seu dispositivo durante a compactação.</p>
          </div>
          <div className="rounded-xl border border-border bg-muted/10 p-4">
            <Archive className="size-5 text-primary" />
            <p className="mt-3 text-sm font-medium">Formato ZIP</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">O resultado é um arquivo .zip compatível com sistemas e descompactadores comuns.</p>
          </div>
          <div className="rounded-xl border border-border bg-muted/10 p-4">
            <Download className="size-5 text-primary" />
            <p className="mt-3 text-sm font-medium">Download direto</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">Ao concluir, o navegador inicia o download do ZIP gerado.</p>
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-5xl">
          <AdSlot slot="tool-middle" />
        </div>
      </div>
    </section>
  );
}
