"use client";

/* eslint-disable @next/next/no-img-element -- the logo preview uses a temporary local blob URL */

import { openFilePicker } from "@/lib/browser/file-picker";
import {
  type ChangeEvent,
  type KeyboardEvent,
  type PointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Download, ImagePlus, Move, Scaling, Type, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageToolPageShell } from "@/components/tools/image-tool-page-shell";
import { canvasBlob, downloadBlob, IMAGE_TYPES, loadImage } from "@/lib/image-tools/canvas";

type WatermarkType = "text" | "logo";
type Placement = { x: number; y: number; scale: number };
type Gesture = {
  mode: "move" | "resize";
  pointerX: number;
  pointerY: number;
  placement: Placement;
  startDistance?: number;
};

const INITIAL_PLACEMENT: Placement = { x: 0.5, y: 0.78, scale: 0.09 };

export function WatermarkClient() {
  const input = useRef<HTMLInputElement>(null);
  const logoInput = useRef<HTMLInputElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const imageUrl = useRef<string | null>(null);
  const logoUrl = useRef<string | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [logo, setLogo] = useState<HTMLImageElement | null>(null);
  const [text, setText] = useState("Sua marca");
  const [type, setType] = useState<WatermarkType>("text");
  const [opacity, setOpacity] = useState(65);
  const [placement, setPlacement] = useState<Placement>(INITIAL_PLACEMENT);
  const [error, setError] = useState("");

  const canRender = Boolean(image && (type === "text" ? text.trim() : logo));
  const dimensions = useMemo(
    () => getWatermarkDimensions(image, type, text, logo, placement.scale),
    [image, logo, placement.scale, text, type],
  );

  useEffect(() => {
    if (!canvas.current || !image) return;
    drawComposition(canvas.current, image, type, text, logo, opacity, placement);
  }, [image, logo, opacity, placement, text, type]);

  useEffect(() => () => {
    if (imageUrl.current) URL.revokeObjectURL(imageUrl.current);
    if (logoUrl.current) URL.revokeObjectURL(logoUrl.current);
  }, []);

  async function selectImage(event: ChangeEvent<HTMLInputElement>) {
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
      setType("text");
      setPlacement(INITIAL_PLACEMENT);
      setError("");
    } catch {
      setError("Não foi possível abrir esta imagem.");
    } finally {
      event.target.value = "";
    }
  }

  async function selectLogo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) {
      setError("Use um logo PNG, JPG ou WebP.");
      return;
    }
    try {
      const nextLogo = await loadImage(file);
      if (logoUrl.current) URL.revokeObjectURL(logoUrl.current);
      logoUrl.current = nextLogo.src;
      setLogo(nextLogo);
      setType("logo");
      setPlacement({ x: 0.5, y: 0.78, scale: 0.22 });
      setError("");
    } catch {
      setError("Não foi possível abrir este logo.");
    } finally {
      event.target.value = "";
    }
  }

  function beginGesture(event: PointerEvent<HTMLElement>, mode: Gesture["mode"]) {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    const bounds = stage.current?.getBoundingClientRect();
    const centerX = bounds ? bounds.left + placement.x * bounds.width : event.clientX;
    const centerY = bounds ? bounds.top + placement.y * bounds.height : event.clientY;
    gesture.current = { mode, pointerX: event.clientX, pointerY: event.clientY, placement, startDistance: mode === "resize" ? Math.max(12, Math.hypot(event.clientX - centerX, event.clientY - centerY)) : undefined };
  }

  function updateGesture(event: PointerEvent<HTMLElement>) {
    const active = gesture.current;
    const bounds = stage.current?.getBoundingClientRect();
    if (!active || !bounds?.width || !bounds.height) return;
    event.preventDefault();
    event.stopPropagation();
    const dx = (event.clientX - active.pointerX) / bounds.width;
    const dy = (event.clientY - active.pointerY) / bounds.height;
    if (active.mode === "move") {
      setPlacement((current) => clampPlacement(
        { ...current, x: active.placement.x + dx, y: active.placement.y + dy },
        dimensions,
      ));
      return;
    }
    const min = type === "logo" ? 0.04 : 0.02;
    const max = type === "logo" ? 0.8 : 0.35;
    const centerX = bounds.left + active.placement.x * bounds.width;
    const centerY = bounds.top + active.placement.y * bounds.height;
    const distance = Math.hypot(event.clientX - centerX, event.clientY - centerY);
    const nextScale = clamp(active.placement.scale * (distance / (active.startDistance ?? distance)), min, max);
    const nextDimensions = getWatermarkDimensions(image, type, text, logo, nextScale);
    setPlacement(clampPlacement({ ...active.placement, scale: nextScale }, nextDimensions));
  }

  function stopGesture(event: PointerEvent<HTMLElement>) {
    if (gesture.current) event.currentTarget.releasePointerCapture(event.pointerId);
    gesture.current = null;
  }

  function moveWithKeyboard(event: KeyboardEvent<HTMLDivElement>) {
    const distance = event.shiftKey ? 0.05 : 0.01;
    const movements: Record<string, [number, number]> = {
      ArrowLeft: [-distance, 0],
      ArrowRight: [distance, 0],
      ArrowUp: [0, -distance],
      ArrowDown: [0, distance],
    };
    const movement = movements[event.key];
    if (!movement) return;
    event.preventDefault();
    setPlacement((current) => clampPlacement(
      { ...current, x: current.x + movement[0], y: current.y + movement[1] },
      dimensions,
    ));
  }

  async function download() {
    if (!image || !canRender) return;
    const output = document.createElement("canvas");
    drawComposition(output, image, type, text, logo, opacity, placement);
    downloadBlob(await canvasBlob(output), "imagem-com-marca-dagua.png");
  }

  return (
    <ImageToolPageShell title="Adicionar Marca d'Água" description="Posicione texto ou logo diretamente sobre a imagem e baixe o resultado pronto.">
      <Card className="mx-auto max-w-6xl overflow-hidden">
        <CardHeader>
          <CardTitle>Editor de marca d&apos;água</CardTitle>
          <CardDescription>A marca aparece automaticamente. Arraste para mover e use a alça no canto para redimensionar.</CardDescription>
        </CardHeader>
        <CardContent>
          <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={selectImage} />
          <input ref={logoInput} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={selectLogo} />
          {!image ? (
            <button type="button" onClick={() => openFilePicker(input.current)} className="flex min-h-80 w-full flex-col items-center justify-center gap-3 border-2 border-dashed border-primary/35 bg-muted/20 p-8 text-center transition-colors hover:border-primary hover:bg-primary/5">
              <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary"><Upload /></span>
              <span className="font-heading text-lg font-semibold">Selecionar imagem</span>
              <span className="max-w-md text-sm text-muted-foreground">Envie um PNG, JPG ou WebP. O texto “Sua marca” será aplicado imediatamente na prévia.</span>
            </button>
          ) : (
            <div className="grid overflow-hidden border border-border lg:grid-cols-[280px_minmax(0,1fr)]">
              <aside className="border-b border-border bg-muted/20 p-4 lg:border-b-0 lg:border-r">
                <div className="grid grid-cols-2 gap-2" role="tablist" aria-label="Tipo de marca d'água">
                  <Button type="button" variant={type === "text" ? "default" : "outline"} aria-pressed={type === "text"} onClick={() => { setType("text"); setPlacement(INITIAL_PLACEMENT); }}><Type />Texto</Button>
                  <Button type="button" variant={type === "logo" ? "default" : "outline"} aria-pressed={type === "logo"} onClick={() => { setType("logo"); if (logo) setPlacement({ x: 0.5, y: 0.78, scale: 0.22 }); else openFilePicker(logoInput.current); }}><ImagePlus />Logo</Button>
                </div>

                {type === "text" ? (
                  <label className="mt-5 block text-sm font-medium">Texto
                    <input value={text} onChange={(event) => setText(event.target.value)} className="mt-2 h-10 w-full border border-input bg-background px-3 outline-none focus:border-primary" />
                  </label>
                ) : (
                  <div className="mt-5">
                    <p className="text-sm font-medium">Imagem do logo</p>
                    {logo && <div className="mt-2 flex min-h-20 items-center justify-center border border-border bg-background p-3"><img src={logo.src} alt="Logo selecionado" className="max-h-14 max-w-full object-contain" /></div>}
                    <Button type="button" variant="outline" className="mt-2 w-full" onClick={() => openFilePicker(logoInput.current)}><Upload />{logo ? "Trocar logo" : "Selecionar logo"}</Button>
                  </div>
                )}

                <label className="mt-5 block text-sm font-medium">Opacidade: {opacity}%
                  <input type="range" min="10" max="100" value={opacity} onInput={(event) => setOpacity(Number(event.currentTarget.value))} className="mt-2 w-full accent-primary" />
                </label>

                <div className="mt-5 space-y-2 border border-border bg-background p-3 text-xs leading-5 text-muted-foreground">
                  <p className="flex gap-2"><Move className="mt-0.5 size-4 shrink-0" />Arraste a marca para posicioná-la.</p>
                  <p className="flex gap-2"><Scaling className="mt-0.5 size-4 shrink-0" />Arraste a alça inferior direita para dimensionar.</p>
                </div>

                <Button type="button" size="lg" className="mt-5 w-full" disabled={!canRender} onClick={download}><Download />Baixar imagem</Button>
                <Button type="button" variant="ghost" className="mt-2 w-full" onClick={() => openFilePicker(input.current)}>Trocar imagem principal</Button>
              </aside>

              <section className="flex min-h-[420px] items-center justify-center overflow-auto bg-[linear-gradient(45deg,hsl(var(--muted))_25%,transparent_25%),linear-gradient(-45deg,hsl(var(--muted))_25%,transparent_25%),linear-gradient(45deg,transparent_75%,hsl(var(--muted))_75%),linear-gradient(-45deg,transparent_75%,hsl(var(--muted))_75%)] bg-[length:20px_20px] bg-[position:0_0,0_10px,10px_-10px,-10px_0] p-4 sm:p-8">
                <div ref={stage} className="relative w-full max-w-4xl touch-none overflow-hidden bg-black shadow-2xl" style={{ aspectRatio: `${image.naturalWidth} / ${image.naturalHeight}` }}>
                  <canvas ref={canvas} aria-label="Prévia da imagem com marca d'água" className="block size-full" />
                  {canRender && (
                    <div
                      role="group"
                      tabIndex={0}
                      aria-label="Marca d'água selecionada. Arraste para mover ou use as setas do teclado."
                      className="absolute cursor-move border-2 border-white shadow-[0_0_0_1px_rgba(37,99,235,.9)] outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      style={{
                        left: `${(placement.x - dimensions.width / 2) * 100}%`,
                        top: `${(placement.y - dimensions.height / 2) * 100}%`,
                        width: `${dimensions.width * 100}%`,
                        height: `${dimensions.height * 100}%`,
                      }}
                      onPointerDown={(event) => beginGesture(event, "move")}
                      onPointerMove={updateGesture}
                      onPointerUp={stopGesture}
                      onPointerCancel={stopGesture}
                      onKeyDown={moveWithKeyboard}
                    >
                      <button
                        type="button"
                        aria-label="Redimensionar marca d'água pela alça inferior direita"
                        className="absolute -bottom-5 -right-5 grid size-11 touch-none place-items-center rounded-full bg-transparent cursor-nwse-resize"
                        onPointerDown={(event) => beginGesture(event, "resize")}
                        onPointerMove={updateGesture}
                        onPointerUp={stopGesture}
                        onPointerCancel={stopGesture}
                      ><span aria-hidden="true" className="size-5 rounded-full border-2 border-white bg-primary shadow-md" /></button>
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}
          {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>
    </ImageToolPageShell>
  );
}

function getWatermarkDimensions(image: HTMLImageElement | null, type: WatermarkType, text: string, logo: HTMLImageElement | null, scale: number) {
  if (!image) return { width: scale, height: scale };
  if (type === "logo" && logo) {
    return {
      width: scale,
      height: scale * (logo.naturalHeight / logo.naturalWidth) * (image.naturalWidth / image.naturalHeight),
    };
  }
  const fontSize = image.naturalWidth * scale;
  return {
    width: Math.max(0.02, (Math.max(1, text.trim().length) * fontSize * 0.62) / image.naturalWidth),
    height: (fontSize * 1.2) / image.naturalHeight,
  };
}

function drawComposition(canvas: HTMLCanvasElement, image: HTMLImageElement, type: WatermarkType, text: string, logo: HTMLImageElement | null, opacity: number, placement: Placement) {
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext("2d");
  if (!context) return;
  context.drawImage(image, 0, 0);
  context.save();
  context.globalAlpha = opacity / 100;
  const dimensions = getWatermarkDimensions(image, type, text, logo, placement.scale);
  const width = dimensions.width * image.naturalWidth;
  const height = dimensions.height * image.naturalHeight;
  const x = placement.x * image.naturalWidth - width / 2;
  const y = placement.y * image.naturalHeight - height / 2;
  if (type === "logo" && logo) {
    context.drawImage(logo, x, y, width, height);
  } else if (text.trim()) {
    const fontSize = image.naturalWidth * placement.scale;
    context.font = `700 ${fontSize}px sans-serif`;
    context.textBaseline = "top";
    context.lineJoin = "round";
    context.fillStyle = "#ffffff";
    context.strokeStyle = "rgba(0,0,0,.58)";
    context.lineWidth = Math.max(2, image.naturalWidth * 0.003);
    context.strokeText(text, x, y);
    context.fillText(text, x, y);
  }
  context.restore();
}

function clampPlacement(placement: Placement, dimensions: { width: number; height: number }) {
  const halfWidth = Math.min(dimensions.width / 2, 0.5);
  const halfHeight = Math.min(dimensions.height / 2, 0.5);
  return {
    ...placement,
    x: clamp(placement.x, halfWidth, 1 - halfWidth),
    y: clamp(placement.y, halfHeight, 1 - halfHeight),
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
