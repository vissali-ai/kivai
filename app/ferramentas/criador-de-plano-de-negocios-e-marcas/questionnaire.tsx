"use client";
import { useState } from "react";
import { ToolAiPanel } from "@/components/tools/tool-ai-panel";
import { brandFinancials } from "@/lib/brand-financials";

const profileLabels = {
  niche:"Nicho da marca", offer:"Produto e diferencial", customer:"Cliente ideal e necessidade",
  stage:"Estágio atual", operations:"Produção, fornecedores e recursos", channel:"Canal de venda", deadline:"Prazo e objetivo do lançamento",
};
const hints = { niche:"Roupas, skates, acessórios ou outro nicho", offer:"Qual produto pretende lançar e por que alguém o escolheria?", customer:"Quem compra e qual problema você resolve?", stage:"Ideia, protótipo, primeiras vendas ou expansão", operations:"Produção própria, terceirizada, sob encomenda ou revenda", channel:"Loja online, marketplace, eventos ou varejo", deadline:"Ex.: testar a primeira coleção em três meses" };
const limits = {niche:150,offer:800,customer:800,stage:100,operations:800,channel:300,deadline:200};
const moneyLabels = {budget:"Orçamento disponível (R$)",price:"Preço de venda por unidade (R$)",unitCost:"Custo variável por unidade, incluindo embalagem e frete pago pela marca (R$)",fee:"Taxas e tributos proporcionais à venda (%)",lot:"Unidades do primeiro lote",setup:"Despesas únicas de implantação (R$)",fixed:"Custos fixos mensais (R$)"};
const money = (value:number)=>value.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const control = "mt-2 w-full rounded-md border bg-background px-3 py-2 font-normal";
export default function Questionnaire({initialOffer}:{initialOffer:string}) {
  const [profile,setProfile]=useState({niche:"",offer:initialOffer,customer:"",stage:"",operations:"",channel:"",deadline:""});
  const [numbers,setNumbers]=useState({budget:"",price:"",unitCost:"",fee:"",lot:"",setup:"",fixed:""});
  const financialKeys=Object.keys(moneyLabels) as (keyof typeof moneyLabels)[];
  const finances = {budget:+numbers.budget,price:+numbers.price,unitCost:+numbers.unitCost,fee:+numbers.fee,lot:+numbers.lot,setup:+numbers.setup,fixed:+numbers.fixed};
  const valid=financialKeys.every(k=>numbers[k].trim()!=="" && Number.isFinite(finances[k]) && finances[k]>=0 && finances[k]<=100000000 && Math.abs(finances[k]*100-Math.round(finances[k]*100))<0.00001)
    && finances.price>=0.01 && finances.fee<=100 && Number.isInteger(finances.lot) && finances.lot>=1 && finances.lot<=1000000;
  const complete=valid && Object.values(profile).every(v=>v.trim());
  const totals=brandFinancials(finances);
  const group="grid gap-4 rounded-xl border bg-card p-5 sm:grid-cols-2";
  return <div className="space-y-6">
    <fieldset className={group}><legend className="px-2 font-semibold">Marca e mercado</legend>
      {(Object.keys(profileLabels) as (keyof typeof profileLabels)[]).map(key=><label key={key}>{profileLabels[key]}<textarea rows={2} maxLength={limits[key]} className={control} placeholder={hints[key]} value={profile[key]} onChange={e=>setProfile(previous=>({...previous,[key]:e.target.value}))}/></label>)}
    </fieldset>
    <fieldset className={group}><legend className="px-2 font-semibold">Cenário financeiro</legend>
      <p className="text-sm text-muted-foreground sm:col-span-2">Use valores estimados para um produto representativo. Preencha com zero os custos que não se aplicam.</p>
      {financialKeys.map(key=><label key={key}>{moneyLabels[key]}<input className={control} type="number" min={key==="lot"?1:key==="price"?0.01:0} max={key==="fee"?100:key==="lot"?1000000:100000000} step={key==="lot"?1:0.01} value={numbers[key]} onChange={e=>setNumbers(previous=>({...previous,[key]:e.target.value}))}/></label>)}
    </fieldset>
    {valid&&<section className="rounded-xl border p-5"><h2 className="mb-3 text-lg font-semibold">Simulação do primeiro lote</h2>
      <dl className="grid gap-3 sm:grid-cols-2">{[
        ["Lote e implantação",money(totals.initialLotAndSetup)],["Saldo após lote e implantação",money(totals.remainingBudget)],["Contribuição por unidade",money(totals.contributionPerUnit)],["Margem de contribuição",(totals.contributionMarginPercent??0).toLocaleString("pt-BR",{maximumFractionDigits:2})+"%"],["Ponto de equilíbrio mensal",totals.monthlyBreakEvenUnits===null?"Inviável com esta contribuição":totals.monthlyBreakEvenUnits+" unidades"]
      ].map(([label,value])=><div key={label}><dt>{label}</dt><dd className="font-semibold">{value}</dd></div>)}</dl></section>}
    <ToolAiPanel cost={1} fingerprint={JSON.stringify([profile,numbers])} disabled={!complete} prepare={async()=>({kind:"brandPlan",consent:true,...profile,finances})}
      render={r=>r.kind==="brandPlan"&&<div className="space-y-4"><h2 className="text-2xl font-semibold">Plano da sua marca</h2>
        {[[ "Diagnóstico",r.diagnosis],["Posicionamento e oferta",r.positioning],["Operação e fornecedores",r.operations],["Viabilidade do cenário",r.economics]].map(([title,body])=><section key={title}><h3 className="font-semibold">{title}</h3><p>{body}</p></section>)}
        <h3 className="font-semibold">Roteiro de lançamento</h3><ol className="space-y-3">{r.launch.map((step,i)=><li key={i}><strong>{step.phase}</strong><p>{step.action}</p><p>Indicador: {step.metric}</p></li>)}</ol><h3 className="font-semibold">Riscos e próximo teste</h3><p>{r.risks}</p></div>}>
      {!complete&&<p className="text-sm">Complete o perfil e o cenário financeiro para gerar o plano.</p>}
    </ToolAiPanel></div>;
}
