import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Clock3 } from "lucide-react";
import { RoutineReminderSettings } from "@/components/account/routine-reminder-settings";
import { AccountWorkspaceNav } from "@/components/account/account-workspace-nav";
import { noIndexRobots } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Minhas Rotinas",
  robots: noIndexRobots,
};

export default function MyRoutinesPage() {
  return (
    <main className="mx-auto min-h-[75vh] w-full max-w-7xl px-4 pb-20 pt-24 sm:px-6 lg:px-8">
      <div className="grid min-w-0 gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
      <AccountWorkspaceNav />
      <div className="min-w-0">
      <Link href="/conta" className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Voltar ao painel
      </Link>
      <div className="mb-6 mt-5">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
          <Clock3 className="size-4" /> Organização
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Minhas Rotinas</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Agende uma atividade semanal e volte diretamente à ferramenta escolhida.
        </p>
      </div>
      <RoutineReminderSettings />
      </div>
      </div>
    </main>
  );
}
