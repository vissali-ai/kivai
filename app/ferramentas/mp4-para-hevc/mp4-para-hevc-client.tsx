"use client";

import { useEffect, useRef, useState } from "react";
import { Download, FileVideo2, RefreshCw, RotateCcw, Trash2 } from "lucide-react";
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
import { MP4_HEVC_MAX_FILE_SIZE, MP4_HEVC_MAX_FILE_SIZE_LABEL, type Mp4HevcQuality } from "./config";

type Result = { blob: Blob; url: string; name: string; duration: number; width: number; height: number };
const fallbackError = "Não foi possível converter o vídeo para HEVC. Tente novamente com outro arquivo.";

function backendUrl() {
  if (typeof window !== "undefined" && ["localhost", "127.0.0.1"].includes(window.location.hostname)) return "http://127.0.0.1:8000";
  return (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_KIVAI_BACKEND_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
}
function safeName(name: string) {
  const base = name.replace(/\.[^.]+$/, "").normalize("NFKC").replace(/[\\/:*?"<>|\u0000-\u001f]/g, "-").replace(/\s+/g, " ").trim().slice(0, 115) || "video";
  return `${base}-hevc.mp4`;
}
function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds)) return "--:--";
  const hours = Math.floor(seconds / 3600), minutes = Math.floor((seconds % 3600) / 60), rest = Math.floor(seconds % 60);
  return hours ? `${hours}:${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}` : `${minutes}:${String(rest).padStart(2, "0")}`;
}
async function responseMessage(response: Response) {
  try { return ((await response.json()) as { detail?: string }).detail || fallbackError; } catch { return fallbackError; }
}

