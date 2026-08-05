"use client";

import { useEffect, useRef, useState } from "react";
import { Download, FileText, RefreshCw, RotateCcw, Trash2 } from "lucide-react";

import { ToolActionBar } from "@/components/tools/tool-action-bar";
import { ToolErrorMessage } from "@/components/tools/tool-error-message";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { ToolProcessingStatus, type ToolStatus } from "@/components/tools/tool-processing-status";
import { ToolResultCard } from "@/components/tools/tool-result-card";
import { ToolUploadArea } from "@/components/tools/tool-upload-area";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatFileSize } from "@/lib/tool-files";
import { WORD_TO_PDF_MAX_FILE_SIZE, WORD_TO_PDF_MAX_FILE_SIZE_LABEL, type PageOrientation, type PageSize } from "./config";
import { renderDocxToPdf, validateAndRenderDocx } from "./word-to-pdf";

type Result = { blob: Blob; name: string; size: number };

function getErrorMessage(error: unknown) {
  const code = error instanceof Error ? error.message : "";
  if (code === "protected-docx") return "Este documento está protegido e não pode ser processado. Salve uma cópia sem proteção e tente novamente.";
  if (code === "macro-docx") return "Documentos com macros não são compatíveis. Salve o arquivo como DOCX sem macros e tente novamente.";
  if (["invalid-docx", "corrupt-docx", "empty-docx"].includes(code)) return "Não foi possível ler este documento. Verifique se o arquivo está funcionando e tente novamente.";
  if (["page-size-failed", "render-failed"].includes(code)) return "Não foi possível preparar as páginas deste documento. Atualize a página e tente novamente.";
  if (error instanceof RangeError || /memory|allocation/i.test(code)) return "O dispositivo ficou sem memória para processar este documento. Feche outras abas ou tente um arquivo menor.";
  return "Não foi possível converter o documento. Tente novamente ou utilize outro arquivo.";
}

function safePdfName(name: string) {
  const base = name.replace(/\.docx$/i, "").replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-").trim();
  return `${base || "documento"}.pdf`;
}

