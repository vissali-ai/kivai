"use client";

import { useEffect, useMemo, useState } from "react";
import { ToolAiPanel } from "@/components/tools/tool-ai-panel";
import { brandFinancials } from "@/lib/brand-financials";

const profileLabels = {
  niche: "Nicho da marca",
  offer: "Produto e diferencial",
  customer: "Cliente ideal e necessidade",
  stage: "Estágio atual",
  operations: "Produção, fornecedores e recursos",
  channel: "Canal de venda",
  deadline: "Prazo e objetivo do lançamento",
};

const hints = {
  niche: "Roupas, skates, acessórios ou outro nicho",
  offer: "Qual produto pretende lançar e por que alguém o escolheria?",
  customer: "Quem compra e qual problema ou necessidade você pretende atender?",
  stage: "Ideia, protótipo, primeiras vendas ou expansão",
  operations: "Produção própria, terceirizada, sob encomenda ou revenda",
  channel: "Loja online, marketplace, eventos ou varejo",
  deadline: "Ex.: testar a primeira coleção em três meses",
};

const limits = { niche: 150, offer: 800, customer: 800, stage: 100, operations: 800, channel: 300, deadline: 200 };
const moneyLabels = {
  budget: "Orçamento disponível (R$)",
  price: "Preço de venda por unidade (R$)",
  unitCost: "Custo variável por unidade, incluindo embalagem e frete pago pela marca (R$)",
  fee: "Taxas e tributos proporcionais à venda (%)",
  lot: "Unidades do primeiro lote",
  setup: "Despesas únicas de implantação (R$)",
  fixed: "Custos fixos mensais (R$)",
};

type ProfileKey = keyof typeof profileLabels;
type MoneyKey = keyof typeof moneyLabels;
type Profile = Record<ProfileKey, string>;
type Numbers = Record<MoneyKey, string>;

const emptyProfile = { niche: "", offer: "", customer: "", stage: "", operations: "", channel: "", deadline: "" };
const emptyNumbers = { budget: "", price: "", unitCost: "", fee: "", lot: "", setup: "", fixed: "" };
const requiredProfile: ProfileKey[] = ["niche", "offer", "customer"];
const optionalProfile: ProfileKey[] = ["stage", "operations", "channel", "deadline"];
const financialKeys = Object.keys(moneyLabels) as MoneyKey[];
const storageKey = "kivai.brand-plan-draft.v2";
const control = "mt-2 w-full rounded-md border bg-background px-3 py-2 font-normal";
const money = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function parseOptionalNumber(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function validNumber(key: MoneyKey, value: string) {
  if (!value.trim()) return true;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100000000) return false;
  if (key === "price" && parsed < 0.01) return false;
  if (key === "fee" && parsed > 100) return false;
  if (key === "lot" && (!Number.isInteger(parsed) || parsed < 1 || parsed > 1000000)) return false;
  return Math.abs(parsed * 100 - Math.round(parsed * 100)) < 0.00001;
}

