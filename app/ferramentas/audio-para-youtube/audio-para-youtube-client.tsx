"use client";

import { ChangeEvent, PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from "react";
import { Download, FileAudio, ImagePlus, RotateCcw, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ToolActionBar } from "@/components/tools/tool-action-bar";
import { ToolErrorMessage } from "@/components/tools/tool-error-message";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { ToolProcessingStatus, type ToolStatus } from "@/components/tools/tool-processing-status";
import { ToolResultCard } from "@/components/tools/tool-result-card";
import { ToolUploadArea } from "@/components/tools/tool-upload-area";
import { openFilePicker } from "@/lib/browser/file-picker";
import { formatFileSize } from "@/lib/tool-files";

const MAX_AUDIO_SIZE = 500 * 1024 * 1024;
const FORMATS = ["wav", "mp3", "m4a", "aac", "flac"];
const VIDEO_TYPES = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];

function baseName(name: string) { return name.replace(/\.[^.]+$/, "") || "audio"; }
function safeOutputName(name: string) { return (baseName(name).normalize("NFKC").replace(/[\\/:*?"<>|\u0000-\u001f]/g, "-").trim().slice(0, 120) || "audio") + "-youtube.webm"; }
function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds)) return "--:--";
  const h = Math.floor(seconds / 3600), m = Math.floor((seconds % 3600) / 60), s = Math.floor(seconds % 60);
  return h ? h + ":" + String(m).padStart(2,"0") + ":" + String(s).padStart(2,"0") : m + ":" + String(s).padStart(2,"0");
}
function supportedVideoType() { return VIDEO_TYPES.find((type) => MediaRecorder.isTypeSupported(type)) || ""; }

export default function AudioParaYoutubeClient() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const editorCanvasRef = useRef<HTMLCanvasElement>(null);
  const coverImageRef = useRef<HTMLImageElement | null>(null);
  const dragRef = useRef<{ x: number; y: number; startX: number; startY: number } | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [cover, setCover] = useState<{ file: File; url: string } | null>(null);
  const [duration, setDuration] = useState(0);
  const [coverMode, setCoverMode] = useState<"fill" | "fit">("fill");
  const [coverZoom, setCoverZoom] = useState(1);
  const [coverPosition, setCoverPosition] = useState({ x: 0, y: 0 });
  const [resolution, setResolution] = useState<"1080" | "720">("1080");
  const [status, setStatus] = useState<ToolStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ blob: Blob; url: string; name: string } | null>(null);

  useEffect(() => () => { void audioContextRef.current?.close(); }, []);

  useEffect(() => {
    if (!cover) { coverImageRef.current = null; return; }
    const image = new Image();
    image.src = cover.url;
    image.onload = () => { coverImageRef.current = image; renderEditorPreview(); };
    return () => { if (coverImageRef.current === image) coverImageRef.current = null; };
  }, [cover]);

  useEffect(() => { renderEditorPreview(); }, [coverMode, coverZoom, coverPosition, cover]);

  function drawEditedCover(ctx: CanvasRenderingContext2D, width: number, height: number, image: HTMLImageElement) {
    ctx.fillStyle = "#09090b"; ctx.fillRect(0, 0, width, height);
    const baseScale = coverMode === "fill" ? Math.max(width / image.naturalWidth, height / image.naturalHeight) : Math.min(width / image.naturalWidth, height / image.naturalHeight);
    if (coverMode === "fit") {
      const blurScale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
      const bw = image.naturalWidth * blurScale, bh = image.naturalHeight * blurScale;
      ctx.save(); ctx.filter = "blur(28px) brightness(0.55)"; ctx.drawImage(image, (width - bw) / 2, (height - bh) / 2, bw, bh); ctx.restore();
      ctx.fillStyle = "rgba(0,0,0,.18)"; ctx.fillRect(0, 0, width, height);
    }
    const scale = baseScale * coverZoom;
    const w = image.naturalWidth * scale, h = image.naturalHeight * scale;
    const maxX = Math.max(0, (w - width) / 2), maxY = Math.max(0, (h - height) / 2);
    const x = (width - w) / 2 + Math.max(-maxX, Math.min(maxX, coverPosition.x * width));
    const y = (height - h) / 2 + Math.max(-maxY, Math.min(maxY, coverPosition.y * height));
    ctx.drawImage(image, x, y, w, h);
  }

  function renderEditorPreview() {
    const canvas = editorCanvasRef.current, image = coverImageRef.current;
    if (!canvas || !image?.naturalWidth) return;
    canvas.width = 960; canvas.height = 540;
    const ctx = canvas.getContext("2d"); if (ctx) drawEditedCover(ctx, canvas.width, canvas.height, image);
  }

  function resetCoverEditor() { setCoverZoom(1); setCoverPosition({ x: 0, y: 0 }); }
  function beginCoverDrag(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (!cover || status === "processing") return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { x: event.clientX, y: event.clientY, startX: coverPosition.x, startY: coverPosition.y };
  }
  function moveCover(event: ReactPointerEvent<HTMLCanvasElement>) {
    const drag = dragRef.current; if (!drag) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setCoverPosition({ x: drag.startX + (event.clientX - drag.x) / rect.width, y: drag.startY + (event.clientY - drag.y) / rect.height });
  }
  function endCoverDrag(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    dragRef.current = null;
  }

  function clearResult() { if (result) URL.revokeObjectURL(result.url); setResult(null); }
  function selectAudio(files: File[]) {
    const next = files[0]; if (!next || status === "processing") return;
    const ext = next.name.split(".").pop()?.toLowerCase() || "";
    setError(""); clearResult();
    if (!FORMATS.includes(ext) && !next.type.startsWith("audio/")) { setError("Selecione um arquivo WAV, MP3, M4A, AAC ou FLAC."); setStatus("error"); return; }
    if (!next.size || next.size > MAX_AUDIO_SIZE) { setError("O arquivo precisa ter conteúdo e no máximo 500 MB."); setStatus("error"); return; }
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    const url = URL.createObjectURL(next); setFile(next); setAudioUrl(url); setDuration(0); setStatus("ready");
  }
  function selectCover(event: ChangeEvent<HTMLInputElement>) {
    const next = event.target.files?.[0]; event.target.value = ""; if (!next) return;
    if (!next.type.startsWith("image/")) { setError("Selecione uma imagem JPG, PNG ou WebP."); return; }
    if (cover) URL.revokeObjectURL(cover.url);
    setCover({ file: next, url: URL.createObjectURL(next) }); setCoverMode("fill"); setCoverZoom(1); setCoverPosition({ x: 0, y: 0 }); setError(""); clearResult();
  }
  function reset() {
    if (audioUrl) URL.revokeObjectURL(audioUrl); if (cover) URL.revokeObjectURL(cover.url); clearResult();
    setFile(null); setAudioUrl(""); setCover(null); setCoverMode("fill"); setCoverZoom(1); setCoverPosition({ x: 0, y: 0 }); setDuration(0); setProgress(0); setError(""); setStatus("idle");
  }
  async function drawCover(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d"); if (!ctx || !file) throw new Error("Não foi possível preparar a imagem do vídeo.");
    const width = resolution === "1080" ? 1920 : 1280, height = resolution === "1080" ? 1080 : 720; canvas.width=width; canvas.height=height;
    ctx.fillStyle="#09090b"; ctx.fillRect(0,0,width,height);
    if (cover) {
      let image = coverImageRef.current;
      if (!image) { image = new Image(); image.src = cover.url; await image.decode(); coverImageRef.current = image; }
      drawEditedCover(ctx, width, height, image);
    } else {
      const gradient=ctx.createLinearGradient(0,0,width,height); gradient.addColorStop(0,"#111827"); gradient.addColorStop(1,"#18181b");
      ctx.fillStyle=gradient; ctx.fillRect(0,0,width,height);
      ctx.fillStyle="#ffffff"; ctx.textAlign="center"; ctx.textBaseline="middle";
      ctx.font="600 " + Math.round(width*0.042) + "px system-ui, sans-serif";
      ctx.fillText(baseName(file.name).slice(0,60),width/2,height/2,width*0.78);
      ctx.font="400 " + Math.round(width*0.016) + "px system-ui, sans-serif"; ctx.fillStyle="#a1a1aa";
      ctx.fillText("Áudio",width/2,height/2+height*0.09,width*0.7);
    }
  }
  async function createVideo() {
    const audio=audioRef.current, canvas=canvasRef.current;
    if (!file || !audio || !canvas || status==="processing") return;
    if (!window.MediaRecorder || !canvas.captureStream) { setError("Seu navegador não oferece a codificação local necessária. Use Chrome, Edge ou Firefox atualizados."); setStatus("error"); return; }
    const mimeType=supportedVideoType(); if (!mimeType) { setError("Este navegador não consegue gerar o vídeo WebM necessário."); setStatus("error"); return; }
    setError(""); clearResult(); setStatus("processing"); setProgress(0);
    try {
      await drawCover(canvas);
      const AudioContextConstructor=window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextConstructor) throw new Error("Seu navegador não consegue processar esta faixa de áudio.");
      const context=new AudioContextConstructor(); audioContextRef.current=context;
      const source=context.createMediaElementSource(audio); const destination=context.createMediaStreamDestination();
      source.connect(destination); await context.resume();
      const stream=canvas.captureStream(1); destination.stream.getAudioTracks().forEach((track)=>stream.addTrack(track));
      const recorder=new MediaRecorder(stream,{mimeType,videoBitsPerSecond:resolution==="1080"?2500000:1500000,audioBitsPerSecond:192000});
      const chunks: BlobPart[]=[]; recorder.ondataavailable=(event)=>{if(event.data.size)chunks.push(event.data);};
      const stopped=new Promise<Blob>((resolve,reject)=>{recorder.onerror=()=>reject(new Error("Não foi possível codificar o vídeo."));recorder.onstop=()=>resolve(new Blob(chunks,{type:mimeType}));});
      const update=()=>setProgress(Math.min(99,(audio.currentTime/Math.max(audio.duration,0.01))*100));
      audio.addEventListener("timeupdate",update); audio.currentTime=0; recorder.start(1000); await audio.play();
      await new Promise<void>((resolve,reject)=>{audio.addEventListener("ended",()=>resolve(),{once:true});audio.addEventListener("error",()=>reject(new Error("O navegador não conseguiu reproduzir este formato de áudio.")),{once:true});});
      if(recorder.state!=="inactive")recorder.stop(); const blob=await stopped; audio.removeEventListener("timeupdate",update);
      source.disconnect(); destination.disconnect(); await context.close(); audioContextRef.current=null;
      if(!blob.size)throw new Error("O vídeo gerado ficou vazio. Tente outro arquivo.");
      setResult({blob,url:URL.createObjectURL(blob),name:safeOutputName(file.name)}); setProgress(100); setStatus("success");
    } catch (nextError) {
      setError(nextError instanceof Error?nextError.message:"Não foi possível criar o vídeo."); setStatus("error");
      try { await audioContextRef.current?.close(); } catch {} audioContextRef.current=null;
    }
  }
  function download() { if(!result)return; const link=document.createElement("a");link.href=result.url;link.download=result.name;link.click(); }

  return <ToolPageShell title="Áudio para YouTube" description="Transforme WAV, MP3 e outros arquivos de áudio em vídeo com capa, pronto para enviar ao YouTube." categoryName="Áudio" categoryHref="/ferramentas/audio" breadcrumbRootName="Início" breadcrumbRootHref="/" processingMode="local" privacyMessage="Seu áudio e sua capa são processados diretamente no navegador e não são enviados para servidores do Kivai.">
    <Card className="mx-auto max-w-5xl overflow-hidden"><CardHeader><CardTitle>Criar vídeo a partir do áudio</CardTitle><CardDescription>Envie WAV, MP3, M4A, AAC ou FLAC. A ferramenta adiciona uma capa e gera um vídeo WebM compatível com upload no YouTube.</CardDescription></CardHeader><CardContent className="space-y-6">
      {!file && <ToolUploadArea accept="audio/*,.wav,.mp3,.m4a,.aac,.flac" formats="WAV, MP3, M4A, AAC ou FLAC" maxSizeLabel="500 MB" error={error} onFilesSelected={selectAudio} label="Selecionar áudio para preparar para o YouTube" />}
      <ToolProcessingStatus status={status} message={status==="processing"?"Criando vídeo · " + Math.round(progress) + "%":""} />
      {file && !result && <><section className="flex min-w-0 items-center gap-4 rounded-lg border border-border p-4"><FileAudio className="size-8 shrink-0 text-primary"/><div className="min-w-0 flex-1"><p className="break-all font-medium">{file.name}</p><p className="mt-1 text-sm text-muted-foreground">{formatFileSize(file.size)}{duration?" · " + formatDuration(duration):""}</p></div></section>
        <audio ref={audioRef} src={audioUrl} preload="metadata" className="w-full" controls onLoadedMetadata={(event)=>setDuration(event.currentTarget.duration)} onError={()=>{setError("Este navegador não conseguiu abrir o áudio selecionado.");setStatus("error");}} />
        <fieldset className="rounded-lg border border-border p-4"><div className="grid gap-5 sm:grid-cols-2"><div><p className="font-medium">Capa do vídeo</p><p className="mt-1 text-sm text-muted-foreground">Opcional. Envie qualquer proporção e ajuste para o quadro 16:9.</p><input ref={coverInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={selectCover}/><Button className="mt-3" type="button" variant="outline" onClick={()=>openFilePicker(coverInputRef.current)} disabled={status==="processing"}><ImagePlus className="size-4"/>{cover?"Trocar capa":"Adicionar capa"}</Button></div>
        <div><p className="font-medium">Resolução</p><div className="mt-3 flex gap-2"><Button type="button" variant={resolution==="1080"?"default":"outline"} onClick={()=>setResolution("1080")} disabled={status==="processing"}>1080p</Button><Button type="button" variant={resolution==="720"?"default":"outline"} onClick={()=>setResolution("720")} disabled={status==="processing"}>720p</Button></div><p className="mt-3 text-sm text-muted-foreground">Formato horizontal 16:9. Para áudio com imagem estática, 720p gera um arquivo menor.</p></div></div>
        {cover&&<div className="mt-5 border-t border-border pt-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">Ajustar capa em 16:9</p><p className="mt-1 text-sm text-muted-foreground">Arraste a imagem para reposicionar. No modo Ajustar, o espaço restante recebe um fundo desfocado.</p></div><div className="flex flex-wrap gap-2"><Button type="button" size="sm" variant={coverMode==="fill"?"default":"outline"} onClick={()=>{setCoverMode("fill");resetCoverEditor();}} disabled={status==="processing"}>Preencher</Button><Button type="button" size="sm" variant={coverMode==="fit"?"default":"outline"} onClick={()=>{setCoverMode("fit");resetCoverEditor();}} disabled={status==="processing"}>Ajustar</Button><Button type="button" size="sm" variant="outline" onClick={resetCoverEditor} disabled={status==="processing"}><RotateCcw className="size-4"/>Centralizar</Button></div></div>
        <div className="mt-4 overflow-hidden rounded-md border border-border bg-black"><canvas ref={editorCanvasRef} className="aspect-video h-auto w-full touch-none cursor-move select-none" onPointerDown={beginCoverDrag} onPointerMove={moveCover} onPointerUp={endCoverDrag} onPointerCancel={endCoverDrag} aria-label="Editor da capa em proporção 16:9"/></div>
        <label className="mt-4 block text-sm font-medium">Zoom <span className="ml-1 text-muted-foreground">{Math.round(coverZoom*100)}%</span><input type="range" min="1" max="3" step="0.01" value={coverZoom} onChange={(event)=>setCoverZoom(Number(event.target.value))} disabled={status==="processing"} className="mt-2 w-full accent-current"/></label></div>}</fieldset>
        <canvas ref={canvasRef} className="hidden"/><ToolErrorMessage message={error}/><ToolActionBar><Button size="lg" onClick={()=>void createVideo()} disabled={status==="processing"||!duration}><Video className="size-4"/>Criar vídeo para YouTube</Button><Button variant="outline" onClick={reset} disabled={status==="processing"}><RotateCcw className="size-4"/>Limpar</Button></ToolActionBar></>}
      {result&&<ToolResultCard title="Vídeo pronto para o YouTube" description={result.name + " · " + formatFileSize(result.blob.size) + " · WebM"} preview={<video src={result.url} controls preload="metadata" className="aspect-video w-full bg-black"/>} details={<p className="text-sm text-muted-foreground">O arquivo contém sua faixa de áudio e uma imagem estática em 16:9. WebM é um formato de vídeo aceito pelo YouTube.</p>} actions={<><Button onClick={download}><Download className="size-4"/>Baixar vídeo</Button><Button variant="outline" onClick={reset}><RotateCcw className="size-4"/>Converter outro áudio</Button></>}/>}
      {!file&&status==="error"&&<ToolErrorMessage message={error}/>}
    </CardContent></Card>
  </ToolPageShell>;
}