export default function WordParaPdfClient() {
  const previewRef = useRef<HTMLDivElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState(0);
  const [orientation, setOrientation] = useState<PageOrientation>("auto");
  const [pageSize, setPageSize] = useState<PageSize>("auto");
  const [status, setStatus] = useState<ToolStatus>("idle");
  const [stage, setStage] = useState("Lendo o documento");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  useEffect(() => () => { if (resultUrl) URL.revokeObjectURL(resultUrl); }, [resultUrl]);

  function clearResultUrl() {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl(null);
  }

  function reset() {
    clearResultUrl(); setFile(null); setPages(0); setResult(null); setError(null); setStatus("idle");
    previewRef.current?.replaceChildren();
  }

  async function selectFile(files: File[]) {
    const selected = files[0];
    if (!selected) return;
    setError(null); setResult(null); clearResultUrl();
    const extension = selected.name.split(".").pop()?.toLowerCase();
    if (extension === "doc") { setError("Este formato ainda não é compatível. Salve o documento como DOCX e tente novamente."); setStatus("error"); return; }
    if (extension !== "docx" || !["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/octet-stream", ""].includes(selected.type)) { setError("Selecione um documento no formato DOCX."); setStatus("error"); return; }
    if (!selected.size) { setError("O arquivo está vazio. Selecione outro documento DOCX."); setStatus("error"); return; }
    if (selected.size > WORD_TO_PDF_MAX_FILE_SIZE) { setError(`O arquivo ultrapassa o limite permitido de ${WORD_TO_PDF_MAX_FILE_SIZE_LABEL}.`); setStatus("error"); return; }
    if (!previewRef.current) return;
    setStatus("processing"); setStage("Lendo o documento");
    try {
      const info = await validateAndRenderDocx(selected, previewRef.current);
      setFile(selected); setPages(info.pageCount); setStatus("ready");
    } catch (reason) {
      previewRef.current.replaceChildren(); setFile(null); setPages(0); setError(getErrorMessage(reason)); setStatus("error");
    }
  }

  async function convert() {
    if (!file || !previewRef.current || status === "processing") return;
    setStatus("processing"); setError(null); setStage("Preparando o conteúdo");
    try {
      const blob = await renderDocxToPdf(previewRef.current, { orientation, pageSize }, setStage);
      const next = { blob, name: safePdfName(file.name), size: blob.size };
      setResult(next); setResultUrl(URL.createObjectURL(blob)); setStatus("success");
    } catch (reason) {
      console.error("Falha ao gerar PDF a partir do DOCX:", reason);
      setError(getErrorMessage(reason)); setStatus("error");
    }
  }

  return <ToolPageShell title="Converter Word para PDF" description="Envie um documento DOCX e transforme-o em PDF em poucos segundos." categoryName="PDF" categoryHref="/ferramentas/pdfs" breadcrumbRootName="Início" breadcrumbRootHref="/" privacyMessage="O documento é processado localmente durante esta conversão e não é enviado ao Kivai.">
    <Card className="mx-auto max-w-5xl"><CardHeader><CardTitle>Converter Word para PDF</CardTitle><CardDescription>A conversão busca preservar textos, imagens, tabelas e a estrutura do documento. Alguns elementos avançados podem apresentar diferenças no PDF.</CardDescription></CardHeader><CardContent className="space-y-6">
      {!file && status !== "processing" && <><ToolUploadArea accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" formats="DOCX" maxSizeLabel={WORD_TO_PDF_MAX_FILE_SIZE_LABEL} error={error} onFilesSelected={selectFile} label="Selecionar documento DOCX para converter em PDF" /><ToolActionBar><Button size="lg" disabled><FileText className="size-4" />Converter para PDF</Button></ToolActionBar></>}
      <div ref={previewRef} className={file ? "docx-preview-shell max-h-[38rem] overflow-auto rounded-lg border border-border bg-muted/30 p-2 sm:p-4" : "fixed -left-[10000px] top-0 w-[900px] opacity-0 pointer-events-none"} aria-label={file ? "Pré-visualização do documento" : undefined} />
      {file && status !== "success" && <><section aria-label="Documento selecionado" className="flex min-w-0 flex-col gap-4 border border-border p-4 sm:flex-row sm:items-center"><FileText className="size-6 shrink-0 text-primary" /><div className="min-w-0 flex-1"><p className="truncate font-medium">{file.name}</p><p className="mt-1 text-sm text-muted-foreground">DOCX · {formatFileSize(file.size)} · {pages} {pages === 1 ? "página" : "páginas"}</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={reset} disabled={status === "processing"}><Trash2 className="size-4" />Remover</Button><input ref={replaceInputRef} type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="sr-only" onChange={(event) => { void selectFile(Array.from(event.target.files ?? [])); event.target.value = ""; }} /><Button variant="outline" size="sm" onClick={() => replaceInputRef.current?.click()} disabled={status === "processing"}><RefreshCw className="size-4" />Substituir</Button></div></section>
      <fieldset disabled={status === "processing"} className="grid gap-5 rounded-lg border border-border p-4 sm:grid-cols-2 sm:p-5"><legend className="px-2 font-heading font-medium">Configurações do PDF</legend><OptionSelect label="Orientação" value={orientation} onChange={(value) => setOrientation(value as PageOrientation)} options={[["auto", "Automática"], ["portrait", "Retrato"], ["landscape", "Paisagem"]]} /><OptionSelect label="Tamanho da página" value={pageSize} onChange={(value) => setPageSize(value as PageSize)} options={[["auto", "Automático"], ["a4", "A4"], ["letter", "Carta"]]} /></fieldset></>}
      <ToolProcessingStatus status={status} message={stage} />
      {file && <ToolErrorMessage message={error} />}
      {file && status !== "success" && <ToolActionBar><Button size="lg" onClick={convert} disabled={status === "processing"}><FileText className="size-4" />Converter para PDF</Button></ToolActionBar>}
      {result && status === "success" && <ToolResultCard title="PDF pronto" description={`${result.name} · ${formatFileSize(result.size)}`} preview={resultUrl ? <iframe src={resultUrl} title="Pré-visualização do PDF gerado" className="h-96 w-full border border-border bg-white" /> : undefined} actions={<><Button asChild><a href={resultUrl ?? undefined} download={result.name}><Download className="size-4" />Baixar PDF</a></Button><Button variant="outline" onClick={reset}><RotateCcw className="size-4" />Converter outro documento</Button></>} />}
    </CardContent></Card>
  </ToolPageShell>;
}

function OptionSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: [string, string][] }) {
  return <label className="grid gap-2 text-sm font-medium">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="min-h-11 rounded-md border border-input bg-background px-3 text-foreground outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30">{options.map(([optionValue, text]) => <option key={optionValue} value={optionValue}>{text}</option>)}</select></label>;
}
