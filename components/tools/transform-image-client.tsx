"use client";

import { openFilePicker } from "@/lib/browser/file-picker";
import { type ChangeEvent, useEffect, useRef, useState } from "react";
import { Download, FlipHorizontal, FlipVertical, RotateCw, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageToolPageShell } from "@/components/tools/image-tool-page-shell";
import { canvasBlob, downloadBlob, IMAGE_TYPES, loadImage } from "@/lib/image-tools/canvas";

export function TransformImageClient() {
  const input = useRef<HTMLInputElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const imageUrl = useRef<string | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [rotation, setRotation] = useState(0);
  const [horizontal, setHorizontal] = useState(false);
  const [vertical, setVertical] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (image && canvas.current) drawTransformedImage(canvas.current, image, rotation, horizontal, vertical);
  }, [horizontal, image, rotation, vertical]);

  useEffect(() => () => {
    if (imageUrl.current) URL.revokeObjectURL(imageUrl.current);
  }, []);

  async function select(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) {
      setError("Use uma imagem PNG, JPG ou WebP.");
      return;
    }
    try {
      const nextImage = await loadImage(file);
      if (imageUrl.current) URL.revokeObjectURL(imageUrl.current);
      imageUrl.current = nextImage.src;
      setImage(nextImage);
      setRotation(0);
      setHorizontal(false);
      setVertical(false);
      setError("");
    } catch {
      setError("Não foi possível abrir esta imagem.");
    } finally {
      event.target.value = "";
    }
  }

  async function download() {
    if (!canvas.current) return;
    downloadBlob(await canvasBlob(canvas.current), "imagem-transformada.png");
  }

  return (
    <ImageToolPageShell title="Espelhar e Girar Imagem" description="Veja cada rotação e espelhamento imediatamente e baixe a imagem pronta.">
      <Card className="mx-auto max-w-6xl">
        <CardHeader>
          <CardTitle>Transformação em tempo real</CardTitle>
          <CardDescription>As alterações feitas nos controles aparecem automaticamente na prévia.</CardDescription>
        </CardHeader>
        <CardContent>
          <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={select} />
          {!image ? (
            <button type="button" onClick={() => openFilePicker(input.current)} className="flex min-h-80 w-full flex-col items-center justify-center gap-3 border-2 border-dashed border-primary/35 bg-muted/20 p-8 text-center transition-colors hover:border-primary hover:bg-primary/5">
              <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary"><Upload /></span>
              <span className="font-heading text-lg font-semibold">Selecionar imagem</span>
              <span className="text-sm text-muted-foreground">PNG, JPG ou WebP</span>
            </button>
          ) : (
            <div className="grid overflow-hidden border border-border lg:grid-cols-[280px_minmax(0,1fr)]">
              <aside className="border-b border-border bg-muted/20 p-4 lg:border-b-0 lg:border-r">
                <fieldset>
                  <legend className="text-sm font-semibold">Rotação</legend>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {[0, 90, 180, 270].map((angle) => (
                      <Button key={angle} type="button" variant={rotation === angle ? "default" : "outline"} aria-pressed={rotation === angle} onClick={() => setRotation(angle)}><RotateCw />{angle}°</Button>
                    ))}
                  </div>
                </fieldset>

                <fieldset className="mt-6">
                  <legend className="text-sm font-semibold">Espelhamento</legend>
                  <div className="mt-3 grid gap-2">
                    <Button type="button" variant={horizontal ? "default" : "outline"} aria-pressed={horizontal} onClick={() => setHorizontal((current) => !current)}><FlipHorizontal />Horizontal</Button>
                    <Button type="button" variant={vertical ? "default" : "outline"} aria-pressed={vertical} onClick={() => setVertical((current) => !current)}><FlipVertical />Vertical</Button>
                  </div>
                </fieldset>

                <Button type="button" size="lg" className="mt-6 w-full" onClick={download}><Download />Baixar imagem</Button>
                <Button type="button" variant="ghost" className="mt-2 w-full" onClick={() => openFilePicker(input.current)}>Trocar imagem</Button>
              </aside>

              <section className="flex min-h-[420px] items-center justify-center overflow-auto bg-muted/10 p-4 sm:p-8">
                <canvas ref={canvas} aria-label="Prévia da imagem transformada" className="max-h-[70vh] max-w-full object-contain shadow-2xl" />
              </section>
            </div>
          )}
          {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>
    </ImageToolPageShell>
  );
}

function drawTransformedImage(canvas: HTMLCanvasElement, image: HTMLImageElement, rotation: number, horizontal: boolean, vertical: boolean) {
  const swapsSides = rotation % 180 !== 0;
  canvas.width = swapsSides ? image.naturalHeight : image.naturalWidth;
  canvas.height = swapsSides ? image.naturalWidth : image.naturalHeight;
  const context = canvas.getContext("2d");
  if (!context) return;
  context.translate(canvas.width / 2, canvas.height / 2);
  context.rotate((rotation * Math.PI) / 180);
  context.scale(horizontal ? -1 : 1, vertical ? -1 : 1);
  context.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);
}
