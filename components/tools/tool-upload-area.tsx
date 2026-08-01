"use client";

import { useId, useRef, useState, type DragEvent, type ChangeEvent } from "react";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { ToolErrorMessage } from "@/components/tools/tool-error-message";

export function ToolUploadArea({ accept, formats, maxSizeLabel, disabled, error, multiple, onFilesSelected, className, label = "Selecionar arquivo" }: { accept: string; formats: string; maxSizeLabel?: string; disabled?: boolean; error?: string | null; multiple?: boolean; onFilesSelected: (files: File[]) => void; className?: string; label?: string }) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const select = (files: FileList | null) => { if (!disabled && files?.length) onFilesSelected(Array.from(files)); };
  const drop = (event: DragEvent<HTMLLabelElement>) => { event.preventDefault(); setDragging(false); select(event.dataTransfer.files); };
  return <div className={className}><input ref={inputRef} id={id} type="file" accept={accept} multiple={multiple} disabled={disabled} className="sr-only" onChange={(event: ChangeEvent<HTMLInputElement>) => { select(event.target.files); event.target.value = ""; }} /><label htmlFor={id} role="button" tabIndex={disabled ? -1 : 0} aria-label={label} aria-disabled={disabled} onKeyDown={(event) => { if (!disabled && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); inputRef.current?.click(); } }} onDragEnter={(event) => { event.preventDefault(); if (!disabled) setDragging(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false); }} onDrop={drop} className={cn("flex min-h-64 cursor-pointer flex-col items-center justify-center border border-dashed p-6 text-center outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30 sm:p-10", dragging ? "border-primary bg-primary/5" : "border-border bg-muted/20 hover:bg-muted/40", disabled && "cursor-not-allowed opacity-60", error && "border-destructive/60")}><span className="flex size-14 items-center justify-center border border-border bg-background"><Upload className="size-5" aria-hidden="true" /></span><span className="mt-5 font-heading text-lg font-medium">Clique ou arraste o arquivo</span><span className="mt-2 text-sm leading-6 text-muted-foreground">Formatos aceitos: {formats}{maxSizeLabel ? ` · Tamanho máximo: ${maxSizeLabel}` : ""}</span></label><ToolErrorMessage message={error} className="mt-3" /></div>;
}
