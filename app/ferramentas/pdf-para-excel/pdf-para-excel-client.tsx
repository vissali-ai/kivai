"use client";

import { openFilePicker } from "@/lib/browser/file-picker";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Download, FileSpreadsheet, FileText, RefreshCw, RotateCcw, Trash2, Upload } from "lucide-react";

import { ToolActionBar } from "@/components/tools/tool-action-bar";
import { ToolErrorMessage } from "@/components/tools/tool-error-message";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { ToolProcessingStatus, type ToolStatus } from "@/components/tools/tool-processing-status";
import { ToolResultCard } from "@/components/tools/tool-result-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatFileSize } from "@/lib/tool-files";
import {
  PDF_TO_EXCEL_MAX_FILE_SIZE,
  PDF_TO_EXCEL_MAX_FILE_SIZE_LABEL,
  PDF_TO_EXCEL_MAX_PAGES,
  type EmptyRowsMode,
  type HeaderMode,
  type NumericMode,
  type TableOrganization,
} from "./config";
import {
  analyzePdf,
  createCsv,
  createExcel,
  disposeInspection,
  inspectPdf,
  parsePageRange,
  type ExtractedTable,
  type PdfInspection,
} from "./pdf-to-excel";

type PageItem = { pageNumber: number; thumbnailUrl: string; selected: boolean; included: boolean };
type Result = { blob: Blob; name: string; size: number; tables: number; sheets: number; csv?: Blob };

function friendlyError(error: unknown) {
  const code = error instanceof Error ? error.message : "";
  if (code === "invalid-pdf") return "Selecione um arquivo no formato PDF.";
  if (code === "too-many-pages") return `Este PDF ultrapassa o limite de ${PDF_TO_EXCEL_MAX_PAGES} páginas. Selecione um documento menor.`;
  if (code === "protected-pdf") return "Este PDF possui proteção e não pôde ser analisado.";
  if (code === "corrupt-pdf") return "Não foi possível ler este PDF. Verifique o arquivo e tente novamente.";
  if (code === "scanned-pdf") return "Este PDF parece conter apenas imagens. A extração automática de tabelas digitalizadas ainda não está disponível.";
  if (code === "no-tables") return "Não encontramos tabelas ou textos estruturados neste PDF. O arquivo pode ser uma imagem digitalizada ou possuir um layout incompatível.";
  if (code === "no-pages") return "Selecione pelo menos uma página para analisar.";
  if (code === "invalid-pages") return "Informe páginas válidas, como 1-5 ou 1,3,7.";
  if (code === "no-selected-tables") return "Selecione pelo menos uma tabela para criar o arquivo Excel.";
  if (code === "too-many-cells") return "O conteúdo ultrapassa o limite de dados permitido. Selecione menos páginas.";
  return "Não foi possível gerar o arquivo Excel. Revise os dados e tente novamente.";
}

function safeOutputName(name: string) {
  const base = name.replace(/\.pdf$/i, "").replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-").trim() || "planilha";
  return `${base}.xlsx`;
}

