"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { getFirstMission } from "@/lib/account/first-mission";
import { getCurrentUser, getStoredSession, supabaseUserFetch } from "@/lib/user-auth";

type MissionState = "hidden" | "checking" | "complete" | "error";
type ProgressRow = {
  goal: string | null;
  status: "completed" | "skipped";
  first_mission_completed_at: string | null;
};

// Renderizar apenas após existir um resultado de fato e com a missão iniciada no painel.
export function FirstMissionResult() {
  const pathname = usePathname();
  const slug = /^\/ferramentas\/([a-z0-9-]+)\/?$/.exec(pathname)?.[1] ?? "";
  const [state, setState] = useState<MissionState>("hidden");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined" || !slug || new URLSearchParams(window.location.search).get("missao") !== "1") return;
    let active = true;
    async function complete() {
      const session = getStoredSession();
      if (!session?.access_token) return;
      try {
        const user = await getCurrentUser(session);
        if (!active || !user?.id) return;
        const response = await supabaseUserFetch(`/rest/v1/user_onboarding?select=goal,status,first_mission_completed_at&user_id=eq.${encodeURIComponent(user.id)}&limit=1`);
        if (!response.ok) throw new Error("Não foi possível consultar sua primeira missão.");
        const rows = (await response.json()) as ProgressRow[];
        if (!active || !rows.length) return;
        const progress = rows[0];
        if (getFirstMission(progress.goal).slug !== slug) return;
        if (progress.first_mission_completed_at) {
          setState("complete");
          return;
        }
        setState("checking");
        const update = await supabaseUserFetch(
          `/rest/v1/user_onboarding?user_id=eq.${encodeURIComponent(user.id)}&first_mission_completed_at=is.null&select=first_mission_completed_at,first_mission_tool_slug`,
          {
            method: "PATCH",
            headers: { Prefer: "return=representation" },
            body: JSON.stringify({
              first_mission_tool_slug: slug,
              first_mission_completed_at: new Date().toISOString(),
            }),
          },
        );
        if (!update.ok) throw new Error("Não foi possível registrar sua missão. O resultado continua disponível.");
        const saved = (await update.json()) as Array<{ first_mission_completed_at: string }>;
        if (active) setState(saved.length ? "complete" : "hidden");
      } catch {
        if (active) setState("error");
      }
    }
    void complete();
    return () => { active = false; };
  }, [slug, retry]);

  if (state === "hidden") return null;
  if (state === "checking") return <p role="status" className="mt-3 text-xs text-muted-foreground">Registrando sua primeira missão...</p>;
  if (state === "error") return (
    <p role="alert" className="mt-3 text-xs text-muted-foreground">
      Seu resultado está pronto, mas não foi possível registrar a missão.{" "}
      <button type="button" onClick={() => setRetry((value) => value + 1)} className="font-medium text-primary underline">Tentar novamente</button>
    </p>
  );
  return (
    <div role="status" className="mt-4 rounded-lg border border-primary/25 bg-primary/[0.05] p-3">
      <p className="flex items-center gap-2 text-sm font-semibold"><CheckCircle2 className="size-4 text-primary" aria-hidden="true" /> Sua primeira missão foi concluída!</p>
      <Link href="/conta" className="mt-2 inline-flex text-xs font-medium text-primary hover:underline">Ver meu progresso no Kivai →</Link>
    </div>
  );
}
