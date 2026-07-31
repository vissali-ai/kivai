"use client";

import { ChangeEvent, DragEvent, useRef, useState } from "react";
import Link from "next/link";
import { Download, RotateCcw, Scissors, Upload, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type WorkbenchMode = "volume" | "speed" | "resize" | "split" | "audio";
type Source = { file: File; url: string };
type Result = { blob: Blob; url: string; label: string };
type Dimensions = { width: number; height: number };

const MAX_FILE_SIZE = 200 * 1024 * 1024;
const VIDEO_MIME_CANDIDATES = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];
const AUDIO_MIME_CANDIDATES = ["audio/webm;codecs=opus", "audio/webm"];

function getMimeType(candidates: string[]) {
  return candidates.find((candidate) => MediaRecorder.isTypeSupported(candidate)) ?? "";
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const rest = Math.floor(seconds % 60);
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

function fileBaseName(file: File) {
  return file.name.replace(/\.[^.]+$/, "") || "video";
}

function drawIntoCanvas(
  context: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement,
  dimensions: Dimensions,
  mode: "contain" | "cover" | "stretch",
  background: string,
) {
  context.fillStyle = background;
  context.fillRect(0, 0, canvas.width, canvas.height);
  if (mode === "stretch") {
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    return;
  }
  const scale = mode === "cover"
    ? Math.max(canvas.width / dimensions.width, canvas.height / dimensions.height)
    : Math.min(canvas.width / dimensions.width, canvas.height / dimensions.height);
  const width = dimensions.width * scale;
  const height = dimensions.height * scale;
  context.drawImage(video, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
}

async function waitForSeek(video: HTMLVideoElement, time: number) {
  await new Promise<void>((resolve, reject) => {
    const done = () => { cleanup(); resolve(); };
    const failed = () => { cleanup(); reject(new Error("Não foi possível acessar o trecho selecionado.")); };
    const cleanup = () => { video.removeEventListener("seeked", done); video.removeEventListener("error", failed); };
    video.addEventListener("seeked", done, { once: true });
    video.addEventListener("error", failed, { once: true });
    video.currentTime = time;
  });
}

export function VideoWorkbenchClient({ mode }: { mode: WorkbenchMode }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const [source, setSource] = useState<Source | null>(null);
  const [dimensions, setDimensions] = useState<Dimensions | null>(null);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [speed, setSpeed] = useState(1);
  const [width, setWidth] = useState(1280);
  const [height, setHeight] = useState(720);
  const [keepRatio, setKeepRatio] = useState(true);
  const [fit, setFit] = useState<"contain" | "cover" | "stretch">("contain");
  const [background, setBackground] = useState("#000000");
  const [splitTime, setSplitTime] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<Result[]>([]);

  const labels: Record<WorkbenchMode, { title: string; description: string; action: string }> = {
    volume: { title: "Alterar Volume do Vídeo", description: "Ajuste o volume e exporte uma nova versão do vídeo diretamente no navegador.", action: "Aplicar volume" },
    speed: { title: "Ajustar Velocidade do Vídeo", description: "Acelere ou desacelere o vídeo com áudio sincronizado quando o navegador oferecer suporte.", action: "Aplicar velocidade" },
    resize: { title: "Redimensionar Vídeo", description: "Defina o tamanho final do vídeo e escolha como a imagem deve se ajustar ao quadro.", action: "Redimensionar vídeo" },
    split: { title: "Dividir Vídeo", description: "Escolha um ponto de corte e gere duas partes precisas do seu vídeo.", action: "Dividir vídeo" },
    audio: { title: "Vídeo para Áudio", description: "Extraia a trilha de áudio em WebM, sem enviar seu vídeo para servidores.", action: "Extrair áudio" },
  };
  const label = labels[mode];

  function releaseResults(items = results) { items.forEach((item) => URL.revokeObjectURL(item.url)); }

  function selectFile(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("video/")) { setError("Selecione um arquivo de vídeo válido."); return; }
    if (file.size > MAX_FILE_SIZE) { setError("O limite para processamento local é de 200 MB por vídeo."); return; }
    if (source) URL.revokeObjectURL(source.url);
    releaseResults();
    setSource({ file, url: URL.createObjectURL(file) });
    setResults([]); setDimensions(null); setDuration(0); setProgress(0); setError("");
  }

  function clear() {
    if (source) URL.revokeObjectURL(source.url);
    releaseResults();
    setSource(null); setResults([]); setDimensions(null); setDuration(0); setProgress(0); setError("");
  }

  function onLoadedMetadata() {
    const video = videoRef.current;
    if (!video) return;
    const next = { width: video.videoWidth, height: video.videoHeight };
    setDimensions(next); setDuration(video.duration); setWidth(next.width); setHeight(next.height); setSplitTime(Math.max(0.1, video.duration / 2));
  }

  function updateWidth(value: number) {
    setWidth(value);
    if (keepRatio && dimensions && value > 0) setHeight(Math.max(1, Math.round(value * dimensions.height / dimensions.width)));
  }
  function updateHeight(value: number) {
    setHeight(value);
    if (keepRatio && dimensions && value > 0) setWidth(Math.max(1, Math.round(value * dimensions.width / dimensions.height)));
  }

  async function recordSegment(start: number, end: number, output: Dimensions, audio: boolean, suffix: string) {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !dimensions) throw new Error("Aguarde o vídeo carregar antes de processar.");
    if (!window.MediaRecorder || !canvas.captureStream) throw new Error("Seu navegador não suporta a exportação local. Use Chrome, Edge ou Firefox atualizados.");
    const mimeType = getMimeType(VIDEO_MIME_CANDIDATES);
    if (!mimeType) throw new Error("Este navegador não consegue codificar vídeo em WebM.");
    canvas.width = output.width; canvas.height = output.height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Não foi possível preparar o quadro do vídeo.");
    const stream = canvas.captureStream(30);
    const inputStream = (video as HTMLVideoElement & { captureStream?: () => MediaStream; mozCaptureStream?: () => MediaStream }).captureStream?.()
      ?? (video as HTMLVideoElement & { mozCaptureStream?: () => MediaStream }).mozCaptureStream?.();
    let disconnectAudio: (() => void) | undefined;
    if (audio && mode === "volume") {
      try {
        const audioContext = audioContextRef.current ?? new AudioContext();
        audioContextRef.current = audioContext;
        const audioSource = audioSourceRef.current ?? audioContext.createMediaElementSource(video);
        audioSourceRef.current = audioSource;
        const gain = audioContext.createGain();
        const destination = audioContext.createMediaStreamDestination();
        gain.gain.value = volume / 100;
        audioSource.connect(gain);
        gain.connect(destination);
        await audioContext.resume();
        destination.stream.getAudioTracks().forEach((track) => stream.addTrack(track));
        disconnectAudio = () => { audioSource.disconnect(gain); gain.disconnect(); };
      } catch {
        throw new Error("Não foi possível ajustar a faixa de áudio neste navegador.");
      }
    } else if (audio && inputStream) inputStream.getAudioTracks().forEach((track) => stream.addTrack(track));
    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8_000_000 });
    const chunks: BlobPart[] = [];
    recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
    const stopped = new Promise<Blob>((resolve) => { recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType })); });
    const playbackRate = mode === "speed" ? speed : 1;
    video.playbackRate = playbackRate;
    video.muted = true;
    await waitForSeek(video, start);
    const render = () => {
      drawIntoCanvas(context, canvas, video, dimensions, mode === "resize" ? fit : "contain", mode === "resize" ? background : "#000000");
      const numerator = Math.max(0, video.currentTime - start);
      setProgress(Math.min(100, numerator / Math.max(0.01, end - start) * 100));
      if (!video.paused && !video.ended && video.currentTime < end) requestAnimationFrame(render);
    };
    const finished = () => { video.pause(); recorder.stop(); };
    const checkEnd = () => { if (video.currentTime >= end - 0.02 || video.ended) finished(); };
    video.addEventListener("timeupdate", checkEnd);
    recorder.start(250);
    await video.play();
    requestAnimationFrame(render);
    const blob = await stopped;
    disconnectAudio?.();
    video.removeEventListener("timeupdate", checkEnd);
    video.playbackRate = 1; video.currentTime = 0;
    return { blob, url: URL.createObjectURL(blob), label: suffix };
  }

  async function extractAudio() {
    const video = videoRef.current;
    if (!video) throw new Error("Aguarde o vídeo carregar antes de processar.");
    const capture = (video as HTMLVideoElement & { captureStream?: () => MediaStream; mozCaptureStream?: () => MediaStream }).captureStream?.()
      ?? (video as HTMLVideoElement & { mozCaptureStream?: () => MediaStream }).mozCaptureStream?.();
    const audioTrack = capture?.getAudioTracks()[0];
    if (!audioTrack) throw new Error("Não foi encontrada uma faixa de áudio compatível neste vídeo.");
    const mimeType = getMimeType(AUDIO_MIME_CANDIDATES);
    if (!mimeType) throw new Error("Este navegador não oferece codificação de áudio WebM.");
    const recorder = new MediaRecorder(new MediaStream([audioTrack]), { mimeType, audioBitsPerSecond: 192_000 });
    const chunks: BlobPart[] = [];
    recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
    const stopped = new Promise<Blob>((resolve) => { recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType })); });
    video.muted = true; await waitForSeek(video, 0); recorder.start(250); await video.play();
    await new Promise<void>((resolve) => video.addEventListener("ended", () => { recorder.stop(); resolve(); }, { once: true }));
    const blob = await stopped; video.currentTime = 0;
    return { blob, url: URL.createObjectURL(blob), label: "Áudio WebM" };
  }

  async function process() {
    if (!source || !dimensions || isProcessing) return;
    setError(""); setProgress(0); releaseResults(); setResults([]); setIsProcessing(true);
    try {
      let output: Result[];
      if (mode === "audio") output = [await extractAudio()];
      else if (mode === "split") {
        if (splitTime <= 0 || splitTime >= duration) throw new Error("Escolha um ponto de corte entre o início e o fim do vídeo.");
        const first = await recordSegment(0, splitTime, dimensions, true, `Parte 1 · 0:00 a ${formatTime(splitTime)}`);
        setProgress(0);
        const second = await recordSegment(splitTime, duration, dimensions, true, `Parte 2 · ${formatTime(splitTime)} a ${formatTime(duration)}`);
        output = [first, second];
      } else {
        if (mode === "resize" && (!Number.isInteger(width) || !Number.isInteger(height) || width < 16 || height < 16 || width > 3840 || height > 3840)) throw new Error("Informe largura e altura inteiras entre 16 e 3840 pixels.");
        const result = await recordSegment(0, duration, mode === "resize" ? { width, height } : dimensions, true, mode === "volume" ? `Volume ${volume}%` : mode === "speed" ? `Velocidade ${speed}×` : `${width} × ${height}px`);
        output = [result];
      }
      setResults(output); setProgress(100);
    } catch (processError) {
      setError(processError instanceof Error ? processError.message : "Não foi possível processar este vídeo.");
    } finally { setIsProcessing(false); }
  }

  function download(result: Result, index: number) {
    if (!source) return;
    const extension = mode === "audio" ? "webm" : "webm";
    const link = document.createElement("a"); link.href = result.url; link.download = `${fileBaseName(source.file)}-${mode}${results.length > 1 ? `-parte-${index + 1}` : ""}.${extension}`; link.click();
  }

  return <main className="min-h-screen bg-background text-foreground"><div className="mx-auto w-full max-w-6xl px-4 pb-12 pt-24 sm:px-6 lg:pb-16 lg:px-8">
    <Link href="/ferramentas/videos" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">← Voltar para Vídeos</Link>
    <header className="mb-10 mt-8 max-w-3xl"><p className="text-sm font-medium uppercase tracking-wider text-primary">Ferramenta de vídeo</p><h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">{label.title}</h1><p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">{label.description}</p><p className="mt-4 text-sm text-muted-foreground">Seu vídeo é processado diretamente no navegador e não é enviado para servidores externos.</p></header>
    <Card><CardHeader><CardTitle>Área de processamento</CardTitle><CardDescription>MP4 e WebM compatíveis com o navegador, até 200 MB. A exportação é gerada localmente em WebM.</CardDescription></CardHeader><CardContent className="space-y-6"><input ref={inputRef} type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden" onChange={(event: ChangeEvent<HTMLInputElement>) => { selectFile(event.target.files?.[0]); event.target.value = ""; }} />
    {!source ? <div onDragEnter={(event: DragEvent<HTMLDivElement>) => { event.preventDefault(); setIsDragging(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={() => setIsDragging(false)} onDrop={(event) => { event.preventDefault(); setIsDragging(false); selectFile(event.dataTransfer.files?.[0]); }} className={`flex min-h-72 flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center ${isDragging ? "border-primary bg-primary/10" : "border-border bg-muted/20"}`}><Video className="mb-4 size-10 text-primary"/><p className="font-medium">Arraste seu vídeo aqui</p><p className="mt-1 text-sm text-muted-foreground">ou selecione um arquivo do dispositivo</p><Button className="mt-5" onClick={() => inputRef.current?.click()}><Upload/>Selecionar vídeo</Button></div> : <div className="grid gap-6 lg:grid-cols-2"><div className="space-y-4"><div className="overflow-hidden rounded-xl border border-border bg-black"><video ref={videoRef} src={source.url} controls playsInline className="aspect-video w-full" onLoadedMetadata={onLoadedMetadata} onError={() => setError("Não foi possível abrir este vídeo no navegador.")}/></div><p className="text-sm text-muted-foreground">{source.file.name}{dimensions ? ` · ${dimensions.width} × ${dimensions.height}px · ${formatTime(duration)}` : ""}</p></div><div className="space-y-5 rounded-xl border border-border bg-muted/20 p-4 sm:p-5">
      {mode === "volume" && <><label className="block text-sm font-medium">Volume: {volume}%<input type="range" min="0" max="300" value={volume} onChange={(event) => setVolume(Number(event.target.value))} className="mt-3 w-full"/></label><input type="number" min="0" max="300" value={volume} onChange={(event) => setVolume(Math.min(300, Math.max(0, Number(event.target.value))))} className="h-10 w-full rounded-md border border-input bg-background px-3"/><div className="flex flex-wrap gap-2">{[0,50,100,150,200].map((item) => <Button key={item} size="sm" variant={volume === item ? "default" : "outline"} onClick={() => setVolume(item)}>{item === 0 ? "Sem áudio" : `${item}%`}</Button>)}</div><p className="text-xs text-muted-foreground">A prévia usa o volume selecionado; navegadores compatíveis aplicam a mesma mixagem durante a exportação.</p></>}
      {mode === "speed" && <><div className="grid grid-cols-3 gap-2">{[0.25,0.5,0.75,1,1.25,1.5,2,3,4].map((item) => <Button key={item} size="sm" variant={speed === item ? "default" : "outline"} onClick={() => setSpeed(item)}>{item}×</Button>)}</div><label className="block text-sm font-medium">Velocidade personalizada<input type="number" min="0.25" max="4" step="0.05" value={speed} onChange={(event) => setSpeed(Math.min(4, Math.max(0.25, Number(event.target.value))))} className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3"/></label><p className="text-sm text-muted-foreground">Duração estimada: {formatTime(duration / speed)}. O áudio acompanha a reprodução quando o codec do navegador permitir.</p></>}
      {mode === "resize" && <><div className="grid grid-cols-2 gap-3"><label className="text-sm font-medium">Largura<input type="number" min="16" max="3840" value={width} onChange={(event) => updateWidth(Number(event.target.value))} className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3"/></label><label className="text-sm font-medium">Altura<input type="number" min="16" max="3840" value={height} onChange={(event) => updateHeight(Number(event.target.value))} className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3"/></label></div><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={keepRatio} onChange={(event) => setKeepRatio(event.target.checked)}/>Manter proporção</label><label className="block text-sm font-medium">Como ajustar<select value={fit} onChange={(event) => setFit(event.target.value as typeof fit)} className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3"><option value="contain">Ajustar sem cortar, com bordas</option><option value="cover">Preencher e cortar bordas</option><option value="stretch">Esticar para preencher</option></select></label>{fit === "contain" && <label className="block text-sm font-medium">Cor das bordas<input type="color" value={background} onChange={(event) => setBackground(event.target.value)} className="ml-3 h-8 w-12 align-middle"/></label>}<div className="flex flex-wrap gap-2">{[[1920,1080],[1280,720],[1080,1920],[1080,1080]].map(([presetWidth,presetHeight]) => <Button key={`${presetWidth}-${presetHeight}`} size="sm" variant="outline" onClick={() => { setKeepRatio(false); setWidth(presetWidth); setHeight(presetHeight); }}>{presetWidth} × {presetHeight}</Button>)}</div></>}
      {mode === "split" && <><label className="block text-sm font-medium">Ponto de divisão: {formatTime(splitTime)}<input type="range" min="0.1" max={Math.max(0.1, duration - 0.1)} step="0.01" value={splitTime} onChange={(event) => setSplitTime(Number(event.target.value))} className="mt-3 w-full"/></label><input type="number" min="0.1" max={Math.max(0.1, duration - 0.1)} step="0.01" value={splitTime} onChange={(event) => setSplitTime(Number(event.target.value))} className="h-10 w-full rounded-md border border-input bg-background px-3"/><p className="text-sm text-muted-foreground">Parte 1: 0:00 a {formatTime(splitTime)} · Parte 2: {formatTime(splitTime)} a {formatTime(duration)}</p></>}
      {mode === "audio" && <p className="text-sm leading-6 text-muted-foreground">A exportação utiliza áudio WebM com Opus, o formato de áudio que pode ser criado localmente pelos navegadores modernos sem uma API externa.</p>}
      <canvas ref={canvasRef} className="hidden"/><div className="flex flex-wrap gap-3"><Button onClick={process} disabled={isProcessing || !dimensions}>{mode === "split" ? <Scissors/> : <Video/>}{isProcessing ? `Processando ${Math.round(progress)}%` : label.action}</Button><Button variant="outline" onClick={clear}><RotateCcw/>Limpar</Button></div>{isProcessing && <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }}/></div>}</div></div>}
    {error && <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}{results.length > 0 && <section className="space-y-4">{results.map((result, index) => <article key={result.url} className="rounded-xl border border-border p-4 sm:p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">{result.label}</h2><p className="mt-1 text-sm text-muted-foreground">{(result.blob.size / 1024 / 1024).toFixed(2)} MB · {mode === "audio" ? "Áudio WebM" : "Vídeo WebM"}</p></div><Button onClick={() => download(result,index)}><Download/>Baixar</Button></div>{mode === "audio" ? <audio className="mt-4 w-full" controls src={result.url}/> : <video className="mt-4 aspect-video w-full rounded-lg bg-black" controls playsInline src={result.url}/>}</article>)}</section>}</CardContent></Card>
    <section className="mt-10 grid gap-6 lg:grid-cols-2"><article className="rounded-xl border border-border p-5"><h2 className="text-xl font-semibold">Como utilizar</h2><ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-6 text-muted-foreground"><li>Envie ou arraste um vídeo compatível.</li><li>Configure o ajuste desejado.</li><li>Inicie o processamento e acompanhe o progresso.</li><li>Revise e baixe o resultado.</li></ol></article><article className="rounded-xl border border-border p-5"><h2 className="text-xl font-semibold">Benefícios</h2><ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground"><li>O arquivo permanece no seu dispositivo.</li><li>Não requer login ou instalação.</li><li>Funciona em desktop e mobile compatíveis.</li><li>Permite conferir o resultado antes de baixar.</li></ul></article></section>
    <section className="mt-6 rounded-xl border border-border p-5"><h2 className="text-xl font-semibold">Perguntas frequentes</h2><div className="mt-5 space-y-5 text-sm leading-6 text-muted-foreground"><div><h3 className="font-medium text-foreground">Meu vídeo é enviado para um servidor?</h3><p className="mt-1">Não. O processamento é feito pelo navegador no seu dispositivo.</p></div><div><h3 className="font-medium text-foreground">Por que a saída é WebM?</h3><p className="mt-1">É o formato que navegadores modernos conseguem codificar localmente com segurança, sem depender de serviços externos.</p></div><div><h3 className="font-medium text-foreground">O processamento é instantâneo?</h3><p className="mt-1">Não necessariamente. O tempo depende da duração, resolução e capacidade do dispositivo.</p></div></div></section>
    <section className="mt-6"><h2 className="text-xl font-semibold">Ferramentas relacionadas</h2><div className="mt-4 flex flex-wrap gap-3"><Button variant="outline" asChild><Link href="/ferramentas/videos">Ferramentas de vídeo</Link></Button><Button variant="outline" asChild><Link href="/ferramentas/capturar-frame-video">Gerador de thumbnail</Link></Button><Button variant="outline" asChild><Link href="/ferramentas/recortar-video">Recortar vídeo</Link></Button></div></section>
  </div></main>;
}
