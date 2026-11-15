"use client";

import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Download, LoaderCircle, Play, RotateCcw, Upload, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Layout = "pip" | "side" | "stack";
type PipShape = "rectangle" | "circle" | "triangle" | "star";
type Output = { blob: Blob; url: string; extension: string };
type CanvasSize = { width: number; height: number };
type SyncStatus = "waiting" | "analyzing" | "synced" | "manual";
const mimeCandidates = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm", "video/mp4;codecs=h264,aac", "video/mp4"];
const AUDIO_SYNC_INTERVAL = 0.1;
const AUDIO_SYNC_SCAN_SECONDS = 180;
const AUDIO_SYNC_MAX_OFFSET_SECONDS = 120;

function getCanvasSize(width: number, height: number): CanvasSize {
  const scale = Math.min(1, 1920 / Math.max(width, height));
  return { width: Math.max(2, Math.round(width * scale)), height: Math.max(2, Math.round(height * scale)) };
}

function supportedMime() {
  if (typeof MediaRecorder === "undefined") return "";
  return mimeCandidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

function drawCover(context: CanvasRenderingContext2D, video: HTMLVideoElement, x: number, y: number, width: number, height: number) {
  if (!video.videoWidth || !video.videoHeight) return;
  const scale = Math.max(width / video.videoWidth, height / video.videoHeight);
  const sw = width / scale;
  const sh = height / scale;
  context.drawImage(video, (video.videoWidth - sw) / 2, (video.videoHeight - sh) / 2, sw, sh, x, y, width, height);
}

function tracePipShape(context: CanvasRenderingContext2D, shape: PipShape, x: number, y: number, width: number, height: number) {
  context.beginPath();
  if (shape === "circle") {
    context.ellipse(x + width / 2, y + height / 2, width / 2, height / 2, 0, 0, Math.PI * 2);
  } else if (shape === "triangle") {
    context.moveTo(x + width / 2, y);
    context.lineTo(x + width, y + height);
    context.lineTo(x, y + height);
    context.closePath();
  } else if (shape === "star") {
    const cx = x + width / 2; const cy = y + height / 2;
    for (let point = 0; point < 10; point += 1) {
      const radius = point % 2 === 0 ? width / 2 : width * 0.22;
      const angle = -Math.PI / 2 + point * Math.PI / 5;
      const px = cx + Math.cos(angle) * radius;
      const py = cy + Math.sin(angle) * radius;
      if (point === 0) context.moveTo(px, py); else context.lineTo(px, py);
    }
    context.closePath();
  } else {
    context.rect(x, y, width, height);
  }
}

async function getAudioEnvelope(file: File): Promise<Float32Array | null> {
  const { ALL_FORMATS, AudioSampleSink, BlobSource, Input } = await import("mediabunny");
  const input = new Input({ formats: ALL_FORMATS, source: new BlobSource(file) });
  try {
    const track = await input.getPrimaryAudioTrack();
    if (!track || !(await track.canDecode())) return null;
    const start = await track.getFirstTimestamp();
    const trackEnd = await track.computeDuration();
    const end = Math.min(trackEnd, start + AUDIO_SYNC_SCAN_SECONDS);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end - start < 5) return null;
    const energy = new Float64Array(Math.ceil((end - start) / AUDIO_SYNC_INTERVAL));
    const counts = new Uint32Array(energy.length);
    const sink = new AudioSampleSink(track);
    for await (const sample of sink.samples(start, end)) {
      try {
        const buffer = sample.toAudioBuffer();
        const channels = Array.from({ length: buffer.numberOfChannels }, (_, index) => buffer.getChannelData(index));
        const sampleStart = sample.timestamp;
        const sampleEnd = sampleStart + buffer.duration;
        const firstBin = Math.max(0, Math.floor((sampleStart - start) / AUDIO_SYNC_INTERVAL));
        const lastBin = Math.min(energy.length - 1, Math.ceil((sampleEnd - start) / AUDIO_SYNC_INTERVAL) - 1);
        for (let bin = firstBin; bin <= lastBin; bin += 1) {
          const binStart = Math.max(sampleStart, start + bin * AUDIO_SYNC_INTERVAL);
          const binEnd = Math.min(sampleEnd, start + (bin + 1) * AUDIO_SYNC_INTERVAL);
          const firstFrame = Math.max(0, Math.floor((binStart - sampleStart) * buffer.sampleRate));
          const lastFrame = Math.min(buffer.length, Math.ceil((binEnd - sampleStart) * buffer.sampleRate));
          let sum = 0;
          for (let frame = firstFrame; frame < lastFrame; frame += 1) {
            let framePower = 0;
            for (const channel of channels) framePower += channel[frame] * channel[frame];
            sum += framePower / channels.length;
          }
          const frames = lastFrame - firstFrame;
          if (frames > 0) { energy[bin] += sum / frames; counts[bin] += 1; }
        }
      } finally { sample.close(); }
    }

    const features = new Float32Array(energy.length);
    let mean = 0; let squared = 0; let count = 0;
    for (let index = 1; index < energy.length; index += 1) {
      const previous = counts[index - 1] ? Math.sqrt(energy[index - 1] / counts[index - 1]) : 0;
      const current = counts[index] ? Math.sqrt(energy[index] / counts[index]) : 0;
      const feature = Math.log(1e-5 + current) - Math.log(1e-5 + previous);
      features[index] = feature; mean += feature; squared += feature * feature; count += 1;
    }
    const variance = squared / Math.max(1, count) - (mean / Math.max(1, count)) ** 2;
    const deviation = Math.sqrt(Math.max(0, variance));
    if (deviation < 1e-4) return null;
    for (let index = 0; index < features.length; index += 1) features[index] = (features[index] - mean / Math.max(1, count)) / deviation;
    return features;
  } finally { input.dispose(); }
}

