"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Copy, RotateCcw } from "lucide-react";
import { getToolBySlug } from "@/lib/tools";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const templates = ["{tema}: descubra uma forma simples de começar hoje.", "Tudo o que você precisa saber sobre {tema} em poucos passos.", "Quer melhorar seus resultados com {tema}? Veja estas dicas."];
const dates = ["01/01 — Confraternização Universal", "08/03 — Dia Internacional da Mulher", "15/03 — Dia do Consumidor", "22/04 — Dia da Terra", "01/05 — Dia do Trabalho", "12/06 — Dia dos Namorados", "15/09 — Dia do Cliente", "25/12 — Natal"];
const wordCount = (value: string) => value.trim() ? value.trim().split(/\s+/).length : 0;
const getVideoId = (value: string) => value.match(/(?:youtu\.be\/|[?&]v=|\/shorts\/)([\w-]{11})/)?.[1] ?? "";

export function SocialMediaToolClient({ slug }: { slug: string }) {
  const tool = getToolBySlug(slug);
  const [text, setText] = useState("");
  const [topic, setTopic] = useState("");
  const [mode, setMode] = useState("upper");
  const [numbers, setNumbers] = useState({ first: "", second: "" });
  const [copied, setCopied] = useState(false);
  const isCounter = slug.includes("contador-de-caracteres") || slug.includes("tempo-de-");
  const isCalculator = slug.startsWith("calculadora-");
  const isHash = slug.includes("hashtags");
  const isThumbnail = slug.includes("thumbnail");
  const isConverter = slug === "conversor-de-texto";
  const isDates = slug === "banco-de-datas-comemorativas";
  const isBio = slug === "simulador-de-bio-instagram";
  const isLink = slug === "gerador-de-link-na-bio-instagram";
  const isSummary = slug === "gerador-de-resumos";
  const requiresText = isCounter || isConverter || isThumbnail || isSummary || isLink || isHash;
  const result = useMemo(() => {
    if (isHash) {
      const tags = slug.includes("tiktok") ? ["#tiktok", "#paravoce", "#fyp", "#viral", "#brasil"] : ["#instagram", "#instagood", "#conteudo", "#marketingdigital", "#dicas"];
      return `${tags.join(" ")}${topic ? ` #${topic.toLowerCase().replace(/\s+/g, "")}` : ""}`;
    }
    if (isDates) return dates.join("\n");
    if (isThumbnail) { const id = getVideoId(text); return id ? `https://img.youtube.com/vi/${id}/maxresdefault.jpg` : ""; }
    if (isLink) return text ? `https://wa.me/${text.replace(/\D/g, "")}${topic ? `?text=${encodeURIComponent(topic)}` : ""}` : "";
    if (isSummary) return text.trim().split(/(?<=[.!?])\s+/).slice(0, 3).join(" ");
    if (isConverter) {
      const clean = text.replace(/[\u200B-\u200D\uFEFF]/g, "").replace(/[ \t]+/g, " ").replace(/\n\s*\n\s*\n+/g, "\n\n").trim();
      if (mode === "upper") return clean.toUpperCase();
      if (mode === "lower") return clean.toLowerCase();
      if (mode === "title") return clean.toLowerCase().replace(/(^|\s)\S/g, (char) => char.toUpperCase());
      if (mode === "invert") return clean.split("").map((char) => char === char.toUpperCase() ? char.toLowerCase() : char.toUpperCase()).join("");
      if (mode === "lines") return clean.replace(/\n+/g, " ");
      return clean;
    }
    if (isCalculator) {
      const first = Number(numbers.first) || 0, second = Number(numbers.second) || 0;
      if (slug === "calculadora-de-engajamento") return second ? `${((first / second) * 100).toFixed(2)}%` : "";
      if (slug === "calculadora-de-cpm") return second ? `R$ ${((first / second) * 1000).toFixed(2)}` : "";
      if (slug === "calculadora-de-roi-influenciadores") return first ? `${(((second - first) / first) * 100).toFixed(2)}%` : "";
      return `${((first * second) / 100).toFixed(0)} pessoas`;
    }
    const seed = topic || text;
    if (!seed) return "";
    if (slug === "gerador-de-emojis") return "✨ 🚀 💡 📌 🔥 ✅ 💬";
    if (slug === "gerador-de-palavras-chave") return `${seed}, ${seed} dicas, ${seed} online, melhores ${seed}`;
    if (slug === "gerador-de-prompts") return `Atue como especialista em conteúdo. Crie uma publicação sobre ${seed}, com tom claro, objetivo e uma chamada para ação.`;
    if (slug.includes("headline-linkedin")) return `${seed} | Profissional focado em resultados e crescimento`;
    if (slug.includes("resumo-profissional")) return `Profissional com experiência em ${seed}. Atuo com foco em resultados, colaboração e evolução contínua.`;
    if (slug.includes("alt-text")) return `Imagem relacionada a ${seed}, com elementos visuais que ajudam a explicar o conteúdo.`;
    if (slug.includes("whatsapp")) return `Olá! ${templates[0].replace("{tema}", seed)} Fale conosco pelo WhatsApp.`;
    return templates.map((template) => template.replace("{tema}", seed)).join("\n\n");
  }, [isCalculator, isConverter, isDates, isHash, isLink, isSummary, isThumbnail, mode, numbers, slug, text, topic]);

  const labels = slug === "calculadora-de-engajamento" ? ["Interações", "Seguidores"] : slug === "calculadora-de-cpm" ? ["Investimento (R$)", "Impressões"] : slug === "calculadora-de-roi-influenciadores" ? ["Investimento (R$)", "Retorno (R$)"] : ["Seguidores", "Taxa de alcance (%)"];
  const copy = async () => { if (result) { await navigator.clipboard.writeText(result); setCopied(true); window.setTimeout(() => setCopied(false), 1600); } };
  const reset = () => { setText(""); setTopic(""); setNumbers({ first: "", second: "" }); };
  if (!tool) return null;

  return <main className="min-h-screen bg-background text-foreground"><div className="mx-auto w-full max-w-6xl px-4 pb-12 pt-24 sm:px-6 lg:px-8">
    <nav aria-label="Breadcrumb" className="mb-8 text-sm text-muted-foreground"><Link href="/ferramentas">Ferramentas</Link><span className="mx-2">/</span><Link href="/ferramentas/social-media">Social Media</Link><span className="mx-2">/</span>{tool.name}</nav>
    <header className="mb-10 max-w-3xl"><Link href="/ferramentas/social-media" className="text-sm text-primary hover:underline">← Voltar para o Hub Social Media</Link><p className="mt-6 text-sm font-medium uppercase tracking-wider text-primary">{tool.hubFilter}</p><h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">{tool.name}</h1><p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">{tool.description} Todo o processamento acontece no seu navegador.</p></header>
    <Card className="mx-auto max-w-4xl"><CardHeader><CardTitle>Área de processamento</CardTitle><CardDescription>Preencha os dados abaixo para gerar o resultado.</CardDescription></CardHeader><CardContent className="space-y-5">
      {isCalculator && <div className="grid gap-4 sm:grid-cols-2">{labels.map((label, index) => <label key={label} className="text-sm font-medium">{label}<input type="number" min="0" value={index ? numbers.second : numbers.first} onChange={(event) => setNumbers((current) => index ? { ...current, second: event.target.value } : { ...current, first: event.target.value })} className="mt-2 h-11 w-full rounded-lg border border-input bg-background px-3" /></label>)}</div>}
      {isBio && <><label className="block text-sm font-medium">Nome<input value={topic} onChange={(event) => setTopic(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-input bg-background px-3" /></label><label className="block text-sm font-medium">Bio<textarea value={text} onChange={(event) => setText(event.target.value)} className="mt-2 min-h-28 w-full rounded-lg border border-input bg-background p-3" /></label><div className="rounded-xl border border-border p-5"><p className="font-semibold">{topic || "seu_perfil"}</p><p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{text || "Sua bio aparecerá aqui."}</p></div></>}
      {isDates && <p className="rounded-lg border border-border bg-muted/20 p-4 whitespace-pre-wrap text-sm">{result}</p>}
      {!isCalculator && !isBio && !isDates && <><>{!requiresText && <label className="block text-sm font-medium">Tema ou objetivo<input value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="Ex.: lançamento de produto" className="mt-2 h-11 w-full rounded-lg border border-input bg-background px-3" /></label>}</>{requiresText && <label className="block text-sm font-medium">{isLink ? "Número com DDD" : isThumbnail ? "URL do vídeo ou Short" : "Texto"}<textarea value={text} onChange={(event) => setText(event.target.value)} placeholder="Digite ou cole aqui..." className="mt-2 min-h-36 w-full rounded-lg border border-input bg-background p-3" /></label>}{(isHash || isLink) && <label className="block text-sm font-medium">{isLink ? "Mensagem opcional" : "Tema opcional"}<input value={topic} onChange={(event) => setTopic(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-input bg-background px-3" /></label>}{isConverter && <div className="flex flex-wrap gap-2">{[["upper", "MAIÚSCULO"], ["lower", "minúsculo"], ["title", "Primeira Letra Maiúscula"], ["invert", "Inverter Caixa"], ["lines", "Remover quebras"], ["clean", "Limpar texto"]].map(([value, label]) => <Button key={value} variant={mode === value ? "default" : "outline"} onClick={() => setMode(value)}>{label}</Button>)}</div>}{isCounter && <div className="grid gap-3 sm:grid-cols-3"><Stat label="Caracteres" value={text.length} /><Stat label="Palavras" value={wordCount(text)} /><Stat label={slug.includes("fala") ? "Tempo de fala" : "Tempo de leitura"} value={`${Math.max(1, Math.ceil(wordCount(text) / (slug.includes("fala") ? 130 : 200)))} min`} /></div>}</>}
      {result && !isBio && <section aria-live="polite" className="rounded-xl border border-border bg-muted/20 p-4"><p className="mb-2 text-sm font-medium">Área de resultado</p>{isThumbnail ? <a href={result} target="_blank" rel="noreferrer" className="break-all text-sm text-primary underline">Abrir thumbnail em alta resolução</a> : <p className="whitespace-pre-wrap text-sm leading-6">{result}</p>}</section>}
      {!isBio && !isDates && <div className="flex flex-wrap gap-3"><Button onClick={copy} disabled={!result}><Copy />{copied ? "Copiado" : "Copiar resultado"}</Button><Button variant="outline" onClick={reset}><RotateCcw />Limpar</Button></div>}
    </CardContent></Card>
    <section className="mt-12 rounded-xl border border-primary/20 bg-primary/5 p-6 text-center"><h2 className="text-xl font-semibold">Planeje seu próximo conteúdo com o Kivai</h2><p className="mt-2 text-sm text-muted-foreground">Explore mais ferramentas gratuitas para Social Media.</p><Button asChild className="mt-4"><Link href="/ferramentas/social-media">Ver Hub Social Media</Link></Button></section>
  </div></main>;
}

function Stat({ label, value }: { label: string; value: string | number }) { return <div className="rounded-lg border p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-xl font-semibold">{value}</p></div>; }
