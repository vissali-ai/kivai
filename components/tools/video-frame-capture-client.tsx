"use client";

/* eslint-disable @next/next/no-img-element */

import { ChangeEvent, DragEvent, useRef, useState } from "react";
import Link from "next/link";
import { Download, ImageIcon, RotateCcw, Upload, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type OutputFormat = "image/png" | "image/jpeg";

type CapturedFrame = {
  blob: Blob;
  url: string;
};

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return "0:00.00";

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  const centiseconds = Math.floor((seconds % 1) * 100);

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}.${String(centiseconds).padStart(2, "0")}`;
}

export function VideoFrameCaptureClient() {
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [source, setSource] = useState<{ file: File; url: string } | null>(null);
  const [frame, setFrame] = useState<CapturedFrame | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [format, setFormat] = useState<OutputFormat>("image/png");
  const [quality, setQuality] = useState(92);
  const [isDragging, setIsDragging] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState("");

  function revokeFrame() {
    if (frame) URL.revokeObjectURL(frame.url);
  }

  function selectFile(file?: File) {
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      setError("Selecione um arquivo de vídeo válido.");
      return;
    }

    if (source) URL.revokeObjectURL(source.url);
    revokeFrame();

    setSource({ file, url: URL.createObjectURL(file) });
    setFrame(null);
    setDuration(0);
    setCurrentTime(0);
    setDimensions(null);
    setError("");
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    selectFile(event.target.files?.[0]);
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    selectFile(event.dataTransfer.files?.[0]);
  }

  function handleLoadedMetadata() {
    const video = videoRef.current;
    if (!video) return;

    setDuration(video.duration);
    setDimensions({ width: video.videoWidth, height: video.videoHeight });
  }

  function seekTo(time: number) {
    const video = videoRef.current;
    if (!video) return;

    const nextTime = Math.min(Math.max(0, time), duration || 0);
    video.currentTime = nextTime;
    setCurrentTime(nextTime);
  }

  async function captureFrame() {
    const video = videoRef.current;
    if (!video || !dimensions) {
      setError("Aguarde o vídeo carregar antes de capturar o frame.");
      return;
    }

    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      setError("O frame ainda não está disponível. Tente novamente em alguns instantes.");
      return;
    }

    setIsCapturing(true);
    setError("");

    try {
      const canvas = document.createElement("canvas");
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;

      const context = canvas.getContext("2d");
      if (!context) throw new Error("Não foi possível preparar a captura.");

      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (value) => (value ? resolve(value) : reject(new Error("Não foi possível gerar a imagem."))),
          format,
          format === "image/jpeg" ? quality / 100 : undefined,
        );
      });

      revokeFrame();
      setFrame({ blob, url: URL.createObjectURL(blob) });
    } catch (captureError) {
      setError(captureError instanceof Error ? captureError.message : "Não foi possível capturar o frame.");
    } finally {
      setIsCapturing(false);
    }
  }

  function downloadFrame() {
    if (!frame || !source) return;

    const extension = format === "image/png" ? "png" : "jpg";
    const baseName = source.file.name.replace(/\.[^.]+$/, "") || "frame";
    const link = document.createElement("a");
    link.href = frame.url;
    link.download = `${baseName}-frame-${Math.round(currentTime * 1000)}ms.${extension}`;
    link.click();
  }

  function clear() {
    if (source) URL.revokeObjectURL(source.url);
    revokeFrame();
    setSource(null);
    setFrame(null);
    setDuration(0);
    setCurrentTime(0);
    setDimensions(null);
    setError("");
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-6xl px-4 pb-12 pt-24 sm:px-6 lg:pb-16 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-8 text-sm text-muted-foreground">
          <ol className="flex flex-wrap items-center gap-2">
            <li><Link href="/" className="transition-colors hover:text-foreground">Início</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link href="/ferramentas/videos" className="transition-colors hover:text-foreground">Vídeos</Link></li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-foreground">Capturar frame</li>
          </ol>
        </nav>

        <div className="mb-10 max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-wider text-primary">Ferramenta de vídeo</p>
          <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">Capturar frame de vídeo</h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">Escolha o momento exato de um vídeo e baixe-o como imagem PNG ou JPG. O processamento acontece no seu navegador.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Selecione o vídeo</CardTitle>
            <CardDescription>Envie ou arraste um vídeo. Seus arquivos não são enviados para um servidor.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={handleFileChange} />

            {!source ? (
              <div
                onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }}
                onDragOver={(event) => event.preventDefault()}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`flex min-h-72 flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center transition-colors ${isDragging ? "border-primary bg-primary/10" : "border-border bg-muted/20"}`}
              >
                <Video className="mb-4 size-10 text-primary" aria-hidden="true" />
                <p className="font-medium">Arraste seu vídeo aqui</p>
                <p className="mt-1 text-sm text-muted-foreground">ou selecione um arquivo do seu dispositivo</p>
                <Button className="mt-5" onClick={() => inputRef.current?.click()}>
                  <Upload aria-hidden="true" /> Selecionar vídeo
                </Button>
              </div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-4">
                  <div className="overflow-hidden rounded-xl border border-border bg-black">
                    <video
                      ref={videoRef}
                      src={source.url}
                      controls
                      playsInline
                      className="aspect-video w-full"
                      onLoadedMetadata={handleLoadedMetadata}
                      onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
                      onError={() => setError("Não foi possível abrir este vídeo no navegador.")}
                    />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
                    <span className="truncate">{source.file.name}</span>
                    {dimensions && <span>{dimensions.width} × {dimensions.height}px</span>}
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-muted/20 p-4 sm:p-5">
                  <label className="block text-sm font-medium" htmlFor="frame-time">Momento do frame: {formatTime(currentTime)}</label>
                  <input id="frame-time" type="range" min="0" max={duration || 0} step="0.01" value={currentTime} onChange={(event) => seekTo(Number(event.target.value))} className="mt-3 w-full" />
                  <p className="mt-1 text-xs text-muted-foreground">Duração: {formatTime(duration)}</p>

                  <label className="mt-6 block text-sm font-medium" htmlFor="frame-format">Formato da imagem</label>
                  <select id="frame-format" value={format} onChange={(event) => setFormat(event.target.value as OutputFormat)} className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    <option value="image/png">PNG (sem perdas)</option>
                    <option value="image/jpeg">JPG (arquivo menor)</option>
                  </select>

                  {format === "image/jpeg" && (
                    <label className="mt-5 block text-sm font-medium" htmlFor="frame-quality">Qualidade JPG: {quality}%
                      <input id="frame-quality" type="range" min="50" max="100" value={quality} onChange={(event) => setQuality(Number(event.target.value))} className="mt-2 w-full" />
                    </label>
                  )}

                  <div className="mt-6 flex flex-wrap gap-3">
                    <Button onClick={captureFrame} disabled={isCapturing || !dimensions}>
                      <ImageIcon aria-hidden="true" /> {isCapturing ? "Capturando…" : "Capturar frame"}
                    </Button>
                    <Button variant="outline" onClick={clear}>
                      <RotateCcw aria-hidden="true" /> Limpar
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {error && <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

            {frame && (
              <section aria-labelledby="frame-result-title" className="rounded-xl border border-border p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 id="frame-result-title" className="font-semibold">Frame capturado</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{(frame.blob.size / 1024).toFixed(1)} KB · {dimensions?.width} × {dimensions?.height}px</p>
                  </div>
                  <Button onClick={downloadFrame}><Download aria-hidden="true" /> Baixar imagem</Button>
                </div>
                <div className="mt-5 flex min-h-48 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/20 p-3">
                  <img src={frame.url} alt={`Frame capturado em ${formatTime(currentTime)}`} className="max-h-[480px] max-w-full object-contain" />
                </div>
              </section>
            )}
          </CardContent>
        </Card>

        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <article className="rounded-xl border border-border p-5"><h2 className="text-xl font-semibold">Como utilizar</h2><ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-6 text-muted-foreground"><li>Envie ou arraste um vídeo.</li><li>Use o controle de reprodução ou a barra de tempo para escolher o momento.</li><li>Selecione PNG ou JPG e capture o frame.</li><li>Baixe a imagem pronta.</li></ol></article>
          <article className="rounded-xl border border-border p-5"><h2 className="text-xl font-semibold">Benefícios</h2><ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground"><li>Processamento local para preservar sua privacidade.</li><li>Captura na resolução original exibida pelo vídeo.</li><li>Exportação em PNG sem perdas ou JPG compacto.</li><li>Funciona em desktop e dispositivos móveis compatíveis.</li></ul></article>
        </section>

        <section className="mt-6 rounded-xl border border-border p-5"><h2 className="text-xl font-semibold">Perguntas frequentes</h2><div className="mt-5 space-y-5 text-sm leading-6 text-muted-foreground"><div><h3 className="font-medium text-foreground">Meu vídeo é enviado para algum servidor?</h3><p className="mt-1">Não. A leitura e a captura são feitas localmente pelo navegador.</p></div><div><h3 className="font-medium text-foreground">Por que um vídeo pode não abrir?</h3><p className="mt-1">A compatibilidade depende dos codecs suportados pelo navegador e pelo dispositivo.</p></div><div><h3 className="font-medium text-foreground">Qual formato devo escolher?</h3><p className="mt-1">Use PNG para máxima fidelidade e JPG quando preferir um arquivo menor.</p></div></div></section>

        <section className="mt-6"><h2 className="text-xl font-semibold">Ferramentas relacionadas</h2><div className="mt-4 flex flex-wrap gap-3"><Button variant="outline" asChild><Link href="/ferramentas/imagens">Ferramentas de imagem</Link></Button><Button variant="outline" asChild><Link href="/ferramentas/conversor-de-imagens">Conversor de imagens</Link></Button><Button variant="outline" asChild><Link href="/ferramentas/redimensionar-imagem">Redimensionar imagem</Link></Button></div></section>
      </div>
    </main>
  );
}
