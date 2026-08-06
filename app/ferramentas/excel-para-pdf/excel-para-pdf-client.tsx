"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Download, FileSpreadsheet, RefreshCw, RotateCcw, Trash2, Upload } from "lucide-react";

import { ToolActionBar } from "@/components/tools/tool-action-bar";
import { ToolErrorMessage } from "@/components/tools/tool-error-message";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { ToolProcessingStatus, type ToolStatus } from "@/components/tools/tool-processing-status";
import { ToolResultCard } from "@/components/tools/tool-result-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatFileSize } from "@/lib/tool-files";
import {
  DEFAULT_EXCEL_PDF_OPTIONS,
  EXCEL_TO_PDF_MAX_FILE_SIZE,
  EXCEL_TO_PDF_MAX_FILE_SIZE_LABEL,
  type ExcelFitMode,
  type ExcelMarginSize,
  type ExcelPageOrientation,
  type ExcelPageSize,
  type ExcelPdfOptions,
} from "./config";
import { createExcelPdf, inspectExcel, preparePages, renderExcelPage, type ExcelInspection, type ExcelPage, type ExcelSheet } from "./excel-to-pdf";

type Result = { name: string; blob: Blob; size: number; sheetCount: number; pageCount: number };

function friendlyError(error: unknown) {
  const code = error instanceof Error ? error.message : "";
  if (code === "invalid-xlsx") return "Selecione uma planilha no formato XLSX.";
  if (code === "unsupported-xls") return "Este formato ainda não é compatível. Salve a planilha como XLSX e tente novamente.";
  if (code === "corrupt-xlsx") return "Não foi possível abrir esta planilha. Verifique o arquivo e tente novamente.";
  if (code === "protected-xlsx") return "Esta planilha possui proteção e não pôde ser processada.";
  if (code === "empty-xlsx") return "Não encontramos dados para converter nesta planilha.";
  if (code === "no-sheets") return "Selecione pelo menos uma aba para gerar o PDF.";
  if (code === "too-many-sheets") return "Esta planilha possui mais de 20 abas. Reduza o arquivo e tente novamente.";
  if (code === "too-many-cells") return "A planilha possui dados demais para esta conversão. Selecione menos abas ou reduza o conteúdo.";
  if (code === "too-many-pages") return "O resultado ultrapassa o limite de 100 páginas. Ajuste a escala ou selecione menos abas.";
  if (code === "out-of-memory") return "Esta planilha exige mais memória do que o dispositivo pode disponibilizar. Tente utilizar um arquivo menor.";
  return "Não foi possível gerar o PDF. Revise o arquivo e tente novamente.";
}

function outputName(name: string) { return `${name.replace(/\.xlsx$/i, "").replace(/[<>:\"/\\|?*\u0000-\u001f]/g, "-").trim() || "planilha"}.pdf`; }

