"use client";

import { useMemo, useState } from "react";
import { Copy, Plus, RotateCcw, Trash2 } from "lucide-react";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Method = "followers" | "reach" | "impressions"; type Mode = "single" | "average";
type Values = { likes: string; comments: string; shares: string; saves: string; clicks: string; other: string; base: string };
const emptyValues = (): Values => ({ likes: "", comments: "", shares: "", saves: "", clicks: "", other: "", base: "" });
const interactionFields: [keyof Omit<Values, "base">, string][] = [["likes", "Curtidas"], ["comments", "Comentários"], ["shares", "Compartilhamentos"], ["saves", "Salvamentos"], ["clicks", "Cliques"], ["other", "Outras interações"]];
const methodInfo = { followers: { label: "Por seguidores", base: "Número de seguidores", short: "Seguidores" }, reach: { label: "Por alcance", base: "Alcance da publicação", short: "Alcance" }, impressions: { label: "Por impressões", base: "Número de impressões", short: "Impressões" } } as const;
const networks = ["Instagram", "TikTok", "Facebook", "YouTube", "LinkedIn", "X", "Threads", "Pinterest", "Outra"];
const contentTypes = ["Post", "Carrossel", "Reels", "Stories", "Vídeo", "Shorts", "Texto", "Live", "Outro"];
const nf = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });
const intf = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
function num(value: string) { const parsed = Number(value); return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0; }
function total(values: Values) { return interactionFields.reduce((sum, [key]) => sum + num(values[key]), 0); }
function rate(values: Values) { const base = num(values.base); return base > 0 ? total(values) / base * 100 : null; }
function percent(value: number | null) { return value === null ? "—" : `${nf.format(value)}%`; }
function cleanInput(value: string) { if (value === "") return ""; const parsed = Number(value); return Number.isFinite(parsed) && parsed >= 0 ? value : "0"; }

