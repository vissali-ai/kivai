"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Download, Images, Link2, RotateCcw, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ToolErrorMessage } from "@/components/tools/tool-error-message";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { ToolProcessingStatus, type ToolStatus } from "@/components/tools/tool-processing-status";
import { ToolResultCard } from "@/components/tools/tool-result-card";
import { formatFileSize } from "@/lib/tool-files";

type InstagramItem = {
  id: string;
  kind: "video" | "image";
  filename: string;
  format: string;
  width?: number | null;
  height?: number | null;
  duration?: number | null;
  size?: number | null;
  downloadToken: string;
};

type InstagramResult = {
  source: "instagram";
  shortcode: string;
  title: string;
  author?: string | null;
  items: InstagramItem[];
  expiresIn: number;
};

const genericError = "Não foi possível analisar este link público do Instagram.";

function backendUrl() {
  if (typeof window !== "undefined" && ["localhost", "127.0.0.1"].includes(window.location.hostname)) {
    return "http://127.0.0.1:8000";
  }
  return (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_KIVAI_BACKEND_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
}

function formatDuration(seconds?: number | null) {
  if (!seconds) return null;
  const rounded = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(rounded / 60);
  const remainder = rounded % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

async function responseMessage(response: Response) {
  try {
    return ((await response.json()) as { detail?: string }).detail || genericError;
  } catch {
    return genericError;
  }
}

export default function BaixarVideoInstagramClient() {
  const requestRef = useRef<AbortController | null>(null);
  const [url, setUrl] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [status, setStatus] = useState<ToolStatus>("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<InstagramResult | null>(null);

  useEffect(() => () => requestRef.current?.abort(), []);

  async function analyze(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!url.trim() || !authorized || status === "processing") return;
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setError("");
    setResult(null);
    setStatus("processing");
    try {
      const response = await fetch(`${backendUrl()}/instagram/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), authorized }),
        cache: "no-store",
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(await responseMessage(response));
      const payload = await response.json() as InstagramResult;
      if (!payload.items?.length) throw new Error(genericError);
      setResult(payload);
      setStatus("success");
    } catch (nextError) {
      if ((nextError as Error).name === "AbortError") return;
      const message = nextError instanceof Error ? nextError.message : genericError;
      setError(message.includes("Failed to fetch")
        ? "O recurso de download está temporariamente indisponível. Tente novamente em alguns instantes."
        : message);
      setStatus("error");
    } finally {
      if (requestRef.current === controller) requestRef.current = null;
    }
  }

  function reset() {
    requestRef.current?.abort();
    setUrl("");
    setAuthorized(false);
    setResult(null);
    setError("");
    setStatus("idle");
  }

  return (
    <ToolPageShell
      title="Baixar Vídeo e Foto do Instagram"
      description="Cole o link de um Reel ou de uma publicação pública e baixe o vídeo ou a foto disponível, sem conectar sua conta."
      categoryName="Vídeos"
      categoryHref="/ferramentas/videos"
      breadcrumbRootName="Início"
      breadcrumbRootHref="/"
      processingMode="server"
      privacyMessage="Usamos o link apenas para encontrar o arquivo. Você não precisa informar login ou senha, e o conteúdo não fica salvo no Kivai."
    >
      <Card className="mx-auto max-w-4xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Images className="size-4 text-primary" />Link público do Instagram</CardTitle>
          <CardDescription>Compatível com Reels, vídeos e fotos de publicações públicas. Stories e contas privadas não são suportados.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <form onSubmit={(event) => void analyze(event)} className="space-y-4">
            <label className="block text-sm font-medium" htmlFor="instagram-url">Link do Reel ou da publicação</label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Link2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input
                  id="instagram-url"
                  type="url"
                  inputMode="url"
                  autoComplete="url"
                  required
                  maxLength={2048}
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  placeholder="https://www.instagram.com/reel/..."
                  className="h-11 pl-10 text-sm"
                  disabled={status === "processing"}
                />
              </div>
              <Button type="submit" size="lg" disabled={!url.trim() || !authorized || status === "processing"}>
                <Search className="size-4" />Analisar link
              </Button>
            </div>
            <label className="flex cursor-pointer items-start gap-3 border border-border bg-muted/20 p-4 text-sm leading-6">
              <input
                type="checkbox"
                checked={authorized}
                onChange={(event) => setAuthorized(event.target.checked)}
                className="mt-1 accent-primary"
                disabled={status === "processing"}
              />
              <span>Confirmo que este conteúdo é meu ou que possuo autorização para baixá-lo e utilizá-lo.</span>
            </label>
          </form>

          <ToolProcessingStatus status={status} message="Localizando a foto ou o vídeo público no Instagram..." />
          <ToolErrorMessage message={error} />

          {result && (
            <ToolResultCard
              title={result.items.length > 1
                ? `${result.items.length} arquivos encontrados`
                : result.items[0]?.kind === "image" ? "Foto encontrada" : "Vídeo encontrado"}
              description={[result.author ? `@${result.author.replace(/^@/, "")}` : null, result.title].filter(Boolean).join(" · ")}
              details={(
                <div className="space-y-3">
                  {result.items.map((item, index) => {
                    const duration = formatDuration(item.duration);
                    const details = [
                      item.format,
                      item.width && item.height ? `${item.width} × ${item.height}px` : null,
                      duration,
                      item.size ? formatFileSize(item.size) : null,
                    ].filter(Boolean).join(" · ");
                    return (
                      <div key={item.id} className="flex flex-col gap-3 border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="break-all font-medium">{result.items.length > 1 ? `Vídeo ${index + 1}` : item.filename}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{details || "Arquivo disponível"}</p>
                        </div>
                        <Button asChild className="sm:shrink-0">
                          <a href={`${backendUrl()}/instagram/media/${encodeURIComponent(item.downloadToken)}?download=true`}>
                            <Download className="size-4" />Baixar {item.format}
                          </a>
                        </Button>
                      </div>
                    );
                  })}
                  <p className="text-xs leading-5 text-muted-foreground">Os botões de download ficam disponíveis por aproximadamente {Math.max(1, Math.round(result.expiresIn / 60))} minutos. Depois disso, analise a publicação novamente.</p>
                </div>
              )}
              actions={<Button type="button" variant="outline" onClick={reset}><RotateCcw className="size-4" />Analisar outro link</Button>}
            />
          )}
        </CardContent>
      </Card>
    </ToolPageShell>
  );
}
