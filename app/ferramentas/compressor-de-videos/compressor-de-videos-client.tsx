"use client";

import { useEffect, useRef, useState } from "react";
import { Download, FileVideo2, RefreshCw, RotateCcw, Trash2, X } from "lucide-react";
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
import { AUDIO_BITRATES, type VideoBitrate, type VideoCodec, type VideoFps, type VideoResolution } from "./types";
import { HEIGHT_BITRATES, MODE_OPTIONS, PRESET_OPTIONS, VIDEO_COMPRESS_ACCEPT, VIDEO_COMPRESS_EXTENSIONS, VIDEO_COMPRESS_MAX_SIZE, VIDEO_COMPRESS_MAX_SIZE_LABEL, type AudioMode, type CompressionMode, type CompressionPreset } from "./config";

type Metadata = { format: string; duration: number; width: number; height: number; videoCodec: string; audioCodec: string | null; hasAudio: boolean; fps: number | null; size: number };
type Result = { blob: Blob; url: string; name: string; width: number; height: number; duration: number; codec: string };
const genericError = "Não foi possível comprimir este vídeo. Tente novamente com outro arquivo ou configuração.";

function backendUrl() {
  if (typeof window !== "undefined" && ["localhost", "127.0.0.1"].includes(window.location.hostname)) return "http://127.0.0.1:8000";
  return (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_KIVAI_BACKEND_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
}
function safeName(name: string) {
  const base = name.replace(/\.[^.]+$/, "").normalize("NFKC").replace(/[\\/:*?"<>|\u0000-\u001f]/g, "-").replace(/\s+/g, " ").trim().slice(0, 110) || "video";
  return `${base}-comprimido.mp4`;
}
function formatDuration(seconds: number) {
  const value = Math.max(0, Math.floor(seconds)); const h = Math.floor(value / 3600), m = Math.floor((value % 3600) / 60), s = value % 60;
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
}
async function responseMessage(response: Response) { try { return ((await response.json()) as { detail?: string }).detail || genericError; } catch { return genericError; } }
function estimate(metadata: Metadata, mode: CompressionMode, resolution: VideoResolution, bitrate: VideoBitrate, customBitrate: number, audio: AudioMode, audioBitrate: number, targetMb: string) {
  if (targetMb && Number(targetMb) > 0) return Math.min(metadata.size, Number(targetMb) * 1024 * 1024);
  const selectedHeight = resolution === "auto" ? (mode === "light" ? metadata.height : Math.min(metadata.height, mode === "balanced" ? 1080 : 720)) : resolution === "original" ? metadata.height : Math.min(metadata.height, Number(resolution));
  const nearest = Number(Object.keys(HEIGHT_BITRATES).reduce((a, b) => Math.abs(Number(b) - selectedHeight) < Math.abs(Number(a) - selectedHeight) ? b : a));
  const autoRate = HEIGHT_BITRATES[nearest] * MODE_OPTIONS[mode].factor;
  const videoRate = bitrate === "custom" ? customBitrate : bitrate === "low" ? autoRate * .65 : bitrate === "high" ? autoRate * 1.35 : autoRate;
  const audioRate = audio === "remove" || !metadata.hasAudio ? 0 : audioBitrate;
  return Math.min(metadata.size * 1.2, (videoRate + audioRate) * 1000 / 8 * metadata.duration);
}

export default function CompressorDeVideosClient() {
  const replaceRef = useRef<HTMLInputElement>(null), activeRequest = useRef<AbortController | null>(null), originalUrl = useRef(""), resultUrl = useRef("");
  const [file, setFile] = useState<File | null>(null), [metadata, setMetadata] = useState<Metadata | null>(null), [result, setResult] = useState<Result | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [status, setStatus] = useState<ToolStatus>("idle"), [stage, setStage] = useState(""), [error, setError] = useState("");
  const [mode, setMode] = useState<CompressionMode>("balanced"), [preset, setPreset] = useState<CompressionPreset>("custom"), [resolution, setResolution] = useState<VideoResolution>("auto");
  const [fps, setFps] = useState<VideoFps>("original"), [bitrate, setBitrate] = useState<VideoBitrate>("auto"), [customBitrate, setCustomBitrate] = useState(2500);
  const [codec, setCodec] = useState<VideoCodec>("h264"), [audio, setAudio] = useState<AudioMode>("keep"), [audioBitrate, setAudioBitrate] = useState(128), [targetEnabled, setTargetEnabled] = useState(false), [targetMb, setTargetMb] = useState("");
  useEffect(() => () => { activeRequest.current?.abort(); if (originalUrl.current) URL.revokeObjectURL(originalUrl.current); if (resultUrl.current) URL.revokeObjectURL(resultUrl.current); }, []);

  function clearResult() { if (resultUrl.current) URL.revokeObjectURL(resultUrl.current); resultUrl.current = ""; setResult(null); }
  function clearFile() { activeRequest.current?.abort(); clearResult(); if (originalUrl.current) URL.revokeObjectURL(originalUrl.current); originalUrl.current = ""; setPreviewUrl(""); setFile(null); setMetadata(null); }
  function reset() { clearFile(); setStatus("idle"); setStage(""); setError(""); setPreset("custom"); setMode("balanced"); setResolution("auto"); setTargetEnabled(false); setTargetMb(""); }
  async function select(files: File[]) {
    const next = files[0]; if (!next || status === "processing") return;
    clearFile(); setError("");
    const extension = next.name.split(".").pop()?.toLowerCase() || "";
    if (!next.size || !VIDEO_COMPRESS_EXTENSIONS.includes(extension)) { setError("Selecione um arquivo de vídeo válido."); setStatus("error"); return; }
    if (next.size > VIDEO_COMPRESS_MAX_SIZE) { setError("O vídeo ultrapassa o limite permitido."); setStatus("error"); return; }
    setFile(next); originalUrl.current = URL.createObjectURL(next); setPreviewUrl(originalUrl.current); setStatus("processing"); setStage("Analisando arquivo");
    const controller = new AbortController(); activeRequest.current = controller;
    try {
      const form = new FormData(); form.append("file", next, next.name);
      const response = await fetch(`${backendUrl()}/video/compress/inspect`, { method: "POST", body: form, signal: controller.signal, cache: "no-store" });
      if (!response.ok) throw new Error(await responseMessage(response));
      setMetadata(await response.json() as Metadata); setStatus("ready"); setStage("");
    } catch (nextError) {
      if ((nextError as Error).name === "AbortError") { clearFile(); setStatus("idle"); setStage(""); return; }
      const message = nextError instanceof Error ? nextError.message : "O codec deste vídeo não pôde ser processado.";
      clearFile(); setError(message.includes("Failed to fetch") ? "Não foi possível acessar o serviço de compressão. Verifique sua conexão e tente novamente." : message); setStatus("error"); setStage("");
    } finally { if (activeRequest.current === controller) activeRequest.current = null; }
  }
  function applyPreset(value: CompressionPreset) {
    setPreset(value); const option = PRESET_OPTIONS[value]; setMode(option.mode); setResolution(option.resolution as VideoResolution); setAudio(option.audio as AudioMode); setAudioBitrate(option.audioBitrate);
  }
  async function compress() {
    if (!file || !metadata || status === "processing") return;
    clearResult(); setError(""); setStatus("processing"); setStage("Lendo vídeo");
    const controller = new AbortController(); activeRequest.current = controller;
    const stages = ["Preparando compressão", "Comprimindo vídeo", metadata.hasAudio && audio !== "remove" ? "Processando áudio" : "Finalizando arquivo", "Finalizando arquivo"].filter(Boolean);
    let index = 0; const timer = window.setInterval(() => { if (index < stages.length) setStage(stages[index++]); }, 1800);
    try {
      const form = new FormData(); form.append("file", file, file.name); form.append("mode", mode); form.append("preset", preset); form.append("resolution", resolution); form.append("fps", fps); form.append("bitrate", bitrate); form.append("custom_bitrate", String(customBitrate)); form.append("codec", codec); form.append("audio", audio); form.append("audio_bitrate", String(audioBitrate)); if (targetEnabled && targetMb) form.append("target_mb", targetMb);
      const response = await fetch(`${backendUrl()}/video/compress`, { method: "POST", body: form, signal: controller.signal, cache: "no-store" });
      if (!response.ok) throw new Error(await responseMessage(response));
      const blob = await response.blob(); if (!blob.size || !blob.type.includes("video/mp4")) throw new Error(genericError);
      resultUrl.current = URL.createObjectURL(blob); setResult({ blob, url: resultUrl.current, name: safeName(file.name), width: Number(response.headers.get("X-Video-Width")), height: Number(response.headers.get("X-Video-Height")), duration: Number(response.headers.get("X-Video-Duration")), codec: response.headers.get("X-Video-Codec") || codec }); setStatus("success"); setStage("");
    } catch (nextError) {
      if ((nextError as Error).name === "AbortError") { setError("A compressão foi cancelada."); setStatus("ready"); setStage(""); return; }
      const message = nextError instanceof Error ? nextError.message : genericError; setError(message.includes("Failed to fetch") ? "Não foi possível acessar o serviço de compressão. Verifique sua conexão e tente novamente." : message); setStatus("error"); setStage("");
    } finally { window.clearInterval(timer); if (activeRequest.current === controller) activeRequest.current = null; }
  }
  function cancel() { activeRequest.current?.abort(); }
  function download() { if (!result) return; const link = document.createElement("a"); link.href = result.url; link.download = result.name; link.click(); }
  const estimated = metadata ? estimate(metadata, mode, resolution, bitrate, customBitrate, audio, audioBitrate, targetEnabled ? targetMb : "") : 0;
  const estimatedReduction = metadata ? Math.max(0, (1 - estimated / metadata.size) * 100) : 0;

  return <ToolPageShell title="Comprimir Vídeo Online" description="Reduza o tamanho do seu vídeo mantendo a melhor qualidade possível." categoryName="Vídeos" categoryHref="/ferramentas/videos" breadcrumbRootName="Início" breadcrumbRootHref="/" processingMode="server" privacyMessage="O vídeo é enviado por conexão segura ao serviço de compressão e os arquivos temporários são removidos após o processamento.">
    <Card className="mx-auto max-w-5xl overflow-hidden"><CardHeader><CardTitle>Comprimir Vídeo</CardTitle><CardDescription>Um arquivo por vez, até {VIDEO_COMPRESS_MAX_SIZE_LABEL}. Compatível com MP4, MOV, WebM, AVI, MKV, MPEG e MPG quando o codec puder ser processado.</CardDescription></CardHeader><CardContent className="space-y-6">
      {!file && status !== "processing" && <ToolUploadArea accept={VIDEO_COMPRESS_ACCEPT} formats="MP4, MOV, WebM, AVI, MKV, MPEG e MPG" maxSizeLabel={VIDEO_COMPRESS_MAX_SIZE_LABEL} error={error} onFilesSelected={(files) => void select(files)} label="Selecionar vídeo para comprimir" />}
      <ToolProcessingStatus status={status} message={stage} />
      {status === "processing" && file && <ToolActionBar><Button variant="outline" onClick={cancel}><X className="size-4" />Cancelar compressão</Button></ToolActionBar>}
      {file && metadata && !result && status !== "processing" && <>
        <section aria-label="Vídeo selecionado" className="rounded-lg border border-border p-4"><div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center"><FileVideo2 className="size-8 shrink-0 text-primary" /><div className="min-w-0 flex-1"><p className="break-all font-medium">{file.name}</p><p className="mt-1 text-sm text-muted-foreground">{formatFileSize(file.size)} · {metadata.format.toUpperCase()} · {metadata.width} × {metadata.height}px · {formatDuration(metadata.duration)} · {metadata.videoCodec.toUpperCase()} · {metadata.audioCodec?.toUpperCase() || "Sem áudio"}</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={reset}><Trash2 className="size-4" />Remover</Button><input ref={replaceRef} type="file" accept={VIDEO_COMPRESS_ACCEPT} className="sr-only" onChange={(event) => { void select(Array.from(event.target.files || [])); event.target.value = ""; }} /><Button variant="outline" size="sm" onClick={() => openFilePicker(replaceRef.current)}><RefreshCw className="size-4" />Substituir</Button></div></div><video src={previewUrl} controls preload="metadata" className="mt-4 max-h-80 w-full bg-black" aria-label="Prévia do vídeo original" /></section>
        <fieldset className="rounded-lg border border-border p-4"><legend className="px-2 font-medium">Modo de compressão</legend><div className="mt-2 grid gap-3 sm:grid-cols-3">{(Object.entries(MODE_OPTIONS) as [CompressionMode, typeof MODE_OPTIONS[CompressionMode]][]).map(([value, option]) => <label key={value} className="cursor-pointer rounded-lg border border-border p-4 has-[:checked]:border-primary has-[:checked]:bg-primary/5"><input type="radio" name="compression-mode" value={value} checked={mode === value} onChange={() => { setMode(value); setPreset("custom"); }} className="mr-2 accent-primary" /><span className="font-medium">{option.label}</span><span className="mt-2 block text-sm text-muted-foreground">{option.description}</span></label>)}</div></fieldset>
        <fieldset className="rounded-lg border border-border p-4"><legend className="px-2 font-medium">Presets úteis</legend><div className="mt-2 flex flex-wrap gap-2">{(Object.entries(PRESET_OPTIONS) as [CompressionPreset, typeof PRESET_OPTIONS[CompressionPreset]][]).filter(([key]) => key !== "custom").map(([value, option]) => <Button key={value} type="button" size="sm" variant={preset === value ? "default" : "outline"} onClick={() => applyPreset(value)}>{option.label}</Button>)}</div></fieldset>
        <div className="grid gap-4 sm:grid-cols-2"><label className="font-medium">Resolução<select value={resolution} onChange={(event) => { setResolution(event.target.value as VideoResolution); setPreset("custom"); }} className="mt-2 min-h-11 w-full rounded-md border border-input bg-background px-3"><option value="auto">Automático</option><option value="original">Manter original</option><option value="2160">2160p</option><option value="1080">1080p</option><option value="720">720p</option><option value="480">480p</option><option value="360">360p</option></select></label><label className="flex min-h-11 items-center gap-3 self-end rounded-md border border-border px-4"><input type="checkbox" checked readOnly className="accent-primary" />Manter proporção <span className="text-xs text-muted-foreground">(sempre ativo)</span></label></div>
        <fieldset className="rounded-lg border border-border p-4"><legend className="px-2 font-medium">Tamanho desejado</legend><label className="flex items-center gap-3"><input type="checkbox" checked={targetEnabled} onChange={(event) => setTargetEnabled(event.target.checked)} className="accent-primary" />Definir tamanho aproximado</label>{targetEnabled && <label className="mt-3 block max-w-xs text-sm font-medium">MB desejados<input type="number" min="1" max="200" step="1" value={targetMb} onChange={(event) => setTargetMb(event.target.value)} placeholder="25" className="mt-2 min-h-11 w-full rounded-md border border-input bg-background px-3" /></label>}<p className="mt-2 text-sm text-muted-foreground">O tamanho final é uma estimativa e pode variar conforme o conteúdo e o codec.</p></fieldset>
        <details className="rounded-lg border border-border p-4"><summary className="cursor-pointer font-medium">Configurações avançadas</summary><div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Select label="FPS" value={fps} onChange={(value) => setFps(value as VideoFps)} options={[["original","Original"],["60","60"],["30","30"],["24","24"]]} /><Select label="Bitrate" value={bitrate} onChange={(value) => setBitrate(value as VideoBitrate)} options={[["auto","Automático"],["low","Baixo"],["medium","Médio"],["high","Alto"],["custom","Personalizado"]]} />{bitrate === "custom" && <label className="text-sm font-medium">Bitrate do vídeo (kbps)<input type="number" min="150" max="50000" value={customBitrate} onChange={(event) => setCustomBitrate(Number(event.target.value))} className="mt-2 min-h-11 w-full rounded-md border border-input bg-background px-3" /></label>}<Select label="Codec de vídeo" value={codec} onChange={(value) => setCodec(value as VideoCodec)} options={[["h264","H.264 (mais compatível)"],["hevc","H.265/HEVC"]]} /><Select label="Áudio" value={audio} onChange={(value) => setAudio(value as AudioMode)} options={[["keep","Manter áudio"],["reduce","Reduzir qualidade"],["remove","Remover áudio"]]} />{audio !== "remove" && <Select label="Bitrate do áudio" value={String(audioBitrate)} onChange={(value) => setAudioBitrate(Number(value))} options={AUDIO_BITRATES.map((value) => [String(value),`${value} kbps`])} />}</div><p className="mt-3 text-sm text-muted-foreground">O FPS nunca será aumentado acima do original. A resolução também nunca será ampliada.</p></details>
        <section className="grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-3" aria-label="Estimativa do resultado"><Metric label="Tamanho original" value={formatFileSize(metadata.size)} /><Metric label="Tamanho estimado" value={`aproximadamente ${formatFileSize(estimated)}`} /><Metric label="Redução estimada" value={`${estimatedReduction.toFixed(1)}%`} /></section>
        {metadata.size < 2 * 1024 * 1024 && <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm">Este vídeo já possui um tamanho relativamente reduzido. Uma nova compressão pode diminuir a qualidade sem gerar grande economia.</p>}
        <ToolErrorMessage message={error} /><p className="text-sm text-muted-foreground">Vídeos maiores ou em alta resolução podem levar mais tempo para processar.</p><ToolActionBar><Button size="lg" onClick={() => void compress()} disabled={targetEnabled && (!targetMb || Number(targetMb) < 1)}><FileVideo2 className="size-4" />Comprimir vídeo</Button></ToolActionBar>
      </>}
      {result && metadata && <ToolResultCard title="Vídeo comprimido pronto" description={`${result.name} · ${result.width} × ${result.height}px · ${formatDuration(result.duration)} · MP4/${result.codec.toUpperCase()}`} preview={<video src={result.url} controls preload="metadata" className="max-h-[32rem] w-full bg-black" aria-label="Prévia do vídeo comprimido" />} details={<><div className="grid gap-3 sm:grid-cols-4"><Metric label="Original" value={formatFileSize(metadata.size)} /><Metric label="Comprimido" value={formatFileSize(result.blob.size)} /><Metric label="Economia" value={formatFileSize(Math.max(0, metadata.size - result.blob.size))} /><Metric label="Redução" value={`${((1 - result.blob.size / metadata.size) * 100).toFixed(1)}%`} /></div>{result.blob.size >= metadata.size && <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm">O arquivo gerado ficou maior que o original. Tente utilizar uma compressão maior ou reduzir a resolução.</p>}</>} actions={<><Button onClick={download}><Download className="size-4" />Baixar vídeo comprimido</Button><Button variant="outline" onClick={() => { clearResult(); setStatus("ready"); }}><RotateCcw className="size-4" />Comprimir novamente</Button></>} />}
    </CardContent></Card>
  </ToolPageShell>;
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: (readonly [string, string])[] }) { return <label className="text-sm font-medium">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 min-h-11 w-full rounded-md border border-input bg-background px-3">{options.map(([key, text]) => <option key={key} value={key}>{text}</option>)}</select></label>; }
function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-md bg-muted/30 p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 break-words font-medium">{value}</p></div>; }
