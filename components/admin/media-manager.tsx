"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Media, MediaSource } from "@/lib/blog/types";

const sources: { value: MediaSource; label: string }[] = [
  { value: "own", label: "Imagem própria" }, { value: "press", label: "Divulgação / assessoria" },
  { value: "press-kit", label: "Press kit" }, { value: "stock", label: "Banco de imagens" },
  { value: "creative-commons", label: "Creative Commons" }, { value: "other", label: "Outra origem" },
];

export function MediaManager({ initialMedia }: { initialMedia: Media[] }) {
  const router = useRouter(); const [editing, setEditing] = useState<Media | null>(null); const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("Enviando...");
    const form = event.currentTarget; const data = new FormData(form); const file = data.get("file");
    if (!(file instanceof File) || !file.size) { setBusy(false); return setMessage("Selecione uma imagem."); }
    const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => { const image = new Image(); const url = URL.createObjectURL(file); image.onload = () => { URL.revokeObjectURL(url); resolve({ width: image.naturalWidth, height: image.naturalHeight }); }; image.onerror = reject; image.src = url; });
    data.set("width", String(dimensions.width)); data.set("height", String(dimensions.height));
    const response = await fetch("/api/admin/media", { method: "POST", body: data }); const result = await response.json(); setBusy(false);
    if (!response.ok) return setMessage(result.error);
    setMessage(result.duplicate ? "Esta imagem já existia e não foi duplicada." : "Imagem enviada."); form.reset(); router.refresh();
  }
  async function saveEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!editing) return; setBusy(true); const data = new FormData(event.currentTarget);
    const response = await fetch(`/api/admin/media/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(data)) }); setBusy(false);
    if (!response.ok) return setMessage((await response.json()).error);
    setEditing(null); setMessage("Metadados atualizados."); router.refresh();
  }
  async function remove(item: Media) { if (!window.confirm(`Excluir “${item.filename}” do storage?`)) return; const response = await fetch(`/api/admin/media/${item.id}`, { method: "DELETE" }); if (!response.ok) return setMessage((await response.json()).error); router.refresh(); }
  return <><form onSubmit={upload} className="mb-6 grid gap-3 border border-white/10 bg-card p-5 md:grid-cols-2 xl:grid-cols-4"><label className="space-y-1.5 text-sm"><span>Arquivo JPG, PNG ou WebP *</span><Input name="file" type="file" accept="image/jpeg,image/png,image/webp" required /></label><label className="space-y-1.5 text-sm"><span>Texto alternativo</span><Input name="alt" /></label><label className="space-y-1.5 text-sm"><span>Legenda</span><Input name="caption" /></label><label className="space-y-1.5 text-sm"><span>Crédito</span><Input name="credit" /></label><label className="space-y-1.5 text-sm"><span>Origem</span><select name="source" className="h-8 w-full border border-input bg-background px-2 text-xs">{sources.map((source) => <option key={source.value} value={source.value}>{source.label}</option>)}</select></label><label className="space-y-1.5 text-sm"><span>URL da origem</span><Input name="sourceUrl" type="url" /></label><div className="flex items-end"><Button type="submit" disabled={busy}><Upload />{busy ? "Enviando..." : "Enviar imagem"}</Button></div>{message ? <p className="self-end text-xs text-muted-foreground">{message}</p> : null}</form>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{initialMedia.map((item) => <article key={item.id} className="border border-white/10 bg-card p-3"><img src={item.url} alt={item.alt} className="aspect-video w-full bg-white/5 object-cover" /><div className="mt-3 flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-medium">{item.filename}</p><p className="mt-1 text-xs text-muted-foreground">{item.width} × {item.height} · {(item.size / 1024).toFixed(0)} KB</p><p className="mt-1 truncate text-xs text-muted-foreground">{item.alt || "Sem texto alternativo"}</p></div><div className="flex"><Button variant="ghost" size="icon-sm" onClick={() => setEditing(item)}><Pencil /></Button><Button variant="destructive" size="icon-sm" onClick={() => remove(item)}><Trash2 /></Button></div></div></article>)}</div>{!initialMedia.length ? <p className="border border-white/10 p-12 text-center text-sm text-muted-foreground">Nenhuma mídia enviada.</p> : null}
    {editing ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"><form onSubmit={saveEdit} className="w-full max-w-lg space-y-4 border border-white/10 bg-background p-5"><h2 className="font-semibold">Editar metadados</h2><label className="block space-y-1.5 text-sm"><span>Texto alternativo</span><Input name="alt" defaultValue={editing.alt} /></label><label className="block space-y-1.5 text-sm"><span>Legenda</span><Input name="caption" defaultValue={editing.caption} /></label><label className="block space-y-1.5 text-sm"><span>Crédito</span><Input name="credit" defaultValue={editing.credit} /></label><label className="block space-y-1.5 text-sm"><span>Origem</span><select name="source" defaultValue={editing.source} className="h-8 w-full border border-input bg-background px-2 text-xs">{sources.map((source) => <option key={source.value} value={source.value}>{source.label}</option>)}</select></label><label className="block space-y-1.5 text-sm"><span>URL da origem</span><Input name="sourceUrl" type="url" defaultValue={editing.sourceUrl} /></label><div className="flex gap-2"><Button type="submit" disabled={busy}>Salvar</Button><Button type="button" variant="ghost" onClick={() => setEditing(null)}>Cancelar</Button></div></form></div> : null}</>;
}
