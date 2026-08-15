"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { MP4_AVI_ACCEPT, MP4_AVI_MAX_FILE_SIZE, MP4_AVI_MAX_FILE_SIZE_LABEL, type Mp4AviFps, type Mp4AviQuality, type Mp4AviResolution } from "./config";

type VideoMetadata = {
  size: number;
  duration: number;
  width: number;
  height: number;
  fps: number | null;
  videoCodec: string;
  audioCodec: string | null;
  hasAudio: boolean;
  strategy: "remux" | "transcode";
};

type ConversionResult = {
  blob: Blob;
  url: string;
  name: string;
  duration: number;
  width: number;
  height: number;
  fps: number | null;
  videoCodec: string;
  audioCodec: string | null;
  strategy: "remux" | "transcode";
  originalSize: number;
  originalDuration: number;
  originalWidth: number;
  originalHeight: number;
};

const fallbackError = "Não foi possível converter este vídeo para AVI. Tente novamente com outro arquivo.";

function backendUrl() {
  if (typeof window !== "undefined" && ["localhost", "127.0.0.1"].includes(window.location.hostname)) return "http://127.0.0.1:8000";
  return (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_KIVAI_BACKEND_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
}

function safeName(name: string) {
  const base = name.replace(/\.[^.]+$/, "").normalize("NFKC").replace(/[\\/:*?"<>|\u0000-\u001f]/g, "-").replace(/\s+/g, " ").trim().slice(0, 120) || "video";
  return `${base}.avi`;
}

function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "--:--";
  const hours = Math.floor(seconds / 3600), minutes = Math.floor((seconds % 3600) / 60), rest = Math.floor(seconds % 60);
  return hours ? `${hours}:${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}` : `${minutes}:${String(rest).padStart(2, "0")}`;
}

function codecLabel(codec: string | null) {
  if (!codec) return "Sem áudio";
  return ({ h264: "H.264", hevc: "HEVC/H.265", aac: "AAC", mpeg4: "MPEG-4 Part 2", mp3: "MP3", av1: "AV1" } as Record<string, string>)[codec] || codec.toUpperCase();
}

async function responseMessage(response: Response, fallback: string) {
  try { return ((await response.json()) as { detail?: string }).detail || fallback; }
  catch { return fallback; }
}

export default function Mp4ParaAviClient() {
  const replaceRef = useRef<HTMLInputElement>(null);
  const inspectController = useRef<AbortController | null>(null);
  const convertController = useRef<AbortController | null>(null);
  const resultUrl = useRef<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [quality, setQuality] = useState<Mp4AviQuality>("auto");
  const [resolution, setResolution] = useState<Mp4AviResolution>("original");
  const [fps, setFps] = useState<Mp4AviFps>("original");
  const [status, setStatus] = useState<ToolStatus>("idle");
  const [activity, setActivity] = useState<"inspect" | "convert" | null>(null);
  const [stage, setStage] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<ConversionResult | null>(null);

  useEffect(() => () => {
    inspectController.current?.abort();
    convertController.current?.abort();
    if (resultUrl.current) URL.revokeObjectURL(resultUrl.current);
  }, []);

  const willRemux = useMemo(() => metadata?.strategy === "remux" && quality === "auto" && resolution === "original" && fps === "original", [metadata, quality, resolution, fps]);

  function clearResult() {
    if (resultUrl.current) URL.revokeObjectURL(resultUrl.current);
    resultUrl.current = null;
    setResult(null);
  }

  function clearSelection() {
    inspectController.current?.abort();
    convertController.current?.abort();
    clearResult();
    setFile(null);
    setMetadata(null);
    setStatus("idle");
    setActivity(null);
    setStage("");
    setError("");
  }

  async function select(files: File[]) {
    const next = files[0];
    if (!next || activity === "convert") return;
    inspectController.current?.abort();
    clearResult();
    setMetadata(null);
    setError("");
    const extension = next.name.split(".").pop()?.toLowerCase();
    const acceptedTypes = ["video/mp4", "application/mp4", "application/octet-stream", ""];
    if (!next.size || extension !== "mp4" || !acceptedTypes.includes(next.type)) {
      setFile(null); setError("Selecione um vídeo MP4 válido."); setStatus("error"); return;
    }
    if (next.size > MP4_AVI_MAX_FILE_SIZE) {
      setFile(null); setError("O vídeo ultrapassa o limite permitido."); setStatus("error"); return;
    }

    const controller = new AbortController();
    inspectController.current = controller;
    setFile(next); setStatus("processing"); setActivity("inspect"); setStage("Analisando container e codecs");
    try {
      const form = new FormData(); form.append("file", next, next.name);
      const response = await fetch(`${backendUrl()}/video/mp4-to-avi/inspect`, { method: "POST", body: form, cache: "no-store", signal: controller.signal });
      if (!response.ok) throw new Error(await responseMessage(response, "Não foi possível ler este vídeo. Verifique o arquivo e tente novamente."));
      const inspected = await response.json() as VideoMetadata;
      setMetadata(inspected); setStatus("ready"); setStage("");
    } catch (nextError) {
      if (controller.signal.aborted) return;
      const message = nextError instanceof Error ? nextError.message : "Não foi possível ler este vídeo. Verifique o arquivo e tente novamente.";
      setFile(null); setError(message.includes("Failed to fetch") ? "Não foi possível acessar o serviço de conversão. Verifique sua conexão e tente novamente." : message); setStatus("error"); setStage("");
    } finally {
      if (inspectController.current === controller) { inspectController.current = null; setActivity(null); }
    }
  }

  async function convert() {
    if (!file || !metadata || status === "processing") return;
    const controller = new AbortController();
    convertController.current = controller;
    setError(""); setStatus("processing"); setActivity("convert"); setStage(willRemux ? "Convertendo para AVI sem recodificação" : "Recodificando e gerando o AVI");
    try {
      const form = new FormData(); form.append("file", file, file.name); form.append("quality", quality); form.append("resolution", resolution); form.append("fps", fps);
      const response = await fetch(`${backendUrl()}/video/mp4-to-avi`, { method: "POST", body: form, cache: "no-store", signal: controller.signal });
      if (!response.ok) throw new Error(await responseMessage(response, fallbackError));
      const blob = await response.blob();
      if (!blob.size || !["video/x-msvideo", "video/avi", "application/octet-stream"].includes(blob.type)) throw new Error(fallbackError);
      clearResult();
      const url = URL.createObjectURL(blob);
      resultUrl.current = url;
      setResult({
        blob, url, name: safeName(file.name), duration: Number(response.headers.get("X-Video-Duration")) || metadata.duration,
        width: Number(response.headers.get("X-Video-Width")) || metadata.width, height: Number(response.headers.get("X-Video-Height")) || metadata.height,
        fps: Number(response.headers.get("X-Video-FPS")) || metadata.fps, videoCodec: response.headers.get("X-Video-Codec") || "mpeg4",
        audioCodec: response.headers.get("X-Audio-Codec") === "none" ? null : response.headers.get("X-Audio-Codec") || (metadata.hasAudio ? "mp3" : null),
        strategy: response.headers.get("X-Conversion-Strategy") === "remux" ? "remux" : "transcode",
        originalSize: Number(response.headers.get("X-Video-Original-Size")) || file.size,
        originalDuration: metadata.duration, originalWidth: metadata.width, originalHeight: metadata.height,
      });
      setStatus("success"); setStage("");
    } catch (nextError) {
      if (controller.signal.aborted) { setError("A conversão foi cancelada."); setStatus("ready"); }
      else {
        const message = nextError instanceof Error ? nextError.message : fallbackError;
        setError(message.includes("Failed to fetch") ? "Não foi possível acessar o serviço de conversão. Verifique sua conexão e tente novamente." : message); setStatus("error");
      }
      setStage("");
    } finally {
      if (convertController.current === controller) { convertController.current = null; setActivity(null); }
    }
  }

  function cancel() { if (activity === "convert") convertController.current?.abort(); }
  function download() {
    if (!result) return;
    const link = document.createElement("a"); link.href = result.url; link.download = result.name; link.rel = "noopener"; link.style.display = "none";
    document.body.appendChild(link); link.click(); link.remove();
  }

  return <ToolPageShell title="Converter MP4 para AVI" description="Converta seu vídeo MP4 para AVI usando a mesma tecnologia de conversão do Kivai." categoryName="Vídeos" categoryHref="/ferramentas/videos" breadcrumbRootName="Início" breadcrumbRootHref="/" processingMode="server" privacyMessage="O vídeo é enviado por conexão segura ao serviço de conversão e removido após o processamento.">
    <Card className="mx-auto max-w-5xl overflow-hidden"><CardHeader><CardTitle>Converter MP4 para AVI</CardTitle><CardDescription>Um vídeo MP4 por vez, até {MP4_AVI_MAX_FILE_SIZE_LABEL}. Resolução, proporção, orientação e duração são preservadas por padrão.</CardDescription></CardHeader><CardContent className="space-y-6">
      {!file && activity !== "inspect" && <ToolUploadArea accept={MP4_AVI_ACCEPT} formats="MP4" maxSizeLabel={MP4_AVI_MAX_FILE_SIZE_LABEL} error={error} onFilesSelected={(files) => void select(files)} label="Selecionar vídeo MP4 para converter em AVI" />}
      <ToolProcessingStatus status={status} message={stage} />
      {file && <section aria-label="Vídeo selecionado" className="rounded-lg border border-border p-4"><div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center"><FileVideo2 className="size-8 shrink-0 text-primary" aria-hidden="true" /><div className="min-w-0 flex-1"><p className="break-all font-medium">{file.name}</p><p className="mt-1 text-sm text-muted-foreground">{formatFileSize(file.size)}{!metadata ? " · Analisando informações do vídeo" : " · MP4 verificado"}</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={clearSelection} disabled={status === "processing"}><Trash2 className="size-4" />Remover</Button><input ref={replaceRef} type="file" accept={MP4_AVI_ACCEPT} className="sr-only" onChange={(event) => { void select(Array.from(event.target.files || [])); event.target.value = ""; }} /><Button variant="outline" size="sm" onClick={() => openFilePicker(replaceRef.current)} disabled={status === "processing"}><RefreshCw className="size-4" />Substituir</Button></div></div>
        {metadata && <dl className="mt-4 grid gap-3 border-t border-border pt-4 text-sm sm:grid-cols-2 lg:grid-cols-3"><Meta label="Duração" value={formatDuration(metadata.duration)} /><Meta label="Resolução" value={`${metadata.width} × ${metadata.height}`} /><Meta label="FPS" value={metadata.fps ? `${metadata.fps.toFixed(metadata.fps % 1 ? 2 : 0)} FPS` : "Não informado"} /><Meta label="Vídeo" value={codecLabel(metadata.videoCodec)} /><Meta label="Áudio" value={metadata.hasAudio ? codecLabel(metadata.audioCodec) : "Sem áudio"} /><Meta label="Container" value="MP4" /></dl>}
      </section>}
      {metadata && !result && <><fieldset className="rounded-lg border border-border p-4"><legend className="px-2 font-medium">Configurações do AVI</legend><div className="mt-2 grid gap-4 md:grid-cols-3"><Select label="Qualidade" value={quality} onChange={(value) => setQuality(value as Mp4AviQuality)} disabled={status === "processing"} options={[["auto", "Automática"], ["high", "Alta qualidade"], ["small", "Arquivo menor"]]} /><Select label="Resolução" value={resolution} onChange={(value) => setResolution(value as Mp4AviResolution)} disabled={status === "processing"} options={[["original", "Manter original"], ["2160", "2160p"], ["1080", "1080p"], ["720", "720p"], ["480", "480p"]]} /><Select label="FPS" value={fps} onChange={(value) => setFps(value as Mp4AviFps)} disabled={status === "processing"} options={[["original", "Manter original"], ["60", "60 FPS"], ["30", "30 FPS"], ["24", "24 FPS"]]} /></div><p className="mt-3 text-sm text-muted-foreground">A ferramenta nunca aumenta automaticamente a resolução ou o FPS do arquivo.</p></fieldset>
        <div role="status" className={`border p-4 text-sm ${willRemux ? "border-primary/30 bg-primary/5" : "border-border bg-muted/20"}`}><p className="font-medium">{willRemux ? "Conversão rápida disponível" : "Recodificação necessária"}</p><p className="mt-1 leading-6 text-muted-foreground">{willRemux ? "Os streams já são compatíveis com AVI e podem ser copiados sem recompressão." : "Para gerar um AVI amplamente compatível, o vídeo será convertido para MPEG-4 Part 2 e o áudio para MP3 quando presente."}</p></div>
        <ToolErrorMessage message={error} /><ToolActionBar><Button size="lg" onClick={() => void convert()} disabled={status === "processing"}><FileVideo2 className="size-4" />Converter para AVI</Button>{activity === "convert" && <Button variant="outline" onClick={cancel}><X className="size-4" />Cancelar conversão</Button>}</ToolActionBar></>}
      {!file && status === "error" && <ToolErrorMessage message={error} />}
      {result && <ToolResultCard title="AVI pronto para baixar" description={`${result.name} · ${formatDuration(result.duration)} · ${result.width} × ${result.height}px · ${formatFileSize(result.blob.size)}`} preview={<div className="grid min-h-48 place-items-center border border-border bg-muted/20 p-6 text-center"><div><FileVideo2 className="mx-auto size-12 text-primary" aria-hidden="true" /><p className="mt-4 font-medium">Arquivo AVI gerado e verificado</p><p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Navegadores normalmente não reproduzem AVI diretamente. Baixe o arquivo e abra em um player ou programa compatível.</p></div></div>} details={<div className="grid gap-4 sm:grid-cols-2"><ResultSummary title="Arquivo original" lines={[`MP4 · ${formatFileSize(result.originalSize)}`, `${result.originalWidth} × ${result.originalHeight} · ${formatDuration(result.originalDuration)}`]} /><ResultSummary title="Arquivo convertido" lines={[`AVI · ${formatFileSize(result.blob.size)}`, `${result.width} × ${result.height} · ${formatDuration(result.duration)}`, `${codecLabel(result.videoCodec)} · ${result.audioCodec ? codecLabel(result.audioCodec) : "Sem áudio"}`]} /><p className="sm:col-span-2 text-sm font-medium text-primary">{result.strategy === "remux" ? "Conversão sem recompressão por remux" : "Conversão com recodificação para AVI"}</p></div>} actions={<><Button onClick={download}><Download className="size-4" />Baixar AVI</Button><Button variant="outline" onClick={clearSelection}><RotateCcw className="size-4" />Converter outro vídeo</Button></>} />}
    </CardContent></Card>
  </ToolPageShell>;
}

function Meta({ label, value }: { label: string; value: string }) { return <div><dt className="text-muted-foreground">{label}</dt><dd className="mt-1 font-medium">{value}</dd></div>; }
function Select({ label, value, onChange, disabled, options }: { label: string; value: string; onChange: (value: string) => void; disabled: boolean; options: readonly (readonly [string, string])[] }) { const id = `mp4-avi-${label.toLowerCase()}`; return <label htmlFor={id} className="grid gap-2 text-sm font-medium">{label}<select id={id} value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} className="min-h-11 rounded-md border border-input bg-background px-3">{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select></label>; }
function ResultSummary({ title, lines }: { title: string; lines: string[] }) { return <div className="rounded-lg border border-border p-4"><h3 className="font-medium">{title}</h3>{lines.map((line) => <p key={line} className="mt-1 text-sm text-muted-foreground">{line}</p>)}</div>; }
