import type { Diagnostic } from "@/lib/google-ads/diagnostics";

const visuals = {
  critical: { label: "Atenção imediata", tone: "border-red-400/35 bg-red-400/10 text-red-700" },
  attention: { label: "Investigar", tone: "border-amber-400/30 bg-amber-400/10 text-amber-200" },
  observe: { label: "Monitorar", tone: "border-sky-400/25 bg-sky-400/10 text-sky-200" },
  positive: { label: "Preservar", tone: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" },
  missing: { label: "Dados pendentes", tone: "border-border bg-card text-muted-foreground" },
} as const;

const actions = {
  revisar_agora: "Revisar agora",
  investigar: "Investigar antes de alterar",
  aguardar: "Aguardar e monitorar",
  manter: "Manter e acompanhar",
  completar_dados: "Complementar os dados",
} as const;

export function GoogleAdsDiagnosticFeed({ insights, title = "Prioridades e recomendações" }: {
  insights: Diagnostic[]; title?: string;
}) {
  return (
    <section aria-label={title} className="mt-8 rounded-xl border border-border bg-card p-5">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-xs leading-6 text-muted-foreground">
        Diagnóstico automático baseado em regras e nas métricas informadas. Não utiliza IA
        nem importa recomendações oficiais do Google Ads. Nenhuma alteração é feita
        automaticamente nas campanhas.
      </p>
      {insights.length ? (
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {insights.map((item) => {
            const style = visuals[item.level];
            return (
              <article key={item.id} className="rounded-lg border border-border bg-background p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className={"rounded-full border px-2.5 py-1 text-[11px] font-medium " + style.tone}>
                    {style.label}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{actions[item.action]}</span>
                </div>
                <h4 className="mt-3 text-sm font-semibold">{item.title}</h4>
                <p className="mt-2 text-xs leading-6 text-muted-foreground">{item.finding}</p>
                <div className="mt-3 rounded-md border border-border bg-card p-3">
                  <p className="text-[11px] font-medium text-foreground">Evidência disponível</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.evidence}</p>
                </div>
                <p className="mt-3 text-xs leading-6">
                  <strong className="font-semibold">O que fazer: </strong>{item.recommendation}
                </p>
                {item.caveat ? <p className="mt-2 text-[11px] leading-5 text-muted-foreground">{item.caveat}</p> : null}
              </article>
            );
          })}
        </div>
      ) : <p className="mt-4 text-sm text-muted-foreground">Importe um relatório para gerar orientações fundamentadas.</p>}
    </section>
  );
}
