"use client";
import { useEffect, useState } from "react";
import { getStoredSession } from "@/lib/user-auth";
import type { PlanCode } from "@/lib/billing/plan-benefits";
import type { AccessSubscription } from "@/lib/billing/access";
export type AccountAccess = { userId: string; plan: PlanCode; subscription: AccessSubscription | null };
export async function fetchAccountAccess(): Promise<AccountAccess | null> {
  const token = getStoredSession()?.access_token;
  if (!token) return null;
  const response = await fetch("/api/account/access", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
  if (!response.ok) throw new Error("Não foi possível atualizar seu plano. Tente novamente.");
  return response.json();
}
export function useAccountAccess() {
  const [access, setAccess] = useState<AccountAccess | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true; let running = false;
    const refresh = async () => {
      if (running || document.visibilityState === "hidden") return;
      running = true;
      try { const next = await fetchAccountAccess(); if (active) { setAccess(next); setError(""); } }
      catch (err) { if (active) { setAccess(null); setError(err instanceof Error ? err.message : "Falha ao consultar plano."); } }
      finally { running = false; if (active) setLoading(false); }
    };
    void refresh();
    const timer = window.setInterval(refresh, 15000);
    window.addEventListener("focus", refresh); document.addEventListener("visibilitychange", refresh); window.addEventListener("storage", refresh);
    return () => { active = false; window.clearInterval(timer); window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); window.removeEventListener("storage", refresh); };
  }, []);
  return { access, loading, error };
}
