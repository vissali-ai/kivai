"use client";

import { ChangeEvent, DragEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { Download, Eye, EyeOff, FileLock2, RefreshCw, RotateCcw, Trash2, Unlock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ToolActionBar } from "@/components/tools/tool-action-bar";
import { ToolErrorMessage } from "@/components/tools/tool-error-message";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { ToolProcessingStatus, type ToolStatus } from "@/components/tools/tool-processing-status";
import { ToolResultCard } from "@/components/tools/tool-result-card";
import { openFilePicker } from "@/lib/browser/file-picker";
import { formatFileSize } from "@/lib/tool-files";
import { PDF_UNLOCK_MAX_FILE_SIZE, PDF_UNLOCK_MAX_FILE_SIZE_LABEL, PDF_UNLOCK_MAX_PAGES, type PdfInspection } from "./config";

type Result = { blob: Blob; url: string; name: string; pages: number };

function backendUrl() {
  if (typeof window !== "undefined" && ["localhost", "127.0.0.1"].includes(window.location.hostname)) return "http://127.0.0.1:8000";
  return (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_KIVAI_BACKEND_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
}

function safeOutputName(name: string) {
  const base = name.replace(/\.pdf$/i, "").normalize("NFKC").replace(/[\\/:*?"<>|\u0000-\u001f]/g, "-").replace(/\s+/g, " ").trim().slice(0, 120) || "documento";
  return `${base}-desbloqueado.pdf`;
}

async function responseMessage(response: Response, fallback: string) {
  try {
    const payload = await response.json() as { detail?: string };
    return payload.detail || fallback;
  } catch {
    return fallback;
  }
}

async function validatePdf(file: File) {
  if (file.size === 0) throw new Error("Selecione um arquivo no formato PDF.");
  if (file.size > PDF_UNLOCK_MAX_FILE_SIZE) throw new Error("O arquivo ultrapassa o limite permitido.");
  if (file.type && !["application/pdf", "application/octet-stream"].includes(file.type)) throw new Error("Selecione um arquivo no formato PDF.");
  if (!file.name.toLowerCase().endsWith(".pdf")) throw new Error("Selecione um arquivo no formato PDF.");
  const signature = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  if (new TextDecoder("ascii").decode(signature) !== "%PDF-") throw new Error("Selecione um arquivo no formato PDF.");
}

export default function DesbloquearPdfClient() {
  const inputRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [inspection, setInspection] = useState<PdfInspection | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<ToolStatus>("idle");
  const [stage, setStage] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => () => { if (result) URL.revokeObjectURL(result.url); }, [result]);

  function clearResult() {
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);
  }

  function reset() {
    clearResult();
    setFile(null); setInspection(null); setPassword(""); setShowPassword(false); setCapsLock(false); setError(""); setStage(""); setStatus("idle");
  }

  async function inspect(selected?: File) {
    if (!selected || status === "processing") return;
    clearResult(); setFile(null); setInspection(null); setPassword(""); setError(""); setStage("Validando PDF"); setStatus("processing");
    try {
      await validatePdf(selected);
      setStage("Verificando proteção");
      const form = new FormData(); form.append("file", selected, selected.name);
      const response = await fetch(`${backendUrl()}/pdf-unlock/inspect`, { method: "POST", body: form, cache: "no-store" });
      if (!response.ok) throw new Error(await responseMessage(response, "Não foi possível abrir este PDF. Verifique o arquivo e tente novamente."));
      const nextInspection = await response.json() as PdfInspection;
      setFile(selected); setInspection(nextInspection); setStatus("ready"); setStage("");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Não foi possível abrir este PDF. Verifique o arquivo e tente novamente.");
      setStatus("error"); setStage("");
    }
  }

  async function unlockPdf() {
    if (!file || !inspection || status === "processing" || inspection.protection === "none") return;
    if (inspection.passwordRequired && !password) { setError("Este PDF exige uma senha para ser desbloqueado."); return; }
    setError(""); setStatus("processing"); setStage("Abrindo documento");
    try {
      const form = new FormData(); form.append("file", file, file.name); form.append("password", password);
      setStage("Preparando nova versão");
      const response = await fetch(`${backendUrl()}/pdf-unlock`, { method: "POST", body: form, cache: "no-store" });
      if (!response.ok) throw new Error(await responseMessage(response, "Não foi possível desbloquear este PDF. Verifique a senha e tente novamente."));
      setStage("Finalizando PDF");
      const blob = await response.blob();
      if (blob.type !== "application/pdf" || blob.size === 0) throw new Error("Não foi possível desbloquear este PDF. Verifique a senha e tente novamente.");
      const pages = Number(response.headers.get("X-PDF-Page-Count")) || inspection.pageCount || 0;
      clearResult(); setResult({ blob, url: URL.createObjectURL(blob), name: safeOutputName(file.name), pages });
      setPassword(""); setShowPassword(false); setCapsLock(false); setStatus("success"); setStage("");
    } catch (nextError) {
      setPassword(""); setShowPassword(false); setCapsLock(false);
      setError(nextError instanceof Error ? nextError.message : "Não foi possível desbloquear este PDF. Verifique a senha e tente novamente.");
      setStatus("error"); setStage("");
    }
  }

  function download() {
    if (!result) return;
    const link = document.createElement("a"); link.href = result.url; link.download = result.name; link.click();
  }

  function updateCapsLock(event: KeyboardEvent<HTMLInputElement>) { setCapsLock(event.getModifierState("CapsLock")); }

  const protectionLabel = inspection?.protection === "password" ? "PDF protegido por senha" : inspection?.protection === "restrictions" ? "PDF possui restrições" : "Este PDF não parece possuir proteção";

  return <ToolPageShell title="Desbloquear PDF" description="Remova a proteção de um PDF utilizando a senha correta e gere uma nova versão sem bloqueio." categoryName="PDF" categoryHref="/ferramentas/pdfs" breadcrumbRootName="Início" breadcrumbRootHref="/" processingMode="server" privacyMessage="O arquivo e a senha são transmitidos com conexão segura somente para realizar esta conversão. A senha não é armazenada pelo Kivai.">
    <Card className="mx-auto max-w-5xl overflow-hidden"><CardHeader><CardTitle>Desbloquear PDF</CardTitle><CardDescription>Um PDF por vez, até {PDF_UNLOCK_MAX_FILE_SIZE_LABEL} e {PDF_UNLOCK_MAX_PAGES} páginas.</CardDescription></CardHeader><CardContent className="space-y-6">
      <input id="unlock-pdf-file" ref={inputRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(event: ChangeEvent<HTMLInputElement>) => { void inspect(event.target.files?.[0]); event.target.value = ""; }} />
      {!file && status !== "processing" && <div onDragEnter={(event: DragEvent<HTMLDivElement>) => { event.preventDefault(); setIsDragging(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={() => setIsDragging(false)} onDrop={(event) => { event.preventDefault(); setIsDragging(false); void inspect(event.dataTransfer.files?.[0]); }} className={`flex min-h-80 flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center ${isDragging ? "border-primary bg-primary/10" : "border-border bg-muted/20"}`}><FileLock2 className="size-8 text-primary" aria-hidden="true" /><h2 className="mt-5 text-xl font-semibold">Arraste seu PDF aqui</h2><p className="mt-2 text-sm text-muted-foreground">ou clique para selecionar</p><p className="mt-2 text-xs text-muted-foreground">Formato aceito: PDF · Máximo: {PDF_UNLOCK_MAX_FILE_SIZE_LABEL}</p><Button type="button" className="mt-5" onClick={() => openFilePicker(inputRef.current)}>Selecionar PDF</Button></div>}
      <ToolProcessingStatus status={status} message={stage} />
      <ToolErrorMessage message={error} />

      {file && inspection && !result && <><section aria-label="PDF selecionado" className="flex min-w-0 flex-col gap-4 rounded-lg border border-border p-4 sm:flex-row sm:items-center"><FileLock2 className="size-8 shrink-0 text-primary" aria-hidden="true" /><div className="min-w-0 flex-1"><p className="break-all font-medium">{file.name}</p><p className="mt-1 text-sm text-muted-foreground">PDF · {formatFileSize(file.size)}{inspection.pageCount ? ` · ${inspection.pageCount} ${inspection.pageCount === 1 ? "página" : "páginas"}` : " · páginas disponíveis após validar a senha"}</p><p className="mt-2 text-sm font-medium text-primary">{protectionLabel}</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={reset} disabled={status === "processing"}><Trash2 className="size-4" />Remover</Button><input ref={replaceRef} type="file" accept="application/pdf,.pdf" className="sr-only" onChange={(event) => { void inspect(event.target.files?.[0]); event.target.value = ""; }} /><Button variant="outline" size="sm" onClick={() => openFilePicker(replaceRef.current)} disabled={status === "processing"}><RefreshCw className="size-4" />Substituir</Button></div></section>
        {inspection.protection === "none" ? <div role="status" className="rounded-lg border border-primary/30 bg-primary/5 p-4"><p className="font-medium">Este PDF já pode ser aberto sem senha.</p><p className="mt-2 text-sm leading-6 text-muted-foreground">Nenhum processamento é necessário. Selecione outro PDF caso queira remover uma proteção.</p><ToolActionBar className="mt-4"><Button variant="outline" onClick={reset}><RotateCcw className="size-4" />Selecionar outro PDF</Button></ToolActionBar></div> : <><p className="rounded-lg border border-border bg-muted/10 p-4 text-sm leading-6 text-muted-foreground">Use esta ferramenta em documentos que pertencem a você ou para os quais você possui autorização de edição. Se o PDF exigir uma senha, será necessário informá-la para realizar o desbloqueio.</p>
          {inspection.passwordRequired && <div className="space-y-2"><label htmlFor="pdf-password" className="text-sm font-medium">Senha do PDF</label><div className="flex gap-2"><input id="pdf-password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} onKeyDown={updateCapsLock} onKeyUp={updateCapsLock} onBlur={() => setCapsLock(false)} autoComplete="off" placeholder="Digite a senha do documento" className="min-h-11 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-primary/30" /><Button type="button" variant="outline" aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"} aria-pressed={showPassword} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</Button></div>{capsLock && <p role="status" className="text-sm text-amber-600">Caps Lock está ativado.</p>}</div>}
          <ToolActionBar><Button size="lg" onClick={() => void unlockPdf()} disabled={status === "processing"}><Unlock className="size-4" />Desbloquear PDF</Button></ToolActionBar></>}
      </>}

      {result && <ToolResultCard title="PDF desbloqueado com sucesso" description={`${result.name} · ${result.pages} ${result.pages === 1 ? "página" : "páginas"} · ${formatFileSize(result.blob.size)}`} details={<p className="text-sm text-muted-foreground">Status confirmado: sem senha de abertura.</p>} actions={<><Button onClick={download}><Download className="size-4" />Baixar PDF desbloqueado</Button><Button variant="outline" onClick={reset}><RotateCcw className="size-4" />Desbloquear outro PDF</Button></>} />}
    </CardContent></Card>
  </ToolPageShell>;
}
