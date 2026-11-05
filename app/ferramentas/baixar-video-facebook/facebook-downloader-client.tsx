"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Download, Link2, RotateCcw, Search, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { ToolErrorMessage } from "@/components/tools/tool-error-message";
import { ToolProcessingStatus, type ToolStatus } from "@/components/tools/tool-processing-status";
import { ToolResultCard } from "@/components/tools/tool-result-card";
import { formatFileSize } from "@/lib/tool-files";

type Item = { id: string; filename: string; format: string; width?: number; height?: number; size?: number; downloadToken: string };
type Result = { items: Item[]; expiresIn: number };
type Props = { title: string; description: string; categoryName: string; categoryHref: string };

function backendUrl() {
  return (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_KIVAI_BACKEND_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
}

export default function FacebookDownloaderClient(props: Props) {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<ToolStatus>("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);

  async function analyze(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!url.trim() || status === "processing") return;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setResult(null); setError(""); setStatus("processing");
    const timeout = setTimeout(() => controller.abort("timeout"), 45000);
    try {
      const response = await fetch(`${backendUrl()}/facebook/resolve`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }), signal: controller.signal, cache: "no-store",
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(typeof payload.detail === "string" ? payload.detail : "Não foi possível consultar este vídeo.");
      if (!Array.isArray(payload.items) || !payload.items.length) throw new Error("Nenhum vídeo foi encontrado neste link.");
      if (request.current !== controller) return;
      setResult(payload); setStatus("success");
    } catch (failure) {
      if (request.current !== controller) return;
      if (controller.signal.aborted && controller.signal.reason !== "timeout") return;
      setError(controller.signal.reason === "timeout" ? "A consulta demorou demais. Tente novamente."
        : failure instanceof Error && failure.message !== "Failed to fetch" ? failure.message : "Não foi possível conectar ao serviço. Tente novamente.");
      setStatus("error");
    } finally {
      clearTimeout(timeout);
      if (request.current === controller) request.current = null;
    }
  }

  function reset() {
    request.current?.abort(); request.current = null;
    setUrl(""); setResult(null); setError(""); setStatus("idle");
  }

  return <ToolPageShell {...props} processingMode="server" breadcrumbRootName="Início" breadcrumbRootHref="/"
    privacyMessage="O link é consultado pelo serviço de mídia. Você não precisa conectar sua conta do Facebook.">
    <Card className="mx-auto max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Video className="size-4 text-primary" />Link público do Facebook</CardTitle>
        <CardDescription>Reels, vídeos e links fb.watch. Use conteúdo próprio ou que você tenha autorização para baixar.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <form onSubmit={analyze} className="space-y-3">
          <label htmlFor="facebook-url" className="block text-sm font-medium">Link do vídeo ou Reel</label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <Link2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input id="facebook-url" type="url" inputMode="url" autoComplete="url" required maxLength={2048}
                value={url} onChange={event => setUrl(event.target.value)} disabled={status === "processing"}
                placeholder="https://www.facebook.com/watch?v=..." className="h-11 pl-10" />
            </div>
            <Button size="lg" type="submit" disabled={!url.trim() || status === "processing"}><Search />Analisar link</Button>
          </div>
        </form>
        <ToolProcessingStatus status={status} message="Localizando o vídeo público no Facebook..." />
        <ToolErrorMessage message={error} />
        {result && <ToolResultCard title={result.items.length === 1 ? "Vídeo encontrado" : `${result.items.length} vídeos encontrados`}
          details={<div className="space-y-4"><div className="grid gap-4 sm:grid-cols-2">
            {result.items.map((item, index) => {
              const mediaUrl = `${backendUrl()}/facebook/media/${encodeURIComponent(item.downloadToken)}`;
              return <article key={item.id} className="min-w-0 overflow-hidden rounded-lg border border-border">
                <video controls playsInline preload="metadata" src={mediaUrl} aria-label={`Prévia do vídeo ${index + 1}`} className="aspect-video w-full bg-black object-contain" />
                <div className="space-y-3 p-4">
                  <h3 className="font-medium">Vídeo {index + 1}</h3>
                  <p className="text-sm text-muted-foreground">{[item.format, item.width && item.height ? `${item.width} × ${item.height}px` : null, item.size ? formatFileSize(item.size) : null].filter(Boolean).join(" · ")}</p>
                  <Button asChild className="w-full"><a href={`${mediaUrl}?download=true`}><Download />Baixar {item.format}</a></Button>
                </div>
              </article>;
            })}
          </div><p className="text-xs text-muted-foreground">Links válidos por aproximadamente {Math.max(1, Math.round(result.expiresIn / 60))} minutos. Se expirarem, analise o link novamente.</p></div>}
          actions={<Button variant="outline" type="button" onClick={reset}><RotateCcw />Analisar outro link</Button>} />}
      </CardContent>
    </Card>
  </ToolPageShell>;
}
