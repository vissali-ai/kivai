import type { ReactNode } from "react";
import { CircleCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { ToolActionBar } from "@/components/tools/tool-action-bar";

export function ToolResultCard({ title = "Arquivo pronto", description, details, preview, actions, className }: { title?: string; description?: string; details?: ReactNode; preview?: ReactNode; actions: ReactNode; className?: string }) {
  return <section aria-live="polite" className={cn("border border-primary/30 bg-background p-4 sm:p-6", className)}><div className="flex gap-3"><CircleCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" /><div><h2 className="font-heading text-lg font-medium">{title}</h2>{description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}</div></div>{preview && <div className="mt-5">{preview}</div>}{details && <div className="mt-5">{details}</div>}<ToolActionBar className="mt-5">{actions}</ToolActionBar></section>;
}
