"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, CalendarClock, FolderOpen } from "lucide-react";
import { getStoredSession } from "@/lib/user-auth";
import type { SavedProject } from "@/lib/projects/validation";
import { reminderToolChoices, reminderWeekdays, type ReminderPreference } from "@/lib/account/routine-reminder-options";

type SummaryState = {
  projects: SavedProject[] | null;
  reminder: ReminderPreference | null;
};

export function AccountWorkspaceOverview() {
  const [data, setData] = useState<SummaryState>({ projects: null, reminder: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getStoredSession()?.access_token;
    if (!token) { setLoading(false); return; }
    let active = true;
    const headers = { Authorization: `Bearer ${token}` };
    void Promise.allSettled([
      fetch("/api/account/projects", { headers, cache: "no-store" }),
      fetch("/api/account/routine-reminders", { headers, cache: "no-store" }),
    ]).then(async ([projectsResult, reminderResult]) => {
      let projects: SavedProject[] | null = null;
      let reminder: ReminderPreference | null = null;
      if (projectsResult.status === "fulfilled" && projectsResult.value.ok) {
        try {
          const response = await projectsResult.value.json() as { projects?: SavedProject[] };
          if (Array.isArray(response.projects)) projects = response.projects;
        } catch { /* Resumo indisponível; biblioteca continua acessível. */ }
      }
      if (reminderResult.status === "fulfilled" && reminderResult.value.ok) {
        try {
          const response = await reminderResult.value.json() as { preference?: ReminderPreference };
          if (response.preference) reminder = response.preference;
        } catch { /* Resumo indisponível; configurações continuam acessíveis. */ }
      }
      if (active) setData({ projects, reminder });
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const recent = data.projects?.slice().sort((a, b) =>
    Date.parse(b.updated_at) - Date.parse(a.updated_at)).slice(0, 3) ?? [];
  const routine = data.reminder?.enabled ? data.reminder : null;
  const tool = routine ? reminderToolChoices.find((item) => item.slug === routine.tool_slug) : null;

  return (
    <section aria-label="Continue de onde parou" className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Continue de onde parou</h2>
        <p className="mt-1 text-sm text-muted-foreground">Seus projetos e sua próxima atividade, em um só lugar.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <article className="flex min-w-0 flex-col rounded-2xl border border-border bg-card p-5 sm:p-6">
          <div className="flex items-center gap-2 text-primary"><FolderOpen className="size-5" /><h3 className="font-semibold">Meus Projetos</h3></div>
          <p className="mt-2 text-sm text-muted-foreground">{loading ? "Consultando projetos..." : data.projects ? `${data.projects.length} ${data.projects.length === 1 ? "projeto salvo" : "projetos salvos"}` : "Acesse sua biblioteca de projetos."}</p>
          <div className="mt-4 min-h-24 space-y-2">
            {recent.length ? recent.map(project => (
              <div key={project.id} className="flex min-w-0 items-center justify-between gap-2 rounded-lg bg-muted/40 px-3 py-2">
                <span className="min-w-0 truncate text-sm" title={project.title}>{project.title}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{new Date(project.updated_at).toLocaleDateString("pt-BR")}</span>
              </div>
            )) : <p className="text-sm text-muted-foreground">{!loading && data.projects?.length === 0 ? "Seus trabalhos salvos aparecerão aqui." : ""}</p>}
          </div>
          <Link href="/conta/projetos" className="mt-4 inline-flex min-h-11 items-center gap-2 self-start text-sm font-semibold text-primary hover:underline">
            Ver todos os projetos <ArrowRight className="size-4" />
          </Link>
        </article>
        <article className="flex min-w-0 flex-col rounded-2xl border border-border bg-card p-5 sm:p-6">
          <div className="flex items-center gap-2 text-primary"><CalendarClock className="size-5" /><h3 className="font-semibold">Minhas Rotinas</h3></div>
          <p className="mt-2 text-sm text-muted-foreground">Organize suas atividades recorrentes.</p>
          <div className="mt-4 flex min-h-24 flex-col justify-center rounded-lg bg-muted/40 p-3">
            {loading ? <p className="text-sm text-muted-foreground">Consultando rotina...</p> : routine ? (
              <>
                <p className="text-sm font-semibold">{tool?.label ?? "Atividade agendada"}</p>
                <p className="mt-1 text-sm text-muted-foreground">{reminderWeekdays[routine.weekday]} às {String(routine.hour).padStart(2, "0")}:00</p>
              </>
            ) : <p className="text-sm text-muted-foreground">Nenhuma rotina semanal ativa.</p>}
          </div>
          <Link href="/conta/rotinas" className="mt-4 inline-flex min-h-11 items-center gap-2 self-start text-sm font-semibold text-primary hover:underline">
            Gerenciar rotinas <ArrowRight className="size-4" />
          </Link>
        </article>
      </div>
    </section>
  );
}
