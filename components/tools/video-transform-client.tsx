"use client";

import { openFilePicker } from "@/lib/browser/file-picker";

import { ChangeEvent, DragEvent, useRef, useState } from "react";
import Link from "next/link";
import { Download, FlipHorizontal, RotateCcw, RotateCw, Upload, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type TransformMode = "rotate" | "mirror" | "mute";
type CaptureVideo = HTMLVideoElement & { captureStream?: () => MediaStream; mozCaptureStream?: () => MediaStream };
type Result = { blob: Blob; url: string };

function supportedMimeType() {
  return ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"].find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

export function VideoTransformClient({ mode }: { mode: TransformMode }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [source, setSource] = useState<{ file: File; url: string } | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [rotation, setRotation] = useState(0);
  const [flipHorizontal, setFlipHorizontal] = useState(true);
  const [flipVertical, setFlipVertical] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const title = mode === "rotate" ? "Girar vídeo" : mode === "mirror" ? "Espelhar vídeo" : "Remover áudio";

  function revokeResult() { if (result) URL.revokeObjectURL(result.url); }

  function drawFrame() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !dimensions || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
    const turn = mode === "rotate" ? rotation : 0;
    const sideways = turn === 90 || turn === 270;
    canvas.width = sideways ? dimensions.height : dimensions.width;
    canvas.height = sideways ? dimensions.width : dimensions.height;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.save();
    context.translate(canvas.width / 2, canvas.height / 2);
    context.rotate((turn * Math.PI) / 180);
    context.scale(mode === "mirror" && flipHorizontal ? -1 : 1, mode === "mirror" && flipVertical ? -1 : 1);
    context.drawImage(video, -dimensions.width / 2, -dimensions.height / 2, dimensions.width, dimensions.height);
    context.restore();
  }

  function selectFile(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("video/")) { setError("Selecione um arquivo de vídeo válido."); return; }
    if (source) URL.revokeObjectURL(source.url);
    revokeResult();
    setSource({ file, url: URL.createObjectURL(file) });
    setResult(null); setDimensions(null); setProgress(0); setError("");
  }

  function clear() {
    if (source) URL.revokeObjectURL(source.url);
    revokeResult();
    setSource(null); setResult(null); setDimensions(null); setProgress(0); setError("");
  }

  async function exportVideo() {
    const video = videoRef.current as CaptureVideo | null;
    const canvas = canvasRef.current;
    if (!video || !canvas || !dimensions) { setError("Aguarde o vídeo carregar antes de exportar."); return; }
    if (!window.MediaRecorder || !canvas.captureStream) { setError("Seu navegador não oferece suporte à exportação local de vídeo. Use Chrome, Edge ou Firefox atualizados."); return; }
    const mimeType = supportedMimeType();
    if (!mimeType) { setError("Seu navegador não possui um codificador WebM compatível."); return; }
    setError(""); setProgress(0); setIsExporting(true); revokeResult(); setResult(null);
    try {
      drawFrame();
      const stream = canvas.captureStream(30);
      if (mode !== "mute") {
        const inputStream = video.captureStream?.() ?? video.mozCaptureStream?.();
        inputStream?.getAudioTracks().forEach((track) => stream.addTrack(track));
      }
      const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8_000_000 });
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
      const completed = new Promise<Blob>((resolve, reject) => { recorder.onerror = () => reject(new Error("Não foi possível codificar o vídeo.")); recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType })); });
      let animationFrame = 0;
      const render = () => { drawFrame(); setProgress(video.duration ? Math.min(100, video.currentTime / video.duration * 100) : 0); if (!video.paused && !video.ended) animationFrame = requestAnimationFrame(render); };
      video.currentTime = 0; video.muted = true;
      video.addEventListener("ended", () => { cancelAnimationFrame(animationFrame); recorder.stop(); }, { once: true });
      recorder.start(250); await video.play(); animationFrame = requestAnimationFrame(render);
      const blob = await completed;
      setResult({ blob, url: URL.createObjectURL(blob) }); setProgress(100); video.currentTime = 0;
    } catch (exportError) { setError(exportError instanceof Error ? exportError.message : "Não foi possível exportar o vídeo."); }
    finally { setIsExporting(false); }
  }

  function download() {
    if (!result || !source) return;
    const link = document.createElement("a"); link.href = result.url;
    const suffix = mode === "rotate" ? "girado" : mode === "mirror" ? "espelhado" : "sem-audio";
    link.download = `${source.file.name.replace(/\.[^.]+$/, "") || "video"}-${suffix}.webm`; link.click();
  }

  return <main className="min-h-screen bg-background text-foreground"><div className="mx-auto w-full max-w-6xl px-4 pb-12 pt-24 sm:px-6 lg:pb-16 lg:px-8">
    <div className="mb-8"><Link href="/ferramentas/videos" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">← Voltar para ferramentas de vídeos</Link></div>
    <div className="mb-10 max-w-3xl"><p className="text-sm font-medium uppercase tracking-wider text-primary">Ferramenta de vídeo</p><h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">{title}</h1><p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">{mode === "rotate" ? "Corrija a orientação do seu vídeo e exporte o resultado em WebM, diretamente no navegador." : mode === "mirror" ? "Inverta seu vídeo na horizontal ou vertical e baixe o resultado em WebM, sem enviar arquivos." : "Remova a faixa de áudio do seu vídeo e baixe uma versão silenciosa em WebM, sem enviar arquivos."}</p></div>
    <div className="mx-auto max-w-4xl"><Card className="overflow-hidden"><CardHeader><CardTitle>Área de processamento</CardTitle><CardDescription>MP4 e WebM compatíveis com o navegador, até 200 MB por vídeo.</CardDescription></CardHeader><CardContent className="space-y-6"><input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={(event: ChangeEvent<HTMLInputElement>) => { selectFile(event.target.files?.[0]); event.target.value = ""; }} />
      {!source ? <div onDragEnter={(event: DragEvent<HTMLDivElement>) => { event.preventDefault(); setIsDragging(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={() => setIsDragging(false)} onDrop={(event) => { event.preventDefault(); setIsDragging(false); selectFile(event.dataTransfer.files?.[0]); }} className={`flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center ${isDragging ? "border-primary bg-primary/10" : "border-border bg-muted/20"}`}><div className="flex size-14 items-center justify-center border border-border bg-background"><Upload className="size-5" /></div><p className="mt-6 text-xl font-semibold">Envie seu vídeo</p><p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">Arraste e solte o arquivo nesta área ou selecione um vídeo diretamente do seu dispositivo.</p><Button className="mt-6" onClick={() => openFilePicker(inputRef.current)}>Selecionar vídeo</Button></div> : <div className="grid gap-6 lg:grid-cols-2"><div className="space-y-4"><div className="overflow-hidden rounded-xl border border-border bg-black"><video ref={videoRef} src={source.url} controls playsInline className="aspect-video w-full" onLoadedMetadata={(event) => { setDimensions({ width: event.currentTarget.videoWidth, height: event.currentTarget.videoHeight }); }} onTimeUpdate={drawFrame} onSeeked={drawFrame} onError={() => setError("Não foi possível abrir este vídeo no navegador.")} /></div><p className="text-sm text-muted-foreground">{source.file.name}{dimensions && ` · ${dimensions.width} × ${dimensions.height}px`}</p></div><div className="space-y-5 rounded-xl border border-border bg-muted/20 p-4 sm:p-5">{mode === "rotate" ? <div><p className="text-sm font-medium">Rotação</p><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">{[0,90,180,270].map((value) => <Button key={value} variant={rotation === value ? "default" : "outline"} onClick={() => setRotation(value)}>{value}°</Button>)}</div></div> : mode === "mirror" ? <div><p className="text-sm font-medium">Espelhamento</p><label className="mt-4 flex items-center gap-2 text-sm"><input type="checkbox" checked={flipHorizontal} onChange={(event) => setFlipHorizontal(event.target.checked)} />Horizontal</label><label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={flipVertical} onChange={(event) => setFlipVertical(event.target.checked)} />Vertical</label></div> : <div><p className="text-sm font-medium">Versão silenciosa</p><p className="mt-2 text-sm text-muted-foreground">A exportação removerá totalmente a faixa de áudio do resultado.</p></div>}<div><p className="mb-2 text-sm font-medium">Prévia</p><div className="flex min-h-40 items-center justify-center overflow-hidden rounded-lg border border-border bg-black p-2"><canvas ref={canvasRef} className="max-h-64 max-w-full object-contain" /></div></div><div className="flex flex-wrap gap-3"><Button onClick={exportVideo} disabled={isExporting || !dimensions}>{mode === "rotate" ? <RotateCw /> : mode === "mirror" ? <FlipHorizontal /> : <Video />}{isExporting ? `Exportando ${Math.round(progress)}%` : "Exportar WebM"}</Button><Button variant="outline" onClick={clear}><RotateCcw />Limpar</Button></div>{isExporting && <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} /></div>}</div></div>}
      {error && <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}{result && <section className="rounded-xl border border-border p-4 sm:p-5"><div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="font-semibold">Vídeo pronto</h2><p className="mt-1 text-sm text-muted-foreground">{(result.blob.size / 1024 / 1024).toFixed(2)} MB · WebM</p></div><Button onClick={download}><Download />Baixar WebM</Button></div><video src={result.url} controls playsInline className="mt-5 aspect-video w-full rounded-lg bg-black" /></section>}
    </CardContent></Card></div>
    <section className="mx-auto mt-8 grid max-w-4xl overflow-hidden rounded-xl border border-border sm:grid-cols-3"><article className="border-b border-border p-5 sm:border-b-0 sm:border-r"><p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Formatos</p><p className="mt-3 font-semibold">MP4 e WebM</p></article><article className="border-b border-border p-5 sm:border-b-0 sm:border-r"><p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Limite</p><p className="mt-3 font-semibold">Até 200 MB por vídeo</p></article><article className="p-5"><p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Saída</p><p className="mt-3 font-semibold">Vídeo WebM</p></article></section>
  </div></main>;
}
