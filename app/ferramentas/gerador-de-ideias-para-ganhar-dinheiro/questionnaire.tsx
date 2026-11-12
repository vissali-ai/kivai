"use client";

import { useEffect, useState } from "react";
import { ToolAiPanel } from "@/components/tools/tool-ai-panel";

const questions = [
  { key: "budget", label: "Quanto pode investir no primeiro teste?", options: ["R$ 0", "Até R$ 100", "Até R$ 500", "Até R$ 2.000", "Até R$ 5.000", "Mais de R$ 5.000"] },
  { key: "time", label: "Quantas horas consegue dedicar por semana?", options: ["Até 3 horas", "4 a 8 horas", "9 a 20 horas", "Mais de 20 horas"] },
  { key: "goal", label: "Qual é seu objetivo principal agora?", options: ["Conseguir a primeira venda", "Complementar a renda", "Validar uma fonte de renda recorrente", "Construir um negócio para trabalhar por conta própria"] },
  { key: "preference", label: "Onde prefere executar o trabalho?", options: ["Somente pela internet", "Atendimento local ou presencial", "Combinar online e presencial", "Quero comparar possibilidades"] },
] as const;

const profileQuestions = [
  { key: "activity", label: "Que tipo de atividade mais combina com o que você gosta de fazer?", options: ["Resolver tarefas práticas e colocar a mão na massa", "Pesquisar, analisar e resolver problemas", "Criar, escrever, desenhar ou comunicar", "Ensinar, orientar, atender ou ajudar pessoas", "Vender, negociar, liderar ou convencer", "Organizar processos, dados, rotinas ou controles"] },
  { key: "salesComfort", label: "Como você se sente ao prospectar ou vender?", options: ["Evito vendas e prefiro aquisição mais automática", "Consigo vender com roteiro e processo simples", "Tenho conforto em conversar e apresentar propostas", "Vendas e negociação são um ponto forte"] },
  { key: "digitalLevel", label: "Qual é seu nível com ferramentas digitais?", options: ["Básico", "Intermediário", "Avançado", "Muito avançado ou técnico"] },
  { key: "risk", label: "Como prefere lidar com incerteza?", options: ["Prefiro modelos previsíveis e simples", "Aceito pequenos testes com risco controlado", "Tenho conforto em experimentar e ajustar rápido", "Aceito ciclos mais longos se houver potencial de escala"] },
] as const;

const optionalChoices = [
  { key: "urgency", label: "Quando gostaria de obter a primeira receita?", options: ["O quanto antes, idealmente em até 30 dias", "Posso validar por 1 a 3 meses", "Posso construir algo de médio ou longo prazo"] },
  { key: "modelPreference", label: "Existe um modelo que mais chama sua atenção?", options: ["Serviço ou consultoria", "Produto digital", "E-commerce, revenda ou marketplace", "Conteúdo, audiência ou afiliados", "Negócio local", "Não tenho preferência"] },
] as const;

type Profile = {
  skills: string;
  evidence: string;
  resources: string;
  constraints: string;
  budget: string;
  time: string;
  goal: string;
  preference: string;
  activity: string;
  salesComfort: string;
  digitalLevel: string;
  risk: string;
  urgency: string;
  modelPreference: string;
};

const emptyProfile: Profile = {
  skills: "", evidence: "", resources: "", constraints: "", budget: "", time: "", goal: "", preference: "",
  activity: "", salesComfort: "", digitalLevel: "", risk: "", urgency: "", modelPreference: "",
};

const storageKey = "kivai.business-ideas-profile.v2";
const control = "mt-2 w-full rounded-md border bg-background px-3 py-2 font-normal";

