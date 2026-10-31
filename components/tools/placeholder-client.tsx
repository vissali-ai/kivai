"use client";

/* eslint-disable @next/next/no-img-element -- previews use temporary blob URLs created in the browser */

import { openFilePicker } from "@/lib/browser/file-picker";
import { type ChangeEvent, useEffect, useRef, useState } from "react";
import { Copy, Download, Link2, LoaderCircle, Upload } from "lucide-react";
import Link from "next/link";
import { getStoredSession } from "@/lib/user-auth";
import { useAccountAccess } from "@/lib/billing/access-client";
import { hostingLimit } from "@/lib/favicon/hosting";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageToolPageShell } from "@/components/tools/image-tool-page-shell";
import { canvasBlob, downloadBlob, IMAGE_TYPES, loadImage } from "@/lib/image-tools/canvas";

const MAX_IMAGE_SIZE = 20 * 1024 * 1024;

type PlaceholderResult = { blob: Blob; url: string; data: string; width: number; height: number };

export function PlaceholderClient() {
  const input = useRef<HTMLInputElement>(null);
  const resultUrl = useRef<string | null>(null);
  const imageUrl = useRef<string | null>(null);
  const generation = useRef(0);
  const [file, setFile] = useState<File | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [width, setWidth] = useState(32);
  const [quality, setQuality] = useState(55);
  const [result, setResult] = useState<PlaceholderResult | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const { access } = useAccountAccess();
  const [hosting, setHosting] = useState(false);
  const [hostingError, setHostingError] = useState("");
  const [hostedUrl, setHostedUrl] = useState("");
  const [hostedFiles, setHostedFiles] = useState<Array<{id:string;public_url:string;byte_size:number}>>([]);
  const [refreshingFiles, setRefreshingFiles] = useState(false);
  async function refreshHosted() {
    const token = getStoredSession()?.access_token;
    if (!token) return;
    setRefreshingFiles(true);
    try {
      const res = await fetch("/api/placeholder/hosting",{headers:{Authorization:`Bearer ${token}`},cache:"no-store"});
      const data = await res.json() as {files?:Array<{id:string;public_url:string;byte_size:number}>;error?:string};
      if (!res.ok) throw new Error(data.error || "Não foi possível carregar suas hospedagens.");
      setHostedFiles(data.files ?? []);
    } catch(e) { setHostingError(e instanceof Error ? e.message : "Não foi possível carregar suas hospedagens."); }
    finally { setRefreshingFiles(false); }
  }
  async function host() {
    if (!result || generating || hosting) return;
    setHostingError("");
    const token = getStoredSession()?.access_token;
    if (!token) { setHostingError("Entre na sua conta para hospedar o placeholder."); return; }
    const maxBytes = hostingLimit(access?.plan ?? "free").maxBytes;
    if (result.blob.size > maxBytes) { setHostingError("Arquivo acima do limite de hospedagem do seu plano."); return; }
    setHosting(true);
    try {
      const form = new FormData();
      form.set("placeholder",result.blob,"placeholder-lqip.jpg");
      const res = await fetch("/api/placeholder/hosting",{method:"POST",headers:{Authorization:`Bearer ${token}`},body:form});
      const data = await res.json() as {url?:string;error?:string};
      if (!res.ok || !data.url) throw new Error(data.error || "Não foi possível hospedar o placeholder.");
      setHostedUrl(data.url);
      await refreshHosted();
    } catch(e) { setHostingError(e instanceof Error ? e.message : "Não foi possível hospedar o placeholder."); }
    finally { setHosting(false); }
  }
  async function removeHosted(id:string) {
    if (!window.confirm("Excluir este placeholder? O link público deixará de funcionar.")) return;
    const token = getStoredSession()?.access_token;
    if (!token) return;
    try {
      const res = await fetch(`/api/placeholder/hosting?id=${encodeURIComponent(id)}`,{method:"DELETE",headers:{Authorization:`Bearer ${token}`}});
      if (!res.ok) throw new Error("Não foi possível excluir o placeholder.");
      setHostedFiles(items=>items.filter(item=>item.id!==id));
    } catch(e) { setHostingError(e instanceof Error ? e.message : "Não foi possível excluir."); }
  }

  async function updatePlaceholder(source: HTMLImageElement, nextWidth: number, nextQuality: number) {
    const currentGeneration = ++generation.current;
    setGenerating(true);
    setCopied(false);
    try {
      const next = await generatePlaceholder(source, nextWidth, nextQuality);
      if (currentGeneration !== generation.current) {
        URL.revokeObjectURL(next.url);
        return;
      }
      if (resultUrl.current) URL.revokeObjectURL(resultUrl.current);
      resultUrl.current = next.url;
      setResult(next);
      setHostedUrl("");
      setGenerating(false);
    } catch {
      if (currentGeneration !== generation.current) return;
      setGenerating(false);
      setError("Não foi possível gerar o placeholder desta imagem.");
    }
  }

  useEffect(() => () => {
    generation.current += 1;
    if (resultUrl.current) URL.revokeObjectURL(resultUrl.current);
    if (imageUrl.current) URL.revokeObjectURL(imageUrl.current);
  }, []);

  async function select(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0];
    if (!nextFile) return;
    if (!IMAGE_TYPES.includes(nextFile.type)) {
      setError("Use uma imagem PNG, JPG ou WebP.");
      return;
    }
    if (nextFile.size > MAX_IMAGE_SIZE) {
      setError("A imagem deve ter no máximo 20 MB.");
      return;
    }
    try {
      const nextImage = await loadImage(nextFile);
      if (imageUrl.current) URL.revokeObjectURL(imageUrl.current);
      imageUrl.current = nextImage.src;
      setImage(nextImage);
      setFile(nextFile);
      setHostedUrl("");
      setHostingError("");
      setError("");
      void updatePlaceholder(nextImage, width, quality);
    } catch {
      setError("Não foi possível abrir esta imagem.");
    } finally {
      event.target.value = "";
    }
  }

  async function copyDataUrl() {
    if (!result) return;
    await navigator.clipboard.writeText(result.data);
    setCopied(true);
  }

  return (
    <ImageToolPageShell title="Gerador de Placeholder (LQIP)" description="Gere placeholders LQIP, baixe em JPEG, copie o Data URL ou crie um link público para usar no seu site.">
      <Card className="mx-auto max-w-6xl">
        <CardHeader>
          <CardTitle>Placeholder em tempo real</CardTitle>
          <CardDescription>A largura e a qualidade repercutem imediatamente na prévia e no arquivo para download.</CardDescription>
        </CardHeader>
        <CardContent>
          <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={select} />
          {!file ? (
            <button type="button" onClick={() => openFilePicker(input.current)} className="flex min-h-80 w-full flex-col items-center justify-center gap-3 border-2 border-dashed border-primary/35 bg-muted/20 p-8 text-center transition-colors hover:border-primary hover:bg-primary/5">
              <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary"><Upload /></span>
              <span className="font-heading text-lg font-semibold">Selecionar imagem</span>
              <span className="text-sm text-muted-foreground">O LQIP será criado automaticamente após o upload.</span>
            </button>
          ) : (
            <div className="grid overflow-hidden border border-border lg:grid-cols-[280px_minmax(0,1fr)]">
              <aside className="border-b border-border bg-muted/20 p-4 lg:border-b-0 lg:border-r">
                <p className="truncate text-sm font-semibold" title={file.name}>{file.name}</p>
                <label className="mt-6 block text-sm font-medium">Largura: {width}px
                  <input type="range" min="8" max="128" value={width} onInput={(event) => { const next = Number(event.currentTarget.value); setWidth(next); if (image) void updatePlaceholder(image, next, quality); }} className="mt-2 w-full accent-primary" />
                </label>
                <label className="mt-5 block text-sm font-medium">Qualidade: {quality}%
                  <input type="range" min="10" max="90" value={quality} onInput={(event) => { const next = Number(event.currentTarget.value); setQuality(next); if (image) void updatePlaceholder(image, width, next); }} className="mt-2 w-full accent-primary" />
                </label>

                <div className="mt-5 border border-border bg-background p-3 text-xs leading-5 text-muted-foreground" aria-live="polite">
                  {generating ? "Atualizando placeholder…" : result ? `${result.width} × ${result.height}px · ${(result.blob.size / 1024).toFixed(1)} KB` : "Gerando placeholder…"}
                </div>

                <Button type="button" size="lg" className="mt-5 w-full" disabled={!result || generating} onClick={() => result && downloadBlob(result.blob, "placeholder-lqip.jpg")}><Download />Baixar placeholder</Button>
                <Button type="button" variant="outline" className="mt-2 w-full" disabled={!result} onClick={copyDataUrl}><Copy />{copied ? "Data URL copiado" : "Copiar Data URL"}</Button>
                <Button type="button" variant="outline" className="mt-2 w-full" disabled={!result || generating || hosting} onClick={host}>{hosting ? <LoaderCircle className="animate-spin" /> : <Link2 />}Gerar link para site</Button>
                <Button type="button" variant="ghost" className="mt-2 w-full" onClick={() => openFilePicker(input.current)}>Trocar imagem</Button>
              </aside>

              <section className="flex min-h-[420px] flex-col items-center justify-center overflow-hidden bg-muted/10 p-4 sm:p-8">
                {result ? (
                  <>
                    <div className="w-full max-w-4xl overflow-hidden border border-border bg-background shadow-2xl" style={{ aspectRatio: `${result.width} / ${result.height}` }}>
                      <img src={result.url} alt="Prévia ampliada do placeholder LQIP" className="block size-full object-contain" />
                    </div>
                    <div className="mt-5 w-full max-w-4xl border border-border bg-background p-3">
                      <p className="mb-3 text-xs font-medium text-muted-foreground">Tamanho real ({result.width} × {result.height}px)</p>
                      <div className="flex min-h-16 items-center justify-center overflow-auto bg-muted/20 p-3">
                        <img src={result.url} alt={`Placeholder no tamanho real de ${result.width} por ${result.height} pixels`} width={result.width} height={result.height} className="block max-w-full" />
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Gerando a prévia…</p>
                )}
                <p className="mt-4 text-center text-xs text-muted-foreground">Prévia fiel ao arquivo gerado, sem desfoque, corte ou ampliação artificial.</p>
              </section>
            </div>
          )}
          <p className="mt-4 text-xs leading-5 text-muted-foreground">Faça login e mantenha o seu arquivo hospedado no Kivai.</p>
          {hostingError && <p className="mt-3 text-sm text-destructive" role="alert">{hostingError} {hostingError.startsWith("Entre na sua conta") ? <Link className="underline" href="/conta/login?next=%2Fferramentas%2Fgerador-de-placeholder">Entrar na conta</Link> : <Link className="underline" href="/planos">Ver planos</Link>}</p>}
          {hostedUrl && <div className="mt-4 border border-border bg-muted/20 p-4"><p className="text-sm font-medium">Placeholder hospedado. Copie o link para usar no seu site.</p><p className="mt-2 break-all text-xs">{hostedUrl}</p><Button size="sm" variant="outline" className="mt-3" onClick={() => navigator.clipboard.writeText(hostedUrl)}><Copy />Copiar URL</Button></div>}
          {access?.userId && <div className="mt-5 space-y-3"><Button size="sm" variant="outline" disabled={refreshingFiles} onClick={refreshHosted}>Ver minhas hospedagens</Button>{hostedFiles.length > 0 && <ul className="space-y-2">{hostedFiles.map(item=><li key={item.id} className="flex flex-wrap items-center justify-between gap-2 border border-border p-3 text-xs"><a href={item.public_url} rel="noopener noreferrer" target="_blank" className="max-w-[75%] break-all underline">{item.public_url}</a><Button size="xs" variant="outline" onClick={() => removeHosted(item.id)}>Excluir</Button></li>)}</ul>}</div>}
          {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>
    </ImageToolPageShell>
  );
}

async function generatePlaceholder(image: HTMLImageElement, width: number, quality: number): Promise<PlaceholderResult> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = Math.max(1, Math.round((width * image.naturalHeight) / image.naturalWidth));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("canvas-unavailable");
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const blob = await canvasBlob(canvas, "image/jpeg", quality / 100);
  const data = await blobToDataUrl(blob);
  return { blob, data, url: URL.createObjectURL(blob), width: canvas.width, height: canvas.height };
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
