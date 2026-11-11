"use client";

import { openFilePicker } from "@/lib/browser/file-picker";

/* eslint-disable @next/next/no-img-element */

import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Download, ImageIcon, RotateCcw, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type OutputFormat = "image/png" | "image/jpeg" | "image/webp";
type OutputSize = "original" | "1280x720" | "1920x1080" | "1080x1080" | "1080x1350" | "1080x1920";

type CapturedFrame = {
  blob: Blob;
  url: string;
  time: number;
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
  const seekTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seekWatchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestedTimeRef = useRef(0);
  const seekSequenceRef = useRef(0);
  const previewCleanupRef = useRef<(() => void) | null>(null);
  const [source, setSource] = useState<{ file: File; url: string } | null>(null);
  const [frame, setFrame] = useState<CapturedFrame | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [format, setFormat] = useState<OutputFormat>("image/png");
  const [outputSize, setOutputSize] = useState<OutputSize>("original");
  const [quality, setQuality] = useState(92);
  const [isDragging, setIsDragging] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [batchCount, setBatchCount] = useState<5 | 10 | 20>(5);
  const [error, setError] = useState("");

  useEffect(() => () => {
    if (seekTimerRef.current) clearTimeout(seekTimerRef.current);
    if (seekWatchdogRef.current) clearTimeout(seekWatchdogRef.current);
    if (previewStopTimerRef.current) clearTimeout(previewStopTimerRef.current);
    previewCleanupRef.current?.();
  }, []);

  function cancelPendingSeek() {
    seekSequenceRef.current += 1;
    if (seekTimerRef.current) clearTimeout(seekTimerRef.current);
    if (seekWatchdogRef.current) clearTimeout(seekWatchdogRef.current);
    if (previewStopTimerRef.current) clearTimeout(previewStopTimerRef.current);
    seekTimerRef.current = null;
    seekWatchdogRef.current = null;
    previewStopTimerRef.current = null;
    previewCleanupRef.current?.();
    previewCleanupRef.current = null;
  }

  // Safari no iPhone pode manter o último quadro quando se altera currentTime com o vídeo pausado.
  // Reproduzir um único quadro, sem áudio, força a atualização visual quando o usuário confirma o seek.
  function refreshPreviewFrame() {
    const video = videoRef.current;
    if (!video || !video.paused || video.seeking || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;

    if (previewStopTimerRef.current) clearTimeout(previewStopTimerRef.current);
    previewCleanupRef.current?.();

    const sequence = seekSequenceRef.current;
    const wasMuted = video.muted;
    video.muted = true;
    let finished = false;
    let callbackId: number | undefined;

    const finish = () => {
      if (finished) return;
      finished = true;
      if (previewStopTimerRef.current) clearTimeout(previewStopTimerRef.current);
      if (callbackId !== undefined && video.cancelVideoFrameCallback) video.cancelVideoFrameCallback(callbackId);
      video.pause();
      video.muted = wasMuted;
      if (sequence === seekSequenceRef.current) {
        setIsSeeking(false);
        setCurrentTime(video.currentTime);
      }
      previewCleanupRef.current = null;
    };

    previewCleanupRef.current = finish;
    if (video.requestVideoFrameCallback) {
      callbackId = video.requestVideoFrameCallback(() => finish());
    } else {
      video.addEventListener("timeupdate", finish, { once: true });
    }
    previewStopTimerRef.current = setTimeout(finish, 1400);
    void video.play().catch(finish);
  }

  function applySelectedTime(refresh = false) {
    const video = videoRef.current;
    if (!video) return;
    if (seekTimerRef.current) clearTimeout(seekTimerRef.current);
    if (seekWatchdogRef.current) clearTimeout(seekWatchdogRef.current);
    seekTimerRef.current = null;
    const selected = requestedTimeRef.current;
    if (Math.abs(video.currentTime - selected) > 0.015) {
      video.currentTime = selected;
      setIsSeeking(true);
    } else {
      setIsSeeking(false);
      if (refresh) refreshPreviewFrame();
      return;
    }

    // Se o navegador não entregar seeked (ex.: MOV 4K no Safari), evita spinner permanente.
    const sequence = seekSequenceRef.current;
    seekWatchdogRef.current = setTimeout(() => {
      if (sequence !== seekSequenceRef.current) return;
      setIsSeeking(false);
      setError("A prévia não respondeu à mudança de tempo. Toque em Atualizar prévia ou experimente um vídeo MP4/H.264.");
    }, 3500);
  }

  function revokeFrame() {
    if (frame) URL.revokeObjectURL(frame.url);
  }

  function selectFile(file?: File) {
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      setError("Selecione um arquivo de vídeo válido.");
      return;
    }

    cancelPendingSeek();
    if (source) URL.revokeObjectURL(source.url);
    revokeFrame();

    setSource({ file, url: URL.createObjectURL(file) });
    setFrame(null);
    setDuration(0);
    setCurrentTime(0);
    requestedTimeRef.current = 0;
    setIsSeeking(false);
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

    setDuration(Number.isFinite(video.duration) ? video.duration : 0);
    setCurrentTime(video.currentTime);
    setDimensions({ width: video.videoWidth, height: video.videoHeight });
  }

  function seekTo(time: number, immediate = false) {
    const video = videoRef.current;
    if (!video) return;
    const nextTime = Math.min(Math.max(0, Number.isFinite(time) ? time : 0), duration || 0);

    cancelPendingSeek();
    video.pause();
    requestedTimeRef.current = nextTime;
    setCurrentTime(nextTime);
    setError("");
    setIsSeeking(true);

    // Não dispara dezenas de seeks simultâneos enquanto o dedo arrasta o controle.
    if (immediate) applySelectedTime();
    else seekTimerRef.current = setTimeout(() => applySelectedTime(), 130);
  }

  async function captureFrame() {
    const video = videoRef.current;
    if (!video || !dimensions) {
      setError("Aguarde o vídeo carregar antes de capturar o frame.");
      return;
    }

    if (isSeeking || video.seeking || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      setError("O frame ainda não está disponível. Tente novamente em alguns instantes.");
      return;
    }

    setIsCapturing(true);
    setError("");

    try {
      video.pause();
      const captureTime = video.currentTime;
      const canvas = document.createElement("canvas");
      const [selectedWidth, selectedHeight] = outputSize === "original" ? [dimensions.width, dimensions.height] : outputSize.split("x").map(Number);
      canvas.width = selectedWidth;
      canvas.height = selectedHeight;

      const context = canvas.getContext("2d");
      if (!context) throw new Error("Não foi possível preparar a captura.");

      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (value) => (value ? resolve(value) : reject(new Error("Não foi possível gerar a imagem."))),
          format,
          format === "image/png" ? undefined : quality / 100,
        );
      });

      revokeFrame();
      setFrame({ blob, url: URL.createObjectURL(blob), time: captureTime });
    } catch (captureError) {
      setError(captureError instanceof Error ? captureError.message : "Não foi possível capturar o frame.");
    } finally {
      setIsCapturing(false);
    }
  }


  async function captureMultipleFrames() {
    if (!source || !dimensions || !Number.isFinite(duration) || duration <= 0) {
      setError("Carregue um vídeo com duração válida antes de extrair os frames.");
      return;
    }

    setIsCapturing(true);
    setError("");
    const temporaryVideo = document.createElement("video");
    temporaryVideo.muted = true;
    temporaryVideo.preload = "auto";
    temporaryVideo.playsInline = true;
    temporaryVideo.src = source.url;

    try {
      await new Promise<void>((resolve, reject) => {
        temporaryVideo.onloadedmetadata = () => resolve();
        temporaryVideo.onerror = () => reject(new Error("Não foi possível ler o vídeo."));
        temporaryVideo.load();
      });

      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      const canvas = document.createElement("canvas");
      const [selectedWidth, selectedHeight] = outputSize === "original"
        ? [dimensions.width, dimensions.height]
        : outputSize.split("x").map(Number);
      canvas.width = selectedWidth;
      canvas.height = selectedHeight;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Não foi possível preparar a extração.");
      const extension = format === "image/png" ? "png" : format === "image/webp" ? "webp" : "jpg";
      const basename = source.file.name.replace(/\.[^.]+$/, "") || "video";

      for (let index = 0; index < batchCount; index += 1) {
        // Evita extremos, onde alguns codecs não entregam um frame decodificado.
        const timestamp = (temporaryVideo.duration * (index + 1)) / (batchCount + 1);
        await new Promise<void>((resolve, reject) => {
          temporaryVideo.onseeked = () => resolve();
          temporaryVideo.onerror = () => reject(new Error("Falha ao localizar um frame do vídeo."));
          temporaryVideo.currentTime = timestamp;
        });
        context.drawImage(temporaryVideo, 0, 0, canvas.width, canvas.height);
        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (value) => value ? resolve(value) : reject(new Error("Falha ao gerar a imagem.")),
            format,
            format === "image/png" ? undefined : quality / 100,
          );
        });
        zip.file(`${basename}-frame-${String(index + 1).padStart(2, "0")}.${extension}`, blob);
      }

      const output = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(output);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${basename}-${batchCount}-frames.zip`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (batchError) {
      setError(batchError instanceof Error ? batchError.message : "Não foi possível extrair os frames.");
    } finally {
      temporaryVideo.removeAttribute("src");
      temporaryVideo.load();
      setIsCapturing(false);
    }
  }

  function downloadFrame() {
    if (!frame || !source) return;

    const extension = format === "image/png" ? "png" : format === "image/webp" ? "webp" : "jpg";
    const baseName = source.file.name.replace(/\.[^.]+$/, "") || "frame";
    const link = document.createElement("a");
    link.href = frame.url;
    link.download = `${baseName}-frame-${Math.round(frame.time * 1000)}ms.${extension}`;
    link.click();
  }

  function clear() {
    cancelPendingSeek();
    if (source) URL.revokeObjectURL(source.url);
    revokeFrame();
    setSource(null);
    setFrame(null);
    setDuration(0);
    setCurrentTime(0);
    setIsSeeking(false);
    setDimensions(null);
    setError("");
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-6xl px-4 pb-12 pt-24 sm:px-6 lg:pb-16 lg:px-8">
        <div className="mb-8"><Link href="/ferramentas/videos" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">← Voltar para ferramentas de vídeos</Link></div>

        <div className="mb-10 max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-wider text-primary">Ferramenta de vídeo</p>
          <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">Capturar Frame de Vídeo Online</h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">Transforme momentos do seu vídeo em imagens PNG, JPG ou WebP. Escolha um instante para salvar uma imagem ou capture automaticamente 5, 10 ou 20 imagens distribuídas pelo vídeo e baixe todas em ZIP.</p>
        </div>

        <div className="mx-auto max-w-4xl"><Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Área de processamento</CardTitle>
            <CardDescription>Carregue um vídeo e escolha entre capturar uma imagem ou várias imagens automaticamente.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={handleFileChange} />

            {!source ? (
              <div
                onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }}
                onDragOver={(event) => event.preventDefault()}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center transition-colors ${isDragging ? "border-primary bg-primary/10" : "border-border bg-muted/20"}`}
              >
                <div className="flex size-14 items-center justify-center border border-border bg-background"><Upload className="size-5" aria-hidden="true" /></div>
                <p className="mt-6 text-xl font-semibold">Envie seu vídeo</p>
                <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">Arraste e solte o arquivo nesta área ou selecione um vídeo diretamente do seu dispositivo.</p>
                <Button className="mt-6" onClick={() => openFilePicker(inputRef.current)}>
                  Selecionar vídeo
                </Button>
              </div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-4">
                  <div className="relative overflow-hidden rounded-xl border border-border bg-black">
                    <video
                      ref={videoRef}
                      src={source.url}
                      controls
                      playsInline
                      className="aspect-video w-full"
                      onLoadedMetadata={handleLoadedMetadata}
                      onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
                      onSeeking={() => setIsSeeking(true)}
                      onSeeked={(event) => {
                        if (seekWatchdogRef.current) clearTimeout(seekWatchdogRef.current);
                        seekWatchdogRef.current = null;
                        setCurrentTime(event.currentTarget.currentTime);
                        setIsSeeking(false);
                      }}
                      onError={() => {
                        cancelPendingSeek();
                        setIsSeeking(false);
                        setError("Não foi possível abrir este vídeo no navegador.");
                      }}
                    />
                    <div className="pointer-events-none absolute right-3 top-3 rounded-md bg-black/75 px-2.5 py-1.5 text-xs font-medium text-white shadow-sm" aria-hidden="true">
                      {isSeeking ? "Buscando frame…" : "Momento do frame"}: {formatTime(currentTime)}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
                    <span className="truncate">{source.file.name}</span>
                    {dimensions && <span>{dimensions.width} × {dimensions.height}px</span>}
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-muted/20 p-4 sm:p-5">
                  <label className="block text-sm font-medium" htmlFor="frame-time">Momento do frame: {formatTime(currentTime)} / {formatTime(duration)}</label>
                  <p className="mt-1 text-xs text-muted-foreground">Escolha o instante pelo player acima ou ajuste aqui. Os dois controles ficam sincronizados; ao mover este controle, o vídeo pausa no momento selecionado.</p>
                  <input id="frame-time" type="range" min="0" max={duration || 0} step="0.01" value={currentTime} disabled={!dimensions || duration <= 0} onChange={(event) => seekTo(Number(event.target.value))} onPointerUp={() => applySelectedTime(true)} onTouchEnd={() => applySelectedTime(true)} className="mt-3 w-full" />
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground">Duração: {formatTime(duration)}</p>
                    <Button type="button" size="sm" variant="outline" onClick={refreshPreviewFrame} disabled={!dimensions || isCapturing}>
                      Atualizar prévia
                    </Button>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">{[-5,-1,1,5].map((step) => <Button key={step} size="sm" variant="outline" onClick={() => seekTo(currentTime + step, true)}>{step > 0 ? `+${step}s` : `${step}s`}</Button>)}</div>
                  <label className="mt-4 block text-sm font-medium">Tempo em segundos<input type="number" min="0" max={duration || 0} step="0.01" value={currentTime} onChange={(event) => seekTo(Number(event.target.value))} onBlur={() => applySelectedTime(true)} className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3" /></label>

                  <label className="mt-6 block text-sm font-medium" htmlFor="frame-format">Formato da imagem</label>
                  <select id="frame-format" value={format} onChange={(event) => setFormat(event.target.value as OutputFormat)} className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    <option value="image/png">PNG (sem perdas)</option>
                    <option value="image/jpeg">JPG (arquivo menor)</option>
                    <option value="image/webp">WebP (compacto)</option>
                  </select>

                  {format !== "image/png" && (
                    <label className="mt-5 block text-sm font-medium" htmlFor="frame-quality">Qualidade: {quality}%
                      <input id="frame-quality" type="range" min="50" max="100" value={quality} onChange={(event) => setQuality(Number(event.target.value))} className="mt-2 w-full" />
                    </label>
                  )}

                  <label className="mt-5 block text-sm font-medium" htmlFor="frame-size">Tamanho da imagem
                    <select id="frame-size" value={outputSize} onChange={(event) => setOutputSize(event.target.value as OutputSize)} className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                      <option value="original">Original</option><option value="1280x720">1280 × 720</option><option value="1920x1080">1920 × 1080</option><option value="1080x1080">1080 × 1080</option><option value="1080x1350">1080 × 1350</option><option value="1080x1920">1080 × 1920</option>
                    </select>
                  </label>

                  <div className="mt-6 rounded-lg border border-border bg-background p-3">
                    <label htmlFor="frame-batch-count" className="block text-sm font-medium">Capturar várias imagens automaticamente</label>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">O Kivai escolhe momentos espaçados ao longo do vídeo e salva uma imagem de cada momento. Exemplo: em um vídeo de 60 segundos, ao selecionar 5 imagens, as capturas serão feitas aproximadamente aos 10, 20, 30, 40 e 50 segundos. Todas vêm juntas em um arquivo ZIP.</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <select id="frame-batch-count" value={batchCount} onChange={(event) => setBatchCount(Number(event.target.value) as 5 | 10 | 20)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                        <option value={5}>5 imagens</option>
                        <option value={10}>10 imagens</option>
                        <option value={20}>20 imagens</option>
                      </select>
                      <Button variant="outline" onClick={captureMultipleFrames} disabled={isCapturing || !dimensions || duration <= 0}>
                        <Download aria-hidden="true" /> {isCapturing ? "Processando…"  : "Capturar imagens e baixar ZIP"}
                      </Button>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <Button onClick={captureFrame} disabled={isCapturing || isSeeking || !dimensions}>
                      <ImageIcon aria-hidden="true" /> {isCapturing ? "Processando…" : "Capturar imagem escolhida"}
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
                    <p className="mt-1 text-sm text-muted-foreground">{(frame.blob.size / 1024).toFixed(1)} KB · {outputSize === "original" ? `${dimensions?.width} × ${dimensions?.height}` : outputSize.replace("x", " × ")}px · {formatTime(frame.time)}</p>
                  </div>
                  <Button onClick={downloadFrame}><Download aria-hidden="true" /> Baixar imagem</Button>
                </div>
                <div className="mt-5 flex min-h-48 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/20 p-3">
                  <img src={frame.url} alt={`Frame capturado em ${formatTime(frame.time)}`} className="max-h-[480px] max-w-full object-contain" />
                </div>
              </section>
            )}
          </CardContent>
        </Card></div>
        <section className="mx-auto mt-8 grid max-w-4xl overflow-hidden rounded-xl border border-border sm:grid-cols-3"><article className="border-b border-border p-5 sm:border-b-0 sm:border-r"><p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Formatos</p><p className="mt-3 font-semibold">MP4 e WebM</p></article><article className="border-b border-border p-5 sm:border-b-0 sm:border-r"><p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Limite</p><p className="mt-3 font-semibold">Até 200 MB por vídeo</p></article><article className="p-5"><p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Saída</p><p className="mt-3 font-semibold">PNG, JPG e WebP</p></article></section>
      </div>
    </main>
  );
}
