"use client";

import { openFilePicker } from "@/lib/browser/file-picker";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Crop, Download, FilePlus2, GripVertical, LayoutTemplate, MousePointer2, RefreshCw, RotateCcw, Trash2, Upload } from "lucide-react";
import { ToolErrorMessage } from "@/components/tools/tool-error-message";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { ToolProcessingStatus, type ToolStatus } from "@/components/tools/tool-processing-status";
import { ToolResultCard } from "@/components/tools/tool-result-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatFileSize } from "@/lib/tool-files";
import { disposeResizeInspection, inspectResizePdf, type ResizePdfInspection, type ResizePageInfo } from "../redimensionar-pdf/resize-pdf-engine";
import { SHEET_SIZES, type PrintSettings, type SheetSize } from "./config";
import { buildVisualPrintPdf, createVisualLayout, type VisualCrop, type VisualPlacement } from "./print-layout-engine";
import { VisualCropEditor } from "./visual-crop-editor";

type DocumentItem = { id: string; file: File; inspection: ResizePdfInspection };
type ResizeMode = "move" | "nw" | "ne" | "sw" | "se";
type CropEdgeMode = "crop-left" | "crop-right" | "crop-top" | "crop-bottom";
type DragState = { index: number; mode: ResizeMode | CropEdgeMode; startX: number; startY: number; origin: VisualPlacement; crop?: VisualCrop };

const initial: PrintSettings = { sheet: "A4", customSheet: { width: 210, height: 297 }, content: "original", scale: 100, orientation: "portrait", position: "center", customPosition: { x: 0, y: 0 }, margins: { top: 0, right: 0, bottom: 0, left: 0 }, count: 1, repeat: false, order: "horizontal", gapX: 0, gapY: 0 };
const fullCrop: VisualCrop = { x: 0, y: 0, width: 1, height: 1 };

function errorText(reason: unknown) {
  const code = reason instanceof Error ? reason.message : "";
  if (code === "invalid-pdf") return "Selecione arquivos no formato PDF.";
  if (code === "protected-pdf") return "Um dos PDFs possui proteção e não pôde ser processado.";
  if (code === "too-many-pages") return "A seleção ultrapassa o limite total de 100 páginas.";
  if (code === "too-large") return "Os arquivos ultrapassam o limite total de 25 MB.";
  return "Não foi possível montar o PDF para impressão. Revise os arquivos e tente novamente.";
}

function outputName(name: string) { return `${name.replace(/\.pdf$/i, "").replace(/[<>:\"/\\|?*\u0000-\u001f]/g, "-").trim() || "documentos"}-impressao.pdf`; }
function clamp(value: number, min: number, max: number) { return Math.min(max, Math.max(min, value)); }
function sheetSize(settings: PrintSettings) {
  if (settings.sheet === "Personalizado") return settings.customSheet;
  const preset = SHEET_SIZES[settings.sheet];
  return { width: preset.widthMm, height: preset.heightMm };
}

function newPlacement(page: ResizePageInfo, index: number, settings: PrintSettings): VisualPlacement {
  const selected = sheetSize(settings);
  const sheetWidth = settings.orientation === "landscape" ? selected.height : selected.width;
  const sheetHeight = settings.orientation === "landscape" ? selected.width : selected.height;
  const pageRatio = page.widthPt / page.heightPt;
  let width = 0.38;
  let height = width * (sheetWidth / sheetHeight) / pageRatio;
  if (height > 0.48) { height = 0.48; width = height * pageRatio * (sheetHeight / sheetWidth); }
  const step = (index % 6) * 0.035;
  return { x: clamp(0.08 + step, 0, 1 - width), y: clamp(0.08 + step, 0, 1 - height), width, height };
}

