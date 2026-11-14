"use client";

import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Download, LoaderCircle, Play, RotateCcw, Upload, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Layout = "pip" | "side" | "stack";
type Output = { blob: Blob; url: string; extension: string };
type CanvasSize = { width: number; height: number };
const mimeCandidates = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm", "video/mp4;codecs=h264,aac", "video/mp4"];

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

export function DoubleVideoClient() {
  const mainRef = useRef<HTMLVideoElement>(null);
  const secondRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const objectUrlsRef = useRef(new Set<string>());
  const [mainFile, setMainFile] = useState<File | null>(null);
  const [secondFile, setSecondFile] = useState<File | null>(null);
  const [mainUrl, setMainUrl] = useState("");
  const [secondUrl, setSecondUrl] = useState("");
  const [mainReady, setMainReady] = useState(false);
  const [secondReady, setSecondReady] = useState(false);
  const [canvasSize, setCanvasSize] = useState<CanvasSize>({ width: 1280, height: 720 });
  const [layout, setLayout] = useState<Layout>("pip");
  const [pipPosition, setPipPosition] = useState("right-bottom");
  const [pipSize, setPipSize] = useState(32);
  const [playing, setPlaying] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [output, setOutput] = useState<Output | null>(null);
  const [error, setError] = useState("");

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
      const boxWidth = Math.min(width * pipSize / 100, (height - margin * 2) * aspect);
      const boxHeight = boxWidth / aspect;
      const x = pipPosition.includes("left") ? margin : width - boxWidth - margin;
      const y = pipPosition.includes("top") ? margin : height - boxHeight - margin;
      context.save(); context.shadowColor = "rgba(0,0,0,.38)"; context.shadowBlur = 18;
      context.fillStyle = "#fff"; context.fillRect(x - 3, y - 3, boxWidth + 6, boxHeight + 6);
      context.restore(); drawCover(context, second, x, y, boxWidth, boxHeight);
    } else {
      const horizontal = layout === "side";
      const gutter = 8;
      const firstRect = horizontal ? [0, 0, (width - gutter) / 2, height] : [0, 0, width, (height - gutter) / 2];
      const secondRect = horizontal ? [(width + gutter) / 2, 0, (width - gutter) / 2, height] : [0, (height + gutter) / 2, width, (height - gutter) / 2];
      drawCover(context, main, ...firstRect as [number, number, number, number]);
      drawCover(context, second, ...secondRect as [number, number, number, number]);
    }
  }, [canvasSize, layout, pipPosition, pipSize]);

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
    if (main.ended || main.currentTime >= main.duration) main.currentTime = 0;
    second.currentTime = 0;
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
    main.pause(); second.pause(); main.currentTime = 0; second.currentTime = 0;
    try {
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
        const finish = () => { main.pause(); second.pause(); resolve(); };
        if (!Number.isFinite(main.duration) || main.duration <= 0) { finish(); return; }
        main.addEventListener("ended", finish, { once: true });
        window.setTimeout(finish, main.duration * 1000 + 1500);
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
    if (mainUrl) { URL.revokeObjectURL(mainUrl); objectUrlsRef.current.delete(mainUrl); }
    if (secondUrl) { URL.revokeObjectURL(secondUrl); objectUrlsRef.current.delete(secondUrl); }
    setMainUrl(""); setSecondUrl(""); setMainFile(null); setSecondFile(null); setMainReady(false); setSecondReady(false); releaseOutput(); setError(""); setPlaying(false);
    if (mainRef.current) mainRef.current.pause(); if (secondRef.current) secondRef.current.pause();
  }

  return <main className="min-h-screen bg-background text-foreground">
    <div className="mx-auto w-full max-w-6xl px-4 pb-12 pt-24 sm:px-6 lg:px-8">
      <div className="mb-8"><Link href="/ferramentas/videos" className="text-sm text-muted-foreground hover:text-foreground">← Voltar para vídeos</Link></div>
      <header className="mb-8 max-w-3xl"><p className="text-sm font-medium uppercase tracking-wider text-primary">Edição de vídeo</p><h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">Montar vídeo com câmera dupla</h1><p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">Junte dois vídeos em uma composição, ajuste o enquadramento e exporte um único arquivo. Tudo é processado no seu navegador.</p></header>
      <Card><CardHeader><CardTitle>1. Adicione seus vídeos</CardTitle><CardDescription>Escolha o vídeo principal e a segunda perspectiva ou reação. Cada arquivo deve ser compatível com seu navegador.</CardDescription></CardHeader><CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {[{ key: "main" as const, title: "Vídeo principal", file: mainFile }, { key: "second" as const, title: "Segundo vídeo", file: secondFile }].map(({ key, title, file }) => <label key={key} className="flex min-h-36 cursor-pointer flex-col justify-center rounded-lg border border-dashed border-border bg-muted/20 p-5 hover:border-primary/50"><input type="file" accept="video/*" className="sr-only" onChange={(event) => selectFile(event, key)} /><span className="flex items-center gap-2 font-medium"><Upload className="size-4 text-primary" />{title}</span><span className="mt-2 break-all text-sm text-muted-foreground">{file?.name ?? "Toque para escolher um vídeo"}</span></label>)}
        </div>
        <video ref={mainRef} src={mainUrl || undefined} playsInline muted className="hidden" onLoadedMetadata={() => { const main = mainRef.current; if (main?.videoWidth && main.videoHeight) setCanvasSize(getCanvasSize(main.videoWidth, main.videoHeight)); setMainReady(true); }} onLoadedData={drawFrame} onEnded={() => setPlaying(false)} />
        <video ref={secondRef} src={secondUrl || undefined} playsInline muted className="hidden" onLoadedMetadata={() => setSecondReady(true)} onLoadedData={drawFrame} />
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(240px,.7fr)]">
          <div className="space-y-3"><div className="overflow-hidden rounded-lg border border-border bg-black"><canvas ref={canvasRef} width={canvasSize.width} height={canvasSize.height} style={{ aspectRatio: `${canvasSize.width} / ${canvasSize.height}` }} className="mx-auto block max-h-[75vh] w-full object-contain" aria-label="Prévia da composição" /></div><div className="flex flex-wrap gap-2"><Button type="button" variant="outline" disabled={!mainReady || !secondReady || exporting} onClick={() => void togglePreview()}><Play />{playing ? "Pausar prévia" : "Reproduzir prévia"}</Button><span className="self-center text-xs text-muted-foreground">A prévia e o vídeo final seguem o formato {canvasSize.height > canvasSize.width ? "vertical" : "horizontal"} do vídeo principal.</span></div></div>
          <div className="space-y-4 rounded-lg border border-border p-4"><div><h2 className="font-semibold">2. Escolha a composição</h2><p className="mt-1 text-sm text-muted-foreground">Altere o formato e confira na prévia.</p></div>
            <div className="grid grid-cols-1 gap-2">{([{ id: "pip", label: "Imagem sobreposta" }, { id: "side", label: "Lado a lado" }, { id: "stack", label: "Um acima do outro" }] as const).map((option) => <Button key={option.id} type="button" variant={layout === option.id ? "default" : "outline"} className="justify-start" onClick={() => setLayout(option.id)}>{option.label}</Button>)}</div>
            {layout === "pip" && <div className="space-y-3"><label className="block text-sm font-medium">Posição do segundo vídeo<select className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={pipPosition} onChange={(event) => setPipPosition(event.target.value)}><option value="right-bottom">Inferior direita</option><option value="left-bottom">Inferior esquerda</option><option value="right-top">Superior direita</option><option value="left-top">Superior esquerda</option></select></label><label className="block text-sm font-medium">Tamanho da janela <span className="text-muted-foreground">{pipSize}%</span><input className="mt-2 w-full accent-primary" type="range" min="20" max="48" value={pipSize} onChange={(event) => setPipSize(Number(event.target.value))} /></label></div>}
            <Button className="w-full" disabled={!mainReady || !secondReady || exporting} onClick={() => void exportComposition()}><Video />{exporting ? <><LoaderCircle className="animate-spin" />Gerando vídeo…</> : "Gerar vídeo"}</Button>
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