export default function Mp4ParaHevcClient() {
  const replaceRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [quality, setQuality] = useState<Mp4HevcQuality>("auto");
  const [status, setStatus] = useState<ToolStatus>("idle");
  const [stage, setStage] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  useEffect(() => () => { if (result) URL.revokeObjectURL(result.url); }, [result]);

  function clearResult() { if (result) URL.revokeObjectURL(result.url); setResult(null); }
  function select(files: File[]) {
    const next = files[0]; if (!next || status === "processing") return;
    clearResult(); setError("");
    if (!next.size) { setError("Não foi possível ler este vídeo."); setStatus("error"); return; }
    if (next.size > MP4_HEVC_MAX_FILE_SIZE) { setError("O vídeo ultrapassa o limite permitido."); setStatus("error"); return; }
    if (next.type !== "video/mp4" && next.name.split(".").pop()?.toLowerCase() !== "mp4") { setError("Selecione um vídeo MP4 compatível."); setStatus("error"); return; }
    setFile(next); setStatus("ready");
  }
  function reset() { clearResult(); setFile(null); setQuality("auto"); setStatus("idle"); setStage(""); setError(""); }
  async function convert() {
    if (!file || status === "processing") return;
    setError(""); setStatus("processing"); setStage("Lendo vídeo");
    const stages = ["Analisando MP4", "Preparando conversão", "Codificando em HEVC", "Finalizando arquivo"];
    let index = 0; const timer = window.setInterval(() => { if (index < stages.length) setStage(stages[index++]); }, 1600);
    try {
      const form = new FormData(); form.append("file", file, file.name); form.append("quality", quality);
      const response = await fetch(`${backendUrl()}/video/mp4-to-hevc`, { method: "POST", body: form, cache: "no-store" });
      if (!response.ok) throw new Error(await responseMessage(response));
      const blob = await response.blob(); if (!blob.size || !blob.type.includes("video/mp4")) throw new Error(fallbackError);
      clearResult(); setResult({ blob, url: URL.createObjectURL(blob), name: safeName(file.name), duration: Number(response.headers.get("X-Video-Duration")) || 0, width: Number(response.headers.get("X-Video-Width")) || 0, height: Number(response.headers.get("X-Video-Height")) || 0 });
      setStatus("success"); setStage("");
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : fallbackError;
      setError(message.includes("Failed to fetch") ? "Não foi possível acessar o serviço de conversão. Verifique sua conexão e tente novamente." : message); setStatus("error"); setStage("");
    } finally { window.clearInterval(timer); }
  }
  function download() { if (!result) return; const link = document.createElement("a"); link.href = result.url; link.download = result.name; link.click(); }

  return <ToolPageShell title="Converter MP4 para HEVC" description="Converta vídeos MP4 para HEVC/H.265 e obtenha arquivos mais eficientes." categoryName="Vídeos" categoryHref="/ferramentas/videos" breadcrumbRootName="Início" breadcrumbRootHref="/" processingMode="server" privacyMessage="O vídeo é enviado por conexão segura ao serviço de conversão e removido após o processamento.">
    <Card className="mx-auto max-w-5xl overflow-hidden"><CardHeader><CardTitle>Converter MP4 para HEVC</CardTitle><CardDescription>Um vídeo por vez, até {MP4_HEVC_MAX_FILE_SIZE_LABEL}. O resultado permanece em container MP4, com vídeo HEVC/H.265 e áudio AAC quando houver.</CardDescription></CardHeader><CardContent className="space-y-6">
      {!file && status !== "processing" && <ToolUploadArea accept="video/mp4,.mp4" formats="MP4" maxSizeLabel={MP4_HEVC_MAX_FILE_SIZE_LABEL} error={error} onFilesSelected={select} label="Selecionar vídeo MP4 para converter em HEVC" />}
      <ToolProcessingStatus status={status} message={stage} />
      {file && !result && <><section aria-label="Vídeo selecionado" className="flex min-w-0 flex-col gap-4 rounded-lg border border-border p-4 sm:flex-row sm:items-center"><FileVideo2 className="size-8 shrink-0 text-primary" aria-hidden="true" /><div className="min-w-0 flex-1"><p className="break-all font-medium">{file.name}</p><p className="mt-1 text-sm text-muted-foreground">{formatFileSize(file.size)} · Formato verificado durante a conversão</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={reset} disabled={status === "processing"}><Trash2 className="size-4" />Remover</Button><input ref={replaceRef} type="file" accept="video/mp4,.mp4" className="sr-only" onChange={(event) => { select(Array.from(event.target.files || [])); event.target.value = ""; }} /><Button variant="outline" size="sm" onClick={() => openFilePicker(replaceRef.current)} disabled={status === "processing"}><RefreshCw className="size-4" />Substituir</Button></div></section>
        <fieldset className="rounded-lg border border-border p-4"><legend className="px-2 font-medium">Qualidade do HEVC</legend><label htmlFor="mp4-hevc-quality" className="mt-2 block text-sm font-medium">Perfil de conversão</label><select id="mp4-hevc-quality" value={quality} onChange={(event) => setQuality(event.target.value as Mp4HevcQuality)} disabled={status === "processing"} className="mt-2 min-h-11 w-full rounded-md border border-input bg-background px-3 sm:max-w-md"><option value="auto">Automática</option><option value="high">Alta qualidade</option><option value="small">Arquivo menor</option></select><p className="mt-2 text-sm text-muted-foreground">A resolução é mantida. O perfil ajusta a compressão e o tempo de processamento.</p></fieldset>
        <ToolErrorMessage message={error} /><ToolActionBar><Button size="lg" onClick={() => void convert()} disabled={status === "processing"}><FileVideo2 className="size-4" />Converter para HEVC</Button></ToolActionBar></>}
      {!file && status === "error" && <ToolErrorMessage message={error} />}
      {result && <ToolResultCard title="Vídeo HEVC pronto para baixar" description={`${result.name} · ${formatDuration(result.duration)} · ${result.width} × ${result.height}px · ${formatFileSize(result.blob.size)}`} preview={<video src={result.url} controls preload="metadata" className="max-h-[32rem] w-full bg-black" aria-label="Prévia do vídeo HEVC convertido" />} details={<p className="text-sm text-muted-foreground">Container: MP4 · Vídeo: HEVC/H.265 · Áudio: AAC quando presente no original.</p>} actions={<><Button onClick={download}><Download className="size-4" />Baixar vídeo HEVC</Button><Button variant="outline" onClick={reset}><RotateCcw className="size-4" />Converter outro vídeo</Button></>} />}
    </CardContent></Card>
  </ToolPageShell>;
}
