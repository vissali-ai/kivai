"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, Eye, Save, Send } from "lucide-react";
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
  primarySourceUrl: "", originalContribution: "", relevanceScore: 0, reviewedBy: "", reviewedAt: null,
};

const editorialStageHelp: Partial<Record<PostInput["reviewStatus"], string>> = {
  collected: "Estado inicial criado pelo radar. A pauta ainda é apenas uma sugestão e continua invisível no blog.",
  selected: "Você decidiu que o assunto vale uma matéria, mas ainda não iniciou a apuração. Continua invisível no blog.",
  researching: "Use enquanto consulta fontes primárias, testa ferramentas e escreve sua versão original. Continua invisível no blog.",
  "awaiting-review": "O texto está pronto e aguarda a leitura final de uma pessoa. Ainda não pode ser publicado.",
  approved: "A revisão humana foi concluída. Esta etapa libera o botão de publicar somente quando todo o checklist também estiver completo.",
  rejected: "A sugestão foi descartada. Ela permanece fora do blog e não pode ser publicada enquanto estiver nesta etapa.",
};

function fromPost(post?: Post | null): PostInput {
  if (!post) return blank;
  const isUntouchedRssDraft = post.origin === "rss-agent"
    && post.generationModel === "source-only"
    && post.reviewStatus === "collected"
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

function scheduledLocalValue(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
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
  const editorialWordCount = useMemo(() => form.content.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").trim().split(/\s+/).filter(Boolean).length, [form.content]);
  const editorialChecks = form.origin === "rss-agent" ? [
    { label: "Fonte original coletada", ready: Boolean(form.sourceUrl) },
    { label: "Fonte primária em HTTPS", ready: /^https:\/\//i.test(form.primarySourceUrl) },
    { label: "Relevância editorial avaliada em 7 ou mais", ready: form.relevanceScore >= 7 },
    { label: "Contribuição original com pelo menos 160 caracteres", ready: form.originalContribution.trim().length >= 160 },
    { label: "Pelo menos uma ferramenta relacionada", ready: form.relatedToolSlugs.length > 0 },
    { label: "Texto editorial com pelo menos 600 palavras", ready: editorialWordCount >= 600 },
    { label: "Imagem de capa selecionada", ready: Boolean(form.coverMediaId) },
    { label: "Revisor humano identificado", ready: form.reviewedBy.trim().length >= 3 },
    { label: "Etapa marcada como aprovada", ready: form.reviewStatus === "approved" },
  ] : [];
  const editorialReady = editorialChecks.every((item) => item.ready);
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
    if ((status === "published" || status === "scheduled") && !preview) {
      router.push(`/admin/blog?status=${status}`);
      router.refresh();
      return;
    }
    if (!form.id) router.replace(`/admin/blog/${data.id}`);
    router.refresh();
  }
  const inputClass = "h-10";
  const primaryStatus: PostStatus = form.status === "scheduled" ? "scheduled" : "published";
  return <main className="min-w-0 max-w-full overflow-x-hidden"><header className="mb-6 flex min-w-0 flex-wrap items-end justify-between gap-4"><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Editor</p><h1 className="mt-1 text-3xl font-semibold">{form.id ? "Editar matéria" : "Nova matéria"}</h1><p className="mt-2 text-sm text-muted-foreground">O salvamento padrão mantém a matéria como rascunho.</p></div><div className="flex min-w-0 flex-wrap items-center gap-2"><span className={`text-xs ${message.includes("Erro") || message.includes("obrigatório") ? "text-red-400" : "text-muted-foreground"}`}>{message}</span><Button variant="outline" disabled={saving} onClick={() => save(post?.status === "published" ? "published" : "draft", true)}><Eye />Pré-visualizar</Button><Button variant="secondary" disabled={saving} onClick={() => save("draft")}><Save />Salvar rascunho</Button><Button disabled={saving || (form.origin === "rss-agent" && !editorialReady)} onClick={() => save(primaryStatus)}><Send />{primaryStatus === "scheduled" ? "Agendar publicação" : "Publicar"}</Button></div></header>
    {form.origin === "rss-agent" ? <div className="mb-5 border border-primary/30 bg-primary/10 p-4 text-sm"><strong>Pauta coletada pelo radar editorial.</strong><p className="mt-1 text-muted-foreground">Você está editando o mesmo registro da sugestão, não criando uma cópia. Ao substituir título, texto e demais campos, esta pauta se transforma na sua matéria; a URL coletada fica apenas como referência.</p><p className="mt-1 text-muted-foreground">A publicação exige pesquisa primária, contribuição original do Kivai e aprovação humana. O agente não escreve nem publica automaticamente.</p>{!editorialReady ? <p className="mt-2 font-medium text-amber-300">A publicação permanecerá bloqueada enquanto houver itens pendentes na revisão editorial.</p> : <p className="mt-2 font-medium text-emerald-300">Checklist editorial completo.</p>}</div> : null}
    <div className="min-w-0 space-y-5"><section className="min-w-0 space-y-4 border border-white/10 bg-card p-5"><h2 className="font-semibold">Conteúdo</h2><label className="block space-y-1.5 text-sm"><span>Título *</span><Input value={form.title} onChange={(e) => update("title", e.target.value)} className={inputClass} /></label><label className="block space-y-1.5 text-sm"><span>Subtítulo ou linha fina</span><Input value={form.subtitle} onChange={(e) => update("subtitle", e.target.value)} className={inputClass} /></label><label className="block space-y-1.5 text-sm"><span>Slug *</span><Input value={form.slug} onChange={(e) => update("slug", slugify(e.target.value))} className={inputClass} /></label><label className="block space-y-1.5 text-sm"><span>Resumo *</span><textarea value={form.excerpt} maxLength={320} onChange={(e) => update("excerpt", e.target.value)} className="min-h-24 w-full border border-input bg-background p-3 text-sm outline-none focus:border-ring" /><small className="text-muted-foreground">{form.excerpt.length}/320</small></label><div><span className="mb-1.5 block text-sm">Texto da matéria *</span><RichTextEditor value={form.content} onChange={(value) => update("content", value)} /></div></section>
      <section className="space-y-4 border border-white/10 bg-card p-5"><h2 className="font-semibold">Fonte editorial</h2><div className="grid gap-4 md:grid-cols-2"><label className="space-y-1.5 text-sm"><span>Fonte principal</span><Input value={form.sourceName} onChange={(e) => update("sourceName", e.target.value)} /></label><label className="space-y-1.5 text-sm"><span>URL da fonte</span><Input type="url" value={form.sourceUrl} onChange={(e) => update("sourceUrl", e.target.value)} /></label></div></section>
      {form.origin === "rss-agent" ? <section className="space-y-4 border border-primary/30 bg-primary/5 p-5"><div><h2 className="font-semibold">Revisão editorial obrigatória</h2><p className="mt-1 text-sm text-muted-foreground">A etapa editorial registra o andamento; ela não publica nada sozinha. Somente “Aprovada”, com todo o checklist completo, libera a ação separada de publicar ou agendar.</p></div><div className="grid gap-4 md:grid-cols-2"><label className="space-y-1.5 text-sm"><span>Etapa editorial</span><select value={form.reviewStatus} onChange={(e) => update("reviewStatus", e.target.value as PostInput["reviewStatus"])} className="h-10 w-full border border-input bg-background px-3"><option value="collected">1. Pauta coletada</option><option value="selected">2. Pauta selecionada</option><option value="researching">3. Em pesquisa e redação</option><option value="awaiting-review">4. Aguardando revisão final</option><option value="approved">5. Aprovada para publicação</option><option value="rejected">Descartada</option></select><small className="block leading-5 text-muted-foreground">{editorialStageHelp[form.reviewStatus]}</small></label><label className="space-y-1.5 text-sm"><span>Relevância para o Kivai (0–12)</span><Input type="number" min={0} max={12} value={form.relevanceScore} onChange={(e) => update("relevanceScore", Math.min(12, Math.max(0, Number(e.target.value))))} /><small className="block leading-5 text-muted-foreground">O radar sugere de 0 a 6. Após analisar, use 7 ou mais somente se o assunto tiver ligação direta e útil com as ferramentas ou o público do Kivai.</small></label></div><label className="block space-y-1.5 text-sm"><span>URL da fonte primária *</span><Input type="url" value={form.primarySourceUrl} onChange={(e) => update("primarySourceUrl", e.target.value)} placeholder="Documentação, comunicado ou estudo original em HTTPS" /><small className="block leading-5 text-muted-foreground">Cole a fonte original da informação: documentação oficial, comunicado da empresa, pesquisa ou estudo. Evite usar como fonte primária o portal que apenas repercutiu a notícia.</small></label><label className="block space-y-1.5 text-sm"><span>Contribuição original do Kivai *</span><textarea value={form.originalContribution} onChange={(e) => update("originalContribution", e.target.value)} className="min-h-28 w-full border border-input bg-background p-3 text-sm" placeholder="Explique o teste, comparação, tutorial, checklist ou análise prática acrescentada pelo Kivai." /><small className="block leading-5 text-muted-foreground">Registre o que sua matéria acrescenta além das fontes: teste próprio, exemplos, comparação, passo a passo, opinião técnica ou aplicação prática. {form.originalContribution.trim().length}/160 caracteres mínimos.</small></label><label className="block space-y-1.5 text-sm"><span>Revisor humano *</span><Input value={form.reviewedBy} onChange={(e) => update("reviewedBy", e.target.value)} placeholder="Seu nome ou o nome de quem fez a revisão final" /><small className="block leading-5 text-muted-foreground">Preencha somente depois de conferir fatos, links, originalidade, clareza e ortografia. Pode ser você, desde que faça uma leitura final consciente.</small>{form.reviewedAt ? <small className="block text-muted-foreground">Aprovado em {new Date(form.reviewedAt).toLocaleString("pt-BR")}</small> : null}</label><div className="border border-white/10 bg-background/50 p-4"><p className="text-sm font-medium">Checklist para publicar</p><ul className="mt-3 grid gap-2 sm:grid-cols-2">{editorialChecks.map((item) => <li key={item.label} className={`flex items-start gap-2 text-xs ${item.ready ? "text-emerald-300" : "text-muted-foreground"}`}>{item.ready ? <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" /> : <Circle className="mt-0.5 size-3.5 shrink-0" />}{item.label}</li>)}</ul><p className="mt-3 text-xs text-muted-foreground">Contagem atual: {editorialWordCount} palavras.</p></div></section> : null}
      <section className="space-y-4 border border-white/10 bg-card p-5"><h2 className="font-semibold">SEO</h2><label className="block space-y-1.5 text-sm"><span>SEO Title</span><Input value={form.seoTitle} maxLength={70} onChange={(e) => update("seoTitle", e.target.value)} /><small className="text-muted-foreground">{form.seoTitle.length}/60 recomendado. Vazio usa o título.</small></label><label className="block space-y-1.5 text-sm"><span>Meta Description</span><textarea value={form.metaDescription} maxLength={180} onChange={(e) => update("metaDescription", e.target.value)} className="min-h-20 w-full border border-input bg-background p-3 text-sm" /><small className="text-muted-foreground">{form.metaDescription.length}/160 recomendado</small></label><label className="block space-y-1.5 text-sm"><span>Canonical</span><Input type="url" value={form.canonicalUrl} onChange={(e) => update("canonicalUrl", e.target.value)} placeholder="Vazio usa a URL da matéria" /></label><div className="grid gap-4 md:grid-cols-2"><label className="space-y-1.5 text-sm"><span>OG Title</span><Input value={form.ogTitle} onChange={(e) => update("ogTitle", e.target.value)} /></label><label className="space-y-1.5 text-sm"><span>OG Image</span><Input type="url" value={form.ogImage} onChange={(e) => update("ogImage", e.target.value)} /></label></div><label className="block space-y-1.5 text-sm"><span>OG Description</span><textarea value={form.ogDescription} onChange={(e) => update("ogDescription", e.target.value)} className="min-h-20 w-full border border-input bg-background p-3 text-sm" /></label></section>
      <section className="space-y-4 border border-white/10 bg-card p-5"><h2 className="font-semibold">Publicação</h2><label className="block space-y-1.5 text-sm"><span>Status</span><select value={form.status} onChange={(e) => update("status", e.target.value as PostStatus)} className="h-10 w-full border border-input bg-background px-3"><option value="draft">Rascunho</option><option value="published">Publicada</option><option value="scheduled">Agendada</option><option value="archived">Arquivada</option></select></label>{form.status === "scheduled" ? <label className="block space-y-1.5 text-sm"><span>Publicar em</span><Input type="datetime-local" value={scheduledLocalValue(form.scheduledAt)} onChange={(e) => update("scheduledAt", e.target.value ? new Date(e.target.value).toISOString() : null)} /><small className="text-muted-foreground">Horário de Brasília</small></label> : null}<label className="block space-y-1.5 text-sm"><span>Autor *</span><Input value={form.author} onChange={(e) => update("author", e.target.value)} /></label><label className="block space-y-1.5 text-sm"><span>Categoria</span><select value={form.categoryId ?? ""} onChange={(e) => update("categoryId", e.target.value || null)} className="h-10 w-full border border-input bg-background px-3"><option value="">Sem categoria</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label className="block space-y-1.5 text-sm"><span>Tags</span><Input value={tagText} onChange={(e) => setTagText(e.target.value)} placeholder="Google, Gemini, Android" /><small className="text-muted-foreground">Separe por vírgulas.</small></label></section>
      <section className="space-y-4 border border-white/10 bg-card p-5"><h2 className="font-semibold">Foto da matéria</h2><CoverImageUpload media={cover} onUploaded={(media) => { setCover(media); setForm((current) => ({ ...current, coverMediaId: media.id, coverAlt: current.coverAlt || media.alt, coverCaption: current.coverCaption || media.caption, coverCredit: current.coverCredit || media.credit, coverSource: current.coverSource || media.source, coverSourceUrl: current.coverSourceUrl || media.sourceUrl, needsCover: false })); }} /><label className="block space-y-1.5 text-sm"><span>Texto alternativo</span><Input value={form.coverAlt} onChange={(e) => update("coverAlt", e.target.value)} placeholder="Descreva brevemente o que aparece na foto" /></label><label className="block space-y-1.5 text-sm"><span>Legenda</span><Input value={form.coverCaption} onChange={(e) => update("coverCaption", e.target.value)} /></label><label className="block space-y-1.5 text-sm"><span>Crédito</span><Input value={form.coverCredit} onChange={(e) => update("coverCredit", e.target.value)} /></label><label className="block space-y-1.5 text-sm"><span>Origem</span><Input value={form.coverSource} onChange={(e) => update("coverSource", e.target.value)} /></label><label className="block space-y-1.5 text-sm"><span>URL da origem</span><Input type="url" value={form.coverSourceUrl} onChange={(e) => update("coverSourceUrl", e.target.value)} /></label></section>
      <section className="space-y-3 border border-white/10 bg-card p-5"><h2 className="font-semibold">Ferramentas relacionadas</h2><div className="max-h-64 space-y-2 overflow-auto">{sortedTools.map((tool) => <label key={tool.slug} className="flex items-center gap-2 text-xs"><input type="checkbox" checked={form.relatedToolSlugs.includes(tool.slug)} onChange={(e) => update("relatedToolSlugs", e.target.checked ? [...form.relatedToolSlugs, tool.slug] : form.relatedToolSlugs.filter((slug) => slug !== tool.slug))} />{tool.name}</label>)}</div></section><Button className="w-full" disabled={saving || (form.origin === "rss-agent" && !editorialReady)} onClick={() => save(primaryStatus)}><Send />{primaryStatus === "scheduled" ? "Agendar publicação" : "Publicar"}</Button></div>
  </main>;
}
