"use client";

import { openFilePicker } from "@/lib/browser/file-picker";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { Copy, Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageToolPageShell } from "@/components/tools/image-tool-page-shell";
import { canvasBlob, downloadBlob, IMAGE_TYPES, loadImage } from "@/lib/image-tools/canvas";

const MAX_IMAGE_SIZE = 20 * 1024 * 1024;

export function PlaceholderClient() {
  const input = useRef<HTMLInputElement>(null);
  const resultUrlRef = useRef<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [width, setWidth] = useState(32);
  const [quality, setQuality] = useState(55);
  const [result, setResult] = useState<{ blob: Blob; url: string; data: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => () => {
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
  }, []);

  const clearResult = () => {
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    resultUrlRef.current = null;
    setResult(null);
    setCopied(false);
  };

  const select = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.files?.[0];
    if (!next) return;
    if (!IMAGE_TYPES.includes(next.type)) {
      setError("Use uma imagem PNG, JPG ou WebP.");
      return;
    }
    if (next.size > MAX_IMAGE_SIZE) {
      setError("A imagem deve ter no máximo 20 MB.");
      return;
    }
    clearResult();
    setFile(next);
    setError("");
  };

  const generate = async () => {
    if (!file) return;
    setError("");
    try {
      const image = await loadImage(file);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = Math.max(1, Math.round((width * image.naturalHeight) / image.naturalWidth));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("canvas-unavailable");
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const blob = await canvasBlob(canvas, "image/jpeg", quality / 100);
      const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      clearResult();
      const url = URL.createObjectURL(blob);
      resultUrlRef.current = url;
      setResult({ blob, url, data });
    } catch {
      setError("Não foi possível gerar o placeholder desta imagem.");
    }
  };

  return (
    <ImageToolPageShell title="Gerador de Placeholder (LQIP)" description="Crie imagens leves de baixa qualidade para acelerar o carregamento visual das suas páginas.">
      <Card className="mx-auto max-w-5xl">
        <CardHeader><CardTitle>Área de geração</CardTitle><CardDescription>Gere um JPEG leve e o respectivo Data URL para usar no seu projeto.</CardDescription></CardHeader>
        <CardContent>
          <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={select} />
          {!file ? (
            <div className="flex min-h-80 items-center justify-center border border-dashed border-border bg-muted/20"><Button onClick={() => openFilePicker(input.current)}><Upload />Selecionar imagem</Button></div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="border border-border bg-muted/20 p-4">
                <p className="font-medium">{file.name}</p>
                <label className="mt-5 block text-sm font-medium">Largura: {width}px<input type="range" min="8" max="128" value={width} onChange={(event) => setWidth(Number(event.target.value))} className="mt-2 w-full" /></label>
                <label className="mt-4 block text-sm font-medium">Qualidade: {quality}%<input type="range" min="10" max="90" value={quality} onChange={(event) => setQuality(Number(event.target.value))} className="mt-2 w-full" /></label>
                <div className="mt-6 flex flex-wrap gap-3"><Button onClick={generate}>Gerar placeholder</Button><Button variant="outline" onClick={() => openFilePicker(input.current)}>Trocar imagem</Button></div>
              </div>
              {result ? (
                <div className="border border-border bg-background p-4">
                  <img src={result.url} alt="Placeholder gerado" className="mx-auto max-h-64 max-w-full object-contain" />
                  <p className="mt-4 text-sm text-muted-foreground">{(result.blob.size / 1024).toFixed(1)} KB</p>
                  <div className="mt-4 flex flex-wrap gap-3"><Button onClick={() => downloadBlob(result.blob, "placeholder-lqip.jpg")}><Download />Baixar JPEG</Button><Button variant="outline" onClick={async () => { await navigator.clipboard.writeText(result.data); setCopied(true); }}><Copy />{copied ? "Copiado" : "Copiar Data URL"}</Button></div>
                </div>
              ) : <div className="flex items-center justify-center border border-border bg-background p-4 text-sm text-muted-foreground">Configure e gere seu placeholder.</div>}
            </div>
          )}
          {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>
    </ImageToolPageShell>
  );
}
