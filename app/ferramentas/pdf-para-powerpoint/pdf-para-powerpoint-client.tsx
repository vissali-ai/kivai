"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type DragEvent } from "react";
import { ArrowDown, ArrowUp, Download, FileText, GripVertical, RefreshCw, RotateCcw, Trash2 } from "lucide-react";

import { ToolActionBar } from "@/components/tools/tool-action-bar";
import { ToolErrorMessage } from "@/components/tools/tool-error-message";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { ToolProcessingStatus, type ToolStatus } from "@/components/tools/tool-processing-status";
import { ToolResultCard } from "@/components/tools/tool-result-card";
import { ToolUploadArea } from "@/components/tools/tool-upload-area";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatFileSize } from "@/lib/tool-files";
import { PDF_TO_POWERPOINT_MAX_FILE_SIZE, PDF_TO_POWERPOINT_MAX_FILE_SIZE_LABEL, PDF_TO_POWERPOINT_MAX_PAGES, type PageFit, type RenderQuality, type SlideFormat } from "./config";
import { convertPdfToPowerPoint, inspectPdf, type PdfPagePreview } from "./pdf-to-powerpoint";

type PageItem = PdfPagePreview & { selected: boolean; included: boolean };
type Result = { blob: Blob; name: string; size: number; slides: number };

function errorMessage(error: unknown) {
  const code = error instanceof Error ? error.message : "";
  if (code === "protected-pdf") return "Este PDF possui proteção e não pôde ser processado.";
  if (code === "too-many-pages") return `Este PDF ultrapassa o limite de ${PDF_TO_POWERPOINT_MAX_PAGES} páginas.`;
  if (code === "no-pages") return "Selecione pelo menos uma página para criar a apresentação.";
  if (["invalid-pdf", "corrupt-pdf"].includes(code)) return "Não foi possível ler este PDF. Verifique o arquivo e tente novamente.";
  if (code === "memory") return "Este documento exige mais memória do que o dispositivo pode disponibilizar. Tente utilizar um PDF menor.";
  return "Não foi possível gerar o PowerPoint. Tente novamente com outro arquivo.";
}

function safeName(name: string) { return `${name.replace(/\.pdf$/i, "").replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-").trim() || "apresentacao"}.pptx`; }

