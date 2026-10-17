/**
 * Diagnósticos iniciais transparentes para dados de relatórios CSV.
 * Não inventam contexto externo, recomendações da plataforma ou métricas ausentes.
 * Os limites são heurísticas conservadoras do Kivai, não regras oficiais do Google.
 */
export type DiagnosticLevel = "critical" | "attention" | "observe" | "positive" | "missing";
export type DiagnosticAction = "revisar_agora" | "investigar" | "aguardar" | "manter" | "completar_dados";

export type Diagnostic = {
  id: string;
  level: DiagnosticLevel;
  action: DiagnosticAction;
  title: string;
  finding: string;
  evidence: string;
  recommendation: string;
  caveat?: string;
};

export type MonthlyGoals = {
  budget: number | null;
  leads: number | null;
  maxCpl: number | null;
  targetRoas: number | null;
  monthlyRevenue: number | null;
  conversionsAreLeads: boolean;
  conversionValueIsRevenue: boolean;
  // Objetivo selecionado pelo usuário; metas específicas são opcionais.
  objective?: "leads" | "sales" | "traffic" | "awareness" | "video" | "app" | "other";
  targetConversions?: number | null;
  maxCpa?: number | null;
  targetClicks?: number | null;
  targetImpressions?: number | null;
};

export type ReportTotals = {
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  conversionValue: number | null;
  campaignCount: number;
};

export type DiagnosticInput = {
  goals: MonthlyGoals;
  totals: ReportTotals;
  start: string;
  end: string;
  campaignStartedOn?: string;
  lastMajorChangeOn?: string;
  currencyCode?: string;
};

export type AccumulatedPace = {
  label: string;
  unit: "count" | "currency";
  monthlyTarget: number;
  expectedToDate: number;
  actual: number;
  difference: number;
  differencePct: number;
  achievedPct: number;
  remainingMonthly: number;
  periodPct: number;
};

/**
 * Comparação de quantidade ou valor acumulado, mantendo precisão completa
 * para cálculos e arredondando exclusivamente na apresentação.
 * Não utilizar esta função para CPL, CPC, CTR, CPA ou ROAS.
 */
export function compareAccumulatedGoal(
  label: string,
  unit: AccumulatedPace["unit"],
  target: number | null,
  actual: number,
  period: PeriodInfo,
): AccumulatedPace | null {
  if (!period.valid || target === null ||
      !Number.isFinite(target) || target <= 0 || !Number.isFinite(actual) || actual < 0) return null;
  const expectedToDate = target * period.ratio;
  if (expectedToDate <= 0) return null;
  return {
    label, unit, monthlyTarget: target, expectedToDate, actual,
    difference: actual - expectedToDate,
    differencePct: (actual / expectedToDate - 1) * 100,
    achievedPct: (actual / expectedToDate) * 100,
    remainingMonthly: Math.max(0, target - actual),
    periodPct: period.ratio * 100,
  };
}

export type PeriodInfo = {
  valid: boolean;
  fullMonthToDate: boolean;
  elapsedDays: number;
  daysInMonth: number;
  ratio: number;
  reportDays: number;
  reason?: string;
};

function readISO(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(value + "T12:00:00Z");
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date;
}

function differenceDays(start: Date, end: Date) {
  // Datas artificiais no meio do dia UTC, para não misturar fusos e DST.
  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
}

