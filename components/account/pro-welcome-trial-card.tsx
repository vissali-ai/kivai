"use client";

import { useCallback, useEffect, useState } from "react";
import { Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getStoredSession } from "@/lib/user-auth";

type Trial = {status: "eligible"|"activated"|"used"|"has_plan"|"verify_email"|"unavailable"|"unauthorized"; expiresAt?:string};

function dateLabel(date?: string) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("pt-BR", { timeZone:"America/Sao_Paulo" });
}

export function ProWelcomeTrialCard() {
  const [trial, setTrial] = useState<Trial | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const load = useCallback(async (method: "GET"|"POST") => {
    const token = getStoredSession()?.access_token;
    if (!token) return;
    const response = await fetch("/api/account/welcome-trial", { method, cache: "no-store",
      headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) throw new Error("Não foi possível verificar o benefício. Tente novamente.");
    const data = await response.json() as Trial;
    setTrial(data);
    return data;
  }, []);
  useEffect(() => { void load("GET").catch(() => setMessage("O benefício está temporariamente indisponível.")); }, [load]);
  async function redeem() {
    if (busy || trial?.status !== "eligible") return;
    setBusy(true); setMessage("");
    try {
      const updated = await load("POST");
      if (updated?.status === "activated") {
        setMessage("Seu período Pro foi ativado. Atualize o painel para visualizar os recursos liberados.");
      }
    } catch (error) { setMessage(error instanceof Error ? error.message : "Não foi possível ativar o benefício."); }
    finally { setBusy(false); }
  }
  if (!trial || ["unauthorized","unavailable","has_plan"].includes(trial.status)) return null;
  if (trial.status === "used") return null;
  return (
    <section className="rounded-2xl border border-primary/20 bg-card p-5 sm:p-6" aria-label="Benefício de boas-vindas">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-2xl">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary"><Crown className="size-4" /> Benefício de boas-vindas</p>
          <h2 className="mt-2 text-xl font-semibold">Experimente 7 dias de Kivai Pro</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {trial.status === "activated"
              ? `Acesso gratuito ativado até ${dateLabel(trial.expiresAt)}. Não há cobrança automática.`
              : trial.status === "verify_email"
                ? "Confirme seu e-mail para verificar a elegibilidade e solicitar o teste gratuito."
                : "Disponível uma única vez para contas elegíveis, sem cartão e sem cobrança automática. Independe de avaliações."}
          </p>
        </div>
        {trial.status === "eligible" ? <Button type="button" disabled={busy} onClick={redeem} className="shrink-0">
          {busy ? "Ativando..." : "Ativar meus 7 dias Pro"}
        </Button> : null}
      </div>
      {message ? <p role="status" className="mt-3 text-sm text-muted-foreground">{message}</p> : null}
    </section>
  );
}
