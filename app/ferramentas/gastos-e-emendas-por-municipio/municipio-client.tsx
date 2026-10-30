"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { AdSlot } from "@/components/ads/AdSlot";

type Municipality = { id: number; nome: string };
const UFS = "AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" ");
const GOV = "https://portaldatransparencia.gov.br";
export function EmendasMunicipioClient() {
  const [uf,setUf] = useState("");
  const [municipios,setMunicipios] = useState<Municipality[]>([]);
  const [id,setId] = useState("");
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState("");
  const [ready,setReady] = useState(false);
  useEffect(()=>{
    if(!uf){setMunicipios([]);setId("");return;}
    const controller=new AbortController();
    setLoading(true);setError("");setReady(false);setId("");
    fetch("/api/politica/municipios?uf="+uf,{signal:controller.signal}).then(async r=>{
      const body=await r.json();if(!r.ok)throw Error(body.error??"Erro ao obter municípios");
      setMunicipios(body.municipios??[]);
    }).catch(e=>{if(!controller.signal.aborted)setError(e instanceof Error?e.message:"Consulta indisponível");}).finally(()=>{if(!controller.signal.aborted)setLoading(false)});
    return ()=>controller.abort();
  },[uf]);
  const municipality=municipios.find(m=>String(m.id)===id);
  return <main className="min-h-screen bg-background pb-16 pt-24 text-foreground">
    <section className="mx-auto max-w-6xl space-y-7 px-4 sm:px-6 lg:px-8">
      <Link className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground" href="/ferramentas"><ArrowLeft className="size-4"/> Todas as ferramentas</Link>
      <div className="max-w-3xl space-y-3">
        <p className="text-sm font-medium uppercase tracking-wider text-primary">Dados públicos e fiscalização cidadã</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">Gastos e Emendas por Município</h1>
        <p className="leading-7 text-muted-foreground">Localize um município e consulte fontes oficiais sobre recursos de emendas parlamentares. Esta versão inicial organiza o acesso às consultas públicas e não calcula valores automaticamente.</p>
      </div>
      <form onSubmit={e=>{e.preventDefault();setReady(true)}} className="grid gap-4 rounded-xl border bg-card p-5 sm:grid-cols-2 sm:p-6">
        <label className="space-y-2 text-sm font-medium">Estado
          <select required value={uf} onChange={e=>setUf(e.target.value)} className="block w-full rounded-md border bg-background px-3 py-3 font-normal"><option value="">Selecione o estado</option>{UFS.map(v=><option key={v} value={v}>{v}</option>)}</select>
        </label>
        <label className="space-y-2 text-sm font-medium">Município
          <select required disabled={!uf||loading||!municipios.length} value={id} onChange={e=>{setId(e.target.value);setReady(false)}} className="block w-full rounded-md border bg-background px-3 py-3 font-normal"><option value="">{loading?"Carregando municípios...":"Selecione o município"}</option>{municipios.map(m=><option key={m.id} value={m.id}>{m.nome}</option>)}</select>
        </label>
        <button className="rounded-md bg-primary px-5 py-3 font-medium text-primary-foreground disabled:opacity-50 sm:col-span-2" disabled={!id||loading}>Consultar fontes oficiais</button>
      </form>
      {error&&<p role="alert" className="rounded-lg border border-destructive/40 p-4 text-sm text-destructive">{error}</p>}
      {ready&&municipality&&<section className="space-y-4" aria-live="polite">
        <h2 className="text-2xl font-semibold">{municipality.nome}, {uf}</h2>
        <p className="text-sm text-muted-foreground">Código IBGE: {municipality.id}. As fontes abaixo exigem a seleção dos filtros municipais na própria consulta oficial; não interpretamos dados de outro local como dados deste município.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <a target="_blank" rel="noopener noreferrer" href={GOV+"/emendas/consulta-por-favorecido"} className="rounded-lg border bg-card p-5 hover:border-primary/40"><h3 className="font-semibold">Emendas por favorecido <ExternalLink className="inline size-4"/></h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Confira valores efetivamente pagos a prefeituras, fundos, entidades e outros favorecidos da localidade. Aplique filtros de UF e município no Portal.</p></a>
          <a target="_blank" rel="noopener noreferrer" href={GOV+"/emendas/consulta-por-documento"} className="rounded-lg border bg-card p-5 hover:border-primary/40"><h3 className="font-semibold">Documentos de despesas <ExternalLink className="inline size-4"/></h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Consulte empenhos, liquidações e pagamentos de emendas e filtre a localidade de aplicação.</p></a>
          <a target="_blank" rel="noopener noreferrer" href={GOV+"/emendas/consulta"} className="rounded-lg border bg-card p-5 hover:border-primary/40"><h3 className="font-semibold">Consulta por emenda <ExternalLink className="inline size-4"/></h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Pesquise autor, código e modalidade de emenda. A autoria não comprova pagamento integral ao município.</p></a>
          <a target="_blank" rel="noopener noreferrer" href={GOV+"/emendas"} className="rounded-lg border bg-card p-5 hover:border-primary/40"><h3 className="font-semibold">Painel de emendas <ExternalLink className="inline size-4"/></h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Veja a distribuição e os estágios dos recursos com filtros de ano e localidade.</p></a>
        </div>
      </section>}
      <AdSlot placement="tool-inline"/>
      <section className="grid gap-6 border-t pt-8 sm:grid-cols-2">
        <article><h2 className="text-xl font-semibold">Emenda destinada não é pagamento realizado</h2><p className="mt-3 text-sm leading-7 text-muted-foreground">Valores previstos, empenhados, liquidados e pagos representam etapas diferentes. Não devem ser somados ou apresentados como se fossem gastos já realizados.</p></article>
        <article><h2 className="text-xl font-semibold">O que está disponível nesta versão?</h2><p className="mt-3 text-sm leading-7 text-muted-foreground">A seleção municipal utiliza a API oficial de Localidades do IBGE. Os dados financeiros continuam nos portais governamentais; ainda não há consolidação automática de valores no Kivai.</p></article>
      </section><AdSlot placement="tool-bottom"/>
    </section>
  </main>;
}
