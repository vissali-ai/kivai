"use client";
import { useState } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { getStoredSession } from "@/lib/user-auth";
type Summary = {ratingValue:number;ratingCount:number};
export function ToolRatingControl({slug,initial}: {slug:string;initial:Summary|null}) {
  const [summary,setSummary] = useState(initial);
  const [selected,setSelected] = useState(0);
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState("");
  async function submit() {
    if (!selected || busy) return;
    const token = getStoredSession()?.access_token;
    if (!token) {setMessage("Entre na sua conta para registrar sua avaliação.");return;}
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/tool-ratings", {method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({tool:slug,rating:selected})});
      const result = await response.json() as {summary?:Summary;error?:string};
      if (!response.ok) throw new Error(result.error || "Falha ao avaliar.");
      setSummary(result.summary ?? summary);
      setMessage("Avaliação registrada. Você pode atualizar sua nota.");
    } catch(e) {setMessage(e instanceof Error ? e.message : "Não foi possível avaliar.");}
    finally {setBusy(false);}
  }
  return <section className="rounded-lg border border-border bg-card p-5 sm:p-6" aria-label="Avaliações da ferramenta">
    <h2 className="text-xl font-semibold">Avalie esta ferramenta</h2>
    <p className="mt-2 text-sm text-muted-foreground">{summary ? <>Nota média <strong>{summary.ratingValue.toLocaleString("pt-BR",{minimumFractionDigits:1})}/5</strong> em {summary.ratingCount} {summary.ratingCount===1?"avaliação real":"avaliações reais"}.</> : "Esta ferramenta ainda não recebeu avaliações. Seja o primeiro a avaliar."}</p>
    <div className="mt-4 flex flex-wrap items-center gap-2">
      {[1,2,3,4,5].map(value => <button key={value} type="button" aria-label={`Selecionar ${value} ${value===1?"estrela":"estrelas"}`} aria-pressed={selected===value} onClick={() => setSelected(value)} className="rounded p-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"><Star className={`size-7 ${value <= selected ? "fill-amber-400 text-amber-500" : "text-muted-foreground"}`}/></button>)}
      <button type="button" disabled={!selected || busy} onClick={submit} className="ml-2 rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">{busy?"Salvando...":"Enviar avaliação"}</button>
    </div>
    {message && <p className="mt-3 text-sm" role="status">{message} {message.startsWith("Entre") && <Link href={`/conta/login?next=${encodeURIComponent(`/ferramentas/${slug}`)}`} className="underline">Fazer login</Link>}</p>}
    <p className="mt-3 text-xs text-muted-foreground">Uma avaliação por conta para cada ferramenta. A nota pode ser atualizada. As estrelas nos resultados do Google dependem dos critérios do buscador.</p>
  </section>;
}
