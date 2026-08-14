"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Save, Send } from "lucide-react";
import { CoverImageUpload } from "@/components/admin/cover-image-upload";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { slugify } from "@/lib/blog/slug";
import type { Category, Media, Post, PostInput, PostStatus } from "@/lib/blog/types";

type ToolOption = { slug: string; name: string };
const blank: PostInput = {
  title: "", subtitle: "", slug: "", excerpt: "", content: "<p></p>", status: "draft", author: "Kivai",
  sourceName: "", sourceUrl: "", originalPublishedAt: null, categoryId: null, coverMediaId: null,
  coverAlt: "", coverCaption: "", coverCredit: "", coverSource: "", coverSourceUrl: "",
  seoTitle: "", metaDescription: "", canonicalUrl: "", ogTitle: "", ogDescription: "", ogImage: "",
  relatedToolSlugs: [], featured: false, featuredOrder: null, scheduledAt: null, tagNames: [],
  origin: "manual", reviewStatus: "not-required", generationModel: "", needsCover: false,
};

function fromPost(post?: Post | null): PostInput {
  if (!post) return blank;
  const isUntouchedRssDraft = post.origin === "rss-agent"
    && post.generationModel === "source-only"
    && post.reviewStatus === "awaiting-review"
    && post.status === "draft"
    && Math.abs(new Date(post.updatedAt).getTime() - new Date(post.createdAt).getTime()) < 1_000;
  return {
    ...post,
    id: post.id,
    title: isUntouchedRssDraft ? "" : post.title,
    slug: isUntouchedRssDraft ? "" : post.slug,
    tagNames: post.tags.map((tag) => tag.name),
  };
}

