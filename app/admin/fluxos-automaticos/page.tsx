import { Clock3, GitBranchPlus, Mail, PlayCircle, Trash2 } from "lucide-react";
import {
  automationAudienceOptions,
  automationTriggerOptions,
  listAutomationFlows,
} from "@/lib/marketing/automation-flows";
import { supabaseRest } from "@/lib/blog/supabase";
import {
  createAutomationFlow,
  deleteAutomationFlow,
  toggleAutomationFlow,
  updateAutomationFlow,
} from "./actions";

export const dynamic = "force-dynamic";

type RunRow = {
  id: string;
  flow_id: string;
  status: string;
  scheduled_for: string;
  processed_at: string | null;
  error: string | null;
  created_at: string;
};

function triggerLabel(key: string) {
  return automationTriggerOptions.find((item) => item.key === key)?.label ?? key;
}

function audienceLabel(key: string) {
  return automationAudienceOptions.find((item) => item.key === key)?.label ?? key;
}

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

function FlowFields({ flow }: { flow?: Awaited<ReturnType<typeof listAutomationFlows>>[number] }) {
  return <>
    {flow ? <input type="hidden" name="id" value={flow.id} /> : null}
    <div className="grid gap-4 md:grid-cols-2">
      <label className="grid gap-1.5 text-sm"><span>Nome do fluxo</span><input name="name" required maxLength={140} defaultValue={flow?.name ?? ""} placeholder="Ex.: Nutrição após cadastro" className="h-10 border border-white/10 bg-background px-3" /></label>
      <label className="grid gap-1.5 text-sm"><span>Gatilho</span><select name="triggerKey" defaultValue={flow?.trigger_key ?? "account_created"} className="h-10 border border-white/10 bg-background px-3">{automationTriggerOptions.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}</select></label>
    </div>
    <div className="grid gap-4 md:grid-cols-2">
      <label className="grid gap-1.5 text-sm"><span>Público</span><select name="audience" defaultValue={flow?.audience ?? "all"} className="h-10 border border-white/10 bg-background px-3">{automationAudienceOptions.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}</select></label>
      <label className="grid gap-1.5 text-sm"><span>Atraso após o gatilho, em horas</span><input name="delayHours" type="number" min={0} max={720} defaultValue={flow?.delay_hours ?? 0} className="h-10 border border-white/10 bg-background px-3" /><span className="text-[11px] text-muted-foreground">0 = enviar na próxima execução automática. Máximo: 720 horas.</span></label>
    </div>
    <label className="grid gap-1.5 text-sm"><span>Assunto do e-mail</span><input name="subject" required maxLength={200} defaultValue={flow?.subject ?? ""} placeholder="Use {{nome}}, {{plano}}, {{titulo}}..." className="h-10 border border-white/10 bg-background px-3" /></label>
    <label className="grid gap-1.5 text-sm"><span>Conteúdo do e-mail</span><textarea name="message" required rows={9} defaultValue={flow?.message ?? ""} placeholder="Escreva o e-mail do zero. Variáveis disponíveis: {{nome}}, {{email}}, {{plano}}, {{titulo}}, {{resumo}}, {{link}}, {{data}}." className="w-full border border-white/10 bg-background p-3 text-sm leading-6" /><span className="text-[11px] text-muted-foreground">As variáveis só são preenchidas quando existirem no gatilho escolhido.</span></label>
    <div className="grid gap-4 md:grid-cols-2">
      <label className="grid gap-1.5 text-sm"><span>Botão principal</span><input name="ctaLabel" maxLength={80} defaultValue={flow?.cta_label ?? ""} placeholder="Ex.: Acessar agora" className="h-10 border border-white/10 bg-background px-3" /></label>
      <label className="grid gap-1.5 text-sm"><span>Link principal</span><input name="ctaUrl" defaultValue={flow?.cta_url ?? ""} placeholder="https://... ou {{link}}" className="h-10 border border-white/10 bg-background px-3" /></label>
    </div>
    <div className="grid gap-4 md:grid-cols-2">
      <label className="grid gap-1.5 text-sm"><span>Segundo botão, opcional</span><input name="secondaryCtaLabel" maxLength={80} defaultValue={flow?.secondary_cta_label ?? ""} className="h-10 border border-white/10 bg-background px-3" /></label>
      <label className="grid gap-1.5 text-sm"><span>Segundo link</span><input name="secondaryCtaUrl" defaultValue={flow?.secondary_cta_url ?? ""} placeholder="https://..." className="h-10 border border-white/10 bg-background px-3" /></label>
    </div>
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="enabled" defaultChecked={flow?.enabled ?? true} />Fluxo ativo</label>
  </>;
}

