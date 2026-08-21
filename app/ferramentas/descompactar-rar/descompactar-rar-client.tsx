"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import {
  Archive,
  ArrowLeft,
  Download,
  File,
  Folder,
  KeyRound,
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

const MAX_RAR_SIZE = 120 * 1024 * 1024;
const MAX_ENTRIES = 3000;
const MAX_EXTRACTED_FILE_SIZE = 350 * 1024 * 1024;
const UNRAR_ASSET_PATH = "/vendor/unrar/";

type RarEntry = {
  name: string;
  size: number;
  directory: boolean;
};

type UnrarModule = {
  Archive: new (cmdData: unknown) => {
    openFile: (path: string) => boolean;
    isArchive: (verify: boolean) => boolean;
    readHeader: () => number;
    getHeaderType: () => number;
    getFileName: () => string;
    getFileSize: () => number | bigint;
    isDirectory: () => boolean;
    readFileData: () => { size: () => number; get: (index: number) => number };
    seekToNext: () => void;
  };
  CommandData: new () => unknown;
  setPassword: (password: string) => void;
  FS: {
    writeFile: (path: string, data: Uint8Array) => void;
    unlink: (path: string) => void;
  };
  HeaderType: {
    HEAD_FILE: number;
    HEAD_ENDARC: number;
  };
};

type RuntimeModule = {
  Archive: UnrarModule["Archive"];
  CommandData: UnrarModule["CommandData"];
  setPassword: UnrarModule["setPassword"];
  FS: UnrarModule["FS"];
  FILE_HEAD_VALUE: number;
  ENDARC_HEAD_VALUE: number;
};

type UnrarFactory = (options?: {
  locateFile?: (path: string, prefix: string) => string;
}) => Promise<RuntimeModule>;

declare global {
  interface Window {
    Module?: UnrarFactory;
    __kivaiUnrarPromise?: Promise<UnrarModule>;
  }
}

function formatBytes(bytes: number) {
  if (bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;
  return `${value >= 10 || index === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[index]}`;
}

function safeDownloadName(path: string) {
  const parts = path.split(/[\\/]/).filter(Boolean);
  return parts.at(-1) || "arquivo-extraido";
}

function loadUnrarFactory(): Promise<UnrarFactory> {
  if (typeof window.Module === "function") {
    return Promise.resolve(window.Module);
  }

  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-kivai-unrar="true"]',
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => {
        if (typeof window.Module === "function") resolve(window.Module);
        else reject(new Error("Runtime UnRAR carregado sem inicializador."));
      }, { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Falha ao carregar runtime UnRAR.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = `${UNRAR_ASSET_PATH}unrar.js`;
    script.async = true;
    script.dataset.kivaiUnrar = "true";
    script.onload = () => {
      if (typeof window.Module === "function") resolve(window.Module);
      else reject(new Error("Runtime UnRAR carregado sem inicializador."));
    };
    script.onerror = () => reject(new Error("Falha ao carregar runtime UnRAR."));
    document.head.appendChild(script);
  });
}

async function loadUnrarModule(): Promise<UnrarModule> {
  if (!window.__kivaiUnrarPromise) {
    window.__kivaiUnrarPromise = (async () => {
      const factory = await loadUnrarFactory();
      const runtime = await factory({
        locateFile: (path, prefix) =>
          path.endsWith(".wasm") ? `${UNRAR_ASSET_PATH}${path}` : `${prefix}${path}`,
      });

      return {
        Archive: runtime.Archive,
        CommandData: runtime.CommandData,
        setPassword: runtime.setPassword,
        FS: runtime.FS,
        HeaderType: {
          HEAD_FILE: runtime.FILE_HEAD_VALUE,
          HEAD_ENDARC: runtime.ENDARC_HEAD_VALUE,
        },
      };
    })().catch((error) => {
      window.__kivaiUnrarPromise = undefined;
      throw error;
    });
  }

  return window.__kivaiUnrarPromise;
}

function getErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();

  if (normalized.includes("password") || normalized.includes("encrypted")) {
    return "Não foi possível abrir o RAR. Verifique se o arquivo possui senha e informe a senha correta.";
  }

  if (normalized.includes("cannot open") || normalized.includes("not a valid")) {
    return "O arquivo não pôde ser reconhecido como um RAR válido. Ele pode estar corrompido ou incompleto.";
  }

  return "Não foi possível processar este RAR. Verifique o arquivo e tente novamente.";
}

