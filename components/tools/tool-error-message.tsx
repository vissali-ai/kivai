import { CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export function ToolErrorMessage({ message, className }: { message?: string | null; className?: string }) {
  if (!message) return null;
  return <div role="alert" className={cn("flex gap-3 border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive", className)}><CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" /><p className="leading-6">{message}</p></div>;
}