export default async function AutomaticFlowsPage({ searchParams }: { searchParams: Promise<{ created?: string; saved?: string }> }) {
  const query = await searchParams;
  const [flows, runs] = await Promise.all([
    listAutomationFlows(),
    supabaseRest<RunRow[]>("automation_flow_runs?select=id,flow_id,status,scheduled_for,processed_at,error,created_at&order=created_at.desc&limit=100"),
  ]);
  const runsByFlow = new Map<string, RunRow[]>();
  for (const run of runs) runsByFlow.set(run.flow_id, [...(runsByFlow.get(run.flow_id) ?? []), run]);

  return <div className="space-y-6">
    <section className="border border-white/10 bg-card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Automação própria</p><h1 className="mt-2 text-3xl font-semibold">Criar fluxos automáticos</h1><p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">Crie automações do zero escolhendo gatilho, público, atraso e conteúdo. Os fluxos criados ficam exclusivamente nesta área e os e-mails enviados continuam registrados na Fila de Comunicações.</p></div><GitBranchPlus className="size-8 text-primary" /></div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="border border-white/10 p-3"><p className="text-xs text-muted-foreground">Fluxos criados</p><p className="mt-1 text-xl font-semibold">{flows.length}</p></div><div className="border border-white/10 p-3"><p className="text-xs text-muted-foreground">Ativos</p><p className="mt-1 text-xl font-semibold text-primary">{flows.filter((flow) => flow.enabled).length}</p></div><div className="border border-white/10 p-3"><p className="text-xs text-muted-foreground">Execuções registradas</p><p className="mt-1 text-xl font-semibold">{runs.length}</p></div></div>
      {query.created ? <p className="mt-4 text-sm text-emerald-300">Fluxo criado com sucesso.</p> : null}{query.saved ? <p className="mt-4 text-sm text-emerald-300">Fluxo atualizado com sucesso.</p> : null}
    </section>

    <section className="border border-primary/25 bg-primary/[0.035] p-5 sm:p-6">
      <div className="mb-5"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Novo fluxo</p><h2 className="mt-1 text-xl font-semibold">Configurar do zero</h2><p className="mt-2 text-xs leading-5 text-muted-foreground">A rotina automática verifica os gatilhos diariamente. O atraso é contado a partir do evento e o envio ocorre na primeira execução após o horário calculado.</p></div>
      <form action={createAutomationFlow} className="space-y-4"><FlowFields /><button className="inline-flex h-10 items-center gap-2 bg-primary px-5 text-sm font-semibold text-primary-foreground"><PlayCircle className="size-4" /> Criar fluxo automático</button></form>
    </section>

    <section className="space-y-3">
      <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Meus fluxos</p><h2 className="mt-1 text-xl font-semibold">Fluxos automáticos criados</h2></div>
      {flows.map((flow) => {
        const flowRuns = runsByFlow.get(flow.id) ?? [];
        const lastRun = flowRuns[0];
        return <details key={flow.id} className="border border-white/10 bg-card">
          <summary className="cursor-pointer list-none p-4 sm:p-5"><div className="grid items-center gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px_120px]"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{flow.name}</h3><span className={`border px-2 py-0.5 text-[10px] font-semibold ${flow.enabled ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-300" : "border-white/10 text-muted-foreground"}`}>{flow.enabled ? "ATIVO" : "PAUSADO"}</span></div><p className="mt-1 text-xs text-muted-foreground">{flow.subject}</p></div><div className="text-xs"><p className="text-muted-foreground">Gatilho</p><p className="mt-1 font-medium">{triggerLabel(flow.trigger_key)}</p></div><div className="text-xs"><p className="text-muted-foreground">Público</p><p className="mt-1 font-medium">{audienceLabel(flow.audience)}</p></div><div className="text-xs"><p className="text-muted-foreground">Atraso</p><p className="mt-1 font-medium">{flow.delay_hours}h</p></div></div></summary>
          <div className="grid gap-6 border-t border-white/10 p-5 xl:grid-cols-[minmax(0,1fr)_300px]">
            <form action={updateAutomationFlow} className="space-y-4"><FlowFields flow={flow} /><button className="h-9 border border-primary/30 bg-primary/10 px-4 text-xs font-semibold text-primary">Salvar alterações</button></form>
            <aside className="space-y-4">
              <div className="border border-white/10 p-4"><div className="flex items-center gap-2"><Clock3 className="size-4 text-primary" /><h4 className="font-semibold">Execução</h4></div><p className="mt-3 text-xs text-muted-foreground">Último registro</p><p className="mt-1 text-sm">{lastRun ? `${lastRun.status} · ${formatDate(lastRun.processed_at || lastRun.scheduled_for)}` : "Ainda não executado"}</p>{lastRun?.error ? <p className="mt-2 text-xs text-red-300">{lastRun.error}</p> : null}<p className="mt-3 text-xs text-muted-foreground">{flowRuns.length} execução(ões) registrada(s) neste histórico recente.</p></div>
              <form action={toggleAutomationFlow} className="border border-white/10 p-4"><input type="hidden" name="id" value={flow.id} /><input type="hidden" name="enabled" value={flow.enabled ? "false" : "true"} /><p className="text-xs text-muted-foreground">{flow.enabled ? "Pausar impede novos disparos sem apagar o fluxo." : "Reativar volta a considerar os próximos eventos elegíveis."}</p><button className="mt-3 h-9 w-full border border-white/10 px-3 text-xs font-semibold">{flow.enabled ? "Pausar fluxo" : "Reativar fluxo"}</button></form>
              <details className="border border-red-500/20 bg-red-500/[0.04] p-4"><summary className="cursor-pointer text-xs font-semibold text-red-300"><span className="inline-flex items-center gap-2"><Trash2 className="size-4" /> Excluir fluxo</span></summary><form action={deleteAutomationFlow} className="mt-3 space-y-2"><input type="hidden" name="id" value={flow.id} /><p className="text-xs text-muted-foreground">Digite EXCLUIR para apagar o fluxo e seu histórico de execuções.</p><input name="confirmation" required placeholder="EXCLUIR" className="h-9 w-full border border-red-500/20 bg-background px-2 text-xs" /><button className="h-9 w-full bg-red-500/15 text-xs font-semibold text-red-200">Excluir definitivamente</button></form></details>
              <div className="border border-white/10 p-4"><Mail className="size-4 text-primary" /><p className="mt-2 text-xs leading-5 text-muted-foreground">Cada envio criado por este fluxo gera um registro individual na Fila de Comunicações com destinatário, status e horário.</p></div>
            </aside>
          </div>
        </details>;
      })}
      {!flows.length ? <div className="border border-white/10 bg-card p-8 text-center text-sm text-muted-foreground">Nenhum fluxo criado ainda. Use o formulário acima para criar o primeiro.</div> : null}
    </section>
  </div>;
}