export default function DescompactarRarClient() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [entries, setEntries] = useState<RarEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileCount = useMemo(() => entries.filter((entry) => !entry.directory).length, [entries]);
  const folderCount = useMemo(() => entries.filter((entry) => entry.directory).length, [entries]);
  const estimatedSize = useMemo(
    () => entries.reduce((total, entry) => total + (entry.directory ? 0 : entry.size), 0),
    [entries],
  );

  function reset() {
    setFile(null);
    setPassword("");
    setEntries([]);
    setLoading(false);
    setDownloading(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function chooseFile(selectedFile: File | undefined) {
    if (!selectedFile) return;

    setError(null);
    setEntries([]);

    if (!selectedFile.name.toLowerCase().endsWith(".rar")) {
      setFile(null);
      setError("Selecione um arquivo com extensão .rar.");
      return;
    }

    if (selectedFile.size === 0) {
      setFile(null);
      setError("O arquivo selecionado está vazio.");
      return;
    }

    if (selectedFile.size > MAX_RAR_SIZE) {
      setFile(null);
      setError(`O limite desta ferramenta é ${formatBytes(MAX_RAR_SIZE)} por arquivo RAR.`);
      return;
    }

    setFile(selectedFile);
  }

  async function inspectArchive() {
    if (!file) return;

    setLoading(true);
    setError(null);
    setEntries([]);

    const virtualPath = `/kivai-${Date.now()}.rar`;
    let unrar: UnrarModule | null = null;

    try {
      unrar = await loadUnrarModule();
      unrar.setPassword(password.trim());
      unrar.FS.writeFile(virtualPath, new Uint8Array(await file.arrayBuffer()));

      const archive = new unrar.Archive(new unrar.CommandData());
      if (!archive.openFile(virtualPath) || !archive.isArchive(true)) {
        throw new Error("Not a valid RAR file");
      }

      const found: RarEntry[] = [];
      while (archive.readHeader() > 0) {
        const headerType = archive.getHeaderType();

        if (headerType === unrar.HeaderType.HEAD_ENDARC) break;

        if (headerType === unrar.HeaderType.HEAD_FILE) {
          if (found.length >= MAX_ENTRIES) {
            throw new Error(`Este RAR possui mais de ${MAX_ENTRIES.toLocaleString("pt-BR")} itens, acima do limite da ferramenta.`);
          }

          const rawSize = archive.getFileSize();
          const size = Number(rawSize);
          found.push({
            name: archive.getFileName(),
            size: Number.isFinite(size) ? size : 0,
            directory: archive.isDirectory(),
          });
        }

        archive.seekToNext();
      }

      if (!found.length) {
        throw new Error("Nenhum arquivo foi encontrado dentro deste RAR.");
      }

      setEntries(found);
    } catch (archiveError) {
      const message = archiveError instanceof Error ? archiveError.message : "";
      setError(message.startsWith("Este RAR possui") || message.startsWith("Nenhum arquivo") ? message : getErrorMessage(archiveError));
    } finally {
      try {
        unrar?.FS.unlink(virtualPath);
      } catch {
        // O arquivo virtual pode não ter sido criado se a inicialização falhar.
      }
      setLoading(false);
    }
  }

  async function downloadEntry(target: RarEntry) {
    if (!file || target.directory) return;

    if (target.size > MAX_EXTRACTED_FILE_SIZE) {
      setError(`Este item tem ${formatBytes(target.size)} e ultrapassa o limite de ${formatBytes(MAX_EXTRACTED_FILE_SIZE)} para extração individual no navegador.`);
      return;
    }

    setDownloading(target.name);
    setError(null);

    const virtualPath = "/kivai-download.rar";
    let unrar: UnrarModule | null = null;

    try {
      unrar = await loadUnrarModule();
      unrar.setPassword(password.trim());
      unrar.FS.writeFile(virtualPath, new Uint8Array(await file.arrayBuffer()));

      const archive = new unrar.Archive(new unrar.CommandData());
      if (!archive.openFile(virtualPath) || !archive.isArchive(true)) {
        throw new Error("Cannot open RAR file");
      }

      let extracted: Uint8Array | null = null;
      while (archive.readHeader() > 0) {
        const headerType = archive.getHeaderType();
        if (headerType === unrar.HeaderType.HEAD_ENDARC) break;

        if (headerType === unrar.HeaderType.HEAD_FILE) {
          const currentName = archive.getFileName();
          const isDirectory = archive.isDirectory();

          if (!isDirectory && currentName === target.name) {
            const fileData = archive.readFileData();
            const size = fileData.size();

            if (size > MAX_EXTRACTED_FILE_SIZE) {
              throw new Error(`O arquivo extraído ultrapassa ${formatBytes(MAX_EXTRACTED_FILE_SIZE)}.`);
            }

            extracted = new Uint8Array(size);
            for (let index = 0; index < size; index += 1) {
              extracted[index] = fileData.get(index);
            }
            break;
          }
        }

        archive.seekToNext();
      }

      if (!extracted) {
        throw new Error("Arquivo interno não encontrado.");
      }

      const downloadBytes = new Uint8Array(extracted.byteLength);
      downloadBytes.set(extracted);
      const blob = new Blob([downloadBytes.buffer]);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = safeDownloadName(target.name);
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (archiveError) {
      setError(getErrorMessage(archiveError));
    } finally {
      try {
        unrar?.FS.unlink(virtualPath);
      } catch {
        // Ignora limpeza quando o arquivo virtual não existe.
      }
      setDownloading(null);
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
            Descompactar RAR
          </h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
            Abra um arquivo RAR, veja o conteúdo e baixe os arquivos extraídos diretamente no navegador.
          </p>
        </div>

        <Card className="mx-auto max-w-5xl">
          <CardHeader>
            <CardTitle>Selecione um arquivo RAR</CardTitle>
            <CardDescription>
              O processamento acontece localmente. Seu arquivo não é enviado para nossos servidores.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-primary/40 bg-muted/20 p-10 text-center transition hover:bg-muted/30">
              <Upload className="mb-4 size-8 text-primary" />
              <span className="font-medium">Clique para selecionar um arquivo RAR</span>
              <span className="mt-2 text-sm text-muted-foreground">
                Arquivos .rar de até {formatBytes(MAX_RAR_SIZE)}
              </span>
              <input
                ref={inputRef}
                type="file"
                accept=".rar,application/vnd.rar,application/x-rar-compressed"
                className="hidden"
                onChange={(event) => chooseFile(event.target.files?.[0])}
              />
            </label>

            {error && (
              <div className="mt-5 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm leading-6 text-destructive">
                {error}
              </div>
            )}

            {file && (
              <div className="mt-6 space-y-5">
                <div className="rounded-lg border p-4">
                  <div className="flex items-start gap-3">
                    <Archive className="mt-0.5 size-5 shrink-0 text-primary" />
                    <div className="min-w-0">
                      <p className="break-all font-medium">{file.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{formatBytes(file.size)}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="rar-password" className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <KeyRound className="size-4" />
                    Senha do RAR, se houver
                  </label>
                  <input
                    id="rar-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Deixe em branco se o arquivo não tiver senha"
                    autoComplete="off"
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-primary"
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button onClick={inspectArchive} disabled={loading}>
                    {loading ? <Loader2 className="size-4 animate-spin" /> : <Archive className="size-4" />}
                    {loading ? "Abrindo RAR..." : "Abrir RAR"}
                  </Button>
                  <Button variant="outline" onClick={reset} disabled={loading || downloading !== null}>
                    <RotateCcw className="size-4" />
                    Limpar
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {entries.length > 0 && (
          <div className="mx-auto mt-8 max-w-5xl">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold">Conteúdo do RAR</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {fileCount} arquivo{fileCount === 1 ? "" : "s"}, {folderCount} pasta{folderCount === 1 ? "" : "s"} · {formatBytes(estimatedSize)} descompactados
                </p>
              </div>
              <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="size-4 text-primary" />
                Extração local no navegador
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <ul className="divide-y divide-border">
                {entries.map((entry, index) => (
                  <li key={`${entry.name}-${index}`} className="flex items-center gap-3 p-4">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      {entry.directory ? <Folder className="size-4" /> : <File className="size-4" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="break-all text-sm font-medium">{entry.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {entry.directory ? "Pasta" : formatBytes(entry.size)}
                      </p>
                    </div>
                    {!entry.directory && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadEntry(entry)}
                        disabled={downloading !== null}
                      >
                        {downloading === entry.name ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Download className="size-4" />
                        )}
                        <span className="hidden sm:inline">Baixar</span>
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
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
