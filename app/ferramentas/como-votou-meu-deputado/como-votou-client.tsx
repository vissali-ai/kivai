"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import { AdSlot } from "@/components/ads/AdSlot";

type Deputy = { id: number; nome: string; siglaPartido?: string; siglaUf?: string; urlFoto?: string };
type RecordVote = { votacao: { id: string; data?: string; descricao?: string; siglaOrgao?: string }; voto: string };
type Result = { dados: RecordVote[]; totalVotacoesAmostradas: number; consultasIndisponiveis: number; limite: string };
export default function ComoVotouClient() {
  const [nome, setNome] = useState("");
  const [uf, setUf] = useState("");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [deputies, setDeputies] = useState<Deputy[]>([]);
  const [selected, setSelected] = useState<Deputy | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function find(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError(""); setResult(null); setSelected(null); setDeputies([]);
    try {
      const params = new URLSearchParams({ nome: nome.trim() }); if (uf) params.set("uf", uf);
      const response = await fetch(`/api/politica/deputados?${params}`);
      const data = await response.json();
      if (!response.ok) throw Error(data.error ?? "Falha ao consultar deputados.");
      setDeputies(data.dados ?? []);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Erro na consulta."); }
    finally { setBusy(false); }
  }
  async function votes(deputy: Deputy, yr = year) {
    setSelected(deputy); setBusy(true); setError(""); setResult(null);
    try {
      const response = await fetch(`/api/politica/votos?id=${deputy.id}&ano=${yr}`);
      const data = await response.json();
      if (!response.ok) throw Error(data.error ?? "Falha ao consultar votações.");
      setResult(data);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Erro na consulta."); }
    finally { setBusy(false); }
  }
  return <main className="min-h-screen bg-background pb-14 pt-24 text-foreground">
    <section className="mx-auto max-w-6xl space-y-7 px-4 sm:px-6 lg:px-8">
      <Link href="/ferramentas/politica-e-dados-publicos" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4"/> Política e Dados Públicos</Link>
      <div className="max-w-3xl space-y-3">
        <p className="text-sm font-medium uppercase tracking-wider text-primary">Dados oficiais da Câmara dos Deputados</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">Como Votou Meu Deputado?</h1>
        <p className="leading-7 text-muted-foreground">Pesquise deputados federais e consulte seus votos nominais registrados nas votações recentes da Câmara. Dados públicos, sem avaliação partidária.</p>
      </div>
      <form onSubmit={find} className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-[1fr_150px_auto] sm:p-6">
        <label className="space-y-1.5 text-sm font-medium">Nome do deputado<input value={nome} onChange={e => setNome(e.target.value)} minLength={2} required maxLength={100} placeholder="Digite pelo menos 2 letras" className="w-full rounded-md border bg-background px-3 py-3 font-normal"/></label>
        <label className="space-y-1.5 text-sm font-medium">Estado (opcional)<select value={uf} onChange={e=>setUf(e.target.value)} className="w-full rounded-md border bg-background px-3 py-3 font-normal"><option value="">Todos</option>{"AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" ").map(code=><option key={code} value={code}>{code}</option>)}</select></label>
        <button disabled={busy || nome.trim().length < 2} className="inline-flex self-end items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 font-medium text-primary-foreground disabled:opacity-50"><Search className="size-4"/>Pesquisar</button>
      </form>
      {error && <p role="alert" className="rounded-lg border border-destructive/40 p-4 text-sm text-destructive">{error}</p>}
      {busy && <p role="status" className="text-sm text-muted-foreground">Consultando dados oficiais...</p>}
      {!selected && deputies.length > 0 && <div className="space-y-3"><h2 className="text-xl font-semibold">Selecione um parlamentar</h2><div className="grid gap-2 sm:grid-cols-2">{deputies.map(d=><button key={d.id} type="button" onClick={()=>votes(d)} className="rounded-lg border bg-card p-4 text-left transition-colors hover:bg-muted/40"><span className="font-semibold">{d.nome}</span><span className="mt-1 block text-sm text-muted-foreground">{d.siglaPartido} · {d.siglaUf}</span><span className="mt-2 block text-xs text-primary">Consultar votos</span></button>)}</div></div>}
      {!selected && !busy && deputies.length === 0 && nome.trim().length>=2 && !error && <p className="text-sm text-muted-foreground">Pesquise um nome para consultar os parlamentares.</p>}
      {selected && <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3 rounded-lg border bg-card p-4">
          <div><h2 className="text-xl font-semibold">{selected.nome}</h2><p className="text-sm text-muted-foreground">{selected.siglaPartido} · {selected.siglaUf}</p><button type="button" onClick={()=>{setSelected(null);setResult(null)}} className="mt-2 text-sm text-primary hover:underline">Trocar deputado</button></div>
          <label className="space-y-1 text-sm font-medium">Ano<select value={year} onChange={e=>{setYear(e.target.value);void votes(selected,e.target.value)}} className="block rounded-md border bg-background px-3 py-2">{Array.from({length:new Date().getFullYear()-2014},(_,i)=>String(new Date().getFullYear()-i)).map(y=><option key={y} value={y}>{y}</option>)}</select></label>
        </div>
        {result && <><div className="rounded-lg border border-border bg-muted/30 p-4 text-sm leading-6 text-muted-foreground"><strong className="text-foreground">Escopo da consulta:</strong> {result.limite} Foram consideradas {result.totalVotacoesAmostradas} votações. {result.consultasIndisponiveis>0 && `${result.consultasIndisponiveis} votações não puderam ser consultadas.`} A ausência de voto registrado não comprova ausência do deputado. A paginação é limitada e alguns registros podem não aparecer.</div>
          {result.dados.length === 0 ? <p className="rounded-lg border p-5 text-sm">Nenhum voto nominal deste parlamentar foi localizado na amostra consultada. Isso não significa que ele não tenha votado no período.</p> :
          <div className="space-y-3">{result.dados.map(item=><article key={item.votacao.id} className="space-y-2 rounded-lg border bg-card p-4"><div className="flex flex-wrap items-center justify-between gap-2"><span className="rounded-full border px-3 py-1 text-sm font-semibold">{item.voto}</span><span className="text-xs text-muted-foreground">{item.votacao.data} · {item.votacao.siglaOrgao ?? "Câmara"}</span></div><h3 className="text-sm leading-6">{item.votacao.descricao || "Votação nominal"}</h3><a className="block text-xs text-muted-foreground underline" target="_blank" rel="noopener noreferrer" href={`https://dadosabertos.camara.leg.br/api/v2/votacoes/${encodeURIComponent(item.votacao.id)}/votos`}>Dados originais desta votação</a></article>)}</div>}
        </>}
      </section>}
      <AdSlot placement="tool-inline"/>
      <section className="grid gap-5 border-t pt-8 sm:grid-cols-2"><article><h2 className="text-xl font-semibold">O que os votos significam?</h2><p className="mt-3 text-sm leading-7 text-muted-foreground">Os registros são fornecidos pela Câmara. Um voto “Sim” ou “Não” refere-se ao objeto específico votado, e não necessariamente à aprovação ou rejeição final de um projeto inteiro. Algumas votações são simbólicas ou secretas e não permitem consulta individual.</p></article><article><h2 className="text-xl font-semibold">Fonte, atualização e privacidade</h2><p className="mt-3 text-sm leading-7 text-muted-foreground">As consultas são encaminhadas ao servidor do Kivai, que acessa a API pública da Câmara. As respostas podem ficar em cache por até uma hora. O resultado depende da disponibilidade da fonte oficial e não constitui histórico completo.</p><a href="https://dadosabertos.camara.leg.br/swagger/api.html" target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex text-sm text-primary underline">Documentação oficial da Câmara</a></article></section>
      <section className="border-t pt-6"><h2 className="text-lg font-semibold">Perguntas frequentes</h2><p className="mt-3 text-sm text-muted-foreground"><strong>A ferramenta usa inteligência artificial?</strong> Não. Exibe registros da API oficial.</p><p className="mt-2 text-sm text-muted-foreground"><strong>Todos os votos aparecem?</strong> Não. Esta versão mostra apenas votos nominais registrados na amostra recente do ano selecionado.</p></section>
      <AdSlot placement="tool-bottom"/>
    </section>
  </main>;
}
