"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import {
  Archive,
  ArrowLeft,
  Download,
  File,
  Folder,
  Loader2,
  RotateCcw,
  ShieldCheck,
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

type ZipEntryView = {
  name: string;
  dir: boolean;
  date: Date;
};

const MAX_ZIP_SIZE = 200 * 1024 * 1024;
const MAX_ENTRIES = 3000;

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;
  return `${value.toFixed(index === 0 ? 0 : value >= 10 ? 1 : 2)} ${units[index]}`;
}

function safeDownloadName(path: string) {
  const parts = path.split("/").filter(Boolean);
  return parts.at(-1) || "arquivo";
}

export default function DescompactarZipClient() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [entries, setEntries] = useState<ZipEntryView[]>([]);
  const [zipInstance, setZipInstance] = useState<import("jszip") | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileEntries = useMemo(() => entries.filter((entry) => !entry.dir), [entries]);
  const folderCount = entries.length - fileEntries.length;

  async function openZip(selectedFile: File) {
    setError(null);
    setEntries([]);
    setZipInstance(null);

    if (!selectedFile.name.toLowerCase().endsWith(".zip")) {
      setError("Selecione um arquivo com extensão .zip.");
      return;
    }

    if (selectedFile.size === 0) {
      setError("O arquivo ZIP selecionado está vazio.");
      return;
    }

    if (selectedFile.size > MAX_ZIP_SIZE) {
      setError("Para preservar a estabilidade do navegador, use arquivos ZIP de até 200 MB nesta versão.");
      return;
    }

    setFile(selectedFile);
    setLoading(true);

    try {
      const { default: JSZip } = await import("jszip");
      const zip = await JSZip.loadAsync(await selectedFile.arrayBuffer());
      const items = Object.values(zip.files);

      if (items.length > MAX_ENTRIES) {
        setFile(null);
        setError(`Este ZIP contém mais de ${MAX_ENTRIES.toLocaleString("pt-BR")} itens e excede o limite desta versão.`);
        return;
      }

      if (items.length === 0) {
        setFile(null);
        setError("Nenhum arquivo foi encontrado dentro deste ZIP.");
        return;
      }

      setEntries(
        items
          .map((item) => ({ name: item.name, dir: item.dir, date: item.date }))
          .sort((a, b) => Number(a.dir) - Number(b.dir) || a.name.localeCompare(b.name, "pt-BR")),
      );
      setZipInstance(zip);
    } catch (cause) {
      console.error(cause);
      setFile(null);
      setError(
        "Não foi possível abrir este ZIP. O arquivo pode estar corrompido, protegido por senha ou usar um método de compressão incompatível.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;
    await openZip(selectedFile);
    event.target.value = "";
  }

  async function downloadEntry(name: string) {
    if (!zipInstance) return;
    const entry = zipInstance.file(name);
    if (!entry) return;

    setDownloading(name);
    setError(null);

    try {
      const blob = await entry.async("blob");
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = safeDownloadName(name);
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (cause) {
      console.error(cause);
      setError("Não foi possível extrair este item do ZIP.");
    } finally {
      setDownloading(null);
    }
  }

  function reset() {
    setFile(null);
    setEntries([]);
    setZipInstance(null);
    setError(null);
    setLoading(false);
    setDownloading(null);
    if (inputRef.current) inputRef.current.value = "";
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
            Descompactar ZIP
          </h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
            Abra um arquivo ZIP, confira o conteúdo e baixe os arquivos que precisa diretamente no navegador.
          </p>
        </div>

        <Card className="mx-auto max-w-5xl">
          <CardHeader>
            <CardTitle>Selecione um arquivo ZIP</CardTitle>
            <CardDescription>
              O arquivo é processado localmente. Limite de 200 MB e até 3.000 itens por ZIP nesta versão.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-primary/40 bg-muted/20 p-10 text-center transition hover:bg-muted/30">
              {loading ? (
                <Loader2 className="mb-4 size-8 animate-spin text-primary" />
              ) : (
                <Upload className="mb-4 size-8 text-primary" />
              )}
              <span className="font-medium">
                {loading ? "Lendo conteúdo do ZIP..." : "Clique para selecionar um arquivo ZIP"}
              </span>
              <span className="mt-2 text-sm text-muted-foreground">Arquivo .zip</span>
              <input
                ref={inputRef}
                type="file"
                accept=".zip,application/zip,application/x-zip-compressed"
                className="hidden"
                disabled={loading}
                onChange={handleChange}
              />
            </label>

            {error && (
              <div role="alert" className="mt-5 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm leading-6 text-destructive">
                {error}
              </div>
            )}

            {file && entries.length > 0 && (
              <>
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-border p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Arquivo ZIP</p>
                    <p className="mt-1 truncate font-medium" title={file.name}>{file.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{formatBytes(file.size)}</p>
                  </div>
                  <div className="rounded-lg border border-border p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Arquivos</p>
                    <p className="mt-1 text-2xl font-semibold">{fileEntries.length}</p>
                  </div>
                  <div className="rounded-lg border border-border p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Pastas</p>
                    <p className="mt-1 text-2xl font-semibold">{folderCount}</p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Button variant="outline" onClick={reset}>
                    <RotateCcw className="size-4" />
                    Escolher outro ZIP
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {entries.length > 0 && (
          <div className="mx-auto mt-8 max-w-5xl">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">Conteúdo do ZIP</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {fileEntries.length} arquivo{fileEntries.length === 1 ? "" : "s"} disponível{fileEntries.length === 1 ? "" : "is"} para download.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="size-3.5 text-primary" />
                Processamento local
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="max-h-[520px] divide-y divide-border overflow-y-auto">
                {entries.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-3 p-4">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      {entry.dir ? <Folder className="size-4" /> : <File className="size-4" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium" title={entry.name}>{entry.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {entry.dir ? "Pasta" : `Arquivo • ${entry.date.toLocaleDateString("pt-BR")}`}
                      </p>
                    </div>
                    {!entry.dir && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={downloading !== null}
                        onClick={() => downloadEntry(entry.name)}
                      >
                        {downloading === entry.name ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Download className="size-4" />
                        )}
                        <span className="hidden sm:inline">Baixar</span>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <p className="mt-4 text-xs leading-5 text-muted-foreground">
              Por segurança e compatibilidade entre navegadores, os itens são baixados individualmente nesta versão. Pastas são representadas pela estrutura de caminhos armazenada no ZIP.
            </p>
          </div>
        )}

        <div className="mx-auto mt-8 max-w-5xl">
          <AdSlot variant="banner" />
        </div>
      </div>
    </section>
  );
}
