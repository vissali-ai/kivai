"use client";

import { useState } from "react";
import { Download, RotateCcw } from "lucide-react";
import { ToolResultCard } from "@/components/tools/tool-result-card";
import { Button } from "@/components/ui/button";
import { downloadBlob } from "@/lib/image-tools/canvas";
import { formatFileSize } from "@/lib/tool-files";

export type ToolDownload = { blob: Blob; name: string };

export function ToolDownloadResult({ result, onReset, label = "Baixar PDF", title = "Arquivo pronto para baixar" }: {
  result: ToolDownload;
  onReset: () => void;
  label?: string;
  title?: string;
}) {
  const [requested, setRequested] = useState<Blob | null>(null);
  return (
    <ToolResultCard
      title={title}
      description={`${result.name} · ${formatFileSize(result.blob.size)}`}
      details={requested === result.blob ? <p role="status" className="text-sm text-muted-foreground">Download solicitado. Você pode baixar novamente sem refazer o processamento.</p> : undefined}
      actions={<>
        <Button size="lg" onClick={() => { downloadBlob(result.blob, result.name); setRequested(result.blob); }}><Download aria-hidden="true" />{label}</Button>
        <Button size="lg" variant="outline" onClick={onReset}><RotateCcw aria-hidden="true" />Começar novamente</Button>
      </>}
    />
  );
}
