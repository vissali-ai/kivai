"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, FilePenLine, Send, Trash2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PostStatus } from "@/lib/blog/types";

export function PostActions({ id, slug, status, mobileCompact = false }: { id: string; slug: string; status: PostStatus; mobileCompact?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function changeStatus(nextStatus: PostStatus) {
    setBusy(true);
    const response = await fetch(`/api/admin/posts/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: nextStatus }) });
    const data = response.status === 204 ? null : await response.json();
    setBusy(false);
    if (!response.ok) return window.alert(data?.error ?? "Não foi possível alterar o status.");
    router.refresh();
  }
  async function remove() {
    if (!window.confirm("Excluir esta matéria permanentemente? Esta ação não pode ser desfeita.")) return;
    setBusy(true);
    const response = await fetch(`/api/admin/posts/${id}`, { method: "DELETE" });
    setBusy(false);
    if (!response.ok) return window.alert((await response.json()).error);
    router.refresh();
  }
  if (mobileCompact) return <div className="flex flex-wrap gap-1">
    <Button variant="destructive" size="icon-sm" disabled={busy} title="Excluir" onClick={remove}><Trash2 /></Button>
    <Button asChild variant="ghost" size="icon-sm" title="Editar"><Link href={`/admin/blog/${id}`}><FilePenLine /></Link></Button>
  </div>;

  return <div className="flex flex-wrap gap-1">
    <><Button asChild variant="ghost" size="icon-sm" title="Editar"><Link href={`/admin/blog/${id}`}><FilePenLine /></Link></Button>
    {status === "published" ? <Button asChild variant="ghost" size="icon-sm" title="Visualizar"><Link href={`/blog/${slug}`} target="_blank"><Eye /></Link></Button> : <Button asChild variant="ghost" size="icon-sm" title="Pré-visualizar"><Link href={`/admin/blog/${id}/preview`} target="_blank"><Eye /></Link></Button>}
    {status === "published" ? <Button variant="ghost" size="icon-sm" disabled={busy} title="Despublicar" onClick={() => changeStatus("draft")}><Undo2 /></Button> : <Button variant="ghost" size="icon-sm" disabled={busy} title="Publicar" onClick={() => changeStatus("published")}><Send /></Button>}</>
    <Button variant="destructive" size="icon-sm" disabled={busy} title="Excluir" onClick={remove}><Trash2 /></Button>
  </div>;
}
