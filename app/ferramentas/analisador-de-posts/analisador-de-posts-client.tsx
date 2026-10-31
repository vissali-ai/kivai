"use client";
import { SavedProjects } from "@/components/account/saved-projects";

import { useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clipboard, ExternalLink, FileImage, Info, RotateCcw, Sparkles, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AiCreditBalance } from "@/components/tools/ai-credit-balance";
import { getStoredSession } from "@/lib/user-auth";
import type { PostAnalyzerOutput } from "@/lib/ai/post-analyzer";

type Frame = { mimeType: "image/jpeg"; data: string };
type Report = {
  result: PostAnalyzerOutput;
  source: string;
  network: string;
  cost: number;
  covered: { description: boolean; title: boolean; visuals: boolean; audio: boolean; videoFull: boolean };
  limitations: string[];
};

const downloads: Record<string, { url: string; label: string }> = {
  instagram: { url: "/ferramentas/baixar-video-instagram", label: "Baixar foto ou vídeo do Instagram" },
  tiktok: { url: "/ferramentas/baixar-video-tiktok", label: "Baixar vídeo do TikTok" },
};
function networkFromUrl(input: string) {
  try {
    const h = new URL(input).hostname.toLowerCase();
    for (const name of ["instagram", "tiktok", "youtube", "youtu.be", "facebook", "linkedin", "threads", "pinterest", "twitter", "x.com"]) {
      if (h === name || h === "www." + name || h.endsWith("." + name) || h === name + ".com" || h.endsWith("." + name + ".com")) return name === "youtu.be" ? "youtube" : name;
    }
  } catch { /* invalid link is validated on the server */ }
  return "";
}

async function toJpeg(file: Blob): Promise<Frame> {
  const bitmap = await createImageBitmap(file);
  try {
    const factor = Math.min(1, 720 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * factor));
    canvas.height = Math.max(1, Math.round(bitmap.height * factor));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw Error("Seu navegador não conseguiu processar a imagem.");
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    let data = canvas.toDataURL("image/jpeg", 0.58).split(",")[1];
    if (data.length > 340_000) {
      const small = document.createElement("canvas");
      small.width = Math.max(1, Math.round(canvas.width * 0.7));
      small.height = Math.max(1, Math.round(canvas.height * 0.7));
      small.getContext("2d")?.drawImage(canvas, 0, 0, small.width, small.height);
      data = small.toDataURL("image/jpeg", 0.4).split(",")[1];
    }
    if (data.length > 340_000) throw Error("A imagem é muito complexa. Envie uma versão menor.");
    return { mimeType: "image/jpeg", data };
  } finally { bitmap.close(); }
}

