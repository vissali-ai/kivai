"use client";

import { openFilePicker } from "@/lib/browser/file-picker";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Clipboard, Code2, Download, Eye, FileText, RefreshCw, RotateCcw, Search, Trash2, Undo2, Redo2, Upload } from "lucide-react";

import { ToolActionBar } from "@/components/tools/tool-action-bar";
import { ToolErrorMessage } from "@/components/tools/tool-error-message";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { ToolProcessingStatus, type ToolStatus } from "@/components/tools/tool-processing-status";
import { ToolResultCard } from "@/components/tools/tool-result-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { downloadBlob } from "@/lib/image-tools/canvas";
import { formatFileSize } from "@/lib/tool-files";
import { PDF_TO_HTML_MAX_FILE_SIZE, PDF_TO_HTML_MAX_FILE_SIZE_LABEL, PDF_TO_HTML_MAX_PAGES, type ConversionMode } from "./config";
import { convertPdfToHtml, disposeInspection, inspectPdf, parsePageRange, sanitizeHtmlDocument, type PdfInspection } from "./pdf-to-html";

type Result = { html: string; originalHtml: string; name: string; pages: number; size: number; scannedWarning: boolean };

function friendlyError(error: unknown) {
  const code = error instanceof Error ? error.message : "";
  if (code === "invalid-pdf") return "Selecione um arquivo no formato PDF.";
  if (code === "too-many-pages") return `Este PDF ultrapassa o limite de ${PDF_TO_HTML_MAX_PAGES} páginas.`;
  if (code === "protected-pdf") return "Este PDF possui proteção e não pôde ser convertido.";
  if (code === "corrupt-pdf") return "Não foi possível abrir este PDF. Verifique o arquivo e tente novamente.";
  if (code === "invalid-pages") return "Informe páginas válidas, como 1-5 ou 1,3,7.";
  if (code === "no-content") return "Não encontramos conteúdo textual suficiente para converter neste PDF.";
  return "Não foi possível gerar o HTML. Tente novamente com outro arquivo.";
}

function outputName(name: string) {
  return `${name.replace(/\.pdf$/i, "").replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-").trim() || "documento"}.html`;
}

