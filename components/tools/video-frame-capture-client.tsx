"use client";

import { openFilePicker } from "@/lib/browser/file-picker";

/* eslint-disable @next/next/no-img-element */

import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Download, ImageIcon, RotateCcw, Upload, Images } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type OutputFormat = "image/png" | "image/jpeg" | "image/webp";
type OutputSize = "original" | "1280x720" | "1920x1080" | "1080x1080" | "1080x1350" | "1080x1920";

type CapturedFrame = {
  blob: Blob;
  url: string;
  time: number;
  name: string;
  width: number;
  height: number;
};

type CaptureMode = "single" | "multiple";

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
  const sourceUrlRef = useRef<string | null>(null);
  const imageUrlsRef = useRef<string[]>([]);

  const [source, setSource] = useState<{ file: File; url: string } | null>(null);
  const [frames, setFrames] = useState<CapturedFrame[]>([]);
  const [selectedFrame, setSelectedFrame] = useState<number | null>(null);
  const [mode, setMode] = useState<CaptureMode>("single");
  const [duration, setDuration] = useState(0);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [format, setFormat] = useState<OutputFormat>("image/png");
  const [outputSize, setOutputSize] = useState<OutputSize>("original");
  const [quality, setQuality] = useState(92);
  const [isDragging, setIsDragging] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [batchCount, setBatchCount] = useState<5 | 10 | 20>(5);
  const [batchProgress, setBatchProgress] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => () => {
    if (sourceUrlRef.current) URL.revokeObjectURL(sourceUrlRef.current);
    imageUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  function clearResults() {
    imageUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    imageUrlsRef.current = [];
    setFrames([]);
    setSelectedFrame(null);
    setBatchProgress(0);
  }

  function selectFile(file?: File) {
    if (!file || isCapturing) return;
    if (!file.type.startsWith("video/")) {
      setError("Selecione um arquivo de vídeo válido.");
      return;
    }
    if (sourceUrlRef.current) URL.revokeObjectURL(sourceUrlRef.current);
    clearResults();
    const url = URL.createObjectURL(file);
    sourceUrlRef.current = url;
    setSource({ file, url });
    setDuration(0);
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
    setDimensions({ width: video.videoWidth, height: video.videoHeight });
  }

  function getOutputDimensions() {
    if (!dimensions) throw new Error("Aguarde o carregamento do vídeo.");
    return outputSize === "original"
      ? [dimensions.width, dimensions.height]
      : outputSize.split("x").map(Number);
  }

  function imageExtension() {
    return format === "image/png" ? "png" : format === "image/webp" ? "webp" : "jpg";
  }

  function baseName() {
    return source?.file.name.replace(/\.[^.]+$/, "") || "video";
  }

  async function renderFrame(video: HTMLVideoElement, time: number, index: number): Promise<CapturedFrame> {
    const canvas = document.createElement("canvas");
    const [width, height] = getOutputDimensions();
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Não foi possível preparar a imagem.");
    context.drawImage(video, 0, 0, width, height);
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => result ? resolve(result) : reject(new Error("Não foi possível gerar a imagem.")),
        format,
        format === "image/png" ? undefined : quality / 100,
      );
    });
    const url = URL.createObjectURL(blob);
    imageUrlsRef.current.push(url);
    return {
      blob, url, time, width, height,
      name: baseName() + "-frame-" + String(index).padStart(2, "0") + "-" + Math.round(time * 1000) + "ms." + imageExtension(),
    };
  }

  async function captureSingle() {
    const video = videoRef.current;
    if (!video || !dimensions) {
      setError("Carregue um vídeo antes de capturar a imagem.");
      return;
    }
    if (video.seeking || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      setError("Aguarde a imagem aparecer no player antes de capturar.");
      return;
    }

    setIsCapturing(true);
    setError("");
    try {
      video.pause();
      const time = video.currentTime;
      const result = await renderFrame(video, time, 1);
      clearResultsExcept(result.url);
      setFrames([result]);
      setSelectedFrame(0);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível capturar a imagem.");
    } finally {
      setIsCapturing(false);
    }
  }

  function clearResultsExcept(url: string) {
    imageUrlsRef.current.filter((item) => item !== url).forEach((item) => URL.revokeObjectURL(item));
    imageUrlsRef.current = [url];
    setBatchProgress(0);
  }

  async function captureMultiple() {
    if (!source || !dimensions || duration <= 0 || isCapturing) {
      setError("Carregue um vídeo válido antes de capturar várias imagens.");
      return;
    }

    setIsCapturing(true);
    setError("");
    clearResults();
    const temporaryVideo = document.createElement("video");
    temporaryVideo.muted = true;
    temporaryVideo.playsInline = true;
    temporaryVideo.preload = "auto";
    temporaryVideo.src = source.url;

    try {
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("O navegador demorou para carregar o vídeo.")), 12000);
        temporaryVideo.onloadedmetadata = () => { clearTimeout(timeout); resolve(); };
        temporaryVideo.onerror = () => { clearTimeout(timeout); reject(new Error("Este vídeo não pôde ser aberto para a captura múltipla.")); };
        temporaryVideo.load();
      });

      for (let index = 0; index < batchCount; index += 1) {
        const time = temporaryVideo.duration * (index + 1) / (batchCount + 1);
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            temporaryVideo.onseeked = null;
            reject(new Error("O navegador não conseguiu acessar um dos momentos do vídeo. Confira as imagens disponíveis abaixo."));
          }, 9000);
          temporaryVideo.onseeked = () => { clearTimeout(timeout); resolve(); };
          temporaryVideo.onerror = () => { clearTimeout(timeout); reject(new Error("Falha ao buscar uma imagem do vídeo.")); };
          temporaryVideo.currentTime = time;
        });

        if (temporaryVideo.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
          throw new Error("Um dos quadros ainda não está disponível. Tente outro vídeo ou formato.");
        }
        const result = await renderFrame(temporaryVideo, temporaryVideo.currentTime, index + 1);
        setFrames((previous) => [...previous, result]);
        setBatchProgress(index + 1);
        if (index === 0) setSelectedFrame(0);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível capturar todos os frames.");
    } finally {
      temporaryVideo.removeAttribute("src");
      temporaryVideo.load();
      setIsCapturing(false);
    }
  }

  function downloadFrame(item: CapturedFrame) {
    const link = document.createElement("a");
    link.href = item.url;
    link.download = item.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  async function downloadAllZip() {
    if (!frames.length || isCapturing) return;
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      frames.forEach((item) => zip.file(item.name, item.blob));
      const output = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(output);
      const link = document.createElement("a");
      link.href = url;
      link.download = baseName() + "-" + frames.length + "-imagens.zip";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch {
      setError("Não foi possível criar o arquivo ZIP. Você ainda pode baixar cada imagem pela galeria.");
    }
  }

  function clear() {
    if (isCapturing) return;
    if (sourceUrlRef.current) URL.revokeObjectURL(sourceUrlRef.current);
    sourceUrlRef.current = null;
    clearResults();
    setSource(null);
    setDuration(0);
    setDimensions(null);
    setError("");
  }

  const highlighted = selectedFrame !== null ? frames[selectedFrame] : null;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-6xl px-4 pb-12 pt-24 sm:px-6 lg:pb-16 lg:px-8">
        <div className="mb-8">
          <Link href="/ferramentas/videos" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            ← Voltar para ferramentas de vídeos
          </Link>
        </div>

        <div className="mb-10 max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-wider text-primary">Ferramenta de vídeo</p>
          <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">Capturar Frame de Vídeo Online</h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
            Transforme cenas do vídeo em imagens PNG, JPG ou WebP. Capture uma imagem diretamente do player ou gere 5, 10 ou 20 imagens e escolha quais deseja baixar na galeria.
          </p>
        </div>

        <div className="mx-auto max-w-4xl">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Área de processamento</CardTitle>
              <CardDescription>Envie o vídeo e escolha no player abaixo o momento da captura do frame.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={handleFileChange} />

              {!source ? (
                <div
                  onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }}
                  onDragOver={(event) => event.preventDefault()}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={"flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center transition-colors " + (isDragging ? "border-primary bg-primary/10" : "border-border bg-muted/20")}
                >
                  <div className="flex size-14 items-center justify-center rounded-lg border border-border bg-background"><Upload className="size-5" aria-hidden="true" /></div>
                  <p className="mt-6 text-xl font-semibold">Envie seu vídeo</p>
                  <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">Selecione um vídeo do seu dispositivo ou arraste o arquivo para esta área.</p>
                  <Button className="mt-6" onClick={() => openFilePicker(inputRef.current)}>Selecionar vídeo</Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="overflow-hidden rounded-xl border border-border bg-black">
                      <video
                        ref={videoRef}
                        src={source.url}
                        controls
                        playsInline
                        preload="auto"
                        className="aspect-video w-full"
                        onLoadedMetadata={handleLoadedMetadata}
                        onError={() => setError("Não foi possível abrir este vídeo no navegador. Tente um arquivo MP4/H.264.")}
                      />
                    </div>
                    <div className="flex flex-wrap justify-between gap-2 text-sm text-muted-foreground">
                      <span className="max-w-full truncate">{source.file.name}</span>
                      {dimensions && <span>{dimensions.width} × {dimensions.height}px · {formatTime(duration)}</span>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2" role="group" aria-label="Modo de captura">
                    <Button
                      type="button"
                      variant={mode === "single" ? "default" : "outline"}
                      aria-pressed={mode === "single"}
                      disabled={isCapturing}
                      onClick={() => { setMode("single"); clearResults(); setError(""); }}
                    >
                      <ImageIcon aria-hidden="true" /> Uma imagem
                    </Button>
                    <Button
                      type="button"
                      variant={mode === "multiple" ? "default" : "outline"}
                      aria-pressed={mode === "multiple"}
                      disabled={isCapturing}
                      onClick={() => { setMode("multiple"); clearResults(); setError(""); }}
                    >
                      <Images aria-hidden="true" /> Várias imagens
                    </Button>
                  </div>

                  <div className="rounded-xl border border-border bg-muted/20 p-4 sm:p-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block text-sm font-medium" htmlFor="frame-format">Formato da imagem
                        <select id="frame-format" value={format} disabled={isCapturing} onChange={(event) => { setFormat(event.target.value as OutputFormat); clearResults(); }} className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                          <option value="image/png">PNG (sem perdas)</option>
                          <option value="image/jpeg">JPG (arquivo menor)</option>
                          <option value="image/webp">WebP (compacto)</option>
                        </select>
                      </label>
                      <label className="block text-sm font-medium" htmlFor="frame-size">Tamanho da imagem
                        <select id="frame-size" value={outputSize} disabled={isCapturing} onChange={(event) => { setOutputSize(event.target.value as OutputSize); clearResults(); }} className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                          <option value="original">Original</option>
                          <option value="1280x720">1280 × 720</option>
                          <option value="1920x1080">1920 × 1080</option>
                          <option value="1080x1080">1080 × 1080</option>
                          <option value="1080x1350">1080 × 1350</option>
                          <option value="1080x1920">1080 × 1920</option>
                        </select>
                      </label>
                    </div>

                    {format !== "image/png" && (
                      <label className="mt-5 block text-sm font-medium" htmlFor="frame-quality">Qualidade: {quality}%
                        <input id="frame-quality" type="range" min="50" max="100" value={quality} disabled={isCapturing} onChange={(event) => { setQuality(Number(event.target.value)); clearResults(); }} className="mt-2 w-full" />
                      </label>
                    )}

                    {mode === "single" ? (
                      <div className="mt-5 space-y-3">
                        <p className="text-sm leading-6 text-muted-foreground">Reproduza o vídeo ou arraste a barra do próprio player. Pause no momento que deseja guardar e clique em capturar.</p>
                        <Button onClick={captureSingle} disabled={isCapturing || !dimensions}>
                          <ImageIcon aria-hidden="true" /> {isCapturing ? "Capturando…" : "Capturar imagem"}
                        </Button>
                      </div>
                    ) : (
                      <div className="mt-5 space-y-3">
                        <p className="text-sm leading-6 text-muted-foreground">O Kivai captura automaticamente momentos espaçados do vídeo. Veja todas as imagens na galeria e baixe somente as que gostar. Não é necessário ZIP.</p>
                        <label htmlFor="frame-batch-count" className="block text-sm font-medium">Quantidade de imagens</label>
                        <select id="frame-batch-count" value={batchCount} disabled={isCapturing} onChange={(event) => { setBatchCount(Number(event.target.value) as 5 | 10 | 20); clearResults(); }} className="h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 text-sm">
                          <option value={5}>5 imagens</option>
                          <option value={10}>10 imagens</option>
                          <option value={20}>20 imagens</option>
                        </select>
                        <div>
                          <Button onClick={captureMultiple} disabled={isCapturing || !dimensions || duration <= 0}>
                            <Images aria-hidden="true" /> {isCapturing ? "Capturando " + batchProgress + " de " + batchCount + "…" : "Capturar várias imagens"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-start">
                    <Button variant="outline" onClick={clear} disabled={isCapturing}><RotateCcw aria-hidden="true" /> Limpar vídeo</Button>
                  </div>
                </div>
              )}

              {error && <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

              {frames.length > 0 && (
                <section aria-labelledby="frame-results-heading" className="space-y-5 border-t border-border pt-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 id="frame-results-heading" className="text-lg font-semibold">{mode === "single" ? "Imagem capturada" : "Galeria de frames"}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {frames.length} {frames.length === 1 ? "imagem disponível" : "imagens disponíveis"}. Selecione uma miniatura para ampliar e baixar.
                      </p>
                    </div>
                    {frames.length > 1 && (
                      <Button variant="outline" size="sm" onClick={downloadAllZip} disabled={isCapturing}>
                        <Download aria-hidden="true" /> Baixar todas em ZIP
                      </Button>
                    )}
                  </div>

                  {highlighted && (
                    <div className="space-y-3 rounded-xl border border-border bg-muted/10 p-3 sm:p-4">
                      <div className="flex min-h-40 items-center justify-center overflow-hidden rounded-lg bg-black/5 p-2">
                        <img src={highlighted.url} alt={"Prévia ampliada do frame capturado em " + formatTime(highlighted.time)} className="max-h-[420px] max-w-full object-contain" />
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm text-muted-foreground">{formatTime(highlighted.time)} · {highlighted.width} × {highlighted.height}px · {(highlighted.blob.size / 1024).toFixed(1)} KB</p>
                        <Button onClick={() => downloadFrame(highlighted)}><Download aria-hidden="true" /> Baixar esta imagem</Button>
                      </div>
                    </div>
                  )}

                  {frames.length > 1 && (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                      {frames.map((item, index) => (
                        <div key={item.url} className="overflow-hidden rounded-lg border border-border bg-background">
                          <button
                            type="button"
                            onClick={() => setSelectedFrame(index)}
                            aria-pressed={selectedFrame === index}
                            className={"block w-full cursor-pointer border-b border-border p-2 text-left " + (selectedFrame === index ? "bg-primary/10" : "hover:bg-muted/30")}
                          >
                            <img src={item.url} alt={"Frame " + (index + 1) + " do vídeo"} loading="lazy" decoding="async" className="aspect-video w-full object-contain" />
                            <span className="mt-2 block text-xs text-muted-foreground">Imagem {index + 1} · {formatTime(item.time)}</span>
                          </button>
                          <div className="p-2">
                            <Button size="sm" variant="outline" className="w-full" onClick={() => downloadFrame(item)}>
                              <Download aria-hidden="true" /> Baixar
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">As imagens ficam disponíveis apenas nesta sessão. Salve as escolhidas antes de limpar ou sair da página.</p>
                </section>
              )}
            </CardContent>
          </Card>
        </div>

        <section className="mx-auto mt-8 grid max-w-4xl overflow-hidden rounded-xl border border-border sm:grid-cols-3">
          <article className="border-b border-border p-5 sm:border-b-0 sm:border-r">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Formatos de entrada</p>
            <p className="mt-3 font-semibold">Vídeos compatíveis com o navegador</p>
          </article>
          <article className="border-b border-border p-5 sm:border-b-0 sm:border-r">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Capturas</p>
            <p className="mt-3 font-semibold">Uma imagem ou 5, 10 e 20</p>
          </article>
          <article className="p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Saída</p>
            <p className="mt-3 font-semibold">PNG, JPG e WebP</p>
          </article>
        </section>
      </div>
    </main>
  );
}
