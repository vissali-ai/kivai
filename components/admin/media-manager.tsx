"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ExternalLink, LoaderCircle, Pencil, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PaginationControls } from "@/components/admin/pagination-controls";
import type { Media, MediaSource, MediaUsage } from "@/lib/blog/types";

const sources: { value: MediaSource; label: string }[] = [
  { value: "own", label: "Imagem própria" }, { value: "press", label: "Divulgação / assessoria" },
  { value: "press-kit", label: "Press kit" }, { value: "stock", label: "Banco de imagens" },
  { value: "creative-commons", label: "Creative Commons" }, { value: "other", label: "Outra origem" },
];

export function MediaManager({ initialMedia, usage, unusedOnly = false }: { initialMedia: Media[]; usage: MediaUsage[]; unusedOnly?: boolean }) {
  const router = useRouter(); const [editing, setEditing] = useState<Media | null>(null); const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false); const [deletingId, setDeletingId] = useState<string | null>(null); const [removedIds, setRemovedIds] = useState<string[]>([]); const [itemMessage, setItemMessage] = useState<{ id: string; error: boolean; text: string } | null>(null); const [page, setPage] = useState(1); const pageSize = 10;
  const usageByMedia = useMemo(() => new Map(usage.map((item) => [item.mediaId, item])), [usage]);
  const media = initialMedia.filter((item) => !removedIds.includes(item.id));
  const totalPages = Math.max(1, Math.ceil(media.length / pageSize));
  const safePage = Math.min(page, totalPages);
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
  async function remove(item: Media) {
    const itemUsage = usageByMedia.get(item.id);
    if (itemUsage?.count) return setItemMessage({ id: item.id, error: true, text: `Não é possível excluir: esta imagem está em uso em ${itemUsage.count} local(is).` });
    if (!window.confirm(`Excluir permanentemente “${item.filename}” do acervo e do Storage? Esta ação não pode ser desfeita.`)) return;
    setDeletingId(item.id); setItemMessage({ id: item.id, error: false, text: "Excluindo imagem..." });
    try {
      const response = await fetch(`/api/admin/media/${item.id}`, { method: "DELETE" });
      if (!response.ok) { const result = await response.json(); throw new Error(result.error || "Não foi possível excluir a imagem."); }
      setRemovedIds((current) => [...current, item.id]); setMessage(`“${item.filename}” foi excluída do acervo e do Storage.`); setItemMessage(null); router.refresh();
    } catch (reason) { setItemMessage({ id: item.id, error: true, text: reason instanceof Error ? reason.message : "Não foi possível excluir a imagem." }); }
    finally { setDeletingId(null); }
  }
  return <><form onSubmit={upload} className="mb-6 grid gap-3 border border-white/10 bg-card p-5 md:grid-cols-2 xl:grid-cols-4"><label className="space-y-1.5 text-sm"><span>Arquivo JPG, PNG ou WebP *</span><Input name="file" type="file" accept="image/jpeg,image/png,image/webp" required /></label><label className="space-y-1.5 text-sm"><span>Texto alternativo</span><Input name="alt" /></label><label className="space-y-1.5 text-sm"><span>Legenda</span><Input name="caption" /></label><label className="space-y-1.5 text-sm"><span>Crédito</span><Input name="credit" /></label><label className="space-y-1.5 text-sm"><span>Origem</span><select name="source" className="h-8 w-full border border-input bg-background px-2 text-xs">{sources.map((source) => <option key={source.value} value={source.value}>{source.label}</option>)}</select></label><label className="space-y-1.5 text-sm"><span>URL da origem</span><Input name="sourceUrl" type="url" /></label><div className="flex items-end"><Button type="submit" disabled={busy}><Upload />{busy ? "Enviando..." : "Enviar imagem"}</Button></div>{message ? <p className="self-end text-xs text-muted-foreground">{message}</p> : null}</form>
    {message ? <div role="status" className="mb-4 flex items-start gap-2 border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm text-emerald-200"><CheckCircle2 className="mt-0.5 size-4 shrink-0" />{message}</div> : null}
    {unusedOnly ? <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border border-amber-500/25 bg-amber-500/5 p-3 text-xs text-amber-100"><span>{media.length} arquivo(s) sem referência detectada.</span><Button asChild type="button" size="sm" variant="outline"><Link href="/admin/blog/midias">Ver todo o acervo</Link></Button></div> : null}
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{media.slice((safePage - 1) * pageSize, safePage * pageSize).map((item) => { const itemUsage = usageByMedia.get(item.id) ?? { mediaId: item.id, count: 0, references: [] }; const deleting = deletingId === item.id; return <article key={item.id} className="border border-white/10 bg-card p-3"><img src={item.url} alt={item.alt} className="aspect-video w-full bg-white/5 object-cover" /><div className="mt-3 flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-medium">{item.filename}</p><p className="mt-1 text-xs text-muted-foreground">{item.width} × {item.height} · {(item.size / 1024).toFixed(0)} KB</p><p className="mt-1 truncate text-xs text-muted-foreground">{item.alt || "Sem texto alternativo"}</p></div><div className="flex"><Button variant="ghost" size="icon-sm" onClick={() => setEditing(item)} disabled={deleting} aria-label={`Editar ${item.filename}`}><Pencil /></Button><Button variant="destructive" size="icon-sm" onClick={() => remove(item)} disabled={deleting || itemUsage.count > 0} aria-label={itemUsage.count ? `Imagem em uso: ${item.filename}` : `Excluir ${item.filename}`}>{deleting ? <LoaderCircle className="animate-spin" /> : <Trash2 />}</Button></div></div><div className={`mt-3 border p-3 text-xs ${itemUsage.count ? "border-primary/20 bg-primary/5" : "border-amber-500/25 bg-amber-500/5"}`}><p className="font-medium">{itemUsage.count ? `Em uso em ${itemUsage.count} local(is)` : "Sem uso detectado"}</p>{itemUsage.references.map((reference) => <Link key={`${reference.postId}:${reference.location}`} href={reference.href} className="mt-2 flex items-start gap-1.5 text-muted-foreground hover:text-primary"><ExternalLink className="mt-0.5 size-3 shrink-0" /><span>{reference.location}: {reference.title}</span></Link>)}</div>{itemMessage?.id === item.id ? <p role={itemMessage.error ? "alert" : "status"} className={`mt-3 border p-2 text-xs ${itemMessage.error ? "border-red-500/30 bg-red-500/5 text-red-200" : "border-white/10 text-muted-foreground"}`}>{itemMessage.text}</p> : null}</article>; })}</div>{!media.length ? <p className="border border-white/10 p-12 text-center text-sm text-muted-foreground">{unusedOnly ? "Nenhuma mídia sem uso detectada." : "Nenhuma mídia enviada."}</p> : null}<PaginationControls page={safePage} totalItems={media.length} pageSize={pageSize} onPageChange={setPage} />
    {editing ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"><form onSubmit={saveEdit} className="w-full max-w-lg space-y-4 border border-white/10 bg-background p-5"><h2 className="font-semibold">Editar metadados</h2><label className="block space-y-1.5 text-sm"><span>Texto alternativo</span><Input name="alt" defaultValue={editing.alt} /></label><label className="block space-y-1.5 text-sm"><span>Legenda</span><Input name="caption" defaultValue={editing.caption} /></label><label className="block space-y-1.5 text-sm"><span>Crédito</span><Input name="credit" defaultValue={editing.credit} /></label><label className="block space-y-1.5 text-sm"><span>Origem</span><select name="source" defaultValue={editing.source} className="h-8 w-full border border-input bg-background px-2 text-xs">{sources.map((source) => <option key={source.value} value={source.value}>{source.label}</option>)}</select></label><label className="block space-y-1.5 text-sm"><span>URL da origem</span><Input name="sourceUrl" type="url" defaultValue={editing.sourceUrl} /></label><div className="flex gap-2"><Button type="submit" disabled={busy}>Salvar</Button><Button type="button" variant="ghost" onClick={() => setEditing(null)}>Cancelar</Button></div></form></div> : null}</>;
}
