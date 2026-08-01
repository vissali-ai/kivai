import type { ReactNode } from "react";
import { FileCheck2 } from "lucide-react";
import { formatFileSize, type ImageMetadata } from "@/lib/tool-files";
import { ToolActionBar } from "@/components/tools/tool-action-bar";

export function ToolFilePreview({ file, metadata, preview, actions }: { file: File; metadata?: ImageMetadata | null; preview?: ReactNode; actions?: ReactNode }) {
  return <section aria-label="Arquivo selecionado" className="border border-border bg-background p-4 sm:p-5">{preview}<div className="mt-4 flex min-w-0 gap-3"><FileCheck2 className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" /><div className="min-w-0"><p className="break-all text-sm font-medium">{file.name}</p><p className="mt-1 text-xs text-muted-foreground">{metadata ? `${metadata.width} × ${metadata.height} px · ` : ""}{file.type || "Formato não informado"} · {formatFileSize(file.size)}</p></div></div>{actions && <ToolActionBar className="mt-4">{actions}</ToolActionBar>}</section>;
}
