import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function ToolActionBar({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex flex-col gap-3 sm:flex-row sm:flex-wrap [&>*]:min-h-11 [&>*]:w-full sm:[&>*]:w-auto", className)}>{children}</div>;
}
