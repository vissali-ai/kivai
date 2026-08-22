"use client";

import { openFilePicker } from "@/lib/browser/file-picker";

import { ChangeEvent, DragEvent, useRef, useState } from "react";
import Link from "next/link";
import { Download, RotateCcw, Scissors, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Crop = { x: number; y: number; width: number; height: number };

type ExportedVideo = { blob: Blob; url: string };

type CaptureVideo = HTMLVideoElement & {
  captureStream?: () => MediaStream;
  mozCaptureStream?: () => MediaStream;
};

const DEFAULT_CROP: Crop = { x: 0, y: 0, width: 100, height: 100 };

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function supportedMimeType() {
  const candidates = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];
  return candidates.find((candidate) => MediaRecorder.isTypeSupported(candidate)) ?? "";
}

export function VideoCropClient() {
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [source, setSource] = useState<{ file: File; url: string } | null>(null);
  const [crop, setCrop] = useState<Crop>(DEFAULT_CROP);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [result, setResult] = useState<ExportedVideo | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  function revokeResult() {
    if (result) URL.revokeObjectURL(result.url);
  }

  function normalizedCrop(next: Crop) {
    const width = clamp(next.width, 1, 100);
    const height = clamp(next.height, 1, 100);
    return {
      width,
      height,
      x: clamp(next.x, 0, 100 - width),
      y: clamp(next.y, 0, 100 - height),
    };
  }

  function updateCrop(key: keyof Crop, value: number) {
    setCrop((current) => normalizedCrop({ ...current, [key]: value }));
  }

  function drawFrame() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !dimensions || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;

    const sourceX = Math.round((crop.x / 100) * dimensions.width);
    const sourceY = Math.round((crop.y / 100) * dimensions.height);
    const sourceWidth = Math.max(1, Math.round((crop.width / 100) * dimensions.width));
    const sourceHeight = Math.max(1, Math.round((crop.height / 100) * dimensions.height));
    canvas.width = sourceWidth;
    canvas.height = sourceHeight;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.drawImage(video, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, sourceWidth, sourceHeight);
  }

  function selectFile(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      setError("Selecione um arquivo de vídeo válido.");
      return;
    }

    if (source) URL.revokeObjectURL(source.url);
    revokeResult();
    setSource({ file, url: URL.createObjectURL(file) });
    setResult(null);
    setCrop(DEFAULT_CROP);
    setDimensions(null);
    setProgress(0);
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
    setDimensions({ width: video.videoWidth, height: video.videoHeight });
  }

  async function exportVideo() {
    const video = videoRef.current as CaptureVideo | null;
    const canvas = canvasRef.current;
    if (!video || !canvas || !dimensions) {
      setError("Aguarde o vídeo carregar antes de exportar.");
      return;
    }
    if (!window.MediaRecorder || !canvas.captureStream) {
      setError("Seu navegador não oferece suporte à exportação local de vídeo. Use uma versão atual do Chrome, Edge ou Firefox.");
      return;
    }

    const mimeType = supportedMimeType();
    if (!mimeType) {
      setError("Seu navegador não possui um codificador WebM compatível.");
      return;
    }

    setError("");
    setProgress(0);
    setIsExporting(true);
    revokeResult();
    setResult(null);

    try {
      drawFrame();
      const stream = canvas.captureStream(30);
      const mediaStream = video.captureStream?.() ?? video.mozCaptureStream?.();
      mediaStream?.getAudioTracks().forEach((track) => stream.addTrack(track));
      const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8_000_000 });
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data);
      };

      const completed = new Promise<Blob>((resolve, reject) => {
        recorder.onerror = () => reject(new Error("Não foi possível codificar o vídeo."));
        recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
      });

      let animationFrame = 0;
      const render = () => {
        drawFrame();
        setProgress(video.duration ? Math.min(100, (video.currentTime / video.duration) * 100) : 0);
        if (!video.paused && !video.ended) animationFrame = requestAnimationFrame(render);
      };

      const ended = () => {
        cancelAnimationFrame(animationFrame);
        recorder.stop();
      };

      video.currentTime = 0;
      video.muted = true;
      video.addEventListener("ended", ended, { once: true });
      recorder.start(250);
      await video.play();
      animationFrame = requestAnimationFrame(render);

      const blob = await completed;
      setResult({ blob, url: URL.createObjectURL(blob) });
      setProgress(100);
      video.currentTime = 0;
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : "Não foi possível exportar o vídeo.");
    } finally {
      setIsExporting(false);
    }
  }

  function downloadResult() {
    if (!result || !source) return;
    const link = document.createElement("a");
    link.href = result.url;
    link.download = `${source.file.name.replace(/\.[^.]+$/, "") || "video"}-recortado.webm`;
    link.click();
  }

  function clear() {
    if (source) URL.revokeObjectURL(source.url);
    revokeResult();
    setSource(null);
    setResult(null);
    setCrop(DEFAULT_CROP);
    setDimensions(null);
    setProgress(0);
    setError("");
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-6xl px-4 pb-12 pt-24 sm:px-6 lg:pb-16 lg:px-8">
        <div className="mb-8"><Link href="/ferramentas/videos" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">← Voltar para ferramentas de vídeos</Link></div>
        <div className="mb-10 max-w-3xl"><p className="text-sm font-medium uppercase tracking-wider text-primary">Ferramenta de vídeo</p><h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">Recortar vídeo</h1><p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">Defina a área que deseja manter e exporte o vídeo recortado em WebM, sem enviar o arquivo a um servidor.</p></div>

        <div className="mx-auto max-w-4xl"><Card className="overflow-hidden"><CardHeader><CardTitle>Área de processamento</CardTitle><CardDescription>MP4 e WebM compatíveis com o navegador, até 200 MB por vídeo.</CardDescription></CardHeader><CardContent className="space-y-6"><input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={handleFileChange} />
          {!source ? <div onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={() => setIsDragging(false)} onDrop={handleDrop} className={`flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center ${isDragging ? "border-primary bg-primary/10" : "border-border bg-muted/20"}`}><div className="flex size-14 items-center justify-center border border-border bg-background"><Upload className="size-5" /></div><p className="mt-6 text-xl font-semibold">Envie seu vídeo</p><p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">Arraste e solte o arquivo nesta área ou selecione um vídeo diretamente do seu dispositivo.</p><Button className="mt-6" onClick={() => openFilePicker(inputRef.current)}>Selecionar vídeo</Button></div> : <div className="grid gap-6 lg:grid-cols-2"><div className="space-y-4"><div className="overflow-hidden rounded-xl border border-border bg-black"><video ref={videoRef} src={source.url} controls playsInline className="aspect-video w-full" onLoadedMetadata={handleLoadedMetadata} onTimeUpdate={drawFrame} onSeeked={drawFrame} onError={() => setError("Não foi possível abrir este vídeo no navegador.")} /></div><p className="text-sm text-muted-foreground">{source.file.name}{dimensions && ` · ${dimensions.width} × ${dimensions.height}px`}</p></div><div className="space-y-5 rounded-xl border border-border bg-muted/20 p-4 sm:p-5"><div><h2 className="font-semibold">Ajuste em porcentagem</h2><p className="mt-1 text-xs text-muted-foreground">Use 0 a 100 para definir a posição e o tamanho da área visível.</p></div><div className="grid grid-cols-2 gap-3">{([['x','X'],['y','Y'],['width','Largura'],['height','Altura']] as const).map(([key,label]) => <label key={key} className="text-sm font-medium">{label}<input type="number" min="0" max="100" value={crop[key]} onChange={(event) => updateCrop(key, Number(event.target.value))} className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3" />%</label>)}</div><div><p className="mb-2 text-sm font-medium">Prévia do recorte</p><div className="flex min-h-40 items-center justify-center overflow-hidden rounded-lg border border-border bg-black p-2"><canvas ref={canvasRef} className="max-h-64 max-w-full object-contain" /></div></div><div className="flex flex-wrap gap-3"><Button onClick={exportVideo} disabled={isExporting || !dimensions}><Scissors />{isExporting ? `Exportando ${Math.round(progress)}%` : "Exportar vídeo"}</Button><Button variant="outline" onClick={clear}><RotateCcw />Limpar</Button></div>{isExporting && <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} /></div>}</div></div>}
          {error && <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
          {result && <section className="rounded-xl border border-border p-4 sm:p-5"><div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="font-semibold">Vídeo recortado</h2><p className="mt-1 text-sm text-muted-foreground">{(result.blob.size / 1024 / 1024).toFixed(2)} MB · WebM</p></div><Button onClick={downloadResult}><Download />Baixar WebM</Button></div><video src={result.url} controls playsInline className="mt-5 aspect-video w-full rounded-lg bg-black" /></section>}
        </CardContent></Card></div>
        <section className="mx-auto mt-8 grid max-w-4xl overflow-hidden rounded-xl border border-border sm:grid-cols-3"><article className="border-b border-border p-5 sm:border-b-0 sm:border-r"><p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Formatos</p><p className="mt-3 font-semibold">MP4 e WebM</p></article><article className="border-b border-border p-5 sm:border-b-0 sm:border-r"><p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Limite</p><p className="mt-3 font-semibold">Até 200 MB por vídeo</p></article><article className="p-5"><p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Saída</p><p className="mt-3 font-semibold">Vídeo WebM</p></article></section>
      </div>
    </main>
  );
}