export default function ExcelParaPdfClient() {
  const inputRef = useRef<HTMLInputElement>(null); const replaceRef = useRef<HTMLInputElement>(null); const resultUrlRef = useRef<string | null>(null);
  const [file, setFile] = useState<File | null>(null); const [inspection, setInspection] = useState<ExcelInspection | null>(null); const [sheets, setSheets] = useState<ExcelSheet[]>([]);
  const [includeHidden, setIncludeHidden] = useState(false); const [options, setOptions] = useState<ExcelPdfOptions>(DEFAULT_EXCEL_PDF_OPTIONS); const [pages, setPages] = useState<ExcelPage[]>([]); const [visiblePreviews, setVisiblePreviews] = useState(6);
  const [status, setStatus] = useState<ToolStatus>("idle"); const [stage, setStage] = useState("Lendo a planilha"); const [error, setError] = useState<string | null>(null); const [dragging, setDragging] = useState(false);
  const [result, setResult] = useState<Result | null>(null); const [resultUrl, setResultUrl] = useState<string | null>(null);
  useEffect(() => { resultUrlRef.current = resultUrl; }, [resultUrl]);
  useEffect(() => () => { if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current); }, []);

  const selectableSheets = sheets.filter((sheet) => includeHidden || sheet.state === "visible");
  const selectedSheets = selectableSheets.filter((sheet) => sheet.selected && !sheet.excluded);
  function clearResult() { if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current); resultUrlRef.current = null; setResultUrl(null); setResult(null); }
  function reset() { clearResult(); setFile(null); setInspection(null); setSheets([]); setPages([]); setError(null); setStatus("idle"); setOptions(DEFAULT_EXCEL_PDF_OPTIONS); setIncludeHidden(false); }
  function updateOptions(patch: Partial<ExcelPdfOptions>) { setOptions((current) => ({ ...current, ...patch })); setPages([]); setStatus("ready"); clearResult(); }

  async function selectFile(files: File[]) {
    const selected = files[0]; if (!selected || status === "processing") return; setError(null);
    const extension = selected.name.split(".").pop()?.toLowerCase();
    if (extension === "xls") { setError(friendlyError(new Error("unsupported-xls"))); setStatus("error"); return; }
    if (extension !== "xlsx" || !["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/octet-stream", "application/zip", ""].includes(selected.type)) { setError(friendlyError(new Error("invalid-xlsx"))); setStatus("error"); return; }
    if (!selected.size) { setError(friendlyError(new Error("invalid-xlsx"))); setStatus("error"); return; }
    if (selected.size > EXCEL_TO_PDF_MAX_FILE_SIZE) { setError(`O arquivo ultrapassa o limite permitido de ${EXCEL_TO_PDF_MAX_FILE_SIZE_LABEL}.`); setStatus("error"); return; }
    clearResult(); setFile(null); setInspection(null); setSheets([]); setPages([]); setStatus("processing"); setStage("Lendo a planilha");
    try { const inspected = await inspectExcel(selected, setStage); setFile(selected); setInspection(inspected); setSheets(inspected.sheets); setStatus("ready"); }
    catch (reason) { setError(friendlyError(reason)); setStatus("error"); }
  }

  function moveSheet(index: number, direction: -1 | 1) { setSheets((current) => { const next = [...current]; const target = index + direction; if (target < 0 || target >= next.length) return current; [next[index], next[target]] = [next[target], next[index]]; return next; }); setPages([]); }
  function prepare() { setError(null); setStage("Preparando as páginas"); setStatus("processing"); try { const prepared = preparePages(sheets.map((sheet) => sheet.state !== "visible" && !includeHidden ? { ...sheet, selected: false } : sheet), options); setPages(prepared); setVisiblePreviews(6); setStatus("ready"); } catch (reason) { setError(friendlyError(reason)); setStatus("error"); } }
  async function convert() { if (!pages.length || status === "processing") return; setError(null); setStatus("processing"); setStage("Aplicando as configurações"); try { const blob = await createExcelPdf(pages, setStage); const url = URL.createObjectURL(blob); const name = outputName(file?.name ?? "planilha.xlsx"); clearResult(); setResult({ name, blob, size: blob.size, sheetCount: selectedSheets.length, pageCount: pages.length }); setResultUrl(url); setStatus("success"); } catch (reason) { setError(friendlyError(reason)); setStatus("error"); } }

  return <ToolPageShell title="Converter Excel para PDF" description="Transforme planilhas Excel em arquivos PDF organizados e prontos para compartilhar." categoryName="PDF" categoryHref="/ferramentas/pdfs" breadcrumbRootName="Início" breadcrumbRootHref="/" privacyMessage="Use somente planilhas que você tem autorização para processar.">
    <Card className="mx-auto max-w-6xl"><CardHeader><CardTitle>Converter Excel para PDF</CardTitle><CardDescription>Transforme planilhas Excel em arquivos PDF organizados e prontos para compartilhar.</CardDescription></CardHeader><CardContent className="space-y-6">
      {!file && status !== "processing" && <><input ref={inputRef} type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="sr-only" onChange={(event) => { void selectFile(Array.from(event.target.files ?? [])); event.target.value = ""; }} /><div onDragEnter={(event) => { event.preventDefault(); setDragging(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false); }} onDrop={(event) => { event.preventDefault(); setDragging(false); void selectFile(Array.from(event.dataTransfer.files)); }} className={`flex min-h-64 flex-col items-center justify-center border border-dashed p-6 text-center sm:p-10 ${dragging ? "border-primary bg-primary/5" : "border-border bg-muted/20"}`}><span className="flex size-14 items-center justify-center border border-border bg-background"><Upload className="size-5" /></span><p className="mt-5 font-heading text-lg font-medium">Arraste sua planilha Excel aqui</p><p className="mt-2 text-sm text-muted-foreground">ou clique para selecionar</p><p className="mt-2 text-xs text-muted-foreground">Formato aceito: XLSX</p><Button className="mt-5" onClick={() => inputRef.current?.click()}><FileSpreadsheet className="size-4" />Selecionar Excel</Button></div><ToolErrorMessage message={error} /></>}
      <ToolProcessingStatus status={status} message={stage} />
      {file && status !== "success" && <>
        <section aria-label="Excel selecionado" className="flex min-w-0 flex-col gap-4 rounded-lg border border-border p-4 sm:flex-row sm:items-center"><span className="flex size-16 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500"><FileSpreadsheet className="size-7" /></span><div className="min-w-0 flex-1"><p className="truncate font-medium">{file.name}</p><p className="mt-1 text-sm text-muted-foreground">XLSX · {formatFileSize(file.size)} · {sheets.length} {sheets.length === 1 ? "aba" : "abas"}</p><p className="mt-1 truncate text-xs text-muted-foreground">{sheets.map((sheet) => sheet.name).join(", ")}</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={reset} disabled={status === "processing"}><Trash2 className="size-4" />Remover</Button><input ref={replaceRef} type="file" accept=".xlsx" className="sr-only" onChange={(event) => { void selectFile(Array.from(event.target.files ?? [])); event.target.value = ""; }} /><Button variant="outline" size="sm" onClick={() => replaceRef.current?.click()} disabled={status === "processing"}><RefreshCw className="size-4" />Substituir</Button></div></section>
        {inspection?.hasFormulaWithoutResult && <Notice>Algumas fórmulas não possuem resultados armazenados e podem não aparecer corretamente no PDF.</Notice>}
        {inspection?.hasAdvancedElements && <Notice>Alguns gráficos ou elementos avançados podem apresentar diferenças no PDF.</Notice>}
        <section aria-labelledby="abas-excel-pdf"><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h2 id="abas-excel-pdf" className="font-heading text-lg font-medium">Abas para conversão</h2><p className="mt-1 text-sm text-muted-foreground">{selectedSheets.length} de {selectableSheets.length} selecionadas</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => { setSheets((current) => current.map((sheet) => includeHidden || sheet.state === "visible" ? { ...sheet, selected: true, excluded: false } : sheet)); setPages([]); }}>Selecionar todas</Button><Button variant="outline" size="sm" onClick={() => { setSheets((current) => current.map((sheet) => ({ ...sheet, selected: false }))); setPages([]); }}>Desmarcar todas</Button><Button variant="outline" size="sm" onClick={() => { setSheets((current) => [...current].sort((a, b) => a.originalIndex - b.originalIndex).map((sheet) => ({ ...sheet, excluded: false, selected: sheet.state === "visible" }))); setPages([]); }}><RotateCcw className="size-4" />Restaurar ordem</Button></div></div>
          <label className="mt-4 flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={includeHidden} onChange={(event) => { setIncludeHidden(event.target.checked); setPages([]); }} />Incluir abas ocultas</label>
          <ul className="mt-4 space-y-3">{selectableSheets.map((sheet) => { const index = sheets.indexOf(sheet); return <li key={sheet.id} className={`rounded-lg border p-4 ${sheet.selected && !sheet.excluded ? "border-primary/40" : "border-border opacity-65"}`}><div className="flex flex-col gap-3 sm:flex-row sm:items-center"><label className="flex min-w-0 flex-1 items-center gap-3"><input type="checkbox" checked={sheet.selected && !sheet.excluded} onChange={(event) => { setSheets((current) => current.map((item) => item.id === sheet.id ? { ...item, selected: event.target.checked, excluded: !event.target.checked } : item)); setPages([]); }} /><span className="min-w-0"><span className="block truncate font-medium">{sheet.name}{sheet.state !== "visible" ? " (oculta)" : ""}</span><span className="text-xs text-muted-foreground">{sheet.rowCount} linhas · {sheet.columnCount} colunas</span></span></label><div className="flex gap-2"><Button variant="outline" size="icon-sm" aria-label={`Mover ${sheet.name} para cima`} onClick={() => moveSheet(index, -1)} disabled={index === 0}><ArrowUp className="size-4" /></Button><Button variant="outline" size="icon-sm" aria-label={`Mover ${sheet.name} para baixo`} onClick={() => moveSheet(index, 1)} disabled={index === sheets.length - 1}><ArrowDown className="size-4" /></Button><Button variant="ghost" size="sm" onClick={() => { setSheets((current) => current.map((item) => item.id === sheet.id ? { ...item, excluded: true, selected: false } : item)); setPages([]); }}>Excluir</Button></div></div><SheetMiniature sheet={sheet} /></li>; })}</ul>
        </section>
        <fieldset disabled={status === "processing"} className="grid gap-5 rounded-lg border border-border p-4 sm:grid-cols-2 lg:grid-cols-3 sm:p-5"><legend className="px-2 font-heading font-medium">Configurações de conversão</legend><Select label="Orientação" value={options.orientation} onChange={(value) => updateOptions({ orientation: value as ExcelPageOrientation })} options={[["auto", "Automática"], ["portrait", "Retrato"], ["landscape", "Paisagem"]]} /><Select label="Tamanho do papel" value={options.pageSize} onChange={(value) => updateOptions({ pageSize: value as ExcelPageSize })} options={[["a4", "A4"], ["letter", "Carta"], ["legal", "Ofício"]]} /><Select label="Ajuste da planilha" value={options.fitMode} onChange={(value) => updateOptions({ fitMode: value as ExcelFitMode })} options={[["columns", "Ajustar todas as colunas em uma página"], ["rows", "Ajustar todas as linhas em uma página"], ["sheet", "Ajustar planilha inteira em uma página"], ["original", "Manter tamanho original"]]} /><Select label="Margens" value={options.margins} onChange={(value) => updateOptions({ margins: value as ExcelMarginSize })} options={[["small", "Pequenas"], ["normal", "Normais"], ["large", "Grandes"]]} /><Select label="Linhas de grade" value={options.gridlines} onChange={(value) => updateOptions({ gridlines: value as ExcelPdfOptions["gridlines"] })} options={[["auto", "Automático"], ["show", "Mostrar linhas de grade"], ["hide", "Ocultar linhas de grade"]]} /><div className="grid gap-3 text-sm"><Check label="Centralizar horizontalmente" checked={options.centerHorizontal} onChange={(checked) => updateOptions({ centerHorizontal: checked })} /><Check label="Centralizar verticalmente" checked={options.centerVertical} onChange={(checked) => updateOptions({ centerVertical: checked })} /><Check label="Mostrar letras das colunas e números das linhas" checked={options.showHeadings} onChange={(checked) => updateOptions({ showHeadings: checked })} /><Check label="Repetir a primeira linha em todas as páginas" checked={options.repeatFirstRow} onChange={(checked) => updateOptions({ repeatFirstRow: checked })} /></div></fieldset>
        {!pages.length && <><ToolErrorMessage message={error} /><ToolActionBar><Button size="lg" onClick={prepare} disabled={status === "processing" || !selectedSheets.length}><FileSpreadsheet className="size-4" />Preparar PDF</Button></ToolActionBar></>}
        {pages.length > 0 && <section aria-labelledby="previa-excel-pdf"><div><h2 id="previa-excel-pdf" className="font-heading text-lg font-medium">Pré-visualização</h2><p className="mt-1 text-sm text-muted-foreground">{pages.length} {pages.length === 1 ? "página" : "páginas"} · confira orientação, cortes e quebras antes de converter.</p></div><div className="mt-4 grid gap-4 sm:grid-cols-2">{pages.slice(0, visiblePreviews).map((page, index) => <PagePreview key={page.id} page={page} number={index + 1} />)}</div>{visiblePreviews < pages.length && <Button variant="outline" className="mt-4" onClick={() => setVisiblePreviews((current) => Math.min(pages.length, current + 6))}>Carregar mais páginas</Button>}<ToolErrorMessage message={error} /><ToolActionBar><Button size="lg" onClick={convert} disabled={status === "processing"}><FileSpreadsheet className="size-4" />Converter para PDF</Button></ToolActionBar></section>}
      </>}
      {result && status === "success" && <ToolResultCard title="PDF pronto" description={`${result.name} · ${result.sheetCount} ${result.sheetCount === 1 ? "aba" : "abas"} · ${result.pageCount} ${result.pageCount === 1 ? "página" : "páginas"} · ${formatFileSize(result.size)}`} actions={<><Button asChild><a href={resultUrl ?? undefined} download={result.name}><Download className="size-4" />Baixar PDF</a></Button><Button variant="outline" onClick={reset}><RotateCcw className="size-4" />Converter outra planilha</Button></>} />}
    </CardContent></Card>
  </ToolPageShell>;
}

