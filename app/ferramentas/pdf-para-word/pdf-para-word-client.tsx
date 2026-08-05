"use client";

import { useState } from "react";
import { Download, FileText, RotateCcw, Trash2 } from "lucide-react";
import JSZip from "jszip";

import { ToolActionBar } from "@/components/tools/tool-action-bar";
import { ToolErrorMessage } from "@/components/tools/tool-error-message";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { ToolProcessingStatus, type ToolStatus } from "@/components/tools/tool-processing-status";
import { ToolResultCard } from "@/components/tools/tool-result-card";
import { ToolUploadArea } from "@/components/tools/tool-upload-area";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatFileSize, validateFile } from "@/lib/tool-files";
import { convertPdfToDocx, getPdfFileInfo } from "./pdf-to-docx";

const MAX_FILE_SIZE = 20 * 1024 * 1024;
type SelectedPdf = { file: File; pages: number };
type Result = { name: string; blob: Blob };

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

function friendlyError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (/password|encrypted/i.test(message)) return "Este PDF é protegido por senha. Remova a proteção e tente novamente.";
  if (/invalid|corrupt|format|header/i.test(message)) return "Não foi possível ler o PDF. Verifique se o arquivo está íntegro e tente novamente.";
  return "Não foi possível concluir a conversão. Tente novamente com outro arquivo PDF.";
}

export default function PdfParaWordClient() {
  const [files, setFiles] = useState<SelectedPdf[]>([]);
  const [status, setStatus] = useState<ToolStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Result[]>([]);

  async function selectFiles(selected: File[]) {
    setError(null);
    setResults([]);
    const accepted: SelectedPdf[] = [];
    for (const file of selected) {
      const validation = validateFile({ file, acceptedMimeTypes: ["application/pdf"], acceptedExtensions: ["pdf"], maxSizeBytes: MAX_FILE_SIZE });
      if (validation) { setError(validation); continue; }
      if (files.some((item) => item.file.name === file.name && item.file.size === file.size)) continue;
      try {
        const info = await getPdfFileInfo(file);
        accepted.push({ file, pages: info.pages });
      } catch (reason) {
        setError(friendlyError(reason));
      }
    }
    const next = [...files, ...accepted];
    setFiles(next);
    setStatus(next.length ? "ready" : "idle");
  }

  function reset() {
    setFiles([]); setResults([]); setError(null); setProgress(0); setStatus("idle");
  }

  async function convert() {
    if (!files.length) return;
    setStatus("processing"); setError(null); setProgress(0);
    try {
      const converted: Result[] = [];
      for (let index = 0; index < files.length; index++) {
        const item = files[index];
        const blob = await convertPdfToDocx(item.file, (fileProgress) => {
          setProgress(Math.round(((index + fileProgress / 100) / files.length) * 100));
        });
        converted.push({ name: item.file.name.replace(/\.pdf$/i, ".docx"), blob });
      }
      setResults(converted);
      setStatus("success");
      if (converted.length === 1) download(converted[0].blob, converted[0].name);
      else {
        const zip = new JSZip();
        converted.forEach((item) => zip.file(item.name, item.blob));
        download(await zip.generateAsync({ type: "blob" }), "kivai-pdf-para-word.zip");
      }
    } catch (reason) {
      setError(friendlyError(reason)); setStatus("error");
    }
  }

  return (
    <ToolPageShell title="PDF para Word" description="Converta seus PDFs em documentos editáveis do Microsoft Word, preservando ao máximo a estrutura e a formatação." categoryName="PDF" categoryHref="/ferramentas/pdfs" breadcrumbRootName="Início" breadcrumbRootHref="/" privacyMessage="A conversão acontece localmente no seu navegador. Seus PDFs não são enviados ao Kivai.">
      <Card className="mx-auto max-w-5xl">
        <CardHeader><CardTitle>Selecione seus arquivos PDF</CardTitle><CardDescription>Adicione um ou vários PDFs para converter em documentos DOCX editáveis.</CardDescription></CardHeader>
        <CardContent className="space-y-6">
          {status !== "success" && <ToolUploadArea accept="application/pdf,.pdf" formats="PDF" maxSizeLabel="20 MB por arquivo" multiple disabled={status === "processing"} error={error && !files.length ? error : null} onFilesSelected={selectFiles} label="Selecionar arquivos PDF para converter em Word" />}
          {files.length > 0 && status !== "success" && <section aria-label="Arquivos selecionados" className="space-y-3">
            <div className="flex items-center justify-between gap-3"><h2 className="font-heading text-lg font-medium">Arquivos selecionados ({files.length})</h2><Button variant="ghost" size="sm" onClick={reset} disabled={status === "processing"}><Trash2 className="size-4" /> Limpar</Button></div>
            <ul className="divide-y border border-border">{files.map((item) => <li key={`${item.file.name}-${item.file.lastModified}`} className="flex min-w-0 items-center gap-3 p-4"><FileText className="size-5 shrink-0 text-primary" aria-hidden="true" /><div className="min-w-0"><p className="truncate text-sm font-medium">{item.file.name}</p><p className="mt-1 text-xs text-muted-foreground">{formatFileSize(item.file.size)} · {item.pages} {item.pages === 1 ? "página" : "páginas"}</p></div></li>)}</ul>
          </section>}
          <ToolProcessingStatus status={status} progress={progress} message={`Convertendo ${files.length > 1 ? "arquivos" : "arquivo"} para Word...`} />
          <ToolErrorMessage message={files.length ? error : null} />
          {files.length > 0 && status !== "success" && <ToolActionBar><Button size="lg" onClick={convert} disabled={status === "processing"}><FileText className="size-4" />Converter para Word</Button></ToolActionBar>}
          {status === "success" && <ToolResultCard title={results.length > 1 ? "Documentos prontos" : "Documento pronto"} description={results.length > 1 ? `${results.length} arquivos DOCX foram reunidos em um ZIP e baixados automaticamente.` : "O arquivo DOCX foi baixado automaticamente."} actions={<><Button onClick={() => results.length === 1 && download(results[0].blob, results[0].name)} disabled={results.length !== 1}><Download className="size-4" />Baixar novamente</Button><Button variant="outline" onClick={reset}><RotateCcw className="size-4" />Converter outro arquivo</Button></>} />}
        </CardContent>
      </Card>
    </ToolPageShell>
  );
}