async function framesFromVideo(file: File): Promise<Frame[]> {
  const video = document.createElement("video");
  const objectUrl = URL.createObjectURL(file);
  video.preload = "auto";
  video.muted = true;
  video.playsInline = true;
  try {
    await new Promise<void>((resolve, reject) => {
      const timer = window.setTimeout(() => reject(Error("Não foi possível abrir o vídeo.")), 12000);
      video.onloadedmetadata = () => { clearTimeout(timer); resolve(); };
      video.onerror = () => { clearTimeout(timer); reject(Error("Formato de vídeo incompatível com este navegador.")); };
      video.src = objectUrl;
    });
    if (!Number.isFinite(video.duration) || video.duration <= 0) throw Error("Duração do vídeo indisponível.");
    const frames: Frame[] = [];
    for (const fraction of [0.1, 0.5, 0.9]) {
      await new Promise<void>((resolve, reject) => {
        const timer = window.setTimeout(() => reject(Error("Não foi possível ler os quadros do vídeo.")), 12000);
        video.onseeked = () => { clearTimeout(timer); resolve(); };
        video.onerror = () => { clearTimeout(timer); reject(Error("Erro ao acessar o vídeo.")); };
        video.currentTime = Math.min(video.duration - 0.01, Math.max(0, video.duration * fraction));
      });
      const factor = Math.min(1, 720 / Math.max(video.videoWidth, video.videoHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(video.videoWidth * factor));
      canvas.height = Math.max(1, Math.round(video.videoHeight * factor));
      const ctx = canvas.getContext("2d");
      if (!ctx) throw Error("Seu navegador não conseguiu capturar os quadros.");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const data = canvas.toDataURL("image/jpeg", 0.52).split(",")[1];
      if (data.length > 340_000) throw Error("Quadro muito grande para a análise. Reduza a resolução.");
      frames.push({ mimeType: "image/jpeg", data });
    }
    return frames;
  } finally {
    video.pause(); video.removeAttribute("src"); video.load(); URL.revokeObjectURL(objectUrl);
  }
}

function reportText(r: Report) {
  const x = r.result;
  return ["ANALISADOR DE POSTS | KIVAI", "", "Diagnóstico", x.summary, "",
    "Pontos fortes", ...x.strengths.map(v => "- " + v), "",
    "Melhorias", ...x.issues.map(v => "- " + v.problem + ": " + v.why + " | Ajuste: " + v.fix), "",
    "Legenda otimizada", x.improvedCaption, "", "Ganchos", ...x.hooks.map(v => "- " + v), "",
    "CTA", x.cta, "", "Sugestões de edição", ...x.visualEdits.map(v => "- " + v), "",
    "Próximas ações", ...x.nextSteps.map(v => "- " + v), "",
    "Limitações", ...r.limitations.map(v => "- " + v)].join("\n");
}

export default function AnalisadorDePostsClient() {
  const [status, setStatus] = useState<"published" | "draft">("published");
  const [url, setUrl] = useState("");
  const [objective, setObjective] = useState("engajamento");
  const [audience, setAudience] = useState("");
  const [caption, setCaption] = useState("");
  const [showCaption, setShowCaption] = useState(false);
  const [skipFile, setSkipFile] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [report, setReport] = useState<Report | null>(null);
  const [feedback, setFeedback] = useState("");
  const lock = useRef(false);
  const network = networkFromUrl(url);
  const downloadable = downloads[network];

  function reset() {
    setUrl(""); setFiles([]); setCaption(""); setShowCaption(false); setError(""); setReport(null);
    setSkipFile(false); setAudience(""); setFeedback("");
  }
  function pickFiles(selected: FileList | null) {
    if (!selected) return;
    const next = Array.from(selected);
    if (next.length > 8 || (next.length > 1 && next.some(f => f.type.startsWith("video/")))) {
      setError("Envie até oito imagens ou um vídeo por análise."); return;
    }
    if (next.some(f => f.size > 40 * 1024 * 1024)) { setError("O limite por arquivo é 40 MB."); return; }
    if (next.some(f => !["image/jpeg", "image/png", "image/webp", "video/mp4", "video/quicktime", "video/webm"].includes(f.type))) {
      setError("Formatos permitidos: JPG, PNG, WebP, MP4, MOV e WebM."); return;
    }
    setFiles(next); setSkipFile(false); setError(""); setReport(null);
  }

  async function analyze(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current) return;
    const session = getStoredSession();
    if (!session?.access_token) { setError("Entre na sua conta para usar a IA."); return; }
    lock.current = true; setLoading(true); setError(""); setReport(null); setFeedback("");
    try {
      const images: Frame[] = [];
      let videoFrames = false;
      if (!skipFile && files.length) {
        if (files[0].type.startsWith("video/")) {
          videoFrames = true;
          images.push(...await framesFromVideo(files[0]));
        } else {
          for (const file of files) images.push(await toJpeg(file));
        }
      }
      const response = await fetch("/api/ai/post-analyzer", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + session.access_token },
        body: JSON.stringify({ status, url: url.trim(), objective, audience: audience.trim(), caption: caption.trim(), images, videoFrames, consent: true }),
      });
      const result = await response.json();
      if (!response.ok) {
        if (result.needsCaption) setShowCaption(true);
        throw Error(result.error || "Não foi possível analisar a publicação.");
      }
      setReport(result as Report);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível analisar."); }
    finally {
      lock.current = false; setLoading(false);
      window.dispatchEvent(new Event("kivai:ai-credit-update"));
    }
  }
  async function copyReport() {
    if (!report) return;
    try { await navigator.clipboard.writeText(reportText(report)); setFeedback("Relatório copiado."); }
    catch { setFeedback("Não foi possível copiar automaticamente."); }
  }
  const cost = files.length && !skipFile ? 2 : 1;

  return <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Sparkles className="size-5 text-primary" /> Nova análise</CardTitle>
        <p className="text-sm text-muted-foreground">A IA avalia os dados que conseguir acessar pelo link e utiliza os arquivos enviados para aprofundar o diagnóstico.</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={analyze} className="space-y-6">
          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-semibold">1. Situação da publicação</legend>
            <div className="flex flex-wrap gap-4 text-sm">
              <label className="flex items-center gap-2"><input type="radio" name="status" checked={status === "published"} onChange={() => {setStatus("published");setError("");setReport(null);}} /> Já publicada</label>
              <label className="flex items-center gap-2"><input type="radio" name="status" checked={status === "draft"} onChange={() => {setStatus("draft");setError("");setReport(null);setShowCaption(true);}} /> Rascunho</label>
            </div>
          </fieldset>
          <div className="space-y-2">
            <label htmlFor="post-url" className="block text-sm font-semibold">2. Link da publicação {status === "draft" && "(opcional)"}</label>
            <input id="post-url" type="url" inputMode="url" maxLength={2048} value={url} onChange={e => {setUrl(e.target.value);setReport(null);}} placeholder="https://www.instagram.com/p/..." required={status === "published"} className="w-full rounded-md border border-input bg-background px-3 py-3 text-sm" />
            <p className="text-xs text-muted-foreground">YouTube, Instagram, TikTok, Facebook, LinkedIn, X, Threads e Pinterest. Alguns serviços restringem o acesso público aos conteúdos.</p>
          </div>
          <div className="space-y-3">
            <p className="text-sm font-semibold">3. Arquivo da publicação (opcional)</p>
            {!skipFile && <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-input p-6 text-center hover:border-primary">
              <UploadCloud className="size-7 text-primary" />
              <span className="text-sm font-semibold">Selecionar imagem, vídeo ou carrossel</span>
              <span className="text-xs text-muted-foreground">Até 8 imagens ou 1 vídeo, máximo 40 MB por arquivo. O vídeo é resumido em 3 quadros visuais no navegador.</span>
              <input className="sr-only" type="file" multiple accept="image/png,image/jpeg,image/webp,video/mp4,video/quicktime,video/webm" onChange={e => pickFiles(e.target.files)} />
            </label>}
            {files.length > 0 && !skipFile && <p className="flex items-center gap-2 text-sm"><FileImage className="size-4" /> {files.length} arquivo(s): {files.map(f => f.name).join(", ").slice(0, 180)} <button className="text-primary underline" type="button" onClick={() => setFiles([])}>Remover</button></p>}
            {downloadable && <p className="rounded-md bg-muted/30 p-3 text-sm">Não tem o arquivo? <Link href={downloadable.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-primary underline">{downloadable.label}<ExternalLink className="size-3" /></Link>. Use apenas conteúdo que você tenha direito de utilizar.</p>}
            {network === "youtube" && <p className="rounded-md bg-muted/30 p-3 text-sm">No YouTube, o Kivai tentará analisar vídeos de até 3 minutos e Shorts diretamente pelo link quando houver acesso compatível. Você também pode enviar um vídeo próprio.</p>}
            <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={skipFile} onChange={e => {setSkipFile(e.target.checked);setReport(null);}} className="mt-1" /> Não quero enviar o arquivo</label>
            {skipFile && <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/20 p-3 text-sm"><Info className="mt-0.5 size-4 shrink-0 text-primary" /><p>O Kivai analisará detalhadamente os dados que estiverem disponíveis. Sem acesso ao arquivo ou ao vídeo, certos aspectos visuais, sonoros e de edição poderão ficar de fora. O relatório explicará essas limitações.</p></div>}
          </div>
          <div className="space-y-2">
            <label htmlFor="post-objective" className="block text-sm font-semibold">4. Objetivo da publicação</label>
            <select id="post-objective" value={objective} onChange={e => {setObjective(e.target.value);setReport(null);}} className="w-full rounded-md border border-input bg-background px-3 py-3 text-sm">
              <option value="engajamento">Aumentar engajamento</option><option value="alcance">Alcançar mais pessoas</option><option value="vendas">Gerar vendas ou leads</option><option value="seguidores">Conquistar seguidores</option><option value="autoridade">Fortalecer autoridade</option>
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="post-audience" className="block text-sm font-semibold">5. Público-alvo (opcional)</label>
            <input id="post-audience" maxLength={500} value={audience} onChange={e => {setAudience(e.target.value);setReport(null);}} placeholder="Ex.: empreendedores de 25 a 45 anos" className="w-full rounded-md border border-input bg-background px-3 py-3 text-sm" />
          </div>
          {showCaption && <div className="space-y-2 rounded-lg border border-primary/20 p-3">
            <label htmlFor="post-caption" className="block text-sm font-semibold">Texto da publicação</label>
            <p className="text-xs text-muted-foreground">{status === "draft" ? "Para rascunhos sem arquivo, informe o conteúdo antes de analisar." : "A plataforma não liberou a descrição. Cole a legenda para complementar a análise."}</p>
            <textarea id="post-caption" rows={4} maxLength={8000} value={caption} onChange={e => setCaption(e.target.value)} className="w-full rounded-md border border-input bg-background p-3 text-sm" />
          </div>}
          <AiCreditBalance />
          <p className="text-sm text-muted-foreground">Ao clicar em Analisar Publicação, os dados selecionados serão enviados a um serviço externo de IA. Não inclua informações pessoais ou confidenciais.</p>
          <p className="text-xs leading-5 text-muted-foreground">Cada análise usa aproximadamente {cost} crédito(s). Somente imagens otimizadas ou quadros extraídos do vídeo serão enviados; arquivos originais não são enviados nesta versão. Um provedor gratuito de IA pode usar os dados para melhorar seus produtos. A IA pode errar.</p>
          <Button type="submit" size="lg" disabled={loading} className="w-full sm:w-auto"><Sparkles className="mr-2 size-4" />{loading ? "Analisando publicação..." : "Analisar Publicação"}</Button>
          {error && <p role="alert" className="text-sm text-destructive">{error} {error.startsWith("Entre") && <Link href="/conta/login?next=%2Fferramentas%2Fanalisador-de-posts" className="underline">Fazer login</Link>}</p>}
        </form>
      </CardContent>
    </Card>
    {report && <section aria-live="polite" className="space-y-4">
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><CheckCircle2 className="size-5 text-primary" /> Relatório da publicação</CardTitle></CardHeader>
      <CardContent className="space-y-5">
        <p className="whitespace-pre-wrap text-sm leading-7">{report.result.summary}</p>
        <div className="rounded-lg border p-4 text-sm"><h3 className="font-semibold">O que a IA conseguiu analisar</h3><p className="mt-2 text-muted-foreground">Origem: {report.source}. Descrição: {report.covered.description ? "sim" : "não"}. Imagens: {report.covered.visuals ? "sim" : "não"}. Áudio: {report.covered.audio ? "sim" : "não"}.</p></div>
        {report.result.strengths.length > 0 && <div><h3 className="font-semibold">Pontos fortes</h3><ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{report.result.strengths.map((x,i) => <li key={i}>{x}</li>)}</ul></div>}
        {report.result.issues.length > 0 && <div><h3 className="font-semibold">Oportunidades de melhoria</h3><div className="mt-3 space-y-3">{report.result.issues.map((x,i) => <div key={i} className="rounded-md border p-3 text-sm"><strong>{x.problem}</strong><p className="mt-1 text-muted-foreground">{x.why}</p><p className="mt-2"><strong>Ajuste:</strong> {x.fix}</p></div>)}</div></div>}
        {report.result.improvedCaption && <div><h3 className="font-semibold">Legenda otimizada</h3><p className="mt-2 whitespace-pre-wrap rounded-md bg-muted/25 p-3 text-sm">{report.result.improvedCaption}</p></div>}
        {report.result.hooks.length > 0 && <div><h3 className="font-semibold">Novos ganchos</h3><ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{report.result.hooks.map((x,i) => <li key={i}>{x}</li>)}</ul></div>}
        {report.result.cta && <div><h3 className="font-semibold">Chamada para ação</h3><p className="mt-2 text-sm">{report.result.cta}</p></div>}
        {report.result.visualEdits.length > 0 && <div><h3 className="font-semibold">Sugestões de edição</h3><ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{report.result.visualEdits.map((x,i) => <li key={i}>{x}</li>)}</ul></div>}
        {report.result.nextSteps.length > 0 && <div><h3 className="font-semibold">Próximas ações</h3><ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{report.result.nextSteps.map((x,i) => <li key={i}>{x}</li>)}</ul></div>}
        <div className="rounded-md bg-muted/25 p-3 text-sm"><h3 className="font-semibold">Limitações desta análise</h3><ul className="mt-2 list-disc space-y-1 pl-5">{report.limitations.map((v,i) => <li key={i}>{v}</li>)}</ul></div>
        <div className="flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={copyReport}><Clipboard className="mr-2 size-4" />Copiar relatório</Button><Button type="button" variant="outline" onClick={reset}><RotateCcw className="mr-2 size-4" />Nova análise</Button></div>
        {feedback && <p role="status" className="text-sm text-muted-foreground">{feedback}</p>}
      </CardContent></Card>
    </section>}
    <SavedProjects kind="post_analysis" payload={{ report }} onLoad={value => { const p=value as { report?: Report }; if(p?.report?.result) setReport(p.report); }} />
  </div>;
}