function findAudioOffset(main: Float32Array, second: Float32Array) {
  const minimumOverlap = Math.ceil(8 / AUDIO_SYNC_INTERVAL);
  const maximumShift = Math.min(Math.ceil(AUDIO_SYNC_MAX_OFFSET_SECONDS / AUDIO_SYNC_INTERVAL), Math.max(main.length, second.length) - minimumOverlap);
  let bestScore = -1; let bestShift = 0;
  const scores: Array<{ shift: number; score: number }> = [];
  for (let shift = -maximumShift; shift <= maximumShift; shift += 1) {
    const mainStart = Math.max(0, -shift);
    const secondStart = Math.max(0, shift);
    const overlap = Math.min(main.length - mainStart, second.length - secondStart);
    if (overlap < minimumOverlap) continue;
    let sumMain = 0; let sumSecond = 0; let sumMainSquared = 0; let sumSecondSquared = 0; let cross = 0;
    for (let index = 0; index < overlap; index += 1) {
      const a = main[mainStart + index]; const b = second[secondStart + index];
      sumMain += a; sumSecond += b; sumMainSquared += a * a; sumSecondSquared += b * b; cross += a * b;
    }
    const centeredCross = cross - sumMain * sumSecond / overlap;
    const centeredMain = sumMainSquared - sumMain * sumMain / overlap;
    const centeredSecond = sumSecondSquared - sumSecond * sumSecond / overlap;
    const score = centeredCross / Math.sqrt(Math.max(1e-9, centeredMain * centeredSecond));
    scores.push({ shift, score });
    if (score > bestScore) { bestScore = score; bestShift = shift; }
  }
  const nextPeak = scores.filter((item) => Math.abs(item.shift - bestShift) > Math.ceil(1 / AUDIO_SYNC_INTERVAL)).reduce((peak, item) => Math.max(peak, item.score), -1);
  if (bestScore < 0.28 || bestScore - nextPeak < 0.015) return null;
  return { offset: bestShift * AUDIO_SYNC_INTERVAL, confidence: bestScore };
}

function seekTo(video: HTMLVideoElement, time: number) {
  const target = Math.max(0, Math.min(time, Number.isFinite(video.duration) ? Math.max(0, video.duration - 0.05) : time));
  if (Math.abs(video.currentTime - target) < 0.04 && !video.seeking) return Promise.resolve();
  return new Promise<void>((resolve) => {
    const finish = () => { window.clearTimeout(timer); video.removeEventListener("seeked", finish); resolve(); };
    const timer = window.setTimeout(finish, 1500);
    video.addEventListener("seeked", finish, { once: true });
    video.currentTime = target;
  });
}

