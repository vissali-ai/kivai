"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { AiCreditBalance } from "@/components/tools/ai-credit-balance";
import { SavedProjects } from "@/components/account/saved-projects";
import { getStoredSession } from "@/lib/user-auth";
import { initialPostProject, POST_CREDIT_COST, postBriefSchema, postContentSchema, postPlatforms, postProjectSchema, type PostProject } from "@/lib/post-creator/schema";

const inputClass = "mt-1 block min-h-11 w-full min-w-0 rounded-lg border border-border bg-background px-3 py-2 text-sm";
const sectionClass = "space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-6";
export default function CreatorClient() {
  const [project, setProject] = useState<PostProject>(initialPostProject);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const lock = useRef(false);
  const update = <K extends keyof PostProject>(key: K, value: PostProject[K]) => setProject(current => ({ ...current, [key]: value }));

  async function generate() {
    if (lock.current) return;
    const token = getStoredSession()?.access_token;
    if (!token) { setError("Entre na sua conta para gerar conteúdo com IA."); return; }
    if (!postBriefSchema.safeParse(project.brief).success) { setError("Descreva o tema com pelo menos 5 caracteres."); return; }
    lock.current = true; setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/ai/post-creator", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(65_000),
        body: JSON.stringify({ action: "content", consent: true, brief: project.brief }),
      });
      const result = await response.json();
      if (!response.ok) throw Error(result.error || "Não foi possível gerar conteúdo.");
      const generated = postContentSchema.parse(result.content);
      setProject(current => ({
        ...current,
        title: generated.title,
        subtitle: generated.subtitle,
        caption: [generated.caption, generated.hashtags.join(" ")].filter(Boolean).join("\n\n").slice(0, 4000),
        cta: generated.cta,
        slides: generated.slides,
      }));
      setNotice("Conteúdo gerado. Revise e ajuste os textos antes de publicar.");
    } catch (cause) {
      setError(cause instanceof Error && cause.name !== "TimeoutError" ? cause.message : "A conexão demorou demais. Consulte seu saldo antes de tentar novamente.");
    } finally {
      lock.current = false; setBusy(false);
      window.dispatchEvent(new Event("kivai:ai-credit-update"));
    }
  }
  async function copy(text: string) {
    if (!text.trim()) return;
    try { await navigator.clipboard.writeText(text); setNotice("Texto copiado."); setError(""); }
    catch { setError("Não foi possível copiar. Selecione o texto e copie manualmente."); }
  }
  function loadProject(value: unknown) {
    const payload = value && typeof value === "object" && "kind" in value && value.kind === "post_creator" && "payload" in value ? value.payload : value;
    const parsed = postProjectSchema.safeParse(payload);
    if (!parsed.success) { setError("Este projeto não é válido."); return; }
    setProject(parsed.data); setError(""); setNotice("Projeto aberto. Revise o conteúdo antes de publicar.");
  }
  return <div className="space-y-6">
    <AiCreditBalance />
    <section className={sectionClass} aria-labelledby="brief-title">
      <h2 id="brief-title" className="text-xl font-semibold">Conte o que você quer publicar</h2>
      <p className="text-sm text-muted-foreground">Gere título, legenda, chamada para ação, hashtags e roteiro de carrossel com IA.</p>
      <fieldset disabled={busy} className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm sm:col-span-2">Tema ou briefing<textarea rows={3} maxLength={1500} className={inputClass} value={project.brief.theme} onChange={e => update("brief", { ...project.brief, theme: e.target.value })} placeholder="Ex.: divulgar uma cafeteria com opções de café da manhã" /></label>
        <label className="text-sm">Público<input maxLength={300} className={inputClass} value={project.brief.audience} onChange={e => update("brief", { ...project.brief, audience: e.target.value })} /></label>
        <label className="text-sm">Objetivo<input maxLength={200} className={inputClass} value={project.brief.objective} onChange={e => update("brief", { ...project.brief, objective: e.target.value })} /></label>
        <label className="text-sm">Rede social<select className={inputClass} value={project.brief.platform} onChange={e => update("brief", { ...project.brief, platform: e.target.value as PostProject["brief"]["platform"] })}>{postPlatforms.map(p => <option key={p}>{p}</option>)}</select></label>
        <label className="text-sm">Tom de voz<input maxLength={100} className={inputClass} value={project.brief.tone} onChange={e => update("brief", { ...project.brief, tone: e.target.value })} /></label>
      </fieldset>
      <p className="text-sm text-muted-foreground">Ao clicar em Gerar conteúdo, seu briefing será enviado a um provedor externo de IA. Não inclua informações pessoais ou confidenciais.</p>
      <p className="text-xs text-muted-foreground">Cada geração custa {POST_CREDIT_COST.content} crédito. Se a geração falhar, o crédito reservado é devolvido. Revisar, copiar e salvar não consome créditos adicionais.</p>
      <div className="flex flex-wrap gap-3"><Button disabled={busy} onClick={() => void generate()}>{busy ? "Gerando conteúdo…" : "Gerar conteúdo · 1 crédito"}</Button><Link className="inline-flex min-h-11 items-center text-sm underline" href="/conta">Minha conta</Link></div>
    </section>
    {error && <p role="alert" className="rounded-xl border border-destructive/40 p-4 text-sm">{error}</p>}
    {notice && <p role="status" className="rounded-xl border border-primary/30 p-4 text-sm">{notice}</p>}
    <section className={sectionClass} aria-labelledby="content-title">
      <h2 id="content-title" className="text-xl font-semibold">Revise o conteúdo</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm">Título<input maxLength={140} className={inputClass} value={project.title} onChange={e => update("title", e.target.value)} /></label>
        <label className="text-sm">Chamada para ação<input maxLength={90} className={inputClass} value={project.cta} onChange={e => update("cta", e.target.value)} /></label>
        <label className="text-sm sm:col-span-2">Texto de apoio<textarea rows={2} maxLength={260} className={inputClass} value={project.subtitle} onChange={e => update("subtitle", e.target.value)} /></label>
        <label className="text-sm sm:col-span-2">Legenda e hashtags<textarea rows={8} maxLength={4000} className={inputClass} value={project.caption} onChange={e => update("caption", e.target.value)} /></label>
      </div>
      <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => void copy(project.caption)} disabled={!project.caption}>Copiar legenda</Button><Button variant="outline" onClick={() => void copy([project.title, project.subtitle, project.cta].filter(Boolean).join("\n"))}>Copiar título e chamada</Button></div>
      {project.slides.length > 0 && <details className="rounded-lg border border-border p-4"><summary className="cursor-pointer font-semibold">Roteiro de carrossel · {project.slides.length} slides</summary><div className="mt-4 space-y-4">{project.slides.map((slide,i)=><div key={i} className="space-y-2 border-t border-border pt-3"><label className="block text-sm">Slide {i+1} · Título<input maxLength={140} className={inputClass} value={slide.title} onChange={e=>update("slides",project.slides.map((item,j)=>j===i?{...item,title:e.target.value}:item))}/></label><label className="block text-sm">Texto<textarea rows={2} maxLength={260} className={inputClass} value={slide.body} onChange={e=>update("slides",project.slides.map((item,j)=>j===i?{...item,body:e.target.value}:item))}/></label><Button variant="outline" onClick={()=>void copy([slide.title,slide.body].join("\n"))}>Copiar slide {i+1}</Button></div>)}</div></details>}
    </section>
    <SavedProjects kind="post_creator" payload={project} onLoad={loadProject} />
  </div>;
}