export default function PdfParaHtmlClient() {
  const inputRef = useRef<HTMLInputElement>(null); const replaceRef = useRef<HTMLInputElement>(null); const editorRef = useRef<HTMLTextAreaElement>(null);
  const inspectionRef = useRef<PdfInspection | null>(null); const historyRef = useRef<string[]>([]); const historyIndexRef = useRef(-1);
  const [file, setFile] = useState<File | null>(null); const [inspection, setInspection] = useState<PdfInspection | null>(null);
  const [pageRange, setPageRange] = useState(""); const [pageError, setPageError] = useState<string | null>(null); const [mode, setMode] = useState<ConversionMode>("structured");
  const [status, setStatus] = useState<ToolStatus>("idle"); const [stage, setStage] = useState("Lendo o PDF"); const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null); const [tab, setTab] = useState<"preview" | "code">("preview"); const [editing, setEditing] = useState(false);
  const [find, setFind] = useState(""); const [dragging, setDragging] = useState(false); const [copied, setCopied] = useState(false);
  const [canUndo, setCanUndo] = useState(false); const [canRedo, setCanRedo] = useState(false);

  useEffect(() => () => disposeInspection(inspectionRef.current), []);

  function release() { disposeInspection(inspectionRef.current); inspectionRef.current = null; setInspection(null); }
  function reset() { release(); setFile(null); setResult(null); setPageRange(""); setPageError(null); setError(null); setStatus("idle"); setEditing(false); setFind(""); historyRef.current = []; historyIndexRef.current = -1; setCanUndo(false); setCanRedo(false); }

  async function selectFile(files: File[]) {
    const selected = files[0]; if (!selected || status === "processing") return;
    setError(null); setPageError(null); setResult(null);
    if (selected.name.split(".").pop()?.toLowerCase() !== "pdf" || !["application/pdf", "application/octet-stream", ""].includes(selected.type) || !selected.size) { setError("Selecione um arquivo no formato PDF."); setStatus("error"); return; }
    if (selected.size > PDF_TO_HTML_MAX_FILE_SIZE) { setError(`O arquivo ultrapassa o limite permitido de ${PDF_TO_HTML_MAX_FILE_SIZE_LABEL}.`); setStatus("error"); return; }
    release(); setStatus("processing"); setStage("Lendo o PDF");
    try { const next = await inspectPdf(selected, setStage); inspectionRef.current = next; setInspection(next); setFile(selected); setStatus("ready"); }
    catch (reason) { setError(friendlyError(reason)); setStatus("error"); }
  }

  async function convert() {
    if (!file || !inspection || status === "processing") return;
    let pages: number[];
    try { pages = parsePageRange(pageRange, inspection.pageCount); setPageError(null); }
    catch (reason) { setPageError(friendlyError(reason)); return; }
    setStatus("processing"); setError(null); setStage("Extraindo textos");
    try {
      const converted = await convertPdfToHtml(file, pages, mode, setStage); setStage("Finalizando arquivo");
      const html = sanitizeHtmlDocument(converted.html); const name = outputName(file.name); const size = new Blob([html], { type: "text/html;charset=utf-8" }).size;
      const next = { html, originalHtml: html, name, pages: converted.pages, size, scannedWarning: converted.scannedWarning };
      setResult(next); historyRef.current = [html]; historyIndexRef.current = 0; setCanUndo(false); setCanRedo(false); setStatus("success"); setTab("preview");
    } catch (reason) { setError(friendlyError(reason)); setStatus("error"); }
  }

  function updateHtml(html: string) {
    if (!result) return; setResult({ ...result, html });
    const next = historyRef.current.slice(0, historyIndexRef.current + 1); next.push(html); if (next.length > 60) next.shift(); historyRef.current = next; historyIndexRef.current = next.length - 1; setCanUndo(historyIndexRef.current > 0); setCanRedo(false);
  }
  function navigateHistory(offset: number) { const index = historyIndexRef.current + offset; const html = historyRef.current[index]; if (!result || html === undefined) return; historyIndexRef.current = index; setResult({ ...result, html }); setCanUndo(index > 0); setCanRedo(index < historyRef.current.length - 1); }
  function restore() { if (!result) return; updateHtml(result.originalHtml); }
  function safeHtml() { return sanitizeHtmlDocument(result?.html ?? ""); }
  function download() { if (!result) return; downloadBlob(new Blob([safeHtml()], { type: "text/html;charset=utf-8" }), result.name); }
  async function copy() { if (!result) return; await navigator.clipboard.writeText(safeHtml()); setCopied(true); window.setTimeout(() => setCopied(false), 1800); }
  function findText() { const editor = editorRef.current; if (!editor || !find) return; const start = editor.value.toLocaleLowerCase().indexOf(find.toLocaleLowerCase(), editor.selectionEnd); const index = start >= 0 ? start : editor.value.toLocaleLowerCase().indexOf(find.toLocaleLowerCase()); if (index >= 0) { editor.focus(); editor.setSelectionRange(index, index + find.length); } }

  return <ToolPageShell title="Converter PDF para HTML" description="Transforme o texto extraível de um PDF em um documento HTML para revisar, editar ou reutilizar na web." categoryName="PDF" categoryHref="/ferramentas/pdfs" breadcrumbRootName="Início" breadcrumbRootHref="/" privacyMessage="A leitura do PDF e a geração do HTML acontecem localmente no navegador. Use somente documentos que você tem autorização para processar.">
    <Card className="mx-auto max-w-5xl"><CardHeader><CardTitle>Converter PDF para HTML</CardTitle><CardDescription>Extraia texto e estruturas simples para visualizar, editar ou reutilizar na web.</CardDescription></CardHeader><CardContent className="space-y-6">
      {!file && status !== "processing" && <><input id="pdf-to-html-file" ref={inputRef} type="file" accept="application/pdf,.pdf" className="sr-only" onChange={(event) => { void selectFile(Array.from(event.target.files ?? [])); event.target.value = ""; }} /><div onDragEnter={(event) => { event.preventDefault(); setDragging(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false); }} onDrop={(event) => { event.preventDefault(); setDragging(false); void selectFile(Array.from(event.dataTransfer.files)); }} className={`flex min-h-64 flex-col items-center justify-center border border-dashed p-6 text-center transition-colors sm:p-10 ${dragging ? "border-primary bg-primary/5" : "border-border bg-muted/20"}`}><span className="flex size-14 items-center justify-center border border-border bg-background"><Upload className="size-5" /></span><p className="mt-5 font-heading text-lg font-medium">Arraste seu PDF aqui</p><p className="mt-2 text-sm text-muted-foreground">ou clique para selecionar</p><p className="mt-2 text-xs text-muted-foreground">Formato aceito: PDF · Máximo: {PDF_TO_HTML_MAX_FILE_SIZE_LABEL}</p><Button asChild className="mt-5"><label htmlFor="pdf-to-html-file"><FileText className="size-4" />Selecionar PDF</label></Button></div><ToolErrorMessage message={error} /></>}
      <ToolProcessingStatus status={status} message={stage} />

      {file && inspection && !result && <><section aria-label="PDF selecionado" className="flex min-w-0 flex-col gap-4 rounded-lg border border-border p-4 sm:flex-row sm:items-center"><div className="relative aspect-[3/4] w-20 shrink-0 overflow-hidden border bg-white"><Image src={inspection.thumbnailUrl} alt="Miniatura da primeira página" fill unoptimized className="object-contain" /></div><div className="min-w-0 flex-1"><p className="truncate font-medium">{file.name}</p><p className="mt-1 text-sm text-muted-foreground">PDF · {formatFileSize(file.size)} · {inspection.pageCount} {inspection.pageCount === 1 ? "página" : "páginas"}</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={reset} disabled={status === "processing"}><Trash2 className="size-4" />Remover</Button><input ref={replaceRef} type="file" accept="application/pdf,.pdf" className="sr-only" onChange={(event) => { void selectFile(Array.from(event.target.files ?? [])); event.target.value = ""; }} /><Button variant="outline" size="sm" onClick={() => openFilePicker(replaceRef.current)} disabled={status === "processing"}><RefreshCw className="size-4" />Substituir</Button></div></section>
        <fieldset disabled={status === "processing"} className="grid gap-5 rounded-lg border border-border p-4 sm:grid-cols-2 sm:p-5"><legend className="px-2 font-heading font-medium">Configurações</legend><label className="grid gap-2 text-sm font-medium">Páginas<input value={pageRange} onChange={(event) => setPageRange(event.target.value)} placeholder="Todas ou ex.: 1-5,8" className="min-h-11 rounded-md border border-input bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-primary/30" /><span className="font-normal text-muted-foreground">Deixe vazio para converter todas.</span></label><label className="grid gap-2 text-sm font-medium">Modo de conversão<select value={mode} onChange={(event) => setMode(event.target.value as ConversionMode)} className="min-h-11 rounded-md border border-input bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-primary/30"><option value="structured">HTML estruturado</option><option value="visual">Aproximar aparência do texto</option></select><span className="font-normal text-muted-foreground">{mode === "visual" ? "Reposiciona o texto extraído para aproximar o layout. Imagens, vetores e fundos não são reconstruídos." : "Prioriza títulos, parágrafos, listas e tabelas simples detectadas por heurística."}</span></label></fieldset><ToolErrorMessage message={pageError ?? error} /><ToolActionBar><Button size="lg" onClick={convert} disabled={status === "processing"}><Code2 className="size-4" />Converter para HTML</Button></ToolActionBar></>}

      {result && <><ToolResultCard title="HTML pronto" description={`${result.name} · ${result.pages} ${result.pages === 1 ? "página convertida" : "páginas convertidas"} · ${formatFileSize(new Blob([safeHtml()]).size)}`} actions={<><Button onClick={download}><Download className="size-4" />Baixar HTML</Button><Button variant="outline" onClick={() => void copy()}><Clipboard className="size-4" />{copied ? "HTML copiado" : "Copiar HTML"}</Button><Button variant="outline" onClick={reset}><RotateCcw className="size-4" />Converter outro PDF</Button></>} />
        {result.scannedWarning && <p role="status" className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm">Este documento contém uma ou mais páginas com pouco texto extraível. Se forem páginas digitalizadas como imagem, será necessário OCR, que não faz parte desta versão.</p>}
        <section aria-labelledby="resultado-html"><div className="flex flex-wrap items-center gap-2 border-b border-border"><Button variant={tab === "preview" ? "secondary" : "ghost"} onClick={() => setTab("preview")}><Eye className="size-4" />Visualização</Button><Button variant={tab === "code" ? "secondary" : "ghost"} onClick={() => setTab("code")}><Code2 className="size-4" />Código HTML</Button></div>
          {tab === "preview" ? <iframe title="Visualização segura do HTML convertido" sandbox="" srcDoc={safeHtml()} className="mt-4 h-[32rem] w-full rounded-lg border border-border bg-white sm:h-[40rem]" /> : <div className="mt-4 space-y-3"><div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => setEditing((value) => !value)}>{editing ? "Bloquear edição" : "Editar HTML"}</Button><Button variant="outline" size="sm" onClick={() => { editorRef.current?.focus(); editorRef.current?.select(); }}>Selecionar tudo</Button><Button variant="outline" size="sm" onClick={() => navigateHistory(-1)} disabled={!canUndo}><Undo2 className="size-4" />Desfazer</Button><Button variant="outline" size="sm" onClick={() => navigateHistory(1)} disabled={!canRedo}><Redo2 className="size-4" />Refazer</Button><Button variant="outline" size="sm" onClick={restore}><RotateCcw className="size-4" />Restaurar versão</Button></div><div className="flex gap-2"><label className="sr-only" htmlFor="find-html">Localizar texto</label><input id="find-html" value={find} onChange={(event) => setFind(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") findText(); }} placeholder="Localizar no código" className="min-h-10 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/30" /><Button variant="outline" onClick={findText}><Search className="size-4" />Localizar</Button></div><textarea ref={editorRef} value={result.html} readOnly={!editing} onChange={(event) => updateHtml(event.target.value)} spellCheck={false} aria-label="Código HTML gerado" className="h-80 w-full resize-y overflow-auto rounded-lg border border-border bg-muted/20 p-4 font-mono text-xs leading-5 outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:h-[32rem]" /></div>}
        </section></>}
    </CardContent></Card>
  </ToolPageShell>;
}
