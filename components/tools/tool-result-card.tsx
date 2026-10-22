import type { ReactNode } from "react";
import { CircleCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { ToolActionBar } from "@/components/tools/tool-action-bar";
import { PostResultWelcome } from "@/components/tools/post-result-welcome";
import { FirstMissionResult } from "@/components/tools/first-mission-result";

export function ToolResultCard({ title = "Arquivo pronto", description, details, preview, actions, className }: { title?: string; description?: string; details?: ReactNode; preview?: ReactNode; actions: ReactNode; className?: string }) {
  return <section aria-label={title} aria-live="polite" className={cn("rounded-lg border border-border bg-card p-4 sm:p-5", className)}><div className="flex gap-3"><CircleCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" /><div className="min-w-0 break-words"><h2 className="font-heading text-lg font-medium">{title}</h2>{description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}</div></div>{preview && <div className="mt-5">{preview}</div>}{details && <div className="mt-5">{details}</div>}<ToolActionBar className="mt-5">{actions}</ToolActionBar><PostResultWelcome /><FirstMissionResult /></section>;
}
