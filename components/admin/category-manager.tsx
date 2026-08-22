"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { PaginationControls } from "@/components/admin/pagination-controls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { slugify } from "@/lib/blog/slug";
import type { Category } from "@/lib/blog/types";

export function CategoryManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Category | null>(null);
  const [page, setPage] = useState(1);
  const [name, setName] = useState(""); const [slug, setSlug] = useState(""); const [description, setDescription] = useState(""); const [message, setMessage] = useState("");
  const pageSize = 10;
  const pageItems = categories.slice((page - 1) * pageSize, page * pageSize);
  function reset() { setEditing(null); setName(""); setSlug(""); setDescription(""); }
  async function submit(event: React.FormEvent) { event.preventDefault(); setMessage("Salvando..."); const response = await fetch(editing ? `/api/admin/categories/${editing.id}` : "/api/admin/categories", { method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, slug, description }) }); const data = await response.json(); if (!response.ok) return setMessage(data.error); reset(); setMessage("Categoria salva."); router.refresh(); }
  async function remove(category: Category) { if (!window.confirm(`Excluir a categoria “${category.name}”? As matérias ficarão sem categoria.`)) return; const response = await fetch(`/api/admin/categories/${category.id}`, { method: "DELETE" }); if (!response.ok) return setMessage((await response.json()).error); router.refresh(); }
  return <div className="grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)]"><form onSubmit={submit} className="h-fit space-y-4 rounded-xl border border-white/10 bg-card p-5"><h2 className="font-semibold">{editing ? "Editar categoria" : "Nova categoria"}</h2><label className="block space-y-1.5 text-sm"><span>Nome *</span><Input required value={name} onChange={(e) => { setName(e.target.value); if (!editing) setSlug(slugify(e.target.value)); }} /></label><label className="block space-y-1.5 text-sm"><span>Slug *</span><Input required value={slug} onChange={(e) => setSlug(slugify(e.target.value))} /></label><label className="block space-y-1.5 text-sm"><span>Descrição</span><textarea value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-24 w-full rounded-md border border-input bg-background p-3 text-sm" /></label>{message ? <p className="text-xs text-muted-foreground">{message}</p> : null}<div className="flex flex-wrap gap-2"><Button type="submit"><Plus />{editing ? "Salvar" : "Criar categoria"}</Button>{editing ? <Button type="button" variant="ghost" onClick={reset}>Cancelar</Button> : null}</div></form><section className="overflow-hidden rounded-xl border border-white/10 bg-card"><div className="grid gap-3 p-3 sm:grid-cols-2">{pageItems.map((category) => <article key={category.id} className="min-w-0 rounded-lg border border-white/10 bg-background p-4"><h3 className="font-medium">{category.name}</h3><p className="mt-1 break-all text-xs text-primary">/{category.slug}</p><p className="mt-3 text-sm leading-6 text-muted-foreground">{category.description || "Sem descrição"}</p><div className="mt-4 flex gap-2"><Button className="flex-1" size="sm" onClick={() => { setEditing(category); setName(category.name); setSlug(category.slug); setDescription(category.description); }}><Pencil />Editar</Button><Button variant="destructive" size="icon-sm" onClick={() => remove(category)}><Trash2 /></Button></div></article>)}</div>{!categories.length ? <p className="p-10 text-center text-sm text-muted-foreground">Nenhuma categoria cadastrada.</p> : null}<PaginationControls page={page} totalItems={categories.length} pageSize={pageSize} onPageChange={setPage} /></section></div>;
}