export default function MontarPdfParaImpressaoClient() {
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<DocumentItem[]>([]);
  const combinedBytesRef = useRef<Uint8Array | null>(null);
  const resultUrlRef = useRef<string | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const idCounterRef = useRef(1);
  const [items, setItems] = useState<DocumentItem[]>([]);
  const [pages, setPages] = useState<ResizePageInfo[]>([]);
  const [placements, setPlacements] = useState<VisualPlacement[]>([]);
  const [crops, setCrops] = useState<VisualCrop[]>([]);
  const [cropTarget, setCropTarget] = useState<number | null>(null);
  const [settings, setSettings] = useState(initial);
  const [selected, setSelected] = useState(0);
  const [status, setStatus] = useState<ToolStatus>("idle");
  const [stage, setStage] = useState("Lendo os PDFs");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ name: string; blob: Blob } | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  useEffect(() => { itemsRef.current = items; }, [items]);
  useEffect(() => { resultUrlRef.current = resultUrl; }, [resultUrl]);
  useEffect(() => () => { itemsRef.current.forEach((item) => disposeResizeInspection(item.inspection)); if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current); }, []);

  const layout = useMemo(() => pages.length && placements.length === pages.length ? createVisualLayout(pages, settings, placements) : null, [pages, placements, settings]);
  const labels = useMemo(() => items.flatMap((item) => item.inspection.pages.map((_, index) => item.inspection.pages.length > 1 ? `${item.file.name} · pág. ${index + 1}` : item.file.name)), [items]);

  async function rebuild(next: DocumentItem[]) {
    const { PDFDocument } = await import("pdf-lib");
    const merged = await PDFDocument.create();
    const flatPages: ResizePageInfo[] = [];
    for (const item of next) {
      const source = await PDFDocument.load(item.inspection.bytes.slice(), { ignoreEncryption: false });
      const copied = await merged.copyPages(source, source.getPageIndices());
      copied.forEach((page) => merged.addPage(page));
      item.inspection.pages.forEach((page) => flatPages.push({ ...page, pageNumber: flatPages.length + 1, selected: true }));
    }
    combinedBytesRef.current = next.length ? await merged.save({ useObjectStreams: true }) : null;
    setPages(flatPages);
    setPlacements((current) => flatPages.map((page, index) => current[index] ?? newPlacement(page, index, settings)));
    setCrops((current) => flatPages.map((_, index) => current[index] ?? fullCrop));
    setSelected((current) => Math.min(current, Math.max(0, flatPages.length - 1)));
  }

  async function addFiles(selectedFiles: File[]) {
    if (!selectedFiles.length || status === "processing") return;
    setError(null);
    const totalSize = items.reduce((sum, item) => sum + item.file.size, 0) + selectedFiles.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > 25 * 1024 * 1024) { setError(errorText(new Error("too-large"))); setStatus("error"); return; }
    setStatus("processing");
    setStage("Lendo os PDFs");
    const added: DocumentItem[] = [];
    try {
      for (let index = 0; index < selectedFiles.length; index++) {
        const file = selectedFiles[index];
        if (!file.size || file.name.split(".").pop()?.toLowerCase() !== "pdf") throw new Error("invalid-pdf");
        setStage(`Analisando arquivo ${index + 1} de ${selectedFiles.length}`);
        const inspection = await inspectResizePdf(file, setStage);
        added.push({ id: `${idCounterRef.current++}-${index}-${file.name}`, file, inspection });
      }
      const next = [...items, ...added];
      if (next.reduce((sum, item) => sum + item.inspection.pages.length, 0) > 100) throw new Error("too-many-pages");
      await rebuild(next);
      setItems(next);
      setStatus("ready");
    } catch (reason) {
      added.forEach((item) => disposeResizeInspection(item.inspection));
      setError(errorText(reason));
      setStatus("error");
    }
  }

  async function removeItem(item: DocumentItem) {
    setStatus("processing");
    setStage("Atualizando a montagem");
    const next = items.filter((entry) => entry.id !== item.id);
    setPlacements([]);
    setCrops([]);
    await rebuild(next);
    setItems(next);
    disposeResizeInspection(item.inspection);
    setStatus(next.length ? "ready" : "idle");
  }

  function clear() {
    items.forEach((item) => disposeResizeInspection(item.inspection));
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    combinedBytesRef.current = null;
    setItems([]); setPages([]); setPlacements([]); setCrops([]); setCropTarget(null); setResult(null); setResultUrl(null); setError(null); setStatus("idle");
  }

  async function generate() {
    if (!combinedBytesRef.current || status === "processing" || !placements.length) return;
    setError(null);
    try {
      setStatus("processing");
      setStage("Montando sua folha");
      const blob = await buildVisualPrintPdf(combinedBytesRef.current, pages, settings, placements, crops, setStage);
      if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
      const url = URL.createObjectURL(blob);
      setResult({ name: outputName(items[0]?.file.name ?? "documentos.pdf"), blob });
      setResultUrl(url);
      setStatus("success");
    } catch (reason) { setError(errorText(reason)); setStatus("error"); }
  }

  function pointerStarter(index: number, mode: ResizeMode, placement: VisualPlacement) {
    return (event: ReactPointerEvent) => {
      event.preventDefault(); event.stopPropagation();
      canvasRef.current?.setPointerCapture(event.pointerId);
      dragRef.current = { index, mode, startX: event.clientX, startY: event.clientY, origin: placement };
      setSelected(index);
    };
  }

  function cropPointerStarter(index: number, mode: CropEdgeMode, placement: VisualPlacement, crop: VisualCrop) {
    return (event: ReactPointerEvent) => {
      event.preventDefault(); event.stopPropagation();
      canvasRef.current?.setPointerCapture(event.pointerId);
      dragRef.current = { index, mode, startX: event.clientX, startY: event.clientY, origin: placement, crop };
      setSelected(index);
    };
  }

  function movePointer(event: ReactPointerEvent) {
    const drag = dragRef.current;
    const canvas = canvasRef.current;
    if (!drag || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dx = (event.clientX - drag.startX) / rect.width;
    const dy = (event.clientY - drag.startY) / rect.height;
    const original = drag.origin;
    let next = original;
    if (drag.mode.startsWith("crop-") && drag.crop) {
      const crop = drag.crop;
      let nextCrop = crop;
      if (drag.mode === "crop-right") {
        const right = clamp(crop.x + crop.width + dx * (crop.width / original.width), crop.x + 0.04, Math.min(1, crop.x + crop.width * ((1 - original.x) / original.width)));
        const width = crop.width ? original.width * ((right - crop.x) / crop.width) : original.width;
        nextCrop = { ...crop, width: right - crop.x };
        next = { ...original, width };
      } else if (drag.mode === "crop-left") {
        const right = crop.x + crop.width;
        const minimumX = Math.max(0, right - crop.width * ((original.x + original.width) / original.width));
        const x = clamp(crop.x + dx * (crop.width / original.width), minimumX, right - 0.04);
        const width = crop.width ? original.width * ((right - x) / crop.width) : original.width;
        nextCrop = { ...crop, x, width: right - x };
        next = { ...original, x: original.x + original.width - width, width };
      } else if (drag.mode === "crop-bottom") {
        const bottom = clamp(crop.y + crop.height + dy * (crop.height / original.height), crop.y + 0.04, Math.min(1, crop.y + crop.height * ((1 - original.y) / original.height)));
        const height = crop.height ? original.height * ((bottom - crop.y) / crop.height) : original.height;
        nextCrop = { ...crop, height: bottom - crop.y };
        next = { ...original, height };
      } else {
        const bottom = crop.y + crop.height;
        const minimumY = Math.max(0, bottom - crop.height * ((original.y + original.height) / original.height));
        const y = clamp(crop.y + dy * (crop.height / original.height), minimumY, bottom - 0.04);
        const height = crop.height ? original.height * ((bottom - y) / crop.height) : original.height;
        nextCrop = { ...crop, y, height: bottom - y };
        next = { ...original, y: original.y + original.height - height, height };
      }
      setCrops((current) => current.map((value, index) => index === drag.index ? nextCrop : value));
      setPlacements((current) => current.map((placement, index) => index === drag.index ? next : placement));
      setResult(null);
      return;
    }
    if (drag.mode === "move") {
      next = { ...original, x: clamp(original.x + dx, 0, 1 - original.width), y: clamp(original.y + dy, 0, 1 - original.height) };
    } else {
      const east = drag.mode.endsWith("e");
      const south = drag.mode.startsWith("s");
      const xScale = 1 + (east ? dx : -dx) / original.width;
      const yScale = 1 + (south ? dy : -dy) / original.height;
      let scale = Math.abs(xScale - 1) > Math.abs(yScale - 1) ? xScale : yScale;
      const maxX = east ? (1 - original.x) / original.width : (original.x + original.width) / original.width;
      const maxY = south ? (1 - original.y) / original.height : (original.y + original.height) / original.height;
      scale = clamp(scale, Math.max(0.08 / original.width, 0.08 / original.height), Math.min(maxX, maxY));
      const width = original.width * scale;
      const height = original.height * scale;
      next = { x: east ? original.x : original.x + original.width - width, y: south ? original.y : original.y + original.height - height, width, height };
    }
    setPlacements((current) => current.map((placement, index) => index === drag.index ? next : placement));
    setResult(null);
  }

  function applyCrop(index: number, crop: VisualCrop) {
    const page = pages[index];
    const placement = placements[index];
    const selectedSheet = sheetSize(settings);
    const sheetWidth = settings.orientation === "landscape" ? selectedSheet.height : selectedSheet.width;
    const sheetHeight = settings.orientation === "landscape" ? selectedSheet.width : selectedSheet.height;
    const croppedRatio = (page.widthPt * crop.width) / (page.heightPt * crop.height);
    let width = placement.width;
    let height = width * (sheetWidth / sheetHeight) / croppedRatio;
    const availableHeight = 1 - placement.y;
    if (height > availableHeight) { width *= availableHeight / height; height = availableHeight; }
    setCrops((current) => current.map((value, pageIndex) => pageIndex === index ? crop : value));
    setPlacements((current) => current.map((value, pageIndex) => pageIndex === index ? { ...value, width, height } : value));
    setCropTarget(null);
    setResult(null);
  }

  const sheet = sheetSize(settings);
  const landscape = settings.orientation === "landscape";
  const canvasRatio = landscape ? sheet.height / sheet.width : sheet.width / sheet.height;

  return <ToolPageShell title="Montar PDF para Impressão" description="Posicione e redimensione seus arquivos diretamente na folha, de um jeito simples e visual." categoryName="PDF" categoryHref="/ferramentas/pdfs" breadcrumbRootName="Início" breadcrumbRootHref="/" privacyMessage="Use somente documentos que você tem autorização para processar.">
    <Card className="mx-auto max-w-7xl overflow-hidden">
      <CardHeader className="border-b">
        <CardTitle>Montar PDF para Impressão</CardTitle>
        <CardDescription>Adicione seus PDFs e monte a folha com mouse ou toque. Arraste para mover e use as alças grandes para redimensionar.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <input ref={inputRef} type="file" accept="application/pdf,.pdf" multiple className="sr-only" onChange={(event) => { void addFiles(Array.from(event.target.files ?? [])); event.target.value = ""; }} />
        {!items.length && status !== "processing" && <div className="p-5 sm:p-8"><button type="button" onClick={() => openFilePicker(inputRef.current)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); void addFiles(Array.from(event.dataTransfer.files)); }} className="flex min-h-72 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-primary/35 bg-primary/[0.03] p-8 text-center transition hover:border-primary hover:bg-primary/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><span className="grid size-14 place-items-center rounded-full bg-primary/10 text-primary"><Upload className="size-7" /></span><span className="mt-5 font-heading text-xl font-semibold">Adicione seus arquivos PDF</span><span className="mt-2 max-w-md text-sm text-muted-foreground">Arraste os arquivos para cá ou clique para escolher. Você poderá posicionar e redimensionar tudo diretamente na folha.</span><span className="mt-6 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">Escolher arquivos</span></button><ToolErrorMessage message={error} /></div>}
        <div className="px-5"><ToolProcessingStatus status={status} message={stage} /></div>
        {!!items.length && status !== "success" && <div className="min-h-[690px] bg-muted/20 lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="border-b bg-background p-4 lg:border-b-0 lg:border-r">
            <div className="grid grid-cols-3 gap-2 lg:grid-cols-2">{pages.map((page, index) => <button key={`${page.pageNumber}-${index}`} type="button" onClick={() => setSelected(index)} onDoubleClick={() => setCropTarget(index)} className={`group rounded-lg border p-1.5 text-left transition ${selected === index ? "border-primary bg-primary/5 ring-2 ring-primary/15" : "hover:border-primary/50"}`}><span className="relative block aspect-[3/4] overflow-hidden rounded bg-white"><Image src={page.thumbnailUrl} alt={labels[index] ?? `Página ${index + 1}`} fill unoptimized className="object-contain" />{crops[index] && crops[index].width < 0.999 && <span className="absolute bottom-1 right-1 rounded bg-primary px-1.5 py-0.5 text-[9px] font-semibold text-primary-foreground">Recortada</span>}</span><span className="mt-1.5 block truncate text-[11px] font-medium">Página {index + 1}</span></button>)}</div>
            <div className="mt-5 space-y-2 border-t pt-4">{items.map((item) => <div key={item.id} className="flex items-center gap-2 text-xs"><GripVertical className="size-3.5 shrink-0 text-muted-foreground" /><span className="min-w-0 flex-1 truncate" title={item.file.name}>{item.file.name}</span><button type="button" onClick={() => void removeItem(item)} className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label={`Remover ${item.file.name}`}><Trash2 className="size-3.5" /></button></div>)}</div>
          </aside>
          <section className="flex min-w-0 flex-col">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-background px-4 py-3">
              <div className="flex flex-wrap items-center gap-2"><Button variant="outline" size="sm" onClick={() => openFilePicker(inputRef.current)}><FilePlus2 className="size-4" />Adicionar PDF</Button><Button variant="outline" size="sm" disabled={selected < 0} onClick={() => setCropTarget(selected)}><Crop className="size-4" />Recortar</Button><label className="flex items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-sm font-medium"><LayoutTemplate className="size-4 text-muted-foreground" /><select aria-label="Tamanho da folha" value={settings.sheet} onChange={(event) => { setSettings((current) => ({ ...current, sheet: event.target.value as SheetSize })); setResult(null); }} className="bg-transparent text-foreground outline-none">{Object.keys(SHEET_SIZES).map((size) => <option key={size} style={{ color: "#0f172a", backgroundColor: "#ffffff" }}>{size}</option>)}</select></label><button type="button" onClick={() => { setSettings((current) => ({ ...current, orientation: current.orientation === "landscape" ? "portrait" : "landscape" })); setResult(null); }} className="rounded-md border bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted">{landscape ? "Paisagem" : "Retrato"}</button></div>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><MousePointer2 className="size-3.5" />Toque para selecionar · arraste a caixa ou as alças</p>
            </div>
            <div className="flex flex-1 items-center justify-center overflow-auto bg-[radial-gradient(circle,_hsl(var(--border))_1px,_transparent_1px)] bg-[size:18px_18px] p-5 sm:p-8">
              <div ref={canvasRef} onPointerMove={movePointer} onPointerUp={() => { dragRef.current = null; }} onPointerCancel={() => { dragRef.current = null; }} onPointerDown={() => setSelected(-1)} className="relative w-full max-w-[560px] touch-none overflow-hidden bg-white shadow-[0_12px_45px_rgba(15,23,42,0.18)]" style={{ aspectRatio: canvasRatio }} aria-label={`Folha ${settings.sheet} em modo ${landscape ? "paisagem" : "retrato"}`}>
                {placements.map((placement, index) => <div key={`${pages[index]?.pageNumber}-${index}`} onDoubleClick={() => setCropTarget(index)} onPointerDown={pointerStarter(index, "move", placement)} className={`absolute touch-none cursor-move select-none overflow-visible ${selected === index ? "z-20 ring-2 ring-primary shadow-[0_0_0_3px_rgba(255,255,255,.9)]" : "z-10 hover:ring-1 hover:ring-primary/60"}`} style={{ left: `${placement.x * 100}%`, top: `${placement.y * 100}%`, width: `${placement.width * 100}%`, height: `${placement.height * 100}%` }}><CroppedPageImage page={pages[index]} crop={crops[index] ?? fullCrop} alt={labels[index] ?? `Página ${index + 1}`} />{selected === index && <>{(["nw", "ne", "sw", "se"] as const).map((corner) => <button key={corner} type="button" aria-label={`Redimensionar pelo canto ${corner}`} onPointerDown={pointerStarter(index, corner, placement)} className={`absolute z-30 grid size-11 touch-none place-items-center rounded-full bg-transparent ${corner === "nw" ? "-left-[22px] -top-[22px] cursor-nwse-resize" : corner === "ne" ? "-right-[22px] -top-[22px] cursor-nesw-resize" : corner === "sw" ? "-bottom-[22px] -left-[22px] cursor-nesw-resize" : "-bottom-[22px] -right-[22px] cursor-nwse-resize"}`}><span aria-hidden="true" className="size-4 rounded-full border-2 border-white bg-primary shadow-md" /></button>)}<button type="button" aria-label="Recortar pela borda esquerda" onPointerDown={cropPointerStarter(index, "crop-left", placement, crops[index] ?? fullCrop)} className="absolute -left-[22px] top-1/2 z-20 grid size-11 -translate-y-1/2 touch-none place-items-center cursor-ew-resize"><span aria-hidden="true" className="h-8 w-2 rounded-full border border-primary bg-white shadow" /></button><button type="button" aria-label="Recortar pela borda direita" onPointerDown={cropPointerStarter(index, "crop-right", placement, crops[index] ?? fullCrop)} className="absolute -right-[22px] top-1/2 z-20 grid size-11 -translate-y-1/2 touch-none place-items-center cursor-ew-resize"><span aria-hidden="true" className="h-8 w-2 rounded-full border border-primary bg-white shadow" /></button><button type="button" aria-label="Recortar pela borda superior" onPointerDown={cropPointerStarter(index, "crop-top", placement, crops[index] ?? fullCrop)} className="absolute left-1/2 -top-[22px] z-20 grid size-11 -translate-x-1/2 touch-none place-items-center cursor-ns-resize"><span aria-hidden="true" className="h-2 w-8 rounded-full border border-primary bg-white shadow" /></button><button type="button" aria-label="Recortar pela borda inferior" onPointerDown={cropPointerStarter(index, "crop-bottom", placement, crops[index] ?? fullCrop)} className="absolute -bottom-[22px] left-1/2 z-20 grid size-11 -translate-x-1/2 touch-none place-items-center cursor-ns-resize"><span aria-hidden="true" className="h-2 w-8 rounded-full border border-primary bg-white shadow" /></button></>}</div>)}
                {!placements.length && <div className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">Adicione um PDF para começar</div>}
              </div>
            </div>
            <div className="flex flex-col gap-3 border-t bg-background px-4 py-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-muted-foreground">{pages.length} {pages.length === 1 ? "página" : "páginas"} na folha · {layout?.occupiedPercent.toFixed(0) ?? 0}% ocupado · {formatFileSize(items.reduce((sum, item) => sum + item.file.size, 0))}</p><Button size="lg" onClick={() => void generate()} disabled={status === "processing"}><Download className="size-4" />Gerar PDF para impressão</Button></div>
          </section>
        </div>}
        <div className="px-5"><ToolErrorMessage message={error} /></div>
        {result && status === "success" && <div className="p-5 sm:p-6"><ToolResultCard title="PDF pronto para impressão" description={`${result.name} · ${formatFileSize(result.blob.size)}`} actions={<><Button asChild><a href={resultUrl ?? undefined} download={result.name}><Download className="size-4" />Baixar PDF</a></Button><Button variant="outline" onClick={() => { setResult(null); setStatus("ready"); }}><RefreshCw className="size-4" />Continuar editando</Button><Button variant="outline" onClick={clear}><RotateCcw className="size-4" />Nova montagem</Button></>} /></div>}
      </CardContent>
    </Card>
    {cropTarget !== null && pages[cropTarget] && <VisualCropEditor page={pages[cropTarget]} value={crops[cropTarget] ?? fullCrop} onCancel={() => setCropTarget(null)} onApply={(crop) => applyCrop(cropTarget, crop)} />}
  </ToolPageShell>;
}

function CroppedPageImage({ page, crop, alt }: { page: ResizePageInfo; crop: VisualCrop; alt: string }) {
  return <div className="relative size-full overflow-hidden bg-white"><div className="absolute" style={{ left: `${-(crop.x / crop.width) * 100}%`, top: `${-(crop.y / crop.height) * 100}%`, width: `${100 / crop.width}%`, height: `${100 / crop.height}%` }}><Image src={page.thumbnailUrl} alt={alt} fill unoptimized draggable={false} className="pointer-events-none object-fill" /></div></div>;
}
