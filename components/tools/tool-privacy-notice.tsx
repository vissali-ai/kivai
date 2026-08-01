import { ShieldCheck } from "lucide-react";

export type ProcessingMode = "local" | "server" | "hybrid";
const messages: Record<ProcessingMode, string> = {
  local: "Processamento local: o arquivo permanece no seu dispositivo.",
  server: "O arquivo é enviado com segurança para processamento no servidor.",
  hybrid: "Parte do processamento ocorre no dispositivo e parte no servidor.",
};

export function ToolPrivacyNotice({ processingMode = "local", message }: { processingMode?: ProcessingMode; message?: string }) {
  return <aside className="flex gap-3 border border-border bg-muted/20 p-4 text-sm text-muted-foreground"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" /><p className="leading-6">{message ?? messages[processingMode]}</p></aside>;
}
