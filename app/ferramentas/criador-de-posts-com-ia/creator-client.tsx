"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { AiCreditBalance } from "@/components/tools/ai-credit-balance";
import { SavedProjects } from "@/components/account/saved-projects";
import { getStoredSession } from "@/lib/user-auth";
import { initialPostProject, POST_CREDIT_COST, postBriefSchema, postContentSchema, postFormats, postPlatforms, postProjectSchema, type PostContent, type PostProject } from "@/lib/post-creator/schema";
import { downloadPostFile, optimizePostImage, renderPost } from "@/lib/post-creator/canvas";
import { sendPostToPreview } from "@/lib/post-creator/handoff";

const inputClass = "mt-1 block min-h-11 w-full min-w-0 rounded-lg border border-border bg-background px-3 py-2 text-sm";
const sectionClass = "space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-6";
export default function CreatorClient() {
  const router = useRouter();
  const [project, setProject] = useState<PostProject>(initialPostProject);
  const [consent, setConsent] = useState(false), [busy, setBusy] = useState<"content" | "">("");
  const [error, setError] = useState(""), [notice, setNotice] = useState("");
  const [content, setContent] = useState<PostContent | null>(null);
  const [rendered, setRendered] = useState<PostProject | null>(null), [processing, setProcessing] = useState(false);
  const requestLock = useRef(false), canvasRef = useRef<HTMLCanvasElement>(null);
  const update = <K extends keyof PostProject>(key: K, value: PostProject[K]) => setProject(current => ({ ...current, [key]: value }));
  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => { void renderPost(project).then(canvas => {
      if (!active || !canvasRef.current) return;
      const target = canvasRef.current; target.width = canvas.width; target.height = canvas.height;
      target.getContext("2d")?.drawImage(canvas, 0, 0); setRendered(project);
    }).catch(() => { if (active) { setError("Não foi possível desenhar a imagem. Remova ou substitua a imagem enviada."); } }); }, 150);
    return () => { active = false; window.clearTimeout(timer); };
  }, [project]);
  const exportReady = rendered === project && !processing;
  async function generate() {
    if (requestLock.current || !consent) return;
    const token = getStoredSession()?.access_token;
    if (!token) { setError("Entre na sua conta para gerar com IA."); return; }
    if (!postBriefSchema.safeParse(project.brief).success) { setError("Descreva o tema com pelo menos 5 caracteres."); return; }
    requestLock.current = true; setBusy("content"); setError(""); setNotice("");
    try {
      const response = await fetch("/api/ai/post-creator", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(65_000), body: JSON.stringify({ action: "content", consent, brief: project.brief }) });
      const result = await response.json();
      if (!response.ok) throw Error(result.error || "Não foi possível gerar. Consulte o saldo e tente novamente.");
      setContent(postContentSchema.parse(result.content));
      setNotice("Conteúdo pronto. Revise antes de aplicar à sua arte.");
    } catch (cause) { setError(cause instanceof Error && cause.name !== "TimeoutError" ? cause.message : "A conexão demorou demais. Consulte o saldo antes de tentar novamente."); }
    finally { requestLock.current = false; setBusy(""); window.dispatchEvent(new Event("kivai:ai-credit-update")); }
  }
  async function upload(file: File | undefined, key: "image" | "logo") {
    if (!file) return; setProcessing(true); setError("");
    try { update(key, await optimizePostImage(file, key === "logo")); setNotice("Imagem preparada para o editor e para salvar na conta."); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível abrir a imagem."); }
    finally { setProcessing(false); }
  }
  async function downloadPng() {
    if (!exportReady || !canvasRef.current) return;
    const blob = await new Promise<Blob | null>(resolve => canvasRef.current!.toBlob(resolve, "image/png"));
    if (!blob) { setError("Falha ao preparar o PNG. Tente novamente."); return; }
    downloadPostFile(blob, "post-kivai.png"); setNotice("Download da arte iniciado. A legenda pode ser copiada separadamente.");
  }
  function preview() {
    if (!exportReady || !canvasRef.current) return;
    try {
      sendPostToPreview({ image: canvasRef.current.toDataURL("image/jpeg", 0.85), caption: project.caption, platform: project.brief.platform, format: project.format });
      router.push("/ferramentas/preview-de-post-redes-sociais?from=criador");
    } catch { setError("Não foi possível transferir a arte. Baixe o PNG e envie manualmente ao Preview."); }
  }
  function loadProject(value: unknown) {
    // The account library exports a wrapper; the editor exports the payload itself.
    const payload = value && typeof value === "object" && "kind" in value && value.kind === "post_creator" && "payload" in value ? value.payload : value;
    const parsed = postProjectSchema.safeParse(payload);
    if (!parsed.success) { setError("Este arquivo não é um projeto válido do Criador de Posts."); return; }
    setProject(parsed.data); setContent(null); setError(""); setNotice("Projeto aberto. Revise a arte antes de exportar.");
  }
  async function importProject(file: File | undefined) {
    if (!file) return;
    if (file.size > 512000) { setError("O arquivo de projeto deve ter até 500 KB."); return; }
    if (!window.confirm("Abrir este projeto substituirá a arte atual. Você já salvou o que deseja manter?")) return;
    try { loadProject(JSON.parse(await file.text())); } catch { setError("Não foi possível ler o arquivo de projeto."); }
  }
  return <div className="space-y-6">
    <div className="flex flex-wrap gap-2 text-sm"><a href="#briefing-post" className="rounded-lg border px-3 py-3">1. Criar conteúdo</a><a href="#editar-post" className="rounded-lg border px-3 py-3">2. Editar arte</a><a href="#salvar-post" className="rounded-lg border px-3 py-3">3. Salvar e visualizar</a></div>
    <AiCreditBalance />
    <section id="briefing-post" className={`${sectionClass} scroll-mt-24`} aria-labelledby="brief-title">
      <h2 id="brief-title" className="text-xl font-semibold">1. Conte o que você quer publicar</h2>
      <p className="text-sm text-muted-foreground">A IA sugere título, legenda, chamada para ação, hashtags e roteiro de carrossel. Você revisa tudo antes de usar. A arte continua sendo montada manualmente no editor.</p>
      <fieldset disabled={Boolean(busy)} className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm sm:col-span-2">Tema ou briefing<textarea rows={3} maxLength={1500} className={inputClass} value={project.brief.theme} onChange={e => update("brief", { ...project.brief, theme: e.target.value })} placeholder="Ex.: divulgar uma cafeteria com opções de café da manhã" /></label>
        <label className="text-sm">Público<input maxLength={300} className={inputClass} value={project.brief.audience} onChange={e => update("brief", { ...project.brief, audience: e.target.value })} placeholder="Quem você quer alcançar?" /></label>
        <label className="text-sm">Objetivo<input maxLength={200} className={inputClass} value={project.brief.objective} onChange={e => update("brief", { ...project.brief, objective: e.target.value })} /></label>
        <label className="text-sm">Rede social<select className={inputClass} value={project.brief.platform} onChange={e => update("brief", { ...project.brief, platform: e.target.value as PostProject["brief"]["platform"] })}>{postPlatforms.map(p => <option key={p}>{p}</option>)}</select></label>
        <label className="text-sm">Tom de voz<input maxLength={100} className={inputClass} value={project.brief.tone} onChange={e => update("brief", { ...project.brief, tone: e.target.value })} /></label>
      </fieldset>
      <label className="flex items-start gap-3 text-sm"><input type="checkbox" className="mt-1 size-5 shrink-0" checked={consent} onChange={e => setConsent(e.target.checked)} />Autorizo enviar o briefing ao serviço externo de IA. Não incluí informações pessoais ou confidenciais.</label>
      <p className="text-xs text-muted-foreground">Conteúdo: {POST_CREDIT_COST.content} crédito por geração. Os créditos são reservados durante o pedido e devolvidos se a geração falhar. Editar, salvar, visualizar e baixar não consome créditos. O provedor gratuito pode usar dados para melhorar seus produtos.</p>
      <div className="flex flex-wrap gap-3"><Button disabled={!consent || Boolean(busy)} onClick={() => void generate()}>{busy === "content" ? "Gerando conteúdo…" : "Gerar conteúdo · 1 crédito"}</Button><Link className="inline-flex min-h-11 items-center text-sm underline" href="/conta">Minha conta</Link></div>
      {content ? <div className="space-y-3 rounded-xl border border-primary/30 p-4"><h3 className="font-semibold">Sugestão da IA</h3><p className="font-medium">{content.title}</p><p className="whitespace-pre-wrap break-words text-sm">{content.caption}</p><p className="break-words text-sm text-muted-foreground">{content.hashtags.join(" ")}</p><Button variant="outline" onClick={() => { setProject(p => ({ ...p, title: content.title, subtitle: content.subtitle, cta: content.cta, caption: [content.caption, content.hashtags.join(" ")].filter(Boolean).join("\n\n").slice(0, 4000), slides: content.slides })); setNotice("Conteúdo aplicado à arte. Você pode editar todos os textos abaixo."); }}>Aplicar conteúdo à arte</Button><p className="text-xs text-muted-foreground">Aplicar substitui os textos atuais, preservando sua imagem e identidade visual.</p></div> : null}
    </section>
    {error ? <p role="alert" className="rounded-xl border border-destructive/40 p-4 text-sm">{error}</p> : null}
    {notice ? <p role="status" className="rounded-xl border border-primary/30 p-4 text-sm">{notice}</p> : null}
    <section id="editar-post" className="scroll-mt-24 space-y-4" aria-labelledby="editor-title">
      <h2 id="editor-title" className="text-xl font-semibold">2. Personalize sua arte</h2>
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <div className={sectionClass}>
          <label className="block text-sm">Formato<select className={inputClass} value={project.format} onChange={e => update("format", e.target.value as PostProject["format"])}>{Object.entries(postFormats).map(([key, f]) => <option key={key} value={key}>{f.label} · {f.width} × {f.height}</option>)}</select></label>
          <label className="block text-sm">Título da arte<textarea className={inputClass} rows={2} maxLength={140} value={project.title} onChange={e => update("title", e.target.value)} /></label>
          <label className="block text-sm">Texto de apoio<textarea className={inputClass} rows={3} maxLength={260} value={project.subtitle} onChange={e => update("subtitle", e.target.value)} /></label>
          <label className="block text-sm">Chamada para ação<input className={inputClass} maxLength={90} value={project.cta} onChange={e => update("cta", e.target.value)} /></label>
          <div className="grid grid-cols-3 gap-3">{([['background', 'Fundo'], ['foreground', 'Texto'], ['accent', 'Destaque']] as const).map(([key, label]) => <label key={key} className="text-sm">{label}<input type="color" className="mt-1 block h-11 w-full" value={project[key]} onChange={e => update(key, e.target.value)} /></label>)}</div>
          <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm">Posição do texto<select className={inputClass} value={project.position} onChange={e => update("position", e.target.value as PostProject["position"])}><option value="top">Topo</option><option value="center">Centro</option><option value="bottom">Base</option></select></label><label className="text-sm">Fonte<select className={inputClass} value={project.font} onChange={e => update("font", e.target.value as PostProject["font"])}><option value="sans">Moderna</option><option value="serif">Clássica</option></select></label></div>
          <label className="block text-sm">Imagem própria<input type="file" accept="image/jpeg,image/png,image/webp" disabled={processing} className={inputClass} onChange={e => { void upload(e.target.files?.[0], "image"); e.target.value = ""; }} /></label>
          <label className="block text-sm">Logotipo<input type="file" accept="image/jpeg,image/png,image/webp" disabled={processing} className={inputClass} onChange={e => { void upload(e.target.files?.[0], "logo"); e.target.value = ""; }} /></label>
          <p className="text-xs text-muted-foreground">JPG, PNG ou WebP até 12 MB. Imagens são otimizadas localmente para permitir salvar o projeto; arquivos próprios e logotipos não são enviados à IA.</p>
          <div className="flex flex-wrap gap-2">{project.image ? <Button variant="outline" onClick={() => update("image", "")}>Remover imagem</Button> : null}{project.logo ? <Button variant="outline" onClick={() => update("logo", "")}>Remover logotipo</Button> : null}</div>
          {project.image ? <label className="block text-sm">Escurecer fundo: {project.overlay}%<input className="mt-2 w-full" type="range" min={0} max={85} value={project.overlay} onChange={e => update("overlay", Number(e.target.value))} /></label> : null}
        </div>
        <div className="space-y-4 lg:sticky lg:top-24"><div className="overflow-hidden rounded-xl border bg-muted"><canvas ref={canvasRef} aria-label="Prévia da arte do post" className="mx-auto h-auto w-full" style={{ aspectRatio: `${postFormats[project.format].width}/${postFormats[project.format].height}` }} /></div><p className="text-xs text-muted-foreground">Confira contraste e legibilidade. O PNG inclui somente a arte; a legenda é copiada separadamente. Imagens são enquadradas ao centro.</p><Button disabled={!exportReady} onClick={() => void downloadPng()}>Baixar arte em PNG</Button></div>
      </div>
      <div className={sectionClass}><label className="block text-sm font-medium">Legenda para publicar<textarea className={inputClass} rows={6} maxLength={4000} value={project.caption} onChange={e => update("caption", e.target.value)} /></label><Button variant="outline" disabled={!project.caption} onClick={() => { void navigator.clipboard.writeText(project.caption).then(() => setNotice("Legenda copiada."), () => setError("Não foi possível copiar. Selecione o texto e copie manualmente.")); }}>Copiar legenda</Button></div>
      {project.slides.length ? <details className={sectionClass}><summary className="cursor-pointer font-semibold">Roteiro de carrossel · {project.slides.length} slides</summary><p className="text-sm text-muted-foreground">Aplique um slide, ajuste e baixe sua arte. O fundo e o logotipo são reutilizados; cada PNG contém apenas o slide aplicado.</p>{project.slides.map((slide, i) => <div key={i} className="space-y-2 border-t pt-3"><p className="font-medium">{i + 1}. {slide.title}</p><p className="text-sm">{slide.body}</p><Button variant="outline" onClick={() => setProject(p => ({ ...p, title: slide.title, subtitle: slide.body }))}>Aplicar slide {i + 1}</Button></div>)}</details> : null}
    </section>
    <section id="salvar-post" className={`${sectionClass} scroll-mt-24`} aria-labelledby="save-title"><h2 id="save-title" className="text-xl font-semibold">3. Salve e confira antes de publicar</h2><div className="flex flex-wrap gap-3"><Button disabled={!exportReady} onClick={preview}>Visualizar no Preview</Button><Button variant="outline" onClick={() => downloadPostFile(new Blob([JSON.stringify(project)], { type: "application/json" }), "projeto-post-kivai.json")}>Baixar projeto editável</Button></div><label className="block text-sm">Abrir projeto do dispositivo<input type="file" accept="application/json,.json" className={inputClass} onChange={e => { void importProject(e.target.files?.[0]); e.target.value = ""; }} /></label><p className="text-xs text-muted-foreground">Salve antes de sair. O projeto inclui a imagem otimizada e o logotipo. O Kivai não publica automaticamente nas redes sociais.</p><SavedProjects kind="post_creator" payload={project} onLoad={loadProject} /></section>
  </div>;
}
