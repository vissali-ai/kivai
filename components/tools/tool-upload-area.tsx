"use client";

import { useId, useRef, useState, type DragEvent } from "react";
import { Upload } from "lucide-react";

import { ToolErrorMessage } from "@/components/tools/tool-error-message";
import { ToolPrivacyNotice, type ProcessingMode } from "@/components/tools/tool-privacy-notice";
import { Button } from "@/components/ui/button";
import { openFilePicker } from "@/lib/browser/file-picker";
import { cn } from "@/lib/utils";

type ToolUploadAreaProps = {
  accept: string;
  formats: string;
  maxSizeLabel?: string;
  disabled?: boolean;
  error?: string | null;
  multiple?: boolean;
  onFilesSelected: (files: File[]) => void;
  className?: string;
  label?: string;
  processingMode?: ProcessingMode;
  compact?: boolean;
};

export function ToolUploadArea({
  accept,
  formats,
  maxSizeLabel,
  disabled,
  error,
  multiple,
  onFilesSelected,
  className,
  label = "Selecionar arquivo",
  processingMode,
  compact = false,
}: ToolUploadAreaProps) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const select = (files: FileList | null) => {
    if (!disabled && files?.length) onFilesSelected(multiple ? Array.from(files) : [files[0]]);
  };
  const drop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    select(event.dataTransfer.files);
  };

  return (
    <div className={className}>
      {processingMode && <div className="mb-3"><ToolPrivacyNotice processingMode={processingMode} /></div>}
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        className="sr-only"
        tabIndex={-1}
        aria-label={label}
        aria-describedby={`${id}-formats`}
        onChange={(event) => {
          select(event.target.files);
          event.target.value = "";
        }}
      />
      <div
        data-tool-upload="true"
        aria-busy={disabled || undefined}
        onDragEnter={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false);
        }}
        onDrop={drop}
        className={cn(
          "flex flex-col items-center justify-center rounded-xl border p-6 text-center transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30",
          compact ? "gap-3 sm:flex-row sm:justify-between" : "min-h-64 border-2 border-dashed sm:p-10",
          dragging ? "border-primary bg-primary/5" : "border-border bg-muted/20 hover:bg-muted/40",
          disabled && "cursor-not-allowed opacity-60",
          error && "border-destructive/60",
        )}
      >
        {!compact && <span className="flex size-14 items-center justify-center border border-border bg-background">
          <Upload className="size-5" aria-hidden="true" />
        </span>}
        {!compact && <span className="mt-5 font-heading text-lg font-medium">{multiple ? "Selecione ou arraste seus arquivos" : "Selecione ou arraste seu arquivo"}</span>}
        <span id={`${id}-formats`} className={cn("text-sm leading-6 text-muted-foreground", !compact && "mt-2")}>
          Formatos aceitos: {formats}{maxSizeLabel ? ` · Tamanho máximo: ${maxSizeLabel}` : ""}
        </span>
        <Button type="button" size="lg" className={cn("h-auto min-h-11 max-w-full whitespace-normal py-3 text-center", !compact && "mt-6")} disabled={disabled} aria-describedby={`${id}-formats`} onClick={() => openFilePicker(inputRef.current)}>{label}</Button>
      </div>
      <ToolErrorMessage message={error} className="mt-3" />
    </div>
  );
}