export function PostEditor({ post, categories, tools }: { post?: Post | null; categories: Category[]; tools: ToolOption[] }) {
  const router = useRouter();
  const [form, setForm] = useState<PostInput>(() => fromPost(post));
  const [tagText, setTagText] = useState(() => form.tagNames.join(", "));
  const [cover, setCover] = useState<Media | null>(post?.cover ?? null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const endpoint = form.id ? `/api/admin/posts/${form.id}` : "/api/admin/posts";
  const update = <K extends keyof PostInput>(key: K, value: PostInput[K]) => setForm((current) => ({ ...current, [key]: value }));
  const tags = useMemo(() => tagText.split(",").map((tag) => tag.trim()).filter(Boolean), [tagText]);
  const sortedTools = useMemo(
    () => [...tools].sort((left, right) => left.name.localeCompare(right.name, "pt-BR", { sensitivity: "base" })),
    [tools],
  );
  async function save(status: PostStatus = form.status, preview = false) {
    setSaving(true); setMessage(status === "published" ? "Publicando..." : "Salvando...");
    const payload = { ...form, status, tagNames: tags };
    const response = await fetch(endpoint, { method: form.id ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await response.json();
    setSaving(false);
    if (!response.ok) { setMessage(data.error ?? "Erro ao salvar"); return; }
    setForm((current) => ({ ...current, ...data, id: data.id, tagNames: tags }));
    setMessage("Salvo");
    if (preview) window.open(`/admin/blog/${data.id}/preview`, "_blank", "noopener,noreferrer");
    if (status === "published" && !preview) {
      router.push("/admin/blog?status=published");
      router.refresh();
      return;
    }
    if (!form.id) router.replace(`/admin/blog/${data.id}`);
    router.refresh();
  }
  const inputClass = "h-10";
  return <main className="min-w-0 max-w-full overflow-x-hidden"><header className="mb-6 flex min-w-0 flex-wrap items-end justify-between gap-4"><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Editor</p><h1 className="mt-1 text-3xl font-semibold">{form.id ? "Editar matéria" : "Nova matéria"}</h1><p className="mt-2 text-sm text-muted-foreground">O salvamento padrão mantém a matéria como rascunho.</p></div><div className="flex min-w-0 flex-wrap items-center gap-2"><span className={`text-xs ${message.includes("Erro") || message.includes("obrigatório") ? "text-red-400" : "text-muted-foreground"}`}>{message}</span><Button variant="outline" disabled={saving} onClick={() => save(post?.status === "published" ? "published" : "draft", true)}><Eye />Pré-visualizar</Button><Button variant="secondary" disabled={saving} onClick={() => save("draft")}><Save />Salvar rascunho</Button>{form.status === "scheduled" ? <Button variant="secondary" disabled={saving} onClick={() => save("scheduled")}><Save />Salvar agendamento</Button> : null}<Button disabled={saving} onClick={() => save("published")}><Send />Publicar</Button></div></header>
    {form.origin === "rss-agent" ? <div className="mb-5 border border-primary/30 bg-primary/10 p-4 text-sm"><strong>Pauta coletada pelo agente.</strong><p className="mt-1 text-muted-foreground">Use o título para abrir a fonte original pelo dashboard. Preencha os campos editoriais com o conteúdo preparado no GPT, revise os fatos e adicione uma imagem de capa com os créditos corretos.</p>{form.needsCover ? <p className="mt-2 font-medium text-amber-300">A publicação ficará bloqueada até você selecionar a imagem de capa.</p> : null}</div> : null}
    <div className="min-w-0 space-y-5"><section className="min-w-0 space-y-4 border border-white/10 bg-card p-5"><h2 className="font-semibold">Conteúdo</h2><label className="block space-y-1.5 text-sm"><span>Título *</span><Input value={form.title} onChange={(e) => update("title", e.target.value)} className={inputClass} /></label><label className="block space-y-1.5 text-sm"><span>Subtítulo ou linha fina</span><Input value={form.subtitle} onChange={(e) => update("subtitle", e.target.value)} className={inputClass} /></label><label className="block space-y-1.5 text-sm"><span>Slug *</span><Input value={form.slug} onChange={(e) => update("slug", slugify(e.target.value))} className={inputClass} /></label><label className="block space-y-1.5 text-sm"><span>Resumo *</span><textarea value={form.excerpt} maxLength={320} onChange={(e) => update("excerpt", e.target.value)} className="min-h-24 w-full border border-input bg-background p-3 text-sm outline-none focus:border-ring" /><small className="text-muted-foreground">{form.excerpt.length}/320</small></label><div><span className="mb-1.5 block text-sm">Texto da matéria *</span><RichTextEditor value={form.content} onChange={(value) => update("content", value)} /></div></section>
      <section className="space-y-4 border border-white/10 bg-card p-5"><h2 className="font-semibold">Fonte editorial</h2><div className="grid gap-4 md:grid-cols-2"><label className="space-y-1.5 text-sm"><span>Fonte principal</span><Input value={form.sourceName} onChange={(e) => update("sourceName", e.target.value)} /></label><label className="space-y-1.5 text-sm"><span>URL da fonte</span><Input type="url" value={form.sourceUrl} onChange={(e) => update("sourceUrl", e.target.value)} /></label></div></section>
      <section className="space-y-4 border border-white/10 bg-card p-5"><h2 className="font-semibold">SEO</h2><label className="block space-y-1.5 text-sm"><span>SEO Title</span><Input value={form.seoTitle} maxLength={70} onChange={(e) => update("seoTitle", e.target.value)} /><small className="text-muted-foreground">{form.seoTitle.length}/60 recomendado. Vazio usa o título.</small></label><label className="block space-y-1.5 text-sm"><span>Meta Description</span><textarea value={form.metaDescription} maxLength={180} onChange={(e) => update("metaDescription", e.target.value)} className="min-h-20 w-full border border-input bg-background p-3 text-sm" /><small className="text-muted-foreground">{form.metaDescription.length}/160 recomendado</small></label><label className="block space-y-1.5 text-sm"><span>Canonical</span><Input type="url" value={form.canonicalUrl} onChange={(e) => update("canonicalUrl", e.target.value)} placeholder="Vazio usa a URL da matéria" /></label><div className="grid gap-4 md:grid-cols-2"><label className="space-y-1.5 text-sm"><span>OG Title</span><Input value={form.ogTitle} onChange={(e) => update("ogTitle", e.target.value)} /></label><label className="space-y-1.5 text-sm"><span>OG Image</span><Input type="url" value={form.ogImage} onChange={(e) => update("ogImage", e.target.value)} /></label></div><label className="block space-y-1.5 text-sm"><span>OG Description</span><textarea value={form.ogDescription} onChange={(e) => update("ogDescription", e.target.value)} className="min-h-20 w-full border border-input bg-background p-3 text-sm" /></label></section>
      <section className="space-y-4 border border-white/10 bg-card p-5"><h2 className="font-semibold">Publicação</h2><label className="block space-y-1.5 text-sm"><span>Status</span><select value={form.status} onChange={(e) => update("status", e.target.value as PostStatus)} className="h-10 w-full border border-input bg-background px-3"><option value="draft">Rascunho</option><option value="published">Publicada</option><option value="scheduled">Agendada</option></select></label>{form.status === "scheduled" ? <label className="block space-y-1.5 text-sm"><span>Publicar em</span><Input type="datetime-local" value={form.scheduledAt?.slice(0, 16) ?? ""} onChange={(e) => update("scheduledAt", e.target.value ? new Date(e.target.value).toISOString() : null)} /></label> : null}<label className="block space-y-1.5 text-sm"><span>Autor *</span><Input value={form.author} onChange={(e) => update("author", e.target.value)} /></label><label className="block space-y-1.5 text-sm"><span>Categoria</span><select value={form.categoryId ?? ""} onChange={(e) => update("categoryId", e.target.value || null)} className="h-10 w-full border border-input bg-background px-3"><option value="">Sem categoria</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label className="block space-y-1.5 text-sm"><span>Tags</span><Input value={tagText} onChange={(e) => setTagText(e.target.value)} placeholder="Google, Gemini, Android" /><small className="text-muted-foreground">Separe por vírgulas.</small></label></section>
      <section className="space-y-4 border border-white/10 bg-card p-5"><h2 className="font-semibold">Foto da matéria</h2><CoverImageUpload media={cover} onUploaded={(media) => { setCover(media); setForm((current) => ({ ...current, coverMediaId: media.id, coverAlt: current.coverAlt || media.alt, coverCaption: current.coverCaption || media.caption, coverCredit: current.coverCredit || media.credit, coverSource: current.coverSource || media.source, coverSourceUrl: current.coverSourceUrl || media.sourceUrl, needsCover: false })); }} /><label className="block space-y-1.5 text-sm"><span>Texto alternativo</span><Input value={form.coverAlt} onChange={(e) => update("coverAlt", e.target.value)} placeholder="Descreva brevemente o que aparece na foto" /></label><label className="block space-y-1.5 text-sm"><span>Legenda</span><Input value={form.coverCaption} onChange={(e) => update("coverCaption", e.target.value)} /></label><label className="block space-y-1.5 text-sm"><span>Crédito</span><Input value={form.coverCredit} onChange={(e) => update("coverCredit", e.target.value)} /></label><label className="block space-y-1.5 text-sm"><span>Origem</span><Input value={form.coverSource} onChange={(e) => update("coverSource", e.target.value)} /></label><label className="block space-y-1.5 text-sm"><span>URL da origem</span><Input type="url" value={form.coverSourceUrl} onChange={(e) => update("coverSourceUrl", e.target.value)} /></label></section>
      <section className="space-y-3 border border-white/10 bg-card p-5"><h2 className="font-semibold">Ferramentas relacionadas</h2><div className="max-h-64 space-y-2 overflow-auto">{sortedTools.map((tool) => <label key={tool.slug} className="flex items-center gap-2 text-xs"><input type="checkbox" checked={form.relatedToolSlugs.includes(tool.slug)} onChange={(e) => update("relatedToolSlugs", e.target.checked ? [...form.relatedToolSlugs, tool.slug] : form.relatedToolSlugs.filter((slug) => slug !== tool.slug))} />{tool.name}</label>)}</div></section><Button className="w-full" disabled={saving} onClick={() => save("published")}><Send />Publicar</Button></div>
  </main>;
}
