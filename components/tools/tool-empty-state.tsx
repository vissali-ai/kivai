import type { ReactNode } from "react";
import { FileQuestion } from "lucide-react";
import { cn } from "@/lib/utils";

export function ToolEmptyState({ title = "Nenhum resultado ainda", description, action, className }: { title?: string; description: string; action?: ReactNode; className?: string }) {
  return <div className={cn("flex min-h-48 flex-col items-center justify-center border border-dashed border-border bg-muted/20 p-6 text-center", className)}><FileQuestion className="size-6 text-muted-foreground" aria-hidden="true" /><p className="mt-4 font-medium">{title}</p><p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>{action && <div className="mt-5">{action}</div>}</div>;
}
