"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Coins } from "lucide-react";
import { getStoredSession } from "@/lib/user-auth";

export type AiCreditsInfo = {
  wallet: {
    plan_code: "free" | "pro" | "agency";
    free_limit: number;
    free_remaining: number;
    purchased_remaining: number;
    total_remaining: number;
    renews_on: string;
  };
  hourly: { limit: number; remaining: number; renews_at: string | null };
  salesEnabled: boolean;
};

export function AiCreditBalance() {
  const [info, setInfo] = useState<AiCreditsInfo | null>(null);
  const [message, setMessage] = useState("");

  const refresh = useCallback(async () => {
    const session = getStoredSession();
    if (!session?.access_token) {
      setInfo(null);
      setMessage("Entre na sua conta para consultar e usar seus créditos.");
      return;
    }
    try {
      const response = await fetch("/api/ai/credits", {
        headers: { Authorization: `Bearer ${session.access_token}` },
        cache: "no-store",
      });
      if (!response.ok) throw new Error();
      setInfo(await response.json() as AiCreditsInfo);
      setMessage("");
    } catch {
      setMessage("Saldo temporariamente indisponível.");
    }
  }, []);

  useEffect(() => {
    void refresh();
    const onUpdate = () => { void refresh(); };
    window.addEventListener("kivai:ai-credit-update", onUpdate);
    return () => window.removeEventListener("kivai:ai-credit-update", onUpdate);
  }, [refresh]);

  const renewal = info?.wallet.renews_on
    ? new Date(`${info.wallet.renews_on}T12:00:00`).toLocaleDateString("pt-BR")
    : "";

  return (
    <div data-print-hide className="flex flex-wrap items-center justify-between gap-3 border border-border bg-card p-3 text-sm sm:p-4" aria-live="polite">
      <div className="flex min-w-0 items-start gap-2">
        <Coins className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
        <div className="space-y-1">
          <p className="font-semibold">Créditos para ferramentas com IA</p>
          {info ? (
            <>
              <p className="text-sm">
                <strong>{info.wallet.total_remaining}</strong> disponíveis
                <span className="text-muted-foreground">
                  {" "}({info.wallet.free_remaining} do plano {info.wallet.plan_code === "agency" ? "Agency" : info.wallet.plan_code === "pro" ? "Pro" : "Free"} + {info.wallet.purchased_remaining} adicionais)
                </span>
              </p>
              <p className="text-xs leading-5 text-muted-foreground">
                {info.hourly.remaining} de {info.hourly.limit} solicitações nesta hora.
                Seus {info.wallet.free_limit} créditos mensais renovam em {renewal} e não acumulam.
              </p>
            </>
          ) : <p className="text-xs text-muted-foreground">{message || "Consultando seu saldo..."}</p>}
        </div>
      </div>
      <Link href="/creditos" className="inline-flex min-h-10 items-center justify-center border border-primary px-4 text-sm font-semibold text-primary hover:bg-primary/5">
        Comprar créditos
      </Link>
    </div>
  );
}