export default function Questionnaire({ initialOffer }: { initialOffer: string }) {
  const [profile, setProfile] = useState<Profile>({ ...emptyProfile, offer: initialOffer });
  const [numbers, setNumbers] = useState<Numbers>(emptyNumbers);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "null") as { profile?: Partial<Profile>; numbers?: Partial<Numbers> } | null;
      if (saved && typeof saved === "object") {
        const restoredProfile = { ...emptyProfile, ...(saved.profile ?? {}) };
        const restoredNumbers = { ...emptyNumbers, ...(saved.numbers ?? {}) };
        for (const key of Object.keys(restoredProfile) as ProfileKey[]) if (typeof restoredProfile[key] !== "string") restoredProfile[key] = "";
        for (const key of Object.keys(restoredNumbers) as MoneyKey[]) if (typeof restoredNumbers[key] !== "string") restoredNumbers[key] = "";
        if (initialOffer) restoredProfile.offer = initialOffer;
        setProfile(restoredProfile);
        setNumbers(restoredNumbers);
      }
    } catch {
      setNotice("Não foi possível recuperar o rascunho salvo neste navegador.");
    }
    setReady(true);
  }, [initialOffer]);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify({ profile, numbers }));
    } catch {
      setNotice("Não foi possível salvar o rascunho neste navegador.");
    }
  }, [profile, numbers, ready]);

  const finances = useMemo(() => ({
    budget: parseOptionalNumber(numbers.budget),
    price: parseOptionalNumber(numbers.price),
    unitCost: parseOptionalNumber(numbers.unitCost),
    fee: parseOptionalNumber(numbers.fee),
    lot: parseOptionalNumber(numbers.lot),
    setup: parseOptionalNumber(numbers.setup),
    fixed: parseOptionalNumber(numbers.fixed),
  }), [numbers]);

  const financialValid = financialKeys.every(key => validNumber(key, numbers[key]));
  const profileComplete = requiredProfile.every(key => profile[key].trim());
  const complete = profileComplete && financialValid;
  const simulationReady = financialKeys.every(key => numbers[key].trim() !== "") && financialValid;

  const totals = simulationReady ? brandFinancials({
    budget: Number(numbers.budget),
    price: Number(numbers.price),
    unitCost: Number(numbers.unitCost),
    fee: Number(numbers.fee),
    lot: Number(numbers.lot),
    setup: Number(numbers.setup),
    fixed: Number(numbers.fixed),
  }) : null;

  const group = "grid gap-4 rounded-xl border bg-card p-5 sm:grid-cols-2";

  return <div className="space-y-6">
    <fieldset className={group}>
      <legend className="px-2 font-semibold">Marca e mercado</legend>
      {requiredProfile.map(key => <label key={key}>{profileLabels[key]} <span className="text-xs font-medium text-primary">obrigatório</span>
        <textarea rows={2} maxLength={limits[key]} className={control} placeholder={hints[key]} value={profile[key]} onChange={event => setProfile(previous => ({ ...previous, [key]: event.target.value }))} />
      </label>)}
      {optionalProfile.map(key => <label key={key}>{profileLabels[key]} <span className="text-xs text-muted-foreground">opcional</span>
        <textarea rows={2} maxLength={limits[key]} className={control} placeholder={hints[key]} value={profile[key]} onChange={event => setProfile(previous => ({ ...previous, [key]: event.target.value }))} />
      </label>)}
    </fieldset>

    <fieldset className={group}>
      <legend className="px-2 font-semibold">Cenário financeiro <span className="font-normal text-muted-foreground">(opcional)</span></legend>
      <p className="text-sm leading-6 text-muted-foreground sm:col-span-2">Você pode gerar o plano sem conhecer taxas, tributos ou todos os custos. Deixe em branco o que ainda não sabe. A IA deve tratar esses dados como pendências, sem presumir zero. A simulação financeira só aparece quando todos os valores desta seção estiverem preenchidos.</p>
      {financialKeys.map(key => <label key={key}>{moneyLabels[key]} <span className="text-xs text-muted-foreground">opcional</span>
        <input className={control} type="number" min={key === "lot" ? 1 : key === "price" ? 0.01 : 0} max={key === "fee" ? 100 : key === "lot" ? 1000000 : 100000000} step={key === "lot" ? 1 : 0.01} value={numbers[key]} onChange={event => setNumbers(previous => ({ ...previous, [key]: event.target.value }))} />
      </label>)}
      {!financialValid && <p role="alert" className="text-sm text-destructive sm:col-span-2">Revise os valores preenchidos. Campos financeiros vazios são aceitos.</p>}
    </fieldset>

    {totals && <section className="rounded-xl border p-5">
      <h2 className="mb-3 text-lg font-semibold">Simulação do primeiro lote</h2>
      <dl className="grid gap-3 sm:grid-cols-2">
        {[
          ["Lote e implantação", money(totals.initialLotAndSetup)],
          ["Saldo após lote e implantação", money(totals.remainingBudget)],
          ["Contribuição por unidade", money(totals.contributionPerUnit)],
          ["Margem de contribuição", (totals.contributionMarginPercent ?? 0).toLocaleString("pt-BR", { maximumFractionDigits: 2 }) + "%"],
          ["Ponto de equilíbrio mensal", totals.monthlyBreakEvenUnits === null ? "Inviável com esta contribuição" : totals.monthlyBreakEvenUnits + " unidades"],
        ].map(([label, value]) => <div key={label}><dt>{label}</dt><dd className="font-semibold">{value}</dd></div>)}
      </dl>
    </section>}

    <p className="text-sm text-muted-foreground">Seu rascunho fica salvo neste navegador. Se precisar entrar na conta para usar a IA, os dados serão restaurados quando você voltar.</p>
    {notice && <p role="status" className="text-sm text-muted-foreground">{notice}</p>}

    <ToolAiPanel cost={1} fingerprint={JSON.stringify([profile, numbers])} disabled={!complete}
      prepare={async () => ({ kind: "brandPlan", consent: true, ...profile, finances })}
      render={result => result.kind === "brandPlan" && <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Plano da sua marca</h2>
        {[
          ["Diagnóstico", result.diagnosis],
          ["Posicionamento e oferta", result.positioning],
          ["Operação e fornecedores", result.operations],
          ["Viabilidade e dados a confirmar", result.economics],
        ].map(([title, body]) => <section key={title}><h3 className="font-semibold">{title}</h3><p>{body}</p></section>)}
        <h3 className="font-semibold">Roteiro de lançamento</h3>
        <ol className="space-y-3">{result.launch.map((step, index) => <li key={index}><strong>{step.phase}</strong><p>{step.action}</p><p>Indicador: {step.metric}</p></li>)}</ol>
        <h3 className="font-semibold">Riscos e próximo teste</h3>
        <p>{result.risks}</p>
      </div>}>
      {!profileComplete && <p className="text-sm">Preencha nicho, produto/diferencial e cliente ideal para gerar o plano. Os demais campos podem ficar em branco.</p>}
    </ToolAiPanel>
  </div>;
}