function Notice({ children }: { children: React.ReactNode }) { return <div role="status" className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-700 dark:text-amber-300">{children}</div>; }
function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) { return <label className="flex items-start gap-2"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="mt-0.5" />{label}</label>; }
function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: [string, string][] }) { return <label className="grid gap-2 text-sm font-medium">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="min-h-11 rounded-md border border-input bg-background px-3 outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30">{options.map(([key, text]) => <option key={key} value={key}>{text}</option>)}</select></label>; }
function SheetMiniature({ sheet }: { sheet: ExcelSheet }) { return <div aria-label={`Prévia reduzida da aba ${sheet.name}`} className="mt-3 max-h-32 overflow-hidden rounded border border-border bg-white"><table className="w-full table-fixed border-collapse text-[9px] text-black"><tbody>{sheet.cells.slice(0, 5).map((row, rowIndex) => <tr key={rowIndex}>{row.slice(0, 6).map((cell, columnIndex) => <td key={columnIndex} className="truncate border border-slate-200 px-1 py-0.5" style={{ backgroundColor: cell.style.backgroundColor, color: cell.style.color, fontWeight: cell.style.fontWeight }}>{cell.text}</td>)}</tr>)}</tbody></table></div>; }
function PagePreview({ page, number }: { page: ExcelPage; number: number }) { const ref = useRef<HTMLDivElement>(null); useEffect(() => { if (ref.current) renderExcelPage(page, ref.current, true); }, [page]); const scale = Math.min(0.48, 340 / page.width); return <figure className="overflow-hidden rounded-lg border border-border bg-muted/30 p-3"><div className="mx-auto overflow-hidden bg-white shadow-sm" style={{ width: page.width * scale, height: page.height * scale }}><div ref={ref} style={{ transform: `scale(${scale})`, transformOrigin: "top left" }} /></div><figcaption className="mt-2 truncate text-center text-xs text-muted-foreground">Página {number} · {page.sheetName} · {page.orientation === "landscape" ? "Paisagem" : "Retrato"}</figcaption></figure>; }
