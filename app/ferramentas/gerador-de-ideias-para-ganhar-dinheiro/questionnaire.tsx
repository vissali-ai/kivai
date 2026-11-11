"use client";
import { useState } from "react";
import { ToolAiPanel } from "@/components/tools/tool-ai-panel";

const questions = [
  {key:"budget",label:"Quanto pode investir no primeiro teste?", options:["R$ 0","Até R$ 100","Até R$ 500","Até R$ 2.000","Até R$ 5.000"]},
  {key:"time",label:"Quantas horas tem por semana?", options:["Até 3 horas","4 a 8 horas","9 a 20 horas","Mais de 20 horas"]},
  {key:"goal",label:"Qual é seu objetivo?", options:["Conseguir minha primeira venda","Complementar a renda","Explorar um negócio para trabalhar por conta própria"]},
  {key:"preference",label:"Como prefere trabalhar?", options:["Somente pela internet","Atendimento local ou presencial","Combinar online e presencial","Quero comparar possibilidades"]},
] as const;
const control = "mt-2 w-full rounded-md border bg-background px-3 py-2 font-normal";
export default function Questionnaire() {
  const [profile,setProfile] = useState({skills:"",resources:"",budget:"",time:"",goal:"",preference:""});
  const update = (key:keyof typeof profile,value:string)=>setProfile(prev=>({...prev,[key]:value}));
  const complete = !!profile.skills.trim() && questions.every(q=>profile[q.key]);
  return <>
    <fieldset className="grid gap-5 rounded-xl border bg-card p-5 sm:grid-cols-2 sm:p-7">
      <legend className="px-2 text-lg font-semibold">Seu perfil de trabalho</legend>
      <label className="font-medium sm:col-span-2">O que você sabe fazer?<textarea className={control} rows={3} maxLength={1000} value={profile.skills} onChange={e=>update("skills",e.target.value)} placeholder="Ex.: organizo estoques em planilhas e já ensinei colegas a usar fórmulas."/></label>
      {questions.map(q=><label key={q.key} className="font-medium">{q.label}<select className={control} value={profile[q.key]} onChange={e=>update(q.key,e.target.value)}>
        <option value="">Selecione</option>{q.options.map(option=><option key={option}>{option}</option>)}</select></label>)}
      <label className="font-medium sm:col-span-2">Recursos e restrições (opcional)<textarea className={control} rows={2} maxLength={600} value={profile.resources} onChange={e=>update("resources",e.target.value)} placeholder="Ex.: tenho um celular, acesso a comerciantes do bairro e só posso atender à noite."/></label>
    </fieldset>
    <ToolAiPanel fingerprint={JSON.stringify(profile)} cost={1} disabled={!complete}
      prepare={async()=>({kind:"businessIdeas", consent:true, ...profile})}
      render={result=>result.kind === "businessIdeas" && <div className="space-y-5"><h2 className="text-2xl font-semibold">Seu diagnóstico</h2><p>{result.diagnosis}</p>
        {result.ideas.map((idea,i)=><article key={i} className="space-y-3 rounded-lg border bg-background p-5"><h3 className="text-xl font-semibold">{i+1}. {idea.title}</h3><p>{idea.offer}</p>
          <dl className="grid gap-3">{[["Por que combina com você",idea.fit],["O que exige",idea.requirements],["Como testar",idea.test],["O que observar",idea.signal]].map(([label,text])=><div key={label}><dt className="font-semibold">{label}</dt><dd>{text}</dd></div>)}</dl>
        </article>)}<h3 className="font-semibold">Primeiro passo recomendado</h3><p>{result.nextStep}</p></div>}>
      {!complete&&<p className="text-sm">Preencha suas habilidades e as quatro escolhas para gerar o diagnóstico.</p>}
    </ToolAiPanel>
  </>;
}