export default function PdfParaExcelClient() {
  const inputRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);
  const inspectionRef = useRef<PdfInspection | null>(null);
  const resultUrlRef = useRef<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [tables, setTables] = useState<ExtractedTable[]>([]);
  const [pageRange, setPageRange] = useState("");
  const [pageRangeError, setPageRangeError] = useState<string | null>(null);
  const [organization, setOrganization] = useState<TableOrganization>("separate");
  const [headerMode, setHeaderMode] = useState<HeaderMode>("auto");
  const [emptyRows, setEmptyRows] = useState<EmptyRowsMode>("remove");
  const [numericMode, setNumericMode] = useState<NumericMode>("auto");
  const [status, setStatus] = useState<ToolStatus>("idle");
  const [stage, setStage] = useState("Lendo o PDF");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => { resultUrlRef.current = resultUrl; }, [resultUrl]);
  useEffect(() => () => {
    disposeInspection(inspectionRef.current);
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
  }, []);

  const includedPages = pages.filter((page) => page.included);
  const selectedPages = includedPages.filter((page) => page.selected);
  const selectedTables = tables.filter((table) => table.included);

  function release() {
    disposeInspection(inspectionRef.current);
    inspectionRef.current = null;
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    resultUrlRef.current = null;
  }

  function reset() {
    release();
    setFile(null); setPages([]); setTables([]); setPageRange(""); setPageRangeError(null);
    setResult(null); setResultUrl(null); setError(null); setStatus("idle");
  }

  async function selectFile(files: File[]) {
    const selected = files[0];
    if (!selected || status === "processing") return;
    setError(null); setPageRangeError(null);
    if (selected.name.split(".").pop()?.toLowerCase() !== "pdf" || !["application/pdf", "application/octet-stream", ""].includes(selected.type)) {
      setError("Selecione um arquivo no formato PDF."); setStatus("error"); return;
    }
    if (!selected.size) { setError("Selecione um arquivo no formato PDF."); setStatus("error"); return; }
    if (selected.size > PDF_TO_EXCEL_MAX_FILE_SIZE) { setError(`O arquivo ultrapassa o limite permitido de ${PDF_TO_EXCEL_MAX_FILE_SIZE_LABEL}.`); setStatus("error"); return; }
    release(); setFile(null); setPages([]); setTables([]); setResult(null); setResultUrl(null);
    setStatus("processing"); setStage("Lendo o PDF");
    try {
      const inspection = await inspectPdf(selected, () => setStage("Analisando páginas"));
      inspectionRef.current = inspection;
      setFile(selected);
      setPages(inspection.previews.map((page) => ({ ...page, selected: true, included: true })));
      setStatus("ready");
    } catch (reason) { setError(friendlyError(reason)); setStatus("error"); }
  }

  function applyRange() {
    if (!inspectionRef.current) return;
    try {
      const selected = parsePageRange(pageRange, inspectionRef.current.pageCount);
      if (!selected) { setPageRangeError(null); return; }
      setPages((current) => current.map((page) => ({ ...page, selected: selected.includes(page.pageNumber) })));
      setPageRangeError(null);
    } catch (reason) { setPageRangeError(friendlyError(reason)); }
  }

  async function analyze() {
    if (!file || !selectedPages.length || status === "processing") return;
    setStatus("processing"); setError(null); setStage("Analisando páginas"); setTables([]);
    try {
      const extracted = await analyzePdf(file, selectedPages.map((page) => page.pageNumber), setStage);
      setTables(extracted); setStatus("ready");
    } catch (reason) { setError(friendlyError(reason)); setStatus("error"); }
  }

  function updateTable(id: string, update: (table: ExtractedTable) => ExtractedTable) {
    setTables((current) => current.map((table) => table.id === id ? update(table) : table));
  }

  async function convert() {
    if (!file || !selectedTables.length || status === "processing") return;
    setStatus("processing"); setError(null); setStage("Organizando os dados");
    try {
      const output = await createExcel(tables, { organization, headerMode, emptyRows, numericMode }, setStage);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      const url = URL.createObjectURL(output.blob);
      const name = safeOutputName(file.name);
      setResult({ blob: output.blob, name, size: output.blob.size, tables: selectedTables.length, sheets: output.sheetCount, csv: selectedTables.length === 1 ? createCsv(selectedTables[0], { organization, headerMode, emptyRows, numericMode }) : undefined });
      setResultUrl(url); setStatus("success");
    } catch (reason) { setError(friendlyError(reason)); setStatus("error"); }
  }

  function downloadBlob(blob: Blob, name: string) {
    const url = URL.createObjectURL(blob); const anchor = document.createElement("a");
    anchor.href = url; anchor.download = name; document.body.appendChild(anchor); anchor.click(); anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
  }

  return <ToolPageShell title="Converter PDF para Excel" description="Extraia tabelas e dados de arquivos PDF para uma planilha Excel." categoryName="PDF" categoryHref="/ferramentas/pdfs" breadcrumbRootName="Início" breadcrumbRootHref="/" privacyMessage="Use somente documentos que você tem autorização para processar.">
    <Card className="mx-auto max-w-5xl"><CardHeader><CardTitle>Converter PDF para Excel</CardTitle><CardDescription>Extraia tabelas e dados de arquivos PDF para uma planilha Excel.</CardDescription></CardHeader><CardContent className="space-y-6">
      {!file && status !== "processing" && <><input ref={inputRef} type="file" accept="application/pdf,.pdf" className="sr-only" onChange={(event) => { void selectFile(Array.from(event.target.files ?? [])); event.target.value = ""; }} /><div onDragEnter={(event) => { event.preventDefault(); setDragging(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false); }} onDrop={(event) => { event.preventDefault(); setDragging(false); void selectFile(Array.from(event.dataTransfer.files)); }} className={`flex min-h-64 flex-col items-center justify-center border border-dashed p-6 text-center transition-colors sm:p-10 ${dragging ? "border-primary bg-primary/5" : "border-border bg-muted/20"}`}><span className="flex size-14 items-center justify-center border border-border bg-background"><Upload className="size-5" /></span><p className="mt-5 font-heading text-lg font-medium">Arraste seu PDF aqui</p><p className="mt-2 text-sm text-muted-foreground">ou clique para selecionar</p><p className="mt-2 text-xs text-muted-foreground">Formato aceito: PDF · Máximo: {PDF_TO_EXCEL_MAX_FILE_SIZE_LABEL}</p><Button className="mt-5" onClick={() => openFilePicker(inputRef.current)}><FileText className="size-4" />Selecionar PDF</Button></div><ToolErrorMessage message={error} /></>}
      <ToolProcessingStatus status={status} message={stage} />

      {file && status !== "success" && <>
        <section aria-label="PDF selecionado" className="flex min-w-0 flex-col gap-4 rounded-lg border border-border p-4 sm:flex-row sm:items-center"><div className="relative aspect-[3/4] w-20 shrink-0 overflow-hidden border bg-white">{pages[0] && <Image src={pages[0].thumbnailUrl} alt="Miniatura da primeira página" fill unoptimized className="object-contain" />}</div><div className="min-w-0 flex-1"><p className="truncate font-medium">{file.name}</p><p className="mt-1 text-sm text-muted-foreground">PDF · {formatFileSize(file.size)} · {pages.length} {pages.length === 1 ? "página" : "páginas"}</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={reset} disabled={status === "processing"}><Trash2 className="size-4" />Remover</Button><input ref={replaceRef} type="file" accept="application/pdf,.pdf" className="sr-only" onChange={(event) => { void selectFile(Array.from(event.target.files ?? [])); event.target.value = ""; }} /><Button variant="outline" size="sm" onClick={() => openFilePicker(replaceRef.current)} disabled={status === "processing"}><RefreshCw className="size-4" />Substituir</Button></div></section>
        <section aria-labelledby="paginas-pdf-excel"><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h2 id="paginas-pdf-excel" className="font-heading text-lg font-medium">Páginas para análise</h2><p className="mt-1 text-sm text-muted-foreground">{selectedPages.length} de {includedPages.length} selecionadas</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => setPages((current) => current.map((page) => page.included ? { ...page, selected: true } : page))}>Selecionar todas</Button><Button variant="outline" size="sm" onClick={() => setPages((current) => current.map((page) => ({ ...page, selected: false })))}>Desmarcar todas</Button><Button variant="outline" size="sm" onClick={() => setPages((current) => current.map((page) => ({ ...page, selected: true, included: true })))}><RotateCcw className="size-4" />Restaurar</Button></div></div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end"><label className="grid flex-1 gap-2 text-sm font-medium">Páginas (opcional)<input value={pageRange} onChange={(event) => setPageRange(event.target.value)} onBlur={applyRange} placeholder="Ex.: 1-5 ou 1,3,7" className="min-h-11 rounded-md border border-input bg-background px-3 outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30" /></label><Button variant="outline" onClick={applyRange}>Aplicar intervalo</Button></div><ToolErrorMessage message={pageRangeError} />
          <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{includedPages.map((page) => <li key={page.pageNumber} className={`rounded-lg border p-2 ${page.selected ? "border-primary ring-1 ring-primary/30" : "border-border opacity-60"}`}><label className="cursor-pointer"><span className="relative block aspect-[3/4] overflow-hidden bg-white"><Image src={page.thumbnailUrl} alt={`Miniatura da página ${page.pageNumber}`} fill unoptimized className="object-contain" /></span><span className="mt-2 flex items-center gap-2 text-sm"><input type="checkbox" checked={page.selected} onChange={(event) => setPages((current) => current.map((item) => item.pageNumber === page.pageNumber ? { ...item, selected: event.target.checked } : item))} />Página {page.pageNumber}</span></label><Button variant="ghost" size="sm" className="mt-1 w-full" onClick={() => setPages((current) => current.map((item) => item.pageNumber === page.pageNumber ? { ...item, included: false, selected: false } : item))}>Remover</Button></li>)}</ul>
        </section>
        {!tables.length && <><ToolErrorMessage message={error} /><ToolActionBar><Button size="lg" onClick={analyze} disabled={status === "processing" || !selectedPages.length}><FileSpreadsheet className="size-4" />Analisar PDF</Button></ToolActionBar></>}
      </>}

      {tables.length > 0 && status !== "success" && <>
        <section aria-labelledby="tabelas-encontradas"><div className="flex items-center justify-between gap-3"><div><h2 id="tabelas-encontradas" className="font-heading text-lg font-medium">Tabelas encontradas</h2><p className="mt-1 text-sm text-muted-foreground">{selectedTables.length} de {tables.length} incluídas</p></div></div><div className="mt-5 space-y-5">{tables.map((table) => <TableEditor key={table.id} table={table} onChange={(update) => updateTable(table.id, update)} />)}</div></section>
        <fieldset disabled={status === "processing"} className="grid gap-5 rounded-lg border border-border p-4 sm:grid-cols-2 sm:p-5"><legend className="px-2 font-heading font-medium">Configurações de conversão</legend><Select label="Organização das tabelas" value={organization} onChange={(value) => setOrganization(value as TableOrganization)} options={[["separate", "Uma planilha para cada tabela"], ["combined", "Todas as tabelas na mesma planilha"]]} /><Select label="Cabeçalho" value={headerMode} onChange={(value) => setHeaderMode(value as HeaderMode)} options={[["auto", "Detectar automaticamente"], ["first", "Usar primeira linha como cabeçalho"], ["none", "Não usar cabeçalho"]]} /><Select label="Linhas vazias" value={emptyRows} onChange={(value) => setEmptyRows(value as EmptyRowsMode)} options={[["remove", "Remover linhas vazias"], ["keep", "Manter linhas vazias"]]} /><Select label="Formatação numérica" value={numericMode} onChange={(value) => setNumericMode(value as NumericMode)} options={[["auto", "Detectar automaticamente"], ["text", "Manter tudo como texto"]]} /></fieldset>
        <ToolErrorMessage message={error} /><ToolActionBar><Button size="lg" onClick={convert} disabled={status === "processing" || !selectedTables.length}><FileSpreadsheet className="size-4" />Converter para Excel</Button></ToolActionBar>
      </>}

      {result && status === "success" && <ToolResultCard title="Excel pronto" description={`${result.name} · ${result.tables} ${result.tables === 1 ? "tabela" : "tabelas"} · ${result.sheets} ${result.sheets === 1 ? "planilha" : "planilhas"} · ${formatFileSize(result.size)}`} actions={<><Button asChild><a href={resultUrl ?? undefined} download={result.name}><Download className="size-4" />Baixar Excel</a></Button>{result.csv && <Button variant="outline" onClick={() => downloadBlob(result.csv!, result.name.replace(/\.xlsx$/i, ".csv"))}>Baixar CSV</Button>}<Button variant="outline" onClick={reset}><RotateCcw className="size-4" />Converter outro PDF</Button></>} />}
    </CardContent></Card>
  </ToolPageShell>;
}

