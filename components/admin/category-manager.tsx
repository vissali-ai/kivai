"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { slugify } from "@/lib/blog/slug";
import type { Category } from "@/lib/blog/types";

export function CategoryManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Category | null>(null);
  const [visibleCount, setVisibleCount] = useState(10);
  const [name, setName] = useState(""); const [slug, setSlug] = useState(""); const [description, setDescription] = useState(""); const [message, setMessage] = useState("");
  function reset() { setEditing(null); setName(""); setSlug(""); setDescription(""); }
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setMessage("Salvando...");
    const response = await fetch(editing ? `/api/admin/categories/${editing.id}` : "/api/admin/categories", { method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, slug, description }) });
    const data = await response.json();
    if (!response.ok) return setMessage(data.error);
    reset(); setMessage("Categoria salva."); router.refresh();
  }
  async function remove(category: Category) {
    if (!window.confirm(`Excluir a categoria “${category.name}”? As matérias ficarão sem categoria.`)) return;
    const response = await fetch(`/api/admin/categories/${category.id}`, { method: "DELETE" });
    if (!response.ok) return setMessage((await response.json()).error);
    router.refresh();
  }
  return <div className="grid gap-5 lg:grid-cols-[360px_1fr]"><form onSubmit={submit} className="h-fit space-y-4 border border-white/10 bg-card p-5"><h2 className="font-semibold">{editing ? "Editar categoria" : "Nova categoria"}</h2><label className="block space-y-1.5 text-sm"><span>Nome *</span><Input required value={name} onChange={(e) => { setName(e.target.value); if (!editing) setSlug(slugify(e.target.value)); }} /></label><label className="block space-y-1.5 text-sm"><span>Slug *</span><Input required value={slug} onChange={(e) => setSlug(slugify(e.target.value))} /></label><label className="block space-y-1.5 text-sm"><span>Descrição</span><textarea value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-24 w-full border border-input bg-background p-3 text-sm" /></label>{message ? <p className="text-xs text-muted-foreground">{message}</p> : null}<div className="flex gap-2"><Button type="submit"><Plus />{editing ? "Salvar" : "Criar categoria"}</Button>{editing ? <Button type="button" variant="ghost" onClick={reset}>Cancelar</Button> : null}</div></form><div className="overflow-x-auto border border-white/10 bg-card"><table className="w-full min-w-[600px] text-left text-xs"><thead className="border-b border-white/10 text-muted-foreground"><tr><th className="p-3">Nome</th><th className="p-3">Slug</th><th className="p-3">Descrição</th><th className="p-3">Ações</th></tr></thead><tbody>{categories.slice(0, visibleCount).map((category) => <tr key={category.id} className="border-b border-white/5"><td className="p-3 font-medium">{category.name}</td><td className="p-3 text-muted-foreground">{category.slug}</td><td className="max-w-md p-3 text-muted-foreground">{category.description || "-"}</td><td className="p-3"><div className="flex gap-1"><Button variant="ghost" size="icon-sm" onClick={() => { setEditing(category); setName(category.name); setSlug(category.slug); setDescription(category.description); }}><Pencil /></Button><Button variant="destructive" size="icon-sm" onClick={() => remove(category)}><Trash2 /></Button></div></td></tr>)}</tbody></table>{!categories.length ? <p className="p-10 text-center text-sm text-muted-foreground">Nenhuma categoria cadastrada.</p> : null}{categories.length ? <div className="flex items-center justify-between gap-3 p-4"><p className="text-xs text-muted-foreground">Exibindo {Math.min(visibleCount, categories.length)} de {categories.length}</p>{visibleCount < categories.length ? <Button type="button" variant="outline" onClick={() => setVisibleCount((count) => count + 10)}>Carregar mais</Button> : null}</div> : null}</div></div>;
}
