"use client";

import { useEffect, useRef, useState, type ChangeEvent, type PointerEvent as ReactPointerEvent } from "react";
import { Crop, Download, RefreshCw, Upload } from "lucide-react";

import { ImageToolPageShell } from "@/components/tools/image-tool-page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { canvasBlob, downloadBlob, IMAGE_TYPES, loadImage } from "@/lib/image-tools/canvas";

type CropBox = { x: number; y: number; width: number; height: number };
type CropResult = { blob: Blob; url: string };
type DragState = {
  mode: "move" | "resize";
  handle?: "nw" | "ne" | "sw" | "se";
  clientX: number;
  clientY: number;
  start: CropBox;
};

const ASPECT_RATIOS = [
  { label: "Livre", value: null },
  { label: "1:1", value: 1 },
  { label: "4:5", value: 4 / 5 },
  { label: "3:2", value: 3 / 2 },
  { label: "16:9", value: 16 / 9 },
] as const;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function CropImageClient() {
  const inputRef = useRef<HTMLInputElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const imageUrlRef = useRef<string | null>(null);
  const resultUrlRef = useRef<string | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [name, setName] = useState("imagem");
  const [cropBox, setCropBox] = useState<CropBox>({ x: 0, y: 0, width: 1, height: 1 });
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const [result, setResult] = useState<CropResult | null>(null);
  const [error, setError] = useState("");

  useEffect(() => { imageUrlRef.current = image?.src ?? null; }, [image]);
  useEffect(() => { resultUrlRef.current = result?.url ?? null; }, [result]);
  useEffect(() => () => {
    if (imageUrlRef.current?.startsWith("blob:")) URL.revokeObjectURL(imageUrlRef.current);
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
  }, []);

  function clearResult() {
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);
  }

  async function select(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = event.target.files?.[0];
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) {
      setError("Use PNG, JPG ou WebP.");
      return;
    }

    try {
      const loaded = await loadImage(file);
      if (image?.src.startsWith("blob:")) URL.revokeObjectURL(image.src);
      clearResult();
      setImage(loaded);
      setName(file.name.replace(/\.[^/.]+$/, ""));
      setCropBox({ x: 0, y: 0, width: loaded.naturalWidth, height: loaded.naturalHeight });
      setAspectRatio(null);
      setError("");
    } catch {
      setError("Não foi possível abrir esta imagem.");
    } finally {
      input.value = "";
    }
  }

  function applyAspect(ratio: number | null) {
    if (!image) return;
    setAspectRatio(ratio);
    clearResult();
    if (!ratio) return;

    const imageRatio = image.naturalWidth / image.naturalHeight;
    const width = imageRatio > ratio ? image.naturalHeight * ratio : image.naturalWidth;
    const height = imageRatio > ratio ? image.naturalHeight : image.naturalWidth / ratio;
    setCropBox({
      x: Math.round((image.naturalWidth - width) / 2),
      y: Math.round((image.naturalHeight - height) / 2),
      width: Math.round(width),
      height: Math.round(height),
    });
  }

  function updateCrop(patch: Partial<CropBox>) {
    if (!image) return;
    clearResult();
    setCropBox((current) => {
      const next = { ...current, ...patch };
      next.x = clamp(Math.round(next.x), 0, image.naturalWidth - 1);
      next.y = clamp(Math.round(next.y), 0, image.naturalHeight - 1);
      next.width = clamp(Math.round(next.width), 1, image.naturalWidth - next.x);
      next.height = clamp(Math.round(next.height), 1, image.naturalHeight - next.y);
      return next;
    });
  }

  function beginDrag(event: ReactPointerEvent<HTMLElement>, mode: DragState["mode"], handle?: DragState["handle"]) {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { mode, handle, clientX: event.clientX, clientY: event.clientY, start: cropBox };
  }

  function moveDrag(event: ReactPointerEvent<HTMLElement>) {
    const drag = dragRef.current;
    const stage = stageRef.current;
    if (!drag || !stage || !image) return;
    event.preventDefault();
    event.stopPropagation();
    const bounds = stage.getBoundingClientRect();
    const dx = (event.clientX - drag.clientX) / bounds.width * image.naturalWidth;
    const dy = (event.clientY - drag.clientY) / bounds.height * image.naturalHeight;

    if (drag.mode === "move") {
      updateCrop({
        x: clamp(drag.start.x + dx, 0, image.naturalWidth - drag.start.width),
        y: clamp(drag.start.y + dy, 0, image.naturalHeight - drag.start.height),
      });
      return;
    }

    const west = drag.handle?.includes("w");
    const north = drag.handle?.includes("n");
    let x = west ? drag.start.x + dx : drag.start.x;
    let y = north ? drag.start.y + dy : drag.start.y;
    let width = west ? drag.start.width - dx : drag.start.width + dx;
    let height = north ? drag.start.height - dy : drag.start.height + dy;
    x = clamp(x, 0, drag.start.x + drag.start.width - 24);
    y = clamp(y, 0, drag.start.y + drag.start.height - 24);
    width = clamp(width, 24, image.naturalWidth - x);
    height = clamp(height, 24, image.naturalHeight - y);

    if (aspectRatio) {
      const ratioHeight = width / aspectRatio;
      if (ratioHeight <= image.naturalHeight - y) height = ratioHeight;
      else width = height * aspectRatio;
      if (west) x = drag.start.x + drag.start.width - width;
      if (north) y = drag.start.y + drag.start.height - height;
    }
    updateCrop({ x, y, width, height });
  }

  async function crop() {
    if (!image) return;
    const canvas = document.createElement("canvas");
    canvas.width = cropBox.width;
    canvas.height = cropBox.height;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.drawImage(image, cropBox.x, cropBox.y, cropBox.width, cropBox.height, 0, 0, cropBox.width, cropBox.height);
    const blob = await canvasBlob(canvas);
    clearResult();
    setResult({ blob, url: URL.createObjectURL(blob) });
  }

  const imageWidth = image?.naturalWidth ?? 1;
  const imageHeight = image?.naturalHeight ?? 1;

  return (
    <ImageToolPageShell title="Recortar Imagem" description="Selecione visualmente a área que deseja manter ou informe medidas exatas em pixels.">
      <Card className="mx-auto max-w-6xl overflow-hidden">
        <CardHeader>
          <CardTitle>Área de recorte</CardTitle>
          <CardDescription>Arraste a moldura, use as alças nos cantos ou escolha uma proporção pronta.</CardDescription>
        </CardHeader>
        <CardContent>
          <input id="crop-image-file" ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={select} />
          {!image ? (
            <div className="flex min-h-80 flex-col items-center justify-center border border-dashed border-border bg-muted/20 p-6 text-center">
              <Upload className="size-7 text-primary" />
              <h2 className="mt-5 text-lg font-semibold">Selecione uma imagem</h2>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">PNG, JPG ou WebP. O arquivo é processado no seu dispositivo.</p>
              <Button asChild size="lg" className="mt-6 min-h-11"><label htmlFor="crop-image-file">Selecionar imagem</label></Button>
            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
              <section className="min-w-0 rounded-lg border border-border bg-black/90 p-3 sm:p-5" aria-label="Editor visual de recorte">
                <div ref={stageRef} className="relative mx-auto w-fit max-w-full overflow-hidden">
                  <img src={image.src} alt="Imagem para recortar" className="block max-h-[68vh] max-w-full select-none object-contain" draggable={false} />
                  <div
                    className="absolute touch-none cursor-move border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.62)]"
                    style={{ left: `${cropBox.x / imageWidth * 100}%`, top: `${cropBox.y / imageHeight * 100}%`, width: `${cropBox.width / imageWidth * 100}%`, height: `${cropBox.height / imageHeight * 100}%` }}
                    onPointerDown={(event) => beginDrag(event, "move")}
                    onPointerMove={moveDrag}
                    onPointerUp={() => { dragRef.current = null; }}
                    onPointerCancel={() => { dragRef.current = null; }}
                  >
                    <span className="pointer-events-none absolute inset-x-0 top-1/3 border-t border-white/50" />
                    <span className="pointer-events-none absolute inset-x-0 top-2/3 border-t border-white/50" />
                    <span className="pointer-events-none absolute inset-y-0 left-1/3 border-l border-white/50" />
                    <span className="pointer-events-none absolute inset-y-0 left-2/3 border-l border-white/50" />
                    {(["nw", "ne", "sw", "se"] as const).map((handle) => (
                      <button
                        key={handle}
                        type="button"
                        aria-label={`Redimensionar pelo canto ${handle}`}
                        className={`absolute grid size-11 touch-none place-items-center rounded-full bg-transparent ${handle.includes("n") ? "-top-[22px]" : "-bottom-[22px]"} ${handle.includes("w") ? "-left-[22px]" : "-right-[22px]"}`}
                        onPointerDown={(event) => beginDrag(event, "resize", handle)}
                        onPointerMove={moveDrag}
                        onPointerUp={() => { dragRef.current = null; }}
                        onPointerCancel={() => { dragRef.current = null; }}
                      ><span aria-hidden="true" className="size-7 rounded-full border-2 border-white bg-primary shadow-md" /></button>
                    ))}
                  </div>
                </div>
                <p className="mt-4 text-center text-xs text-white/70">Arraste para posicionar · use os cantos para redimensionar</p>
              </section>

              <aside className="rounded-lg border border-border bg-muted/20 p-4">
                <h2 className="font-semibold">Opções de recorte</h2>
                <p className="mt-1 text-xs text-muted-foreground">Proporção</p>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {ASPECT_RATIOS.map((option) => <Button key={option.label} type="button" size="sm" variant={aspectRatio === option.value ? "default" : "outline"} onClick={() => applyAspect(option.value)}>{option.label}</Button>)}
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  {([
                    ["X", "x"], ["Y", "y"], ["Largura", "width"], ["Altura", "height"],
                  ] as const).map(([label, key]) => (
                    <label key={key} className="text-xs font-medium">{label} (px)
                      <input type="number" inputMode="numeric" min={key === "x" || key === "y" ? 0 : 1} value={cropBox[key]} onChange={(event) => updateCrop({ [key]: Number(event.target.value) })} className="mt-1 min-h-11 w-full rounded-md border border-input bg-background px-3 text-base" />
                    </label>
                  ))}
                </div>
                <p className="mt-3 text-xs text-muted-foreground">Original: {imageWidth} × {imageHeight}px</p>
                <Button size="lg" className="mt-5 min-h-11 w-full" onClick={() => void crop()}><Crop />Aplicar recorte</Button>
                <Button asChild variant="outline" className="mt-3 min-h-11 w-full"><label htmlFor="crop-image-file"><RefreshCw />Trocar imagem</label></Button>
              </aside>
            </div>
          )}

          {result && (
            <section className="mt-6 rounded-lg border border-border bg-background p-4" aria-label="Resultado do recorte">
              <img src={result.url} alt="Imagem recortada" className="mx-auto max-h-96 max-w-full object-contain" />
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">Resultado: {cropBox.width} × {cropBox.height}px</p>
                <Button onClick={() => downloadBlob(result.blob, `${name}-recortada.png`)}><Download />Baixar PNG</Button>
              </div>
            </section>
          )}
          {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>
    </ImageToolPageShell>
  );
}