export function inspectPeriod(start: string, end: string): PeriodInfo {
  const from = readISO(start), to = readISO(end);
  const empty = { valid: false, fullMonthToDate: false, elapsedDays: 0, daysInMonth: 0, ratio: 0, reportDays: 0 };
  if (!from || !to || from > to) return { ...empty, reason: "Informe o início e o fim corretos do período exportado." };
  const year = from.getUTCFullYear();
  const month = from.getUTCMonth();
  const sameMonth = year === to.getUTCFullYear() && month === to.getUTCMonth();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0, 12)).getUTCDate();
  const reportDays = differenceDays(from, to) + 1;
  if (reportDays > 366) return { ...empty, reportDays, reason: "Escolha no máximo 366 dias por análise." };
  const fullMonthToDate = sameMonth && from.getUTCDate() === 1;
  // A meta é mensal. Para um intervalo arbitrário, somamos a fração de cada
  // mês civil incluída no período, inclusive ao atravessar meses/anos.
  let ratio = 0;
  let cursor = new Date(from);
  while (cursor <= to) {
    const y = cursor.getUTCFullYear();
    const m = cursor.getUTCMonth();
    const totalDays = new Date(Date.UTC(y, m + 1, 0, 12)).getUTCDate();
    const last = new Date(Date.UTC(y, m, totalDays, 12));
    const segmentEnd = to < last ? to : last;
    ratio += (differenceDays(cursor, segmentEnd) + 1) / totalDays;
    cursor = new Date(Date.UTC(y, m, segmentEnd.getUTCDate() + 1, 12));
  }
  return {
    valid: true, fullMonthToDate, elapsedDays: reportDays,
    daysInMonth, ratio, reportDays,
  };
}

export function durationSince(dateISO: string | undefined, endISO: string) {
  if (!dateISO) return null;
  const date = readISO(dateISO), end = readISO(endISO);
  if (!date || !end || date > end) return null;
  return differenceDays(date, end) + 1;
}

