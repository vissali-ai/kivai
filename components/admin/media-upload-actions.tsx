"use client";

import { useRef, useState } from "react";
import { ClipboardPaste, Images, ImageUp, LoaderCircle } from "lucide-react";
import { MediaPicker } from "@/components/admin/media-picker";
import { Button } from "@/components/ui/button";
import type { Media } from "@/lib/blog/types";

function imageDimensions(file: File) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new window.Image();
    image.onload = () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
      URL.revokeObjectURL(url);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não foi possível ler a imagem."));
    };
    image.src = url;
  });
}

export function MediaUploadActions({
  onSelect,
  className = "",
}: {
  onSelect: (media: Media) => void;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const pasteRef = useRef<HTMLDivElement>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  async function upload(file?: File) {
    if (!file) return;
    setUploading(true);
    setMessage("Enviando imagem...");
    try {
      const dimensions = await imageDimensions(file);
      const form = new FormData();
      form.append("file", file);
      form.append("width", String(dimensions.width));
      form.append("height", String(dimensions.height));
      const response = await fetch("/api/admin/media", { method: "POST", body: form });
      const data = await response.json() as Media & { error?: string; duplicate?: boolean };
      if (!response.ok) throw new Error(data.error || "Não foi possível enviar a imagem.");
      onSelect(data);
      setMessage(data.duplicate ? "Imagem existente selecionada." : "Imagem enviada e selecionada.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível enviar a imagem.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function pasteFromClipboard() {
    if (uploading) return;
    if (!navigator.clipboard?.read) {
      setMessage("Selecione a linha de botões e use Ctrl+V ou Colar.");
      pasteRef.current?.focus();
      return;
    }
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const type = item.types.find((value) => ["image/png", "image/jpeg", "image/webp"].includes(value));
        if (!type) continue;
        const blob = await item.getType(type);
        await upload(new File([blob], "imagem-colada." + type.split("/")[1], { type }));
        return;
      }
      setMessage("A área de transferência não contém uma imagem compatível.");
    } catch {
      setMessage("Não foi possível acessar a área de transferência. Selecione a linha de botões e use Ctrl+V ou Colar.");
      pasteRef.current?.focus();
    }
  }

  function handlePaste(event: React.ClipboardEvent<HTMLDivElement>) {
    if (uploading) return;
    const file = Array.from(event.clipboardData.items)
      .find((item) => item.kind === "file" && ["image/jpeg", "image/png", "image/webp"].includes(item.type))
      ?.getAsFile();
    if (!file) return;
    event.preventDefault();
    void upload(file);
  }

  return <div className={`space-y-2 ${className}`}>
    <input
      ref={inputRef}
      type="file"
      accept="image/jpeg,image/png,image/webp"
      className="hidden"
      onChange={(event) => upload(event.target.files?.[0])}
    />
    <div
      ref={pasteRef}
      tabIndex={0}
      onPaste={handlePaste}
      className="flex flex-col gap-2 outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:flex-row"
      aria-label="Opções de imagem; pressione Ctrl+V para colar"
    >
      <Button type="button" variant="outline" className="flex-1" onClick={() => setPickerOpen(true)}>
        <Images />Escolher da biblioteca
      </Button>
      <Button type="button" variant="outline" className="flex-1" disabled={uploading} onClick={() => inputRef.current?.click()}>
        {uploading ? <LoaderCircle className="animate-spin" /> : <ImageUp />}
        {uploading ? "Enviando..." : "Galeria ou dispositivo"}
      </Button>
      <Button type="button" variant="outline" className="flex-1" disabled={uploading} onClick={() => void pasteFromClipboard()} title="Cole uma imagem com este botão ou pressione Ctrl+V após selecionar a área">
        <ClipboardPaste />Colar imagem
      </Button>
    </div>
    {message ? <p className="text-xs text-primary" aria-live="polite">{message}</p> : null}
    <MediaPicker open={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={onSelect} />
  </div>;
}