export default function PdfParaPowerPointClient() {
  const replaceRef = useRef<HTMLInputElement>(null);
  const dragIndex = useRef<number | null>(null);
  const pagesRef = useRef<PageItem[]>([]);
  const resultUrlRef = useRef<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [format, setFormat] = useState<SlideFormat>("auto");
  const [fit, setFit] = useState<PageFit>("contain");
  const [quality, setQuality] = useState<RenderQuality>("standard");
  const [status, setStatus] = useState<ToolStatus>("idle");
  const [stage, setStage] = useState("Lendo o PDF");
  const [progress, setProgress] = useState<number | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  useEffect(() => { pagesRef.current = pages; }, [pages]);
  useEffect(() => { resultUrlRef.current = resultUrl; }, [resultUrl]);
  useEffect(() => () => { pagesRef.current.forEach((page) => URL.revokeObjectURL(page.thumbnailUrl)); if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current); }, []);
  const includedPages = pages.filter((page) => page.included);
  const selectedPages = includedPages.filter((page) => page.selected);

  function clear() {
    pages.forEach((page) => URL.revokeObjectURL(page.thumbnailUrl)); if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(null); setPages([]); setResult(null); setResultUrl(null); setError(null); setProgress(undefined); setStatus("idle");
  }

  async function selectFile(files: File[]) {
    const selected = files[0]; if (!selected) return;
    setError(null); setResult(null); if (resultUrl) { URL.revokeObjectURL(resultUrl); setResultUrl(null); }
    if (selected.name.split(".").pop()?.toLowerCase() !== "pdf" || !["application/pdf", "application/octet-stream", ""].includes(selected.type)) { setError("Selecione um arquivo no formato PDF."); setStatus("error"); return; }
    if (!selected.size) { setError("O arquivo está vazio. Selecione outro PDF."); setStatus("error"); return; }
    if (selected.size > PDF_TO_POWERPOINT_MAX_FILE_SIZE) { setError(`O arquivo ultrapassa o limite permitido de ${PDF_TO_POWERPOINT_MAX_FILE_SIZE_LABEL}.`); setStatus("error"); return; }
    pages.forEach((page) => URL.revokeObjectURL(page.thumbnailUrl)); setPages([]); setStatus("processing"); setStage("Preparando as páginas"); setProgress(0);
    try {
      const previews = await inspectPdf(selected, (current, total) => setProgress(Math.round((current / total) * 100)));
      setFile(selected); setPages(previews.map((page) => ({ ...page, selected: true, included: true }))); setStatus("ready"); setProgress(undefined);
    } catch (reason) { setFile(null); setError(errorMessage(reason)); setStatus("error"); setProgress(undefined); }
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction; if (target < 0 || target >= pages.length) return;
    setPages((current) => { const next = [...current]; [next[index], next[target]] = [next[target], next[index]]; return next; });
  }
  function drop(event: DragEvent<HTMLLIElement>, target: number) {
    event.preventDefault(); const source = dragIndex.current; dragIndex.current = null; if (source === null || source === target) return;
    setPages((current) => { const next = [...current]; const [item] = next.splice(source, 1); next.splice(target, 0, item); return next; });
  }
  function restore() { setPages((current) => current.map((page) => ({ ...page, included: true })).sort((a, b) => a.pageNumber - b.pageNumber)); }

  async function convert() {
    if (!file || !selectedPages.length || status === "processing") { if (!selectedPages.length) setError(errorMessage(new Error("no-pages"))); return; }
    setStatus("processing"); setError(null); setStage("Criando os slides"); setProgress(0);
    try {
      const blob = await convertPdfToPowerPoint(file, selectedPages.map((page) => page.pageNumber), { format, fit, quality }, (current, total, nextStage) => { setStage(nextStage); setProgress(nextStage === "Criando os slides" ? Math.round((current / total) * 90) : undefined); });
      const next = { blob, name: safeName(file.name), size: blob.size, slides: selectedPages.length };
      setResult(next); setResultUrl(URL.createObjectURL(blob)); setStatus("success"); setProgress(undefined);
    } catch (reason) { console.error("Falha ao gerar PowerPoint:", reason); setError(errorMessage(reason)); setStatus("error"); setProgress(undefined); }
  }

  return <ToolPageShell title="Converter PDF para PowerPoint" description="Transforme as páginas do seu PDF em slides de uma apresentação PowerPoint." categoryName="PDF" categoryHref="/ferramentas/pdfs" breadcrumbRootName="Início" breadcrumbRootHref="/">
    <Card className="mx-auto max-w-5xl"><CardHeader><CardTitle>Converter PDF para PowerPoint</CardTitle><CardDescription>Selecione as páginas, organize os slides e gere uma apresentação PPTX.</CardDescription></CardHeader><CardContent className="space-y-6">
      {!file && status !== "processing" && <><ToolUploadArea accept="application/pdf,.pdf" formats="PDF" maxSizeLabel={PDF_TO_POWERPOINT_MAX_FILE_SIZE_LABEL} error={error} onFilesSelected={selectFile} label="Selecionar PDF para converter em PowerPoint" /><ToolActionBar><Button size="lg" disabled><FileText className="size-4" />Converter para PowerPoint</Button></ToolActionBar></>}
      <ToolProcessingStatus status={status} message={stage} progress={progress} />
      {file && status !== "success" && <><section aria-label="PDF selecionado" className="flex min-w-0 flex-col gap-4 border border-border p-4 sm:flex-row sm:items-center"><FileText className="size-6 shrink-0 text-primary" /><div className="min-w-0 flex-1"><p className="truncate font-medium">{file.name}</p><p className="mt-1 text-sm text-muted-foreground">PDF · {formatFileSize(file.size)} · {pages.length} {pages.length === 1 ? "página" : "páginas"}</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={clear} disabled={status === "processing"}><Trash2 className="size-4" />Remover</Button><input ref={replaceRef} type="file" accept="application/pdf,.pdf" className="sr-only" onChange={(event) => { void selectFile(Array.from(event.target.files ?? [])); event.target.value = ""; }} /><Button variant="outline" size="sm" onClick={() => replaceRef.current?.click()} disabled={status === "processing"}><RefreshCw className="size-4" />Substituir</Button></div></section>
      <section aria-labelledby="paginas-pdf"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 id="paginas-pdf" className="font-heading text-lg font-medium">Páginas e ordem dos slides</h2><p className="mt-1 text-sm text-muted-foreground">{selectedPages.length} de {includedPages.length} selecionadas</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => setPages((current) => current.map((page) => page.included ? { ...page, selected: true } : page))}>Selecionar todas</Button><Button variant="outline" size="sm" onClick={() => setPages((current) => current.map((page) => ({ ...page, selected: false })))}>Desmarcar todas</Button><Button variant="outline" size="sm" onClick={restore}><RotateCcw className="size-4" />Restaurar</Button></div></div>
      <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{includedPages.map((page) => { const index = pages.indexOf(page); return <li key={page.pageNumber} draggable onDragStart={() => { dragIndex.current = index; }} onDragOver={(event) => event.preventDefault()} onDrop={(event) => drop(event, index)} className={`relative overflow-hidden rounded-lg border bg-background p-2 transition ${page.selected ? "border-primary ring-1 ring-primary/30" : "border-border opacity-65"}`}><label className="block cursor-pointer"><span className="relative block aspect-[3/4] overflow-hidden bg-white"><Image src={page.thumbnailUrl} alt={`Miniatura da página ${page.pageNumber}`} fill unoptimized className="object-contain" /></span><span className="mt-2 flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={page.selected} onChange={(event) => setPages((current) => current.map((item) => item.pageNumber === page.pageNumber ? { ...item, selected: event.target.checked } : item))} />Página {page.pageNumber}<GripVertical className="ml-auto size-4 text-muted-foreground" aria-hidden="true" /></span></label><div className="mt-2 grid grid-cols-3 gap-1"><Button variant="outline" size="icon-sm" onClick={() => move(index, -1)} disabled={index === 0} aria-label={`Mover página ${page.pageNumber} para cima`}><ArrowUp className="size-4" /></Button><Button variant="outline" size="icon-sm" onClick={() => move(index, 1)} disabled={index === pages.length - 1} aria-label={`Mover página ${page.pageNumber} para baixo`}><ArrowDown className="size-4" /></Button><Button variant="outline" size="icon-sm" onClick={() => setPages((current) => current.map((item) => item.pageNumber === page.pageNumber ? { ...item, included: false, selected: false } : item))} aria-label={`Excluir página ${page.pageNumber}`}><Trash2 className="size-4" /></Button></div></li>; })}</ul></section>
      <fieldset disabled={status === "processing"} className="grid gap-5 rounded-lg border border-border p-4 sm:grid-cols-3 sm:p-5"><legend className="px-2 font-heading font-medium">Configurações</legend><Select label="Formato dos slides" value={format} onChange={(value) => setFormat(value as SlideFormat)} options={[["auto", "Automático"], ["wide", "Widescreen 16:9"], ["standard", "Padrão 4:3"]]} /><Select label="Ajuste da página" value={fit} onChange={(value) => setFit(value as PageFit)} options={[["contain", "Ajustar página inteira"], ["cover", "Preencher o slide"]]} /><Select label="Qualidade" value={quality} onChange={(value) => setQuality(value as RenderQuality)} options={[["standard", "Padrão"], ["high", "Alta qualidade"]]} /></fieldset>
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm leading-6 text-muted-foreground"><p>As páginas do PDF serão inseridas como imagens nos slides para preservar o visual do documento.</p><p className="mt-1">O conteúdo visual será preservado, mas textos, tabelas e imagens não ficarão necessariamente editáveis separadamente.{fit === "cover" ? " No modo Preencher, pequenas áreas das bordas podem ser cortadas." : ""}</p></div><ToolErrorMessage message={error} /><ToolActionBar><Button size="lg" onClick={convert} disabled={status === "processing" || !selectedPages.length}><FileText className="size-4" />Converter para PowerPoint</Button></ToolActionBar></>}
      {result && status === "success" && <ToolResultCard title="PowerPoint pronto" description={`${result.name} · ${result.slides} ${result.slides === 1 ? "slide" : "slides"} · ${formatFileSize(result.size)}`} actions={<><Button asChild><a href={resultUrl ?? undefined} download={result.name}><Download className="size-4" />Baixar PowerPoint</a></Button><Button variant="outline" onClick={clear}><RotateCcw className="size-4" />Converter outro PDF</Button></>} />}
      {error === `Este PDF ultrapassa o limite de ${PDF_TO_POWERPOINT_MAX_PAGES} páginas.` && <p className="text-sm"><Link href="/ferramentas/dividir-pdf" className="text-primary hover:underline">Divida o PDF em arquivos menores</Link> e tente novamente.</p>}
    </CardContent></Card>
  </ToolPageShell>;
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: [string, string][] }) { return <label className="grid gap-2 text-sm font-medium">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="min-h-11 rounded-md border border-input bg-background px-3 text-foreground outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30">{options.map(([key, text]) => <option key={key} value={key}>{text}</option>)}</select></label>; }