export function buildCampaignDiagnostics(input: DiagnosticInput): {
  insights: Diagnostic[];
  period: PeriodInfo;
  metrics: { cpl: number | null; roas: number | null; budgetPacing: number | null; leadsPacing: number | null };
  pacing: { leads: AccumulatedPace | null; investment: AccumulatedPace | null; revenue: AccumulatedPace | null;
    conversions: AccumulatedPace | null; clicks: AccumulatedPace | null; impressions: AccumulatedPace | null };
} {
  const { goals, totals } = input;
  const period = inspectPeriod(input.start, input.end);
  const insights: Diagnostic[] = [];
  const pacing = {
    leads: goals.conversionsAreLeads
      ? compareAccumulatedGoal("Leads", "count", goals.leads, totals.conversions, period)
      : null,
    investment: compareAccumulatedGoal("Investimento", "currency", goals.budget, totals.cost, period),
    revenue: goals.conversionValueIsRevenue && totals.conversionValue !== null
      ? compareAccumulatedGoal("Receita atribuída", "currency", goals.monthlyRevenue, totals.conversionValue, period)
      : null,
    conversions: compareAccumulatedGoal("Conversões registradas", "count", goals.targetConversions ?? null, totals.conversions, period),
    clicks: compareAccumulatedGoal("Cliques", "count", goals.targetClicks ?? null, totals.clicks, period),
    impressions: compareAccumulatedGoal("Impressões", "count", goals.targetImpressions ?? null, totals.impressions, period),
  };

  const money = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: /^[A-Z]{3}$/.test(input.currencyCode ?? "") ? input.currencyCode : "BRL" });
  const number = (value: number) => value.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
  const cpl = totals.conversions > 0 && goals.conversionsAreLeads ? totals.cost / totals.conversions : null;
  const roas = totals.conversionValue !== null && totals.cost > 0 ? totals.conversionValue / totals.cost : null;
  const budgetPacing = period.valid && goals.budget !== null && goals.budget > 0
    ? totals.cost / (goals.budget * period.ratio) : null;
  const leadsPacing = period.valid && goals.leads !== null && goals.leads > 0 && goals.conversionsAreLeads
    ? totals.conversions / (goals.leads * period.ratio) : null;
  const revenuePacing = period.valid && goals.monthlyRevenue !== null && goals.monthlyRevenue > 0 &&
    goals.conversionValueIsRevenue && totals.conversionValue !== null
    ? totals.conversionValue / (goals.monthlyRevenue * period.ratio) : null;

  const add = (diagnostic: Diagnostic) => insights.push(diagnostic);
  const enoughDays = period.valid && period.reportDays >= 7;
  const enoughConversions = totals.conversions >= 5;
  const campaignAgeDays = durationSince(input.campaignStartedOn, input.end);
  const lastChangeDays = durationSince(input.lastMajorChangeOn, input.end);

  if (!period.valid) {
    add({
      id: "period_incomplete", level: "missing", action: "completar_dados",
      title: "Conferir o período antes de avaliar as metas",
      finding: period.reason ?? "Período não informado.",
      evidence: input.start && input.end ? input.start + " a " + input.end : "Datas incompletas",
      recommendation: "Selecione um intervalo real de até 366 dias e, para CSV, exporte exatamente o mesmo período.",
    });
  }

  if (!goals.conversionsAreLeads && goals.leads !== null && goals.leads > 0) {
    add({
      id: "lead_definition", level: "missing", action: "completar_dados",
      title: "Confirmar que as conversões são leads",
      finding: "O Google Ads pode contar compras, contatos e outras ações como conversão. Ainda não é possível usar o total como leads.",
      evidence: number(totals.conversions) + " conversões registradas no relatório.",
      recommendation: "Confirme a ação de conversão que representa leads ou importe relatório segmentado por ação de conversão.",
    });
  }

  if (period.valid && goals.budget !== null && goals.budget > 0) {
    const expected = goals.budget * period.ratio;
    if (totals.cost > goals.budget * period.ratio * 1.20) {
      add({
        id: "budget_exceeded", level: "critical", action: "revisar_agora",
        title: "Investimento acima da referência proporcional",
        finding: "O gasto está acima do ritmo linear da meta mensal para o intervalo escolhido.",
        evidence: money(totals.cost) + " gastos; referência proporcional: " + money(expected) + ".",
        recommendation: "Revise imediatamente orçamento autorizado, outras campanhas incluídas e período. Não ajuste lances às cegas.",
      });
    } else if (period.elapsedDays >= 4 && budgetPacing !== null && budgetPacing > 1.20) {
      add({
        id: "budget_fast", level: "attention", action: "investigar",
        title: "Orçamento consumido acima do ritmo planejado",
        finding: "O investimento acumulado está acima da proporção linear do mês.",
        evidence: money(totals.cost) + " gastos; referência proporcional de " + money(expected) + ".",
        recommendation: "Confira programação, sazonalidade, campanhas que puxaram o gasto e o orçamento contratado antes de redistribuir valores.",
        caveat: "A distribuição de gasto não precisa ser linear se a estratégia do cliente determinar outra curva.",
      });
    } else if (period.elapsedDays >= 7 && budgetPacing !== null && budgetPacing < 0.65) {
      add({
        id: "budget_slow", level: "observe", action: "investigar",
        title: "Campanhas consumindo menos verba que a projeção mensal",
        finding: "O gasto ficou abaixo da referência linear do mês.",
        evidence: money(totals.cost) + " gastos; referência proporcional de " + money(expected) + ".",
        recommendation: "Antes de aumentar lances ou orçamento, investigue aprovação, elegibilidade, alcance potencial, segmentação e estratégia de lances da modalidade analisada.",
      });
    }
  }

  if (period.valid && goals.leads !== null && goals.leads > 0 && goals.conversionsAreLeads) {
    const expectedLeads = goals.leads * period.ratio;
    if (period.elapsedDays >= 7 && leadsPacing !== null && leadsPacing < 0.75) {
      add({
        id: "leads_behind", level: "attention", action: "investigar",
        title: "Leads abaixo do ritmo necessário para a meta",
        finding: "O número de leads acumulados está abaixo da projeção proporcional para o período.",
        evidence: number(totals.conversions) + " leads de " + number(goals.leads) + " previstos no mês; referência até a data: " + number(expectedLeads) + ".",
        recommendation: "Investigue distribuição da verba, termos, anúncios, landing pages e mensuração antes de alterar a campanha.",
        caveat: "Metas podem ter sazonalidade; o cálculo usa ritmo linear, não previsão de entrega.",
      });
    } else if (period.elapsedDays >= 7 && leadsPacing !== null && leadsPacing >= 1.05) {
      add({
        id: "leads_on_target", level: "positive", action: "manter",
        title: "Leads no ritmo ou acima da meta",
        finding: "Até esta data, o resultado alcançou pelo menos o ritmo linear mensal.",
        evidence: number(totals.conversions) + " leads; referência até a data: " + number(expectedLeads) + ".",
        recommendation: "Preserve o que está funcionando e valide a qualidade dos leads antes de planejar escala.",
      });
    }
  }

  if (goals.monthlyRevenue !== null && goals.monthlyRevenue > 0) {
    if (!goals.conversionValueIsRevenue || totals.conversionValue === null) {
      add({
        id: "revenue_definition", level: "missing", action: "completar_dados",
        title: "Faturamento e valor de conversão ainda não podem ser comparados",
        finding: "A receita total da empresa não equivale necessariamente ao valor de conversão atribuído no Google Ads.",
        evidence: "Meta de faturamento atribuído: " + money(goals.monthlyRevenue) + ".",
        recommendation: "Verifique a origem e abrangência das conversões de valor e confirme se a meta se refere ao faturamento atribuível.",
      });
    } else if (period.valid && period.elapsedDays >= 7 && revenuePacing !== null) {
      const expectedRevenue = goals.monthlyRevenue * period.ratio;
      if (revenuePacing < 0.75) {
        add({
          id: "revenue_behind", level: "attention", action: "investigar",
          title: "Valor de conversão abaixo da meta mensal proporcional",
          finding: "O valor de conversão atribuído ficou abaixo da referência linear do mês.",
          evidence: money(totals.conversionValue) + " atribuídos; referência até a data: " + money(expectedRevenue) + ".",
          recommendation: "Confirme atribuição e atrasos de conversão e investigue campanhas, produtos e públicos com menor retorno antes de ajustar lances.",
          caveat: "Este valor depende da mensuração Google Ads; não representa faturamento total da empresa.",
        });
      } else if (revenuePacing >= 1.05) {
        add({
          id: "revenue_healthy", level: "positive", action: "manter",
          title: "Valor atribuído acompanha ou supera o plano",
          finding: "A receita atribuída atingiu o ritmo linear configurado.",
          evidence: money(totals.conversionValue) + " atribuídos; referência proporcional: " + money(expectedRevenue) + ".",
          recommendation: "Preserve o que funciona e confirme rentabilidade e capacidade de atendimento antes de escalar.",
        });
      }
    }
  }

  if (goals.maxCpl !== null && goals.maxCpl > 0 && cpl !== null) {
    if (cpl > goals.maxCpl * 1.20) {
      add({
        id: "cpl_above", level: enoughDays && enoughConversions ? "attention" : "observe",
        action: enoughDays && enoughConversions ? "investigar" : "aguardar",
        title: "Custo por lead acima da meta",
        finding: "O CPL está acima do limite configurado pelo gestor.",
        evidence: money(cpl) + " por lead; meta máxima " + money(goals.maxCpl) + "; amostra de " + number(totals.conversions) + " leads.",
        recommendation: enoughDays && enoughConversions
          ? "Priorize investigação de campanhas com maior custo, intenção dos termos, segmentação e conversão da página."
          : "O desvio merece acompanhamento, mas a amostra ainda pode ser insuficiente para alterações estruturais.",
        caveat: "Esse cálculo pressupõe que todas as conversões do relatório representam leads.",
      });
    } else if (enoughDays && enoughConversions) {
      add({
        id: "cpl_healthy", level: "positive", action: "manter",
        title: "CPL dentro do limite informado",
        finding: "O custo por lead está dentro da referência registrada no plano.",
        evidence: money(cpl) + " por lead; limite " + money(goals.maxCpl) + ".",
        recommendation: "Acompanhe qualidade dos leads e taxa de fechamento. Não aumente investimento somente pelo CPL.",
      });
    }
  }

  // Para qualquer modalidade: comparar taxa de conversões somente quando
  // uma meta genérica tiver sido informada. Nunca assumir que conversão = lead.
  if (goals.targetConversions !== null && goals.targetConversions !== undefined &&
      goals.targetConversions > 0 && pacing.conversions !== null) {
    const expected = pacing.conversions.expectedToDate;
    if (period.reportDays >= 7 && totals.conversions < expected * 0.75) {
      add({
        id: "conversions_behind", level: "attention", action: "investigar",
        title: "Conversões abaixo da meta proporcional",
        finding: "O total de conversões está abaixo do ritmo de referência para o período selecionado.",
        evidence: number(totals.conversions) + " conversões; referência no intervalo: " + number(expected) + ".",
        recommendation: "Confira o objetivo e as ações de conversão antes de revisar criativos, público ou orçamento. Use relatórios próprios da modalidade.",
      });
    } else if (period.reportDays >= 7 && totals.conversions >= expected) {
      add({
        id: "conversions_on_target", level: "positive", action: "manter",
        title: "Conversões no ritmo da meta",
        finding: "O volume de conversões acompanha ou supera a referência linear do intervalo.",
        evidence: number(totals.conversions) + " conversões; referência: " + number(expected) + ".",
        recommendation: "Preserve os fatores que funcionam e confira qualidade e atribuição antes de escalar.",
      });
    }
  }
  if (goals.maxCpa !== null && goals.maxCpa !== undefined && goals.maxCpa > 0 && totals.conversions > 0) {
    const cpa = totals.cost / totals.conversions;
    if (cpa > goals.maxCpa * 1.2) {
      add({
        id: "cpa_above", level: enoughDays && enoughConversions ? "attention" : "observe",
        action: enoughDays && enoughConversions ? "investigar" : "aguardar",
        title: "Custo por conversão acima da referência",
        finding: "O CPA está acima do limite definido para o objetivo informado.",
        evidence: money(cpa) + " por conversão; limite informado: " + money(goals.maxCpa) + ".",
        recommendation: "Confirme se as conversões correspondem ao objetivo desejado e avalie os resultados por modalidade antes de alterar lances.",
      });
    }
  }
  for (const pace of [pacing.clicks, pacing.impressions]) {
    if (pace && period.reportDays >= 7 && pace.actual < pace.expectedToDate * 0.7) {
      add({
        id: "volume_below_" + pace.label.toLowerCase(), level: "observe", action: "investigar",
        title: pace.label + " abaixo da meta proporcional",
        finding: "O volume acumulado está abaixo da referência linear do período.",
        evidence: number(pace.actual) + " realizados; referência: " + number(pace.expectedToDate) + ".",
        recommendation: "Revise entrega, segmentação, elegibilidade e objetivo da campanha antes de aumentar o investimento.",
      });
    }
  }

  if (goals.targetRoas !== null && goals.targetRoas > 0) {
    if (roas === null) {
      add({
        id: "roas_missing", level: "missing", action: "completar_dados",
        title: "Falta valor de conversão para avaliar ROAS",
        finding: "O relatório ainda não contém valores de conversão completos.",
        evidence: "Meta ROAS: " + number(goals.targetRoas) + "x.",
        recommendation: "Inclua a coluna Valor de conversão e valide se corresponde a receita atribuída, não ao faturamento total da empresa.",
      });
    } else if (roas < goals.targetRoas * 0.8) {
      add({
        id: "roas_below", level: enoughDays && enoughConversions ? "attention" : "observe",
        action: enoughDays && enoughConversions ? "investigar" : "aguardar",
        title: "ROAS abaixo da meta planejada",
        finding: "O retorno atribuído está abaixo da referência de ROAS cadastrada.",
        evidence: number(roas) + "x registrado; meta " + number(goals.targetRoas) + "x.",
        recommendation: enoughDays && enoughConversions
          ? "Avalie produtos ou serviços, valor de conversão, criativos, públicos e estratégia de lances antes de alterar o orçamento."
          : "Confirme atrasos de conversão e volume de dados antes de realizar mudanças estruturais.",
      });
    } else if (enoughDays && enoughConversions && roas >= goals.targetRoas) {
      add({
        id: "roas_on_target", level: "positive", action: "manter",
        title: "ROAS atingiu a meta cadastrada",
        finding: "A receita atribuída por real investido está acima da meta informada.",
        evidence: number(roas) + "x de ROAS; meta " + number(goals.targetRoas) + "x.",
        recommendation: "Preserve o aprendizado e avalie margem, lucro e capacidade de atendimento antes de expandir o investimento.",
      });
    }
  }

  if (totals.cost > 0 && totals.conversions === 0 &&
      !["awareness", "video", "traffic"].includes(goals.objective ?? "")) {
    const cpaTarget = goals.maxCpa ?? goals.maxCpl;
    const limit = cpaTarget !== null && cpaTarget !== undefined && cpaTarget > 0 ? cpaTarget * 3 : null;
    const noteworthy = limit !== null && totals.cost >= limit && enoughDays;
    add({
      id: "zero_conversions", level: noteworthy ? "attention" : "observe",
      action: noteworthy ? "investigar" : "aguardar",
      title: "Custo registrado sem conversões no período",
      finding: "O relatório informa gasto, mas nenhuma conversão.",
      evidence: money(totals.cost) + " gastos; 0 conversões; " + number(totals.clicks) + " cliques.",
      recommendation: noteworthy
        ? "Verifique a mensuração, aprovação, objetivo, público e criativos compatíveis com a modalidade antes de concluir que a campanha falhou."
        : "Acompanhe o volume de dados e revise primeiro se a mensuração está correta.",
    });
  }

  if (totals.impressions === 0 && period.valid && period.reportDays >= 3) {
    add({
      id: "no_impressions", level: "attention", action: "investigar",
      title: "Sem impressões registradas",
      finding: "As campanhas do arquivo não registraram impressões durante o período.",
      evidence: number(totals.impressions) + " impressões em " + period.reportDays + " dias.",
      recommendation: "Confira se o CSV contém campanhas ativas, datas corretas, aprovação de anúncios, orçamento e elegibilidade.",
    });
  }

  if (campaignAgeDays !== null && campaignAgeDays <= 7) {
    add({
      id: "new_campaign", level: "observe", action: "aguardar",
      title: "Campanha recém-iniciada: evite alterações precipitadas",
      finding: "O início informado é recente e o resultado pode não ter volume suficiente para conclusões.",
      evidence: campaignAgeDays + (campaignAgeDays === 1 ? " dia desde o início informado." : " dias desde o início informado."),
      recommendation: "Mantenha acompanhamento e evite reconfigurações estruturais sem evidências, mas corrija imediatamente recusas, falhas de rastreamento e riscos de orçamento.",
      caveat: "Sete dias não é prazo oficial universal de aprendizado. A fase real depende da estratégia e dos eventos de conversão.",
    });
  }

  if (lastChangeDays !== null && lastChangeDays <= 3) {
    add({
      id: "recent_change", level: "observe", action: "aguardar",
      title: "Alteração recente: confira o impacto antes de mexer novamente",
      finding: "Foi informada uma mudança relevante nos últimos dias.",
      evidence: lastChangeDays + (lastChangeDays === 1 ? " dia desde a mudança." : " dias desde a mudança."),
      recommendation: "Monitore a evolução e evite somar mudanças sem identificar seus efeitos. A exceção são problemas críticos.",
      caveat: "A existência de alteração não comprova que ela causou o desempenho observado.",
    });
  }

  if (!insights.some((item) => item.level === "critical" || item.level === "attention") &&
      !insights.some((item) => item.action === "aguardar" || item.action === "manter")) {
    add({
      id: "not_enough_evidence", level: "observe", action: "aguardar",
      title: "Sem evidência suficiente para recomendar mudanças",
      finding: "Os dados importados não indicam uma ação estrutural inequívoca.",
      evidence: number(totals.clicks) + " cliques, " + number(totals.conversions) + " conversões no relatório.",
      recommendation: "Mantenha o monitoramento e importe recomendações, anúncios, palavras-chave e outros relatórios específicos para uma auditoria completa.",
    });
  }

  const order: Record<DiagnosticLevel, number> = { critical: 0, attention: 1, observe: 2, positive: 3, missing: 4 };
  insights.sort((a, b) => order[a.level] - order[b.level]);

  return { insights, period, metrics: { cpl, roas, budgetPacing, leadsPacing }, pacing };
}
