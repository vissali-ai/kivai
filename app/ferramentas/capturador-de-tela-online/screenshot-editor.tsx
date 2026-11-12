"use client";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { Button } from "@/components/ui/button";

type Mode = "Recortar" | "Desenhar" | "Retângulo";
type Point = { x: number; y: number };
type Edit = { mode: Mode; points: Point[]; color: string; width: number };
function bounds(edit: Edit) {
  const a = edit.points[0], b = edit.points[edit.points.length - 1];
  return { x: Math.min(a.x,b.x), y: Math.min(a.y,b.y), w: Math.abs(a.x-b.x), h: Math.abs(a.y-b.y) };
}
function mark(ctx: CanvasRenderingContext2D, edit: Edit) {
  ctx.save();
  ctx.strokeStyle = edit.color; ctx.lineWidth = edit.width;
  ctx.lineCap = "round"; ctx.lineJoin = "round";
  if (edit.mode === "Desenhar") {
    ctx.beginPath();
    ctx.moveTo(edit.points[0].x,edit.points[0].y);
    for (const p of edit.points) ctx.lineTo(p.x,p.y);
    ctx.stroke();
  } else {
    const {x,y,w,h} = bounds(edit);
    if (edit.mode === "Recortar") {ctx.setLineDash([8,5]); ctx.strokeStyle = "#0284c7"; ctx.fillStyle = "#0284c72b"; ctx.fillRect(x,y,w,h);}
    ctx.strokeRect(x,y,w,h);
  }
  ctx.restore();
}
function paint(canvas: HTMLCanvasElement, source: HTMLCanvasElement, edits: Edit[]) {
  canvas.width = source.width; canvas.height = source.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(source,0,0);
  for (const edit of edits) {
    if (edit.mode !== "Recortar") { mark(ctx,edit); continue; }
    const {x,y,w,h} = bounds(edit);
    const area = ctx.getImageData(x,y,w,h);
    canvas.width = w; canvas.height = h; ctx.putImageData(area,0,0);
  }
}
export default function ScreenshotEditor() {
  const [source,setSource] = useState<HTMLCanvasElement | null>(null);
  const [edits,setEdits] = useState<Edit[]>([]);
  const [mode,setMode] = useState<Mode>("Recortar");
  const [color,setColor] = useState("#dc2626");
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState("");
  const canvas = useRef<HTMLCanvasElement>(null);
  const base = useRef<HTMLCanvasElement | null>(null);
  const gesture = useRef<Edit | null>(null);
  const capture = useRef<AbortController | null>(null);
  useEffect(()=>()=>capture.current?.abort(),[]);
  useEffect(()=>{
    if (!source || !canvas.current) return;
    const rendered = base.current ?? document.createElement("canvas");
    paint(rendered,source,edits);
    base.current = rendered;
    canvas.current.width = rendered.width; canvas.current.height = rendered.height;
    canvas.current.getContext("2d")!.drawImage(rendered,0,0);
    gesture.current = null;
  },[source,edits]);

  async function take(selection: "full" | "area") {
    if (capture.current) return;
    if (!navigator.mediaDevices?.getDisplayMedia) {setMessage("Abra esta página em um navegador de computador que permita compartilhar a tela."); return;}
    const controller = new AbortController();
    capture.current = controller;
    setBusy(true); setMessage("");
    const video = document.createElement("video");
    video.muted = true; video.playsInline = true;
    let stream: MediaStream | undefined;
    let timer: number | undefined;
    function stop() { stream?.getTracks().forEach(track=>track.stop()); }
    controller.signal.addEventListener("abort",stop);
    try {
      stream = await navigator.mediaDevices.getDisplayMedia({video:true,audio:false});
      if (controller.signal.aborted) return;
      video.srcObject = stream;
      await Promise.race([video.play(), new Promise<never>((_,reject)=>{
        timer = window.setTimeout(()=>reject(new Error("frame")),10000);
      })]);
      if (controller.signal.aborted) return;
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      if (!video.videoWidth || !video.videoHeight || video.readyState < 2) throw new Error("frame");
      const image = document.createElement("canvas");
      image.width = video.videoWidth; image.height = video.videoHeight;
      const context = image.getContext("2d");
      if (!context) throw new Error("frame");
      context.drawImage(video,0,0);
      setSource(image);
      setEdits([]);
      setMode(selection === "area" ? "Recortar" : "Desenhar");
      setMessage(selection === "area"
        ? "Captura concluída. Arraste sobre a imagem para marcar a parte que deseja manter."
        : "Captura concluída. Você voltou ao Kivai e já pode editar ou baixar o PNG.");
    } catch (e) {
      if (!controller.signal.aborted) setMessage(e instanceof DOMException && e.name === "NotAllowedError" ? "Captura cancelada ou sem permissão. Clique em Capturar tela para escolher uma fonte." : "Não foi possível obter a imagem. Tente selecionar outra janela ou aba.");
    } finally {
      stop(); video.srcObject = null; window.clearTimeout(timer);
      capture.current = null;
      if (!controller.signal.aborted) {
        setBusy(false);
        window.focus();
        window.setTimeout(() => canvas.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 80);
      }
    }
  }
  function position(e: PointerEvent<HTMLCanvasElement>) {
    const el = e.currentTarget, rect = el.getBoundingClientRect();
    return {x:Math.max(0,Math.min(el.width,Math.round((e.clientX-rect.left)*el.width/rect.width))),
      y:Math.max(0,Math.min(el.height,Math.round((e.clientY-rect.top)*el.height/rect.height)))};
  }
  function preview(edit?: Edit) {
    if (!canvas.current || !base.current) return;
    const ctx = canvas.current.getContext("2d")!;
    ctx.drawImage(base.current,0,0);
    if (edit) mark(ctx,edit);
  }
  function move(e: PointerEvent<HTMLCanvasElement>) {
    const edit = gesture.current;
    if (!edit || !e.isPrimary) return;
    if (edit.mode === "Desenhar") edit.points.push(position(e));
    else edit.points[1] = position(e);
    preview(edit);
  }
  async function download() {
    const blob = await new Promise<Blob|null>(resolve=>base.current!.toBlob(resolve,"image/png"));
    if (!blob) {setMessage("Não foi possível gerar o PNG."); return;}
    const url = URL.createObjectURL(blob), link = document.createElement("a");
    link.href = url; link.download = "captura-de-tela.png"; link.click();
    window.setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  return <section className="space-y-4 rounded-xl border bg-card p-5 sm:p-7">
    <div>
      <h2 className="font-semibold">Como deseja capturar?</h2>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">O navegador sempre mostra o seletor seguro de compartilhamento. Depois da captura, o Kivai encerra o compartilhamento e tenta devolver o foco para esta página.</p>
    </div>
    <div className="flex flex-wrap gap-3">
      <Button onClick={()=>take("full")} disabled={busy}>{busy ? "Aguardando captura…" : "Capturar tela inteira"}</Button>
      <Button variant="outline" onClick={()=>take("area")} disabled={busy}>{busy ? "Aguardando captura…" : "Escolher uma parte"}</Button>
    </div>
    <p role="status" className="text-sm">{message}</p>
    {source && <><div className="flex flex-wrap items-center gap-2">
      {(["Recortar","Desenhar","Retângulo"] as const).map(item=><Button key={item} variant={mode===item?"default":"outline"} aria-pressed={mode===item} onClick={()=>setMode(item)}>{item}</Button>)}
      <label className="flex items-center gap-2">Cor<input type="color" value={color} onChange={e=>setColor(e.target.value)}/></label>
      <Button variant="outline" disabled={!edits.length} onClick={()=>setEdits(previous=>previous.slice(0,-1))}>Desfazer</Button>
    </div><p className="text-sm text-muted-foreground">Arraste sobre a imagem para aplicar a ferramenta selecionada.</p>
    <canvas ref={canvas} aria-label="Editor do print" className="block h-auto max-w-full touch-none cursor-crosshair"
      onPointerDown={e=>{
        if (!e.isPrimary || e.button !== 0) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        gesture.current = {mode,color,width:Math.max(2,Math.round(e.currentTarget.width/400)),points:[position(e)]};
      }} onPointerMove={move} onPointerCancel={()=>{gesture.current=null; preview();}}
      onPointerUp={e=>{
        const edit = gesture.current;
        if (!edit || !e.isPrimary) return;
        move(e); gesture.current=null;
        const {w,h} = bounds(edit);
        if (edit.mode !== "Desenhar" && (w<2 || h<2)) {preview();return;}
        setEdits(previous=>[...previous,edit]);
      }}/>
    <Button onClick={download}>Baixar PNG</Button></>}
  </section>;
}