export default function Questionnaire() {
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "null") as Partial<Profile> | null;
      if (saved && typeof saved === "object") {
        setProfile({ ...emptyProfile, ...Object.fromEntries(Object.entries(saved).filter(([key, value]) => key in emptyProfile && typeof value === "string")) } as Profile);
      }
    } catch {
      setNotice("Não foi possível recuperar o rascunho salvo neste navegador.");
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(profile));
    } catch {
      setNotice("Não foi possível salvar o rascunho neste navegador.");
    }
  }, [profile, ready]);

  const update = (key: keyof Profile, value: string) => setProfile(previous => ({ ...previous, [key]: value }));
  const requiredChoices = [...questions, ...profileQuestions];
  const complete = !!profile.skills.trim() && requiredChoices.every(question => profile[question.key]);

  return <div className="space-y-6">
    <fieldset className="grid gap-5 rounded-xl border bg-card p-5 sm:grid-cols-2 sm:p-7">
      <legend className="px-2 text-lg font-semibold">Experiência e recursos</legend>
      <label className="font-medium sm:col-span-2">O que você sabe fazer?
        <textarea className={control} rows={3} maxLength={1000} value={profile.skills} onChange={event => update("skills", event.target.value)} placeholder="Ex.: organizo estoques em planilhas, faço anúncios, conserto bicicletas ou ensino matemática." />
      </label>
      <label className="font-medium sm:col-span-2">Que evidência você já tem dessa habilidade? <span className="font-normal text-muted-foreground">(opcional)</span>
        <textarea className={control} rows={2} maxLength={800} value={profile.evidence} onChange={event => update("evidence", event.target.value)} placeholder="Ex.: já fiz isso no trabalho, ajudei três conhecidos, tenho portfólio ou consegui um resultado específico." />
      </label>
      <label className="font-medium">Recursos que já possui <span className="font-normal text-muted-foreground">(opcional)</span>
        <textarea className={control} rows={3} maxLength={800} value={profile.resources} onChange={event => update("resources", event.target.value)} placeholder="Ex.: notebook, ferramentas, veículo, câmera, lista de contatos, audiência ou espaço físico." />
      </label>
      <label className="font-medium">Restrições importantes <span className="font-normal text-muted-foreground">(opcional)</span>
        <textarea className={control} rows={3} maxLength={800} value={profile.constraints} onChange={event => update("constraints", event.target.value)} placeholder="Ex.: só posso trabalhar à noite, não quero aparecer em vídeo ou não posso manter estoque." />
      </label>
    </fieldset>

    <fieldset className="grid gap-5 rounded-xl border bg-card p-5 sm:grid-cols-2 sm:p-7">
      <legend className="px-2 text-lg font-semibold">Objetivo e disponibilidade</legend>
      {questions.map(question => <label key={question.key} className="font-medium">{question.label}
        <select className={control} value={profile[question.key]} onChange={event => update(question.key, event.target.value)}>
          <option value="">Selecione</option>
          {question.options.map(option => <option key={option}>{option}</option>)}
        </select>
      </label>)}
    </fieldset>

    <fieldset className="grid gap-5 rounded-xl border bg-card p-5 sm:grid-cols-2 sm:p-7">
      <legend className="px-2 text-lg font-semibold">Forma de trabalhar</legend>
      <p className="text-sm leading-6 text-muted-foreground sm:col-span-2">Estas perguntas ajudam a comparar modelos de negócio pelo tipo de atividade e execução. Elas não formam um teste psicológico nem atribuem uma personalidade.</p>
      {profileQuestions.map(question => <label key={question.key} className="font-medium">{question.label}
        <select className={control} value={profile[question.key]} onChange={event => update(question.key, event.target.value)}>
          <option value="">Selecione</option>
          {question.options.map(option => <option key={option}>{option}</option>)}
        </select>
      </label>)}
      {optionalChoices.map(question => <label key={question.key} className="font-medium">{question.label} <span className="font-normal text-muted-foreground">(opcional)</span>
        <select className={control} value={profile[question.key]} onChange={event => update(question.key, event.target.value)}>
          <option value="">Não informar</option>
          {question.options.map(option => <option key={option}>{option}</option>)}
        </select>
      </label>)}
    </fieldset>

    <p className="text-sm text-muted-foreground">Seu rascunho fica salvo neste navegador. Se precisar entrar na conta para usar a IA, as respostas serão restauradas quando você voltar.</p>
    {notice && <p role="status" className="text-sm text-muted-foreground">{notice}</p>}

    <ToolAiPanel fingerprint={JSON.stringify(profile)} cost={1} disabled={!complete}
      prepare={async () => ({ kind: "businessIdeas", consent: true, ...profile })}
      render={result => result.kind === "businessIdeas" && <div className="space-y-5">
        <h2 className="text-2xl font-semibold">Seu perfil de oportunidade</h2>
        <p>{result.diagnosis}</p>
        {result.ideas.map((idea, index) => <article key={index} className="space-y-3 rounded-lg border bg-background p-5">
          <h3 className="text-xl font-semibold">{index + 1}. {idea.title}</h3>
          <p>{idea.offer}</p>
          <dl className="grid gap-3">
            {[
              ["Por que combina com suas respostas", idea.fit],
              ["O que exige", idea.requirements],
              ["Como validar", idea.test],
              ["Sinal para avançar ou ajustar", idea.signal],
            ].map(([label, text]) => <div key={label}><dt className="font-semibold">{label}</dt><dd>{text}</dd></div>)}
          </dl>
          <a className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-5 py-2.5 text-center text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" href={"/ferramentas/criador-de-plano-de-negocios-e-marcas?ideia=" + encodeURIComponent(idea.title + " — " + idea.offer)} aria-label={"Criar plano para esta ideia: " + idea.title}>Criar plano para esta ideia</a>
        </article>)}
        <h3 className="font-semibold">Primeiro passo recomendado</h3>
        <p>{result.nextStep}</p>
      </div>}>
      {!complete && <p className="text-sm">Preencha suas habilidades e as escolhas obrigatórias para gerar uma análise baseada no seu perfil informado.</p>}
    </ToolAiPanel>
  </div>;
}
