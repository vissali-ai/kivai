"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Check, Crop, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ResizePageInfo } from "../redimensionar-pdf/resize-pdf-engine";
import type { VisualCrop } from "./print-layout-engine";

type CropMode = "move" | "nw" | "ne" | "sw" | "se";
type CropDrag = { mode: CropMode; startX: number; startY: number; origin: VisualCrop };

const fullPage: VisualCrop = { x: 0, y: 0, width: 1, height: 1 };
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function VisualCropEditor({ page, value, onCancel, onApply }: { page: ResizePageInfo; value: VisualCrop; onCancel: () => void; onApply: (crop: VisualCrop) => void }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<CropDrag | null>(null);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) { if (event.key === "Escape") onCancel(); }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onCancel]);

  useEffect(() => {
    function moveCrop(event: PointerEvent) {
      const drag = dragRef.current;
      const frame = frameRef.current;
      if (!drag || !frame) return;
      const bounds = frame.getBoundingClientRect();
      const dx = (event.clientX - drag.startX) / bounds.width;
      const dy = (event.clientY - drag.startY) / bounds.height;
      const origin = drag.origin;
      if (drag.mode === "move") {
        setDraft({ ...origin, x: clamp(origin.x + dx, 0, 1 - origin.width), y: clamp(origin.y + dy, 0, 1 - origin.height) });
        return;
      }
      const east = drag.mode.endsWith("e");
      const south = drag.mode.startsWith("s");
      const anchorX = east ? origin.x : origin.x + origin.width;
      const anchorY = south ? origin.y : origin.y + origin.height;
      const movingX = clamp((east ? origin.x + origin.width : origin.x) + dx, 0, 1);
      const movingY = clamp((south ? origin.y + origin.height : origin.y) + dy, 0, 1);
      const x = east ? anchorX : Math.min(movingX, anchorX - 0.04);
      const y = south ? anchorY : Math.min(movingY, anchorY - 0.04);
      const width = east ? Math.max(0.04, movingX - anchorX) : anchorX - x;
      const height = south ? Math.max(0.04, movingY - anchorY) : anchorY - y;
      setDraft({ x, y, width: Math.min(width, 1 - x), height: Math.min(height, 1 - y) });
    }
    function finishCrop() { dragRef.current = null; }
    window.addEventListener("pointermove", moveCrop);
    window.addEventListener("pointerup", finishCrop);
    window.addEventListener("pointercancel", finishCrop);
    return () => { window.removeEventListener("pointermove", moveCrop); window.removeEventListener("pointerup", finishCrop); window.removeEventListener("pointercancel", finishCrop); };
  }, []);

  const previewWidth = `min(620px, ${Math.max(26, Math.min(68, 68 * (page.widthPt / page.heightPt)))}vh)`;

  return <div role="dialog" aria-modal="true" aria-labelledby="crop-title" className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" onPointerDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}>
    <div className="w-full max-w-4xl overflow-hidden rounded-2xl border bg-background shadow-2xl">
      <div className="flex items-start justify-between gap-4 border-b px-5 py-4"><div><h2 id="crop-title" className="flex items-center gap-2 font-heading text-lg font-semibold"><Crop className="size-5 text-primary" />Recortar página</h2><p className="mt-1 text-sm text-muted-foreground">Ajuste a moldura para deixar visível somente a etiqueta.</p></div><Button variant="ghost" size="icon-sm" aria-label="Fechar recorte" onClick={onCancel}><X className="size-4" /></Button></div>
      <div className="max-h-[72vh] overflow-auto bg-muted/40 p-5 sm:p-8">
        <div ref={frameRef} className="relative mx-auto touch-none select-none overflow-hidden bg-white shadow-xl" style={{ width: previewWidth, aspectRatio: page.widthPt / page.heightPt }}>
          <Image src={page.thumbnailUrl} alt="Página completa para recorte" fill unoptimized draggable={false} className="pointer-events-none object-fill" />
          <div className="pointer-events-none absolute left-0 top-0 bg-black/55" style={{ width: "100%", height: `${draft.y * 100}%` }} />
          <div className="pointer-events-none absolute bottom-0 left-0 bg-black/55" style={{ width: "100%", height: `${(1 - draft.y - draft.height) * 100}%` }} />
          <div className="pointer-events-none absolute left-0 bg-black/55" style={{ top: `${draft.y * 100}%`, width: `${draft.x * 100}%`, height: `${draft.height * 100}%` }} />
          <div className="pointer-events-none absolute right-0 bg-black/55" style={{ top: `${draft.y * 100}%`, width: `${(1 - draft.x - draft.width) * 100}%`, height: `${draft.height * 100}%` }} />
          <div onPointerDown={(event) => { event.preventDefault(); event.stopPropagation(); dragRef.current = { mode: "move", startX: event.clientX, startY: event.clientY, origin: draft }; }} className="absolute cursor-move border-2 border-primary shadow-[0_0_0_1px_white]" style={{ left: `${draft.x * 100}%`, top: `${draft.y * 100}%`, width: `${draft.width * 100}%`, height: `${draft.height * 100}%` }}>
            <span className="pointer-events-none absolute left-1/2 top-2 -translate-x-1/2 rounded bg-black/70 px-2 py-1 text-[11px] font-medium text-white">Arraste para mover</span>
            {(["nw", "ne", "sw", "se"] as const).map((corner) => <button key={corner} type="button" aria-label={`Ajustar recorte pelo canto ${corner}`} onPointerDown={(event) => { event.preventDefault(); event.stopPropagation(); dragRef.current = { mode: corner, startX: event.clientX, startY: event.clientY, origin: draft }; }} className={`absolute z-10 size-4 rounded-full border-2 border-white bg-primary shadow ${corner === "nw" ? "left-1 top-1 cursor-nwse-resize" : corner === "ne" ? "right-1 top-1 cursor-nesw-resize" : corner === "sw" ? "bottom-1 left-1 cursor-nesw-resize" : "bottom-1 right-1 cursor-nwse-resize"}`} />)}
          </div>
        </div>
      </div>
      <div className="flex flex-col-reverse gap-3 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><Button variant="ghost" onClick={() => setDraft(fullPage)}><RotateCcw className="size-4" />Mostrar página inteira</Button><div className="flex justify-end gap-2"><Button variant="outline" onClick={onCancel}>Cancelar</Button><Button onClick={() => onApply(draft)}><Check className="size-4" />Aplicar recorte</Button></div></div>
    </div>
  </div>;
}
