import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToolStatus = "idle" | "ready" | "processing" | "success" | "error";

export function ToolProcessingStatus({ status, message = "Processando arquivo...", progress, className }: { status: ToolStatus; message?: string; progress?: number; className?: string }) {
  if (status !== "processing") return null;
  const value = progress === undefined ? undefined : Math.max(0, Math.min(100, progress));
  return <div role="status" aria-live="polite" aria-busy="true" className={cn("border border-primary/20 bg-primary/5 p-4", className)}><div className="flex items-center gap-3 text-sm font-medium"><LoaderCircle className="size-4 animate-spin" aria-hidden="true" /><span>{message}</span>{value !== undefined && <span className="ml-auto tabular-nums">{Math.round(value)}%</span>}</div>{value !== undefined && <progress className="mt-3 h-2 w-full accent-current" max={100} value={value} aria-label="Progresso do processamento" />}</div>;
}
