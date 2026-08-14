"use client";

import { useRef, useState } from "react";
import { Images, ImageUp, LoaderCircle } from "lucide-react";
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

  return <div className={`space-y-2 ${className}`}>
    <input
      ref={inputRef}
      type="file"
      accept="image/jpeg,image/png,image/webp"
      className="hidden"
      onChange={(event) => upload(event.target.files?.[0])}
    />
    <div className="flex flex-col gap-2 sm:flex-row">
      <Button type="button" variant="outline" className="flex-1" onClick={() => setPickerOpen(true)}>
        <Images />Escolher da biblioteca
      </Button>
      <Button type="button" variant="outline" className="flex-1" disabled={uploading} onClick={() => inputRef.current?.click()}>
        {uploading ? <LoaderCircle className="animate-spin" /> : <ImageUp />}
        {uploading ? "Enviando..." : "Galeria ou dispositivo"}
      </Button>
    </div>
    {message ? <p className="text-xs text-primary" aria-live="polite">{message}</p> : null}
    <MediaPicker open={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={onSelect} />
  </div>;
}
