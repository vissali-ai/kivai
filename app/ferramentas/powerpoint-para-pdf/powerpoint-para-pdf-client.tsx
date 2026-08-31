"use client";

import { openFilePicker } from "@/lib/browser/file-picker";

import Image from "next/image";
import { useEffect, useRef, useState, type DragEvent } from "react";
import {
  ArrowDown,
  ArrowUp,
  Download,
  Eye,
  FileSliders,
  GripVertical,
  RefreshCw,
  RotateCcw,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import { ToolActionBar } from "@/components/tools/tool-action-bar";
import { ToolErrorMessage } from "@/components/tools/tool-error-message";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { ToolProcessingStatus, type ToolStatus } from "@/components/tools/tool-processing-status";
import { ToolResultCard } from "@/components/tools/tool-result-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatFileSize } from "@/lib/tool-files";
import {
  POWERPOINT_TO_PDF_MAX_FILE_SIZE,
  POWERPOINT_TO_PDF_MAX_FILE_SIZE_LABEL,
  POWERPOINT_TO_PDF_MAX_SLIDES,
  type PageOrientation,
  type PageSize,
  type RenderQuality,
} from "./config";
import {
  convertPowerPointToPdf,
  disposePowerPoint,
  inspectPowerPoint,
  type InspectedPowerPoint,
  type PowerPointSlidePreview,
} from "./powerpoint-to-pdf";

type SlideItem = PowerPointSlidePreview & { selected: boolean; included: boolean };
type Result = { blob: Blob; size: number; pages: number };

function errorMessage(error: unknown) {
  const code = error instanceof Error ? error.message : "";
  if (code === "protected-pptx") return "Esta apresentação é protegida e não pode ser processada.";
  if (code === "too-many-slides") return `A apresentação ultrapassa o limite de ${POWERPOINT_TO_PDF_MAX_SLIDES} slides.`;
  if (code === "no-slides") return "Selecione pelo menos um slide para gerar o PDF.";
  if (["invalid-pptx", "empty-pptx"].includes(code)) return "Selecione um arquivo PowerPoint (.pptx).";
  if (code === "corrupt-pptx") return "Não foi possível abrir esta apresentação.";
  return "Não foi possível converter este arquivo.";
}

export default function PowerPointParaPdfClient() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);
  const dragIndex = useRef<number | null>(null);
  const inspectedRef = useRef<InspectedPowerPoint | null>(null);
  const resultUrlRef = useRef<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [slides, setSlides] = useState<SlideItem[]>([]);
  const [orientation, setOrientation] = useState<PageOrientation>("auto");
  const [pageSize, setPageSize] = useState<PageSize>("auto");
  const [quality, setQuality] = useState<RenderQuality>("standard");
  const [status, setStatus] = useState<ToolStatus>("idle");
  const [stage, setStage] = useState("Lendo apresentação");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [preview, setPreview] = useState<SlideItem | null>(null);
  const [draggingFile, setDraggingFile] = useState(false);

  useEffect(() => { resultUrlRef.current = resultUrl; }, [resultUrl]);
  useEffect(() => () => {
    disposePowerPoint(inspectedRef.current);
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
  }, []);

  const includedSlides = slides.filter((slide) => slide.included);
  const selectedSlides = includedSlides.filter((slide) => slide.selected);

  function releaseCurrent() {
    disposePowerPoint(inspectedRef.current);
    inspectedRef.current = null;
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    resultUrlRef.current = null;
  }

  function clear() {
    releaseCurrent();
    setFile(null);
    setSlides([]);
    setResult(null);
    setResultUrl(null);
    setPreview(null);
    setError(null);
    setStatus("idle");
  }

  async function selectFile(files: File[]) {
    const selected = files[0];
    if (!selected || status === "processing") return;
    setError(null);
    setPreview(null);
    if (selected.name.split(".").pop()?.toLowerCase() !== "pptx" || ![
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/octet-stream",
      "application/zip",
      "",
    ].includes(selected.type)) {
      setError("Selecione um arquivo PowerPoint (.pptx).");
      setStatus("error");
      return;
    }
    if (!selected.size) {
      setError("Selecione um arquivo PowerPoint (.pptx).");
      setStatus("error");
      return;
    }
    if (selected.size > POWERPOINT_TO_PDF_MAX_FILE_SIZE) {
      setError("O arquivo ultrapassa o limite permitido.");
      setStatus("error");
      return;
    }

    releaseCurrent();
    setFile(null);
    setSlides([]);
    setResult(null);
    setResultUrl(null);
    setStatus("processing");
    setStage("Lendo apresentação");
    try {
      const inspected = await inspectPowerPoint(selected, setStage);
      inspectedRef.current = inspected;
      setFile(selected);
      setSlides(inspected.previews.map((slide) => ({ ...slide, selected: true, included: true })));
      setStatus("ready");
    } catch (reason) {
      setError(errorMessage(reason));
      setStatus("error");
    }
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= slides.length) return;
    setSlides((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function drop(event: DragEvent<HTMLLIElement>, target: number) {
    event.preventDefault();
    const source = dragIndex.current;
    dragIndex.current = null;
    if (source === null || source === target) return;
    setSlides((current) => {
      const next = [...current];
      const [item] = next.splice(source, 1);
      next.splice(target, 0, item);
      return next;
    });
  }

  function restore() {
    setSlides((current) => current
      .map((slide) => ({ ...slide, included: true }))
      .sort((a, b) => a.slideNumber - b.slideNumber));
  }

  async function convert() {
    if (!inspectedRef.current || status === "processing") return;
    if (!selectedSlides.length) {
      setError(errorMessage(new Error("no-slides")));
      return;
    }
    setStatus("processing");
    setError(null);
    setStage("Lendo apresentação");
    try {
      setStage("Processando slides");
      const blob = await convertPowerPointToPdf(
        inspectedRef.current,
        selectedSlides.map((slide) => slide.slideNumber),
        { orientation, pageSize, quality },
        setStage,
      );
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      const url = URL.createObjectURL(blob);
      setResult({ blob, size: blob.size, pages: selectedSlides.length });
      setResultUrl(url);
      setStatus("success");
    } catch (reason) {
      setError(errorMessage(reason));
      setStatus("error");
    }
  }

  return <ToolPageShell title="Converter PowerPoint para PDF" description="Revise os slides antes de gerar o PDF: selecione o que entra, ajuste a ordem e escolha orientação, tamanho de página e qualidade." categoryName="PDF" categoryHref="/ferramentas/pdfs" breadcrumbRootName="Início" breadcrumbRootHref="/">
    <Card className="mx-auto max-w-5xl"><CardHeader><CardTitle>Prepare os slides para o PDF</CardTitle><CardDescription>Carregue um PPTX e confira as miniaturas antes de definir quais slides entram no arquivo final.</CardDescription></CardHeader><CardContent className="space-y-6">
      {!file && status !== "processing" && <>
        <input ref={fileInputRef} type="file" accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation" className="sr-only" onChange={(event) => { void selectFile(Array.from(event.target.files ?? [])); event.target.value = ""; }} />
        <div onDragEnter={(event) => { event.preventDefault(); setDraggingFile(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDraggingFile(false); }} onDrop={(event) => { event.preventDefault(); setDraggingFile(false); void selectFile(Array.from(event.dataTransfer.files)); }} className={`flex min-h-64 flex-col items-center justify-center border border-dashed p-6 text-center transition-colors sm:p-10 ${draggingFile ? "border-primary bg-primary/5" : "border-border bg-muted/20"}`}>
          <span className="flex size-14 items-center justify-center border border-border bg-background"><Upload className="size-5" aria-hidden="true" /></span>
          <p className="mt-5 font-heading text-lg font-medium">Arraste seu arquivo PowerPoint aqui</p>
          <p className="mt-2 text-sm text-muted-foreground">ou clique para selecionar</p>
          <p className="mt-2 text-xs text-muted-foreground">PPTX · Tamanho máximo: {POWERPOINT_TO_PDF_MAX_FILE_SIZE_LABEL}</p>
          <Button type="button" className="mt-5" onClick={() => openFilePicker(fileInputRef.current)}><FileSliders className="size-4" />Selecionar PowerPoint</Button>
        </div>
        <ToolErrorMessage message={error} />
      </>}

      <ToolProcessingStatus status={status} message={stage} />

      {file && status !== "success" && <>
        <section aria-label="PowerPoint selecionado" className="flex min-w-0 flex-col gap-4 rounded-lg border border-border p-4 sm:flex-row sm:items-center">
          <FileSliders className="size-6 shrink-0 text-primary" />
          <div className="min-w-0 flex-1"><p className="truncate font-medium">{file.name}</p><p className="mt-1 text-sm text-muted-foreground">PPTX · {formatFileSize(file.size)} · {slides.length} {slides.length === 1 ? "slide" : "slides"}</p></div>
          <div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={clear} disabled={status === "processing"}><Trash2 className="size-4" />Remover</Button><input ref={replaceRef} type="file" accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation" className="sr-only" onChange={(event) => { void selectFile(Array.from(event.target.files ?? [])); event.target.value = ""; }} /><Button variant="outline" size="sm" onClick={() => openFilePicker(replaceRef.current)} disabled={status === "processing"}><RefreshCw className="size-4" />Substituir</Button></div>
        </section>

        <section aria-labelledby="slides-powerpoint"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 id="slides-powerpoint" className="font-heading text-lg font-medium">Slides e ordem do PDF</h2><p className="mt-1 text-sm text-muted-foreground">{selectedSlides.length} de {includedSlides.length} selecionados</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => setSlides((current) => current.map((slide) => slide.included ? { ...slide, selected: true } : slide))}>Selecionar todos</Button><Button variant="outline" size="sm" onClick={() => setSlides((current) => current.map((slide) => ({ ...slide, selected: false })))}>Desmarcar todos</Button><Button variant="outline" size="sm" onClick={restore}><RotateCcw className="size-4" />Restaurar ordem</Button></div></div>
          <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{includedSlides.map((slide) => { const index = slides.indexOf(slide); return <li key={slide.slideNumber} draggable onDragStart={() => { dragIndex.current = index; }} onDragOver={(event) => event.preventDefault()} onDrop={(event) => drop(event, index)} className={`relative overflow-hidden rounded-lg border bg-background p-2 transition ${slide.selected ? "border-primary ring-1 ring-primary/30" : "border-border opacity-65"}`}><button type="button" onClick={() => setPreview(slide)} className="relative block aspect-video w-full overflow-hidden bg-white" aria-label={`Visualizar slide ${slide.slideNumber}`}><Image src={slide.thumbnailUrl} alt={`Miniatura do slide ${slide.slideNumber}`} fill unoptimized className="object-contain" /><span className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-black/65 text-white"><Eye className="size-3.5" /></span></button><label className="mt-2 flex cursor-pointer items-center gap-2 text-sm font-medium"><input type="checkbox" checked={slide.selected} onChange={(event) => setSlides((current) => current.map((item) => item.slideNumber === slide.slideNumber ? { ...item, selected: event.target.checked } : item))} />Slide {slide.slideNumber}<GripVertical className="ml-auto size-4 text-muted-foreground" aria-hidden="true" /></label><div className="mt-2 grid grid-cols-3 gap-1"><Button variant="outline" size="icon-sm" onClick={() => move(index, -1)} disabled={index === 0} aria-label={`Mover slide ${slide.slideNumber} para cima`}><ArrowUp className="size-4" /></Button><Button variant="outline" size="icon-sm" onClick={() => move(index, 1)} disabled={index === slides.length - 1} aria-label={`Mover slide ${slide.slideNumber} para baixo`}><ArrowDown className="size-4" /></Button><Button variant="outline" size="icon-sm" onClick={() => setSlides((current) => current.map((item) => item.slideNumber === slide.slideNumber ? { ...item, included: false, selected: false } : item))} aria-label={`Remover slide ${slide.slideNumber} da conversão`}><Trash2 className="size-4" /></Button></div></li>; })}</ul>
        </section>

        <fieldset disabled={status === "processing"} className="grid gap-5 rounded-lg border border-border p-4 sm:grid-cols-3 sm:p-5"><legend className="px-2 font-heading font-medium">Configurações</legend><Select label="Orientação" value={orientation} onChange={(value) => setOrientation(value as PageOrientation)} options={[["auto", "Automática"], ["portrait", "Retrato"], ["landscape", "Paisagem"]]} /><Select label="Tamanho" value={pageSize} onChange={(value) => setPageSize(value as PageSize)} options={[["auto", "Automático"], ["a4", "A4"], ["letter", "Carta"]]} /><Select label="Qualidade" value={quality} onChange={(value) => setQuality(value as RenderQuality)} options={[["standard", "Padrão"], ["high", "Alta"]]} /></fieldset>
        <ToolErrorMessage message={error} />
        <ToolActionBar><Button size="lg" onClick={convert} disabled={status === "processing" || !selectedSlides.length}><FileSliders className="size-4" />Converter para PDF</Button></ToolActionBar>
      </>}

      {result && status === "success" && <ToolResultCard title="PDF pronto" description={`${result.pages} ${result.pages === 1 ? "página" : "páginas"} · ${formatFileSize(result.size)}`} actions={<><Button asChild><a href={resultUrl ?? undefined} download="apresentacao.pdf"><Download className="size-4" />Baixar PDF</a></Button><Button variant="outline" onClick={clear}><RotateCcw className="size-4" />Converter outro PowerPoint</Button></>} />}
    </CardContent></Card>

    {preview && <div role="dialog" aria-modal="true" aria-label={`Visualização do slide ${preview.slideNumber}`} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setPreview(null)}><div className="relative w-full max-w-5xl" onClick={(event) => event.stopPropagation()}><button type="button" onClick={() => setPreview(null)} className="absolute -right-2 -top-12 flex size-10 items-center justify-center rounded-full bg-background text-foreground" aria-label="Fechar visualização"><X className="size-5" /></button><div className="relative aspect-video overflow-hidden rounded-lg bg-white"><Image src={preview.thumbnailUrl} alt={`Slide ${preview.slideNumber}`} fill unoptimized className="object-contain" /></div><p className="mt-3 text-center text-sm text-white">Slide {preview.slideNumber}</p></div></div>}
  </ToolPageShell>;
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: [string, string][] }) {
  return <label className="grid gap-2 text-sm font-medium">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="min-h-11 rounded-md border border-input bg-background px-3 text-foreground outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30">{options.map(([key, text]) => <option key={key} value={key}>{text}</option>)}</select></label>;
}