export function DoubleVideoClient() {
  const mainRef = useRef<HTMLVideoElement>(null);
  const secondRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const objectUrlsRef = useRef(new Set<string>());
  const syncRunRef = useRef(0);
  const [mainFile, setMainFile] = useState<File | null>(null);
  const [secondFile, setSecondFile] = useState<File | null>(null);
  const [mainUrl, setMainUrl] = useState("");
  const [secondUrl, setSecondUrl] = useState("");
  const [mainReady, setMainReady] = useState(false);
  const [secondReady, setSecondReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("waiting");
  const [syncOffset, setSyncOffset] = useState(0);
  const [syncAdjustment, setSyncAdjustment] = useState(0);
  const [canvasSize, setCanvasSize] = useState<CanvasSize>({ width: 1280, height: 720 });
  const [layout, setLayout] = useState<Layout>("pip");
  const [pipShape, setPipShape] = useState<PipShape>("rectangle");
  const [pipPosition, setPipPosition] = useState("right-bottom");
  const [pipSize, setPipSize] = useState(32);
  const [playing, setPlaying] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [output, setOutput] = useState<Output | null>(null);
  const [error, setError] = useState("");
  const alignmentOffset = syncOffset + syncAdjustment;
  const mainStart = Math.max(0, -alignmentOffset);
  const secondStart = Math.max(0, alignmentOffset);

  useEffect(() => {
    if (!mainReady || !secondReady || !mainFile || !secondFile) {
      setSyncStatus("waiting"); setSyncOffset(0); setSyncAdjustment(0); return;
    }
    const run = ++syncRunRef.current;
    setSyncStatus("analyzing"); setSyncOffset(0); setSyncAdjustment(0);
    void Promise.all([getAudioEnvelope(mainFile), getAudioEnvelope(secondFile)]).then(([mainAudio, secondAudio]) => {
      if (syncRunRef.current !== run) return;
      const match = mainAudio && secondAudio ? findAudioOffset(mainAudio, secondAudio) : null;
      if (match) { setSyncOffset(match.offset); setSyncStatus("synced"); }
      else { setSyncStatus("manual"); }
    }).catch(() => { if (syncRunRef.current === run) setSyncStatus("manual"); });
    return () => { if (syncRunRef.current === run) syncRunRef.current += 1; };
  }, [mainFile, mainReady, secondFile, secondReady]);

  const releaseOutput = useCallback(() => setOutput((current) => {
    if (current) { URL.revokeObjectURL(current.url); objectUrlsRef.current.delete(current.url); }
    return null;
  }), []);

  useEffect(() => () => {
    objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    objectUrlsRef.current.clear();
    cancelAnimationFrame(frameRef.current);
    if (recorderRef.current && recorderRef.current.state !== "inactive") recorderRef.current.stop();
  }, []);

  const selectFile = (event: ChangeEvent<HTMLInputElement>, which: "main" | "second") => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("video/")) { setError("Selecione um arquivo de vídeo."); return; }
    mainRef.current?.pause(); secondRef.current?.pause(); setPlaying(false);
    const url = URL.createObjectURL(file);
    objectUrlsRef.current.add(url);
    if (which === "main") {
      if (mainUrl) { URL.revokeObjectURL(mainUrl); objectUrlsRef.current.delete(mainUrl); }
      setMainFile(file); setMainUrl(url); setMainReady(false);
    } else {
      if (secondUrl) { URL.revokeObjectURL(secondUrl); objectUrlsRef.current.delete(secondUrl); }
      setSecondFile(file); setSecondUrl(url); setSecondReady(false);
    }
    releaseOutput(); setError("");
  };

  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const main = mainRef.current;
    const second = secondRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context || !main || !second || !main.videoWidth || !second.videoWidth) return;
    const width = canvasSize.width; const height = canvasSize.height;
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;
    context.fillStyle = "#08080b"; context.fillRect(0, 0, width, height);
    if (layout === "pip") {
      drawCover(context, main, 0, 0, width, height);
      const margin = Math.min(width, height) * 0.035;
      const aspect = second.videoWidth / second.videoHeight;
      const squareShape = pipShape !== "rectangle";
      const boxWidth = squareShape
        ? Math.min(width * pipSize / 100, height - margin * 2)
        : Math.min(width * pipSize / 100, (height - margin * 2) * aspect);
      const boxHeight = squareShape ? boxWidth : boxWidth / aspect;
      const x = pipPosition.includes("left") ? margin : width - boxWidth - margin;
      const y = pipPosition.includes("top") ? margin : height - boxHeight - margin;
      context.save(); context.shadowColor = "rgba(0,0,0,.38)"; context.shadowBlur = 18;
      tracePipShape(context, pipShape, x - 3, y - 3, boxWidth + 6, boxHeight + 6);
      context.fillStyle = "#fff"; context.fill(); context.restore();
      context.save(); tracePipShape(context, pipShape, x, y, boxWidth, boxHeight); context.clip();
      drawCover(context, second, x, y, boxWidth, boxHeight); context.restore();
    } else {
      const horizontal = layout === "side";
      const gutter = 8;
      const firstRect = horizontal ? [0, 0, (width - gutter) / 2, height] : [0, 0, width, (height - gutter) / 2];
      const secondRect = horizontal ? [(width + gutter) / 2, 0, (width - gutter) / 2, height] : [0, (height + gutter) / 2, width, (height - gutter) / 2];
      drawCover(context, main, ...firstRect as [number, number, number, number]);
      drawCover(context, second, ...secondRect as [number, number, number, number]);
    }
  }, [canvasSize, layout, pipPosition, pipShape, pipSize]);

  useEffect(() => { drawFrame(); }, [drawFrame, mainUrl, secondUrl]);
  useEffect(() => {
    const animate = () => {
      drawFrame();
      if (playing || exporting) frameRef.current = requestAnimationFrame(animate);
    };
    if (playing || exporting) frameRef.current = requestAnimationFrame(animate);
    else drawFrame();
    return () => cancelAnimationFrame(frameRef.current);
  }, [drawFrame, playing, exporting]);

  async function togglePreview() {
    const main = mainRef.current; const second = secondRef.current;
    if (!main || !second) return;
    if (playing) { main.pause(); second.pause(); setPlaying(false); return; }
    const mainDuration = Math.max(0, main.duration - mainStart);
    const secondDuration = Math.max(0, second.duration - secondStart);
    if (main.ended || second.ended || main.currentTime < mainStart - 0.05 || second.currentTime < secondStart - 0.05) await Promise.all([seekTo(main, mainStart), seekTo(second, secondStart)]);
    if (!mainDuration || !secondDuration) return;
    await Promise.all([main.play(), second.play().catch(() => undefined)]);
    setPlaying(true);
  }

  async function exportComposition() {
    const main = mainRef.current; const second = secondRef.current; const canvas = canvasRef.current;
    if (!main || !second || !canvas || !mainFile || !secondFile) return;
    if (!canvas.captureStream || typeof MediaRecorder === "undefined") { setError("Seu navegador não oferece exportação de vídeo compatível. Use uma versão atual do Chrome, Edge ou Safari."); return; }
    const mimeType = supportedMime();
    if (!mimeType) { setError("Este navegador não possui um formato de vídeo compatível para exportar."); return; }
    setError(""); releaseOutput(); setExporting(true); setPlaying(false);
    main.pause(); second.pause();
    try {
      await Promise.all([seekTo(main, mainStart), seekTo(second, secondStart)]);
      const stream = canvas.captureStream(30);
      const audioCapture = (main as HTMLVideoElement & { captureStream?: () => MediaStream }).captureStream?.();
      audioCapture?.getAudioTracks().forEach((track) => stream.addTrack(track));
      const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 6_000_000 });
      recorderRef.current = recorder;
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
      const done = new Promise<Blob>((resolve, reject) => {
        recorder.onerror = () => reject(new Error("Falha ao montar o vídeo."));
        recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
      });
      recorder.start(300);
      await Promise.all([main.play(), second.play().catch(() => undefined)]);
      await new Promise<void>((resolve) => {
        let finished = false;
        const finish = () => { if (finished) return; finished = true; main.pause(); second.pause(); resolve(); };
        const compositionDuration = Math.min(main.duration - mainStart, second.duration - secondStart);
        if (!Number.isFinite(compositionDuration) || compositionDuration <= 0) { finish(); return; }
        main.addEventListener("ended", finish, { once: true });
        second.addEventListener("ended", finish, { once: true });
        window.setTimeout(finish, compositionDuration * 1000 + 1500);
      });
      if (recorder.state !== "inactive") recorder.stop();
      const blob = await done;
      if (!blob.size) throw new Error("O vídeo exportado ficou vazio. Tente usar arquivos menores ou outro navegador.");
      const extension = mimeType.includes("mp4") ? "mp4" : "webm";
      const resultUrl = URL.createObjectURL(blob);
      objectUrlsRef.current.add(resultUrl);
      setOutput({ blob, url: resultUrl, extension });
    } catch (cause) {
      if (recorderRef.current?.state !== "inactive") recorderRef.current?.stop();
      setError(cause instanceof Error ? cause.message : "Não foi possível exportar a composição.");
    } finally { setExporting(false); setPlaying(false); }
  }

  function clear() {
    syncRunRef.current += 1;
    if (mainUrl) { URL.revokeObjectURL(mainUrl); objectUrlsRef.current.delete(mainUrl); }
    if (secondUrl) { URL.revokeObjectURL(secondUrl); objectUrlsRef.current.delete(secondUrl); }
    setMainUrl(""); setSecondUrl(""); setMainFile(null); setSecondFile(null); setMainReady(false); setSecondReady(false); releaseOutput(); setError(""); setPlaying(false);
    if (mainRef.current) mainRef.current.pause(); if (secondRef.current) secondRef.current.pause();
  }

  return <main className="min-h-screen bg-background text-foreground">
    <div className="mx-auto w-full max-w-6xl px-4 pb-12 pt-24 sm:px-6 lg:px-8">
      <div className="mb-8"><Link href="/ferramentas/videos" className="text-sm text-muted-foreground hover:text-foreground">← Voltar para vídeos</Link></div>
      <header className="mb-8 max-w-3xl"><p className="text-sm font-medium uppercase tracking-wider text-primary">Ferramenta gratuita de edição de vídeo</p><h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">Juntar e sincronizar vídeos grátis</h1><p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">Gravaram o mesmo momento com dois celulares? Junte os vídeos, sincronize pelo áudio e monte uma tela dividida ou câmera dupla. Gratuito e direto no navegador.</p></header>
      <Card><CardHeader><CardTitle>1. Adicione seus vídeos</CardTitle><CardDescription>Envie duas gravações feitas no mesmo ambiente e momento. Ao carregar os arquivos, tentaremos sincronizar automaticamente os trechos de áudio em comum.</CardDescription></CardHeader><CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {[{ key: "main" as const, title: "Vídeo principal", file: mainFile }, { key: "second" as const, title: "Segundo vídeo", file: secondFile }].map(({ key, title, file }) => <label key={key} className="flex min-h-36 cursor-pointer flex-col justify-center rounded-lg border border-dashed border-border bg-muted/20 p-5 hover:border-primary/50"><input type="file" accept="video/*" className="sr-only" onChange={(event) => selectFile(event, key)} /><span className="flex items-center gap-2 font-medium"><Upload className="size-4 text-primary" />{title}</span><span className="mt-2 break-all text-sm text-muted-foreground">{file?.name ?? "Toque para escolher um vídeo"}</span></label>)}
        </div>
        <video ref={mainRef} src={mainUrl || undefined} playsInline muted className="hidden" onLoadedMetadata={() => { const main = mainRef.current; if (main?.videoWidth && main.videoHeight) setCanvasSize(getCanvasSize(main.videoWidth, main.videoHeight)); setMainReady(true); }} onLoadedData={drawFrame} onEnded={() => setPlaying(false)} />
        <video ref={secondRef} src={secondUrl || undefined} playsInline muted className="hidden" onLoadedMetadata={() => setSecondReady(true)} onLoadedData={drawFrame} onEnded={() => setPlaying(false)} />
        {mainReady && secondReady && <div role="status" className="rounded-lg border border-border bg-muted/20 p-3 text-sm">
          {syncStatus === "analyzing" ? "Analisando o áudio dos dois vídeos para sincronizar… Os arquivos ficam neste dispositivo." : syncStatus === "synced" ? `Vídeos sincronizados pelo áudio. O vídeo principal começa em ${mainStart.toFixed(1)} s e o segundo em ${secondStart.toFixed(1)} s.` : syncStatus === "manual" ? "Não encontramos um trecho de áudio em comum com confiança. Você pode ajustar o ponto de sincronização manualmente." : "Aguardando os dois vídeos…"}
        </div>}
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(240px,.7fr)]">
          <div className="space-y-3"><div className="overflow-hidden rounded-lg border border-border bg-black"><canvas ref={canvasRef} width={canvasSize.width} height={canvasSize.height} style={{ aspectRatio: `${canvasSize.width} / ${canvasSize.height}` }} className="mx-auto block max-h-[75vh] w-full object-contain" aria-label="Prévia da composição" /></div><div className="flex flex-wrap gap-2"><Button type="button" variant="outline" disabled={!mainReady || !secondReady || exporting || syncStatus === "analyzing"} onClick={() => void togglePreview()}><Play />{playing ? "Pausar prévia" : "Reproduzir prévia"}</Button><span className="self-center text-xs text-muted-foreground">A prévia e o vídeo final seguem o formato {canvasSize.height > canvasSize.width ? "vertical" : "horizontal"} do vídeo principal.</span></div></div>
          <div className="space-y-4 rounded-lg border border-border p-4"><div><h2 className="font-semibold">2. Escolha a composição</h2><p className="mt-1 text-sm text-muted-foreground">Altere o formato e confira na prévia.</p></div>
            <div className="grid grid-cols-1 gap-2">{([{ id: "pip", label: "Imagem sobreposta" }, { id: "side", label: "Lado a lado" }, { id: "stack", label: "Um acima do outro" }] as const).map((option) => <Button key={option.id} type="button" variant={layout === option.id ? "default" : "outline"} className="justify-start" onClick={() => setLayout(option.id)}>{option.label}</Button>)}</div>
            {layout === "pip" && <div className="space-y-3"><label className="block text-sm font-medium">Formato do segundo vídeo<select className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={pipShape} onChange={(event) => setPipShape(event.target.value as PipShape)}><option value="rectangle">Retangular</option><option value="circle">Redondo</option><option value="triangle">Triangular</option><option value="star">Estrela</option></select></label><label className="block text-sm font-medium">Posição do segundo vídeo<select className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={pipPosition} onChange={(event) => setPipPosition(event.target.value)}><option value="right-bottom">Inferior direita</option><option value="left-bottom">Inferior esquerda</option><option value="right-top">Superior direita</option><option value="left-top">Superior esquerda</option></select></label><label className="block text-sm font-medium">Tamanho da janela <span className="text-muted-foreground">{pipSize}%</span><input className="mt-2 w-full accent-primary" type="range" min="20" max="48" value={pipSize} onChange={(event) => setPipSize(Number(event.target.value))} /></label></div>}
            {mainReady && secondReady && syncStatus !== "analyzing" && <label className="block text-sm font-medium">Ajuste manual do segundo áudio <span className="text-muted-foreground">{syncAdjustment.toFixed(1)} s</span><input className="mt-2 w-full accent-primary" type="range" min="-5" max="5" step="0.1" value={syncAdjustment} onChange={(event) => setSyncAdjustment(Number(event.target.value))} /><span className="mt-1 block text-xs font-normal text-muted-foreground">O som do vídeo principal será mantido. O áudio do segundo vídeo não entra no resultado.</span></label>}
            <Button className="w-full" disabled={!mainReady || !secondReady || exporting || syncStatus === "analyzing"} onClick={() => void exportComposition()}><Video />{exporting ? <><LoaderCircle className="animate-spin" />Gerando vídeo…</> : "Gerar vídeo"}</Button>
            <Button variant="outline" className="w-full" disabled={!mainUrl && !secondUrl} onClick={clear}><RotateCcw />Limpar e começar de novo</Button>
            {exporting && <p role="status" className="text-sm text-muted-foreground">A composição está sendo gravada em tempo real no seu dispositivo. Mantenha a página aberta.</p>}
          </div>
        </section>
        {error && <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        {output && <section className="space-y-4 rounded-lg border border-border p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">Vídeo pronto</h2><p className="text-sm text-muted-foreground">{(output.blob.size / 1024 / 1024).toFixed(1)} MB · {output.extension.toUpperCase()}</p></div><a className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground" href={output.url} download={`video-camera-dupla.${output.extension}`}><Download className="size-4" />Baixar vídeo</a></div><video className="max-h-[520px] w-full rounded-md bg-black" src={output.url} controls playsInline /></section>}
      </CardContent></Card>
      <p className="mx-auto mt-5 max-w-4xl text-center text-xs leading-5 text-muted-foreground">Os arquivos permanecem neste dispositivo durante a edição. A velocidade de exportação depende da duração e do desempenho do aparelho. A exportação é feita em tempo real; não feche esta página até o vídeo ficar pronto.</p>
    </div>
  </main>;
}