export default function CalculadoraEngajamentoClient() {
  const [mode, setMode] = useState<Mode>("single"); const [method, setMethod] = useState<Method>("followers"); const [single, setSingle] = useState<Values>(emptyValues); const [posts, setPosts] = useState<Values[]>([emptyValues()]);
  const [network, setNetwork] = useState(""); const [contentType, setContentType] = useState(""); const [feedback, setFeedback] = useState("");
  const singleTotal = total(single), singleRate = rate(single);
  const aggregate = useMemo(() => {
    const rates = posts.map(rate);
    const validPosts = posts.filter((post) => num(post.base) > 0);
    const validRates = rates.filter((value): value is number => value !== null);
    const interactions = validPosts.reduce((sum, post) => sum + total(post), 0);
    const bases = validPosts.reduce((sum, post) => sum + num(post.base), 0);
    return {
      interactions,
      bases,
      average: validRates.length ? validRates.reduce((sum, value) => sum + value, 0) / validRates.length : null,
      consolidated: bases > 0 ? interactions / bases * 100 : null,
      rates,
    };
  }, [posts]);
  const displayTotal = mode === "single" ? singleTotal : aggregate.interactions; const displayRate = mode === "single" ? singleRate : aggregate.consolidated;
  function changeSingle(key: keyof Values, value: string) { setSingle((current) => ({ ...current, [key]: cleanInput(value) })); }
  function changePost(index: number, key: keyof Values, value: string) { setPosts((current) => current.map((post, itemIndex) => itemIndex === index ? { ...post, [key]: cleanInput(value) } : post)); }
  function clear() { setSingle(emptyValues()); setPosts([emptyValues()]); setNetwork(""); setContentType(""); setFeedback(""); }
  async function copyResult() { const info = methodInfo[method]; const text = mode === "single" ? `Taxa de engajamento: ${percent(singleRate)}\nTotal de interações: ${intf.format(singleTotal)}\nMétodo: ${info.label.toLowerCase()}\n${info.short}: ${intf.format(num(single.base))}` : `Média das taxas individuais: ${percent(aggregate.average)}\nTaxa consolidada: ${percent(aggregate.consolidated)}\nTotal de interações: ${intf.format(aggregate.interactions)}\nBase consolidada: ${intf.format(aggregate.bases)}\nMétodo: ${info.label.toLowerCase()}`; try { await navigator.clipboard.writeText(text); setFeedback("Resultado copiado."); } catch { setFeedback("Não foi possível copiar o resultado."); } window.setTimeout(() => setFeedback(""), 2200); }
  return <ToolPageShell title="Calculadora de Engajamento" description="Calcule a taxa de engajamento por seguidores, alcance ou impressões e analise a participação das interações." categoryName="Social Media" categoryHref="/ferramentas/social-media" showBreadcrumb={false} privacyMessage="Os cálculos são realizados localmente no navegador. Nenhum dado é enviado ao Kivai.">
    <Card><CardHeader><CardTitle className="text-base">O que deseja calcular?</CardTitle><CardDescription>Use uma publicação ou compare várias publicações pelo mesmo método.</CardDescription></CardHeader><CardContent><div className="flex flex-wrap gap-2"><Button variant={mode === "single" ? "default" : "outline"} aria-pressed={mode === "single"} onClick={() => setMode("single")}>Uma publicação</Button><Button variant={mode === "average" ? "default" : "outline"} aria-pressed={mode === "average"} onClick={() => setMode("average")}>Média de várias publicações</Button></div></CardContent></Card>
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(300px,.75fr)]">
      <Card><CardHeader><CardTitle className="text-base">Dados para o cálculo</CardTitle><CardDescription>Todos os valores devem ser números inteiros iguais ou maiores que zero.</CardDescription></CardHeader><CardContent className="space-y-6">
        <fieldset><legend className="text-sm font-medium">Método de engajamento</legend><div className="mt-2 grid gap-2 sm:grid-cols-3">{(Object.keys(methodInfo) as Method[]).map((item) => <Button key={item} variant={method === item ? "secondary" : "outline"} aria-pressed={method === item} onClick={() => setMethod(item)}>{methodInfo[item].label}</Button>)}</div></fieldset>
        <div className="grid gap-4 border-b border-border pb-5 sm:grid-cols-2"><Select label="Rede social (opcional)" value={network} options={networks} onChange={setNetwork} /><Select label="Tipo de conteúdo (opcional)" value={contentType} options={contentTypes} onChange={setContentType} /></div>
        {mode === "single" ? <InteractionForm values={single} method={method} onChange={changeSingle} /> : <div className="space-y-4">{posts.map((post, index) => <div key={index} className="border border-border p-4"><div className="mb-4 flex items-center justify-between gap-3"><h3 className="font-medium">Publicação {index + 1}</h3><Button variant="destructive" size="sm" disabled={posts.length === 1} onClick={() => setPosts((current) => current.filter((_, itemIndex) => itemIndex !== index))}><Trash2 />Excluir</Button></div><InteractionForm values={post} method={method} onChange={(key, value) => changePost(index, key, value)} compact /><p className="mt-3 text-sm"><span className="text-muted-foreground">Taxa individual:</span> <strong>{percent(aggregate.rates[index])}</strong></p></div>)}<Button variant="outline" onClick={() => setPosts((current) => [...current, emptyValues()])}><Plus />Adicionar publicação</Button></div>}
        <div className="flex flex-wrap gap-2"><Button onClick={copyResult} disabled={displayRate === null}><Copy />Copiar resultado</Button><Button variant="outline" onClick={clear}><RotateCcw />Novo cálculo</Button>{feedback && <p role="status" className="w-full text-sm text-primary">{feedback}</p>}</div>
      </CardContent></Card>
      <aside className="space-y-4 lg:sticky lg:top-24"><Card><CardHeader><CardTitle>Taxa de engajamento</CardTitle><CardDescription>{methodInfo[method].label}{network ? ` · ${network}` : ""}{contentType ? ` · ${contentType}` : ""}</CardDescription></CardHeader><CardContent><div aria-live="polite"><p className="font-heading text-4xl font-semibold text-primary">{percent(displayRate)}</p>{displayRate === null && <p className="mt-2 text-sm text-muted-foreground">Informe um valor maior que zero para calcular a taxa de engajamento.</p>}<dl className="mt-6 grid grid-cols-2 gap-3"><Stat label="Total de interações" value={intf.format(displayTotal)} /><Stat label={mode === "single" ? methodInfo[method].short : "Base consolidada"} value={intf.format(mode === "single" ? num(single.base) : aggregate.bases)} />{mode === "average" && <><Stat label="Média das taxas" value={percent(aggregate.average)} /><Stat label="Taxa consolidada" value={percent(aggregate.consolidated)} /></>}</dl></div></CardContent></Card>
        <Card><CardHeader><CardTitle>Como foi calculado?</CardTitle></CardHeader><CardContent><p className="text-sm leading-6 text-muted-foreground">{mode === "single" ? <>{intf.format(singleTotal)} ÷ {intf.format(num(single.base))} × 100 = <strong className="text-foreground">{percent(singleRate)}</strong></> : <>A taxa consolidada considera apenas publicações com base maior que zero e divide {intf.format(aggregate.interactions)} interações por {intf.format(aggregate.bases)} de base. A média das taxas soma os percentuais individuais válidos e divide pela quantidade de publicações válidas.</>}</p>{mode === "average" && <p className="mt-3 text-xs leading-5 text-muted-foreground">Os resultados podem ser diferentes porque publicações com bases maiores têm mais peso na taxa consolidada.</p>}</CardContent></Card>
        {displayTotal > 0 && <Distribution values={mode === "single" ? [single] : posts.filter((post) => num(post.base) > 0)} />}
      </aside>
    </div>
    <p className="border border-primary/20 bg-primary/5 p-4 text-sm leading-6 text-muted-foreground">A interpretação da taxa depende da plataforma, formato, tamanho da audiência, segmento, período analisado e método de cálculo. Não existe uma classificação universal válida para todos os contextos.</p>
  </ToolPageShell>;
}
function InteractionForm({ values, method, onChange, compact = false }: { values: Values; method: Method; onChange: (key: keyof Values, value: string) => void; compact?: boolean }) { return <div className={cn("grid gap-4", compact ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-3")}>{interactionFields.map(([key, label]) => <NumberField key={key} label={label} value={values[key]} onChange={(value) => onChange(key, value)} />)}<NumberField label={methodInfo[method].base} value={values.base} onChange={(value) => onChange("base", value)} required /></div>; }
function NumberField({ label, value, onChange, required }: { label: string; value: string; onChange: (value: string) => void; required?: boolean }) { return <label className="grid gap-1.5 text-sm font-medium">{label}{required && <span className="sr-only"> obrigatório</span>}<input type="number" min="0" step="1" inputMode="numeric" value={value} onChange={(event) => onChange(event.target.value)} placeholder="0" className="min-h-10 min-w-0 border border-border bg-background px-3" /></label>; }
function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) { return <label className="grid gap-1.5 text-sm font-medium">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="min-h-10 min-w-0 border border-border bg-background px-3"><option value="">Não informado</option>{options.map((option) => <option key={option}>{option}</option>)}</select></label>; }
function Stat({ label, value }: { label: string; value: string }) { return <div className="border border-border p-3"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 font-semibold">{value}</dd></div>; }
function Distribution({ values }: { values: Values[] }) { const sums = interactionFields.map(([key, label]) => ({ label, value: values.reduce((sum, item) => sum + num(item[key]), 0) })); const all = sums.reduce((sum, item) => sum + item.value, 0); return <Card><CardHeader><CardTitle>Distribuição das interações</CardTitle><CardDescription>Participação de cada tipo no total, não a taxa de engajamento.</CardDescription></CardHeader><CardContent><div className="space-y-3">{sums.map((item) => <div key={item.label}><div className="mb-1 flex justify-between text-xs"><span>{item.label}</span><span>{nf.format(item.value / all * 100)}%</span></div><div className="h-1.5 bg-muted"><div className="h-full bg-primary" style={{ width: `${item.value / all * 100}%` }} /></div></div>)}</div></CardContent></Card>; }
