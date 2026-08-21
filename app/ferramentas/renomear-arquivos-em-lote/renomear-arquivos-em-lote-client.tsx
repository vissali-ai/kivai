"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import {
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

const MAX_FILES = 1000;
const MAX_TOTAL_SIZE = 300 * 1024 * 1024;

type FileItem = {
  id: string;
  file: File;
};

type Separator = "-" | "_" | "";

function formatBytes(bytes: number) {
  if (bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;
  return `${value >= 10 || index === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[index]}`;
}

function splitFileName(name: string) {
  const lastDot = name.lastIndexOf(".");
  if (lastDot <= 0) return { base: name, extension: "" };
  return { base: name.slice(0, lastDot), extension: name.slice(lastDot) };
}

function sanitizeBaseName(value: string) {
  return value
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "")
    .replace(/\s+/g, " ")
    .replace(/[. ]+$/g, "");
}

function makeId(file: File, index: number) {
  return `${file.name}-${file.size}-${file.lastModified}-${index}-${crypto.randomUUID()}`;
}

export default function RenomearArquivosEmLoteClient() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [baseName, setBaseName] = useState("arquivo");
  const [separator, setSeparator] = useState<Separator>("-");
  const [startNumber, setStartNumber] = useState(1);
  const [digits, setDigits] = useState(2);
  const [compressing, setCompressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState<number | null>(null);

  const totalSize = useMemo(
    () => files.reduce((total, item) => total + item.file.size, 0),
    [files],
  );

  const preview = useMemo(() => {
    const cleanBase = sanitizeBaseName(baseName) || "arquivo";
    return files.map((item, index) => {
      const { extension } = splitFileName(item.file.name);
      const number = String(startNumber + index).padStart(digits, "0");
      return {
        ...item,
        newName: `${cleanBase}${separator}${number}${extension}`,
      };
    });
  }, [baseName, digits, files, separator, startNumber]);

  function addFiles(selected: File[]) {
    setError(null);
    setResultSize(null);

    const nonEmpty = selected.filter((file) => file.size > 0);
    if (!nonEmpty.length) {
      setError("Selecione pelo menos um arquivo válido.");
      return;
    }

    const nextCount = files.length + nonEmpty.length;
    const nextSize = totalSize + nonEmpty.reduce((sum, file) => sum + file.size, 0);

    if (nextCount > MAX_FILES) {
      setError(`O limite desta ferramenta é ${MAX_FILES.toLocaleString("pt-BR")} arquivos por operação.`);
      return;
    }

    if (nextSize > MAX_TOTAL_SIZE) {
      setError(`O tamanho total dos arquivos não pode ultrapassar ${formatBytes(MAX_TOTAL_SIZE)}.`);
      return;
    }

    setFiles((current) => [
      ...current,
      ...nonEmpty.map((file, index) => ({ id: makeId(file, index), file })),
    ]);
  }

  function removeFile(id: string) {
    setFiles((current) => current.filter((item) => item.id !== id));
    setResultSize(null);
  }

  function reset() {
    setFiles([]);
    setBaseName("arquivo");
    setSeparator("-");
    setStartNumber(1);
    setDigits(2);
    setProgress(0);
    setResultSize(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function downloadRenamedFiles() {
    if (!preview.length) return;

    const cleanBase = sanitizeBaseName(baseName);
    if (!cleanBase) {
      setError("Informe um nome base válido para os arquivos.");
      return;
    }

    setCompressing(true);
    setProgress(0);
    setError(null);
    setResultSize(null);

    try {
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();

      preview.forEach((item) => {
        zip.file(item.newName, item.file);
      });

      const blob = await zip.generateAsync(
        {
          type: "blob",
          compression: "DEFLATE",
          compressionOptions: { level: 6 },
        },
        (metadata) => setProgress(Math.round(metadata.percent)),
      );

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${cleanBase}-renomeados.zip`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);

      setResultSize(blob.size);
      setProgress(100);
    } catch {
      setError("Não foi possível preparar os arquivos renomeados. Reduza a quantidade ou o tamanho dos arquivos e tente novamente.");
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
            Renomear Arquivos em Lote
          </h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
            Padronize o nome de vários arquivos de uma só vez, com numeração automática e preservação das extensões originais.
          </p>
        </div>

        <Card className="mx-auto max-w-5xl">
          <CardHeader>
            <CardTitle>Selecione os arquivos</CardTitle>
            <CardDescription>
              Os arquivos são processados localmente. O navegador gera um ZIP com as cópias renomeadas.
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
              <div role="alert" className="mt-5 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm leading-6 text-destructive">
                {error}
              </div>
            )}

            {files.length > 0 && (
              <div className="mt-6 space-y-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="lg:col-span-2">
                    <label htmlFor="rename-base" className="mb-2 block text-sm font-medium">Nome base</label>
                    <input
                      id="rename-base"
                      value={baseName}
                      onChange={(event) => setBaseName(event.target.value)}
                      maxLength={100}
                      placeholder="Ex.: produto-camiseta"
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-primary"
                    />
                  </div>
                  <div>
                    <label htmlFor="rename-separator" className="mb-2 block text-sm font-medium">Separador</label>
                    <select
                      id="rename-separator"
                      value={separator}
                      onChange={(event) => setSeparator(event.target.value as Separator)}
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-primary"
                    >
                      <option value="-">Hífen (-)</option>
                      <option value="_">Underline (_)</option>
                      <option value="">Sem separador</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="rename-start" className="mb-2 block text-sm font-medium">Iniciar em</label>
                      <input
                        id="rename-start"
                        type="number"
                        min={0}
                        max={999999}
                        value={startNumber}
                        onChange={(event) => setStartNumber(Math.max(0, Math.min(999999, Number(event.target.value) || 0)))}
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-primary"
                      />
                    </div>
                    <div>
                      <label htmlFor="rename-digits" className="mb-2 block text-sm font-medium">Dígitos</label>
                      <select
                        id="rename-digits"
                        value={digits}
                        onChange={(event) => setDigits(Number(event.target.value))}
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-primary"
                      >
                        <option value={1}>1</option>
                        <option value={2}>2</option>
                        <option value={3}>3</option>
                        <option value={4}>4</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-border bg-card">
                  <div className="flex flex-col gap-1 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-medium">
                      {files.length} arquivo{files.length === 1 ? "" : "s"} selecionado{files.length === 1 ? "" : "s"}
                    </p>
                    <p className="text-sm text-muted-foreground">{formatBytes(totalSize)} no total</p>
                  </div>
                  <ul className="max-h-[440px] divide-y divide-border overflow-y-auto">
                    {preview.map((item) => (
                      <li key={item.id} className="flex items-center gap-3 p-4">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <File className="size-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm text-muted-foreground" title={item.file.name}>{item.file.name}</p>
                          <p className="mt-1 truncate text-sm font-medium" title={item.newName}>{item.newName}</p>
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
                      <span>Preparando arquivos...</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full bg-primary transition-[width]" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                )}

                {resultSize !== null && !compressing && (
                  <div className="rounded-lg border border-primary/25 bg-primary/5 p-4 text-sm leading-6">
                    ZIP criado com {formatBytes(resultSize)}. O download foi iniciado automaticamente.
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  <Button onClick={downloadRenamedFiles} disabled={compressing || files.length === 0}>
                    {compressing ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                    {compressing ? "Preparando..." : "Baixar arquivos renomeados"}
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
            <p className="mt-1 text-xs leading-5 text-muted-foreground">Os arquivos permanecem no dispositivo durante a operação.</p>
          </div>
          <div className="rounded-xl border border-border bg-muted/10 p-4">
            <File className="size-5 text-primary" />
            <p className="mt-3 text-sm font-medium">Extensões preservadas</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">JPG, PDF, XLSX, MP4 e outros formatos mantêm sua extensão original.</p>
          </div>
          <div className="rounded-xl border border-border bg-muted/10 p-4">
            <Download className="size-5 text-primary" />
            <p className="mt-3 text-sm font-medium">Download em ZIP</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">As cópias renomeadas são reunidas em um único arquivo ZIP.</p>
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-5xl">
          <AdSlot variant="banner" />
        </div>
      </div>
    </section>
  );
}