function TableEditor({ table, onChange }: { table: ExtractedTable; onChange: (update: (table: ExtractedTable) => ExtractedTable) => void }) {
  const updateData = (data: string[][]) => onChange((current) => ({ ...current, data }));
  const columns = Math.max(0, ...table.data.map((row) => row.length));
  return <article className={`rounded-lg border p-4 ${table.included ? "border-primary/40" : "border-border opacity-65"}`}><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><label className="flex items-center gap-2 font-medium"><input type="checkbox" checked={table.included} onChange={(event) => onChange((current) => ({ ...current, included: event.target.checked }))} />Página {table.pageNumber}, Tabela {table.tableNumber}</label><p className="text-sm text-muted-foreground">{table.data.length} linhas · {columns} colunas</p></div><label className="mt-4 grid gap-2 text-sm font-medium">Nome da planilha<input value={table.sheetName} maxLength={60} onChange={(event) => onChange((current) => ({ ...current, sheetName: event.target.value }))} className="min-h-10 rounded-md border border-input bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-primary/30" /></label><div className="mt-4 max-w-full overflow-x-auto rounded-md border border-border"><table className="w-max min-w-full border-collapse text-sm"><caption className="sr-only">Prévia editável da tabela {table.tableNumber} da página {table.pageNumber}</caption><thead><tr><th className="sticky left-0 z-10 min-w-24 border-b border-r border-border bg-background p-2 text-left">Linha</th>{Array.from({ length: columns }, (_, columnIndex) => <th key={`column-${columnIndex}`} className="min-w-36 border-b border-r border-border bg-muted/40 p-1"><Button variant="ghost" size="sm" onClick={() => updateData(table.data.map((row) => row.filter((_, index) => index !== columnIndex)))}>Excluir coluna {columnIndex + 1}</Button></th>)}</tr></thead><tbody>{table.data.map((row, rowIndex) => <tr key={`${table.id}-row-${rowIndex}`}><th className="sticky left-0 z-10 border-b border-r border-border bg-background p-1"><Button variant="ghost" size="sm" onClick={() => updateData(table.data.filter((_, index) => index !== rowIndex))}>Excluir {rowIndex + 1}</Button></th>{Array.from({ length: columns }, (_, columnIndex) => <td key={`${rowIndex}-${columnIndex}`} className="min-w-36 border-b border-r border-border p-0"><label className="sr-only">Linha {rowIndex + 1}, coluna {columnIndex + 1}</label><input value={row[columnIndex] ?? ""} onChange={(event) => updateData(table.data.map((item, index) => index === rowIndex ? Array.from({ length: columns }, (_, cellIndex) => cellIndex === columnIndex ? event.target.value : item[cellIndex] ?? "") : item))} className="min-h-10 w-full bg-transparent px-2 outline-none focus:bg-primary/5 focus:ring-2 focus:ring-inset focus:ring-primary/40" /></td>)}</tr>)}</tbody></table></div><div className="mt-3 flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => updateData(table.data.filter((row) => row.some((cell) => cell.trim())))}>Remover linhas vazias</Button><Button variant="outline" size="sm" onClick={() => updateData(table.originalData.map((row) => [...row]))}><RotateCcw className="size-4" />Restaurar dados</Button></div></article>;
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: [string, string][] }) { return <label className="grid gap-2 text-sm font-medium">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="min-h-11 rounded-md border border-input bg-background px-3 outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30">{options.map(([key, text]) => <option key={key} value={key}>{text}</option>)}</select></label>; }
