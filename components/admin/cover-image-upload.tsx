"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ImageUp, LoaderCircle } from "lucide-react";
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
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Não foi possível ler a imagem.")); };
    image.src = url;
  });
}

export function CoverImageUpload({ media, onUploaded }: { media: Media | null; onUploaded: (media: Media) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
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
      onUploaded(data);
      setMessage(data.duplicate ? "Esta imagem já existia e foi vinculada à matéria." : "Imagem enviada com sucesso.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível enviar a imagem.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return <div className="space-y-3">
    {media ? <div className="relative aspect-video overflow-hidden bg-white/5"><Image src={media.url} alt={media.alt || "Imagem de capa"} fill sizes="340px" className="object-cover" /></div> : <div className="flex aspect-video items-center justify-center border border-dashed border-white/15 bg-white/[0.025] text-xs text-muted-foreground">A matéria ainda está sem foto</div>}
    <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => upload(event.target.files?.[0])} />
    <Button type="button" variant="outline" className="w-full" disabled={uploading} onClick={() => inputRef.current?.click()}>{uploading ? <LoaderCircle className="animate-spin" /> : <ImageUp />}{media ? "Trocar foto" : "Enviar foto da matéria"}</Button>
    <p className="text-xs leading-5 text-muted-foreground">JPG, PNG ou WebP, com no máximo 8 MB. Use apenas imagens próprias ou com licença adequada.</p>
    {message ? <p className="text-xs text-primary">{message}</p> : null}
  </div>;
}
