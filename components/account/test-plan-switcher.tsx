"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { getStoredSession } from "@/lib/user-auth";
import type { PlanCode } from "@/lib/billing/plan-benefits";

const planOptions: Array<{ value: PlanCode; label: string }> = [
 { value: "free", label: "Free" },
 { value: "pro", label: "Pro" },
 { value: "agency", label: "Agency" },
];

export function TestPlanSwitcher({ currentPlan }: { currentPlan: PlanCode }) {
 const [selected, setSelected] = useState<PlanCode>(currentPlan);
 const [working, setWorking] = useState(false);
 const [error, setError] = useState("");

 async function switchPlan(plan: PlanCode) {
  if (working || plan === currentPlan) return;
  const token = getStoredSession()?.access_token;
  if (!token) { setError("Sua sessão expirou. Entre novamente na conta."); return; }
  setSelected(plan);
  setError("");
  setWorking(true);
  try {
   const response = await fetch("/api/account/test-plan", {
    method: "POST",
    cache: "no-store",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ plan }),
   });
   const result = await response.json() as { plan?: PlanCode; error?: string };
   if (!response.ok || result.plan !== plan) throw new Error(result.error || "Não foi possível trocar o plano.");
   window.location.reload();
  } catch (cause) {
   setSelected(currentPlan);
   setError(cause instanceof Error ? cause.message : "Não foi possível trocar o plano.");
   setWorking(false);
  }
 }

 return (
  <section aria-label="Alternar plano de teste" className="rounded-2xl border border-primary/20 bg-card p-4 sm:p-5">
   <div className="flex flex-wrap items-start justify-between gap-3">
    <div>
     <h2 className="text-base font-semibold">Alternar plano</h2>
     <p className="mt-1 text-xs leading-5 text-muted-foreground">Escolha um plano para conferir suas ferramentas e benefícios. Esta alteração não gera cobranças.</p>
    </div>
    <span className="rounded-md border border-border bg-background px-2 py-1 text-xs font-medium">Conta de teste</span>
   </div>
   <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Planos disponíveis">
    {planOptions.map(({value,label}) => (
     <Button
      key={value}
      type="button"
      size="sm"
      disabled={working}
      variant={selected === value ? "default" : "outline"}
      aria-pressed={selected === value}
      onClick={() => void switchPlan(value)}
     >
      {working && selected === value ? "Alterando..." : label}
     </Button>
    ))}
   </div>
   {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
  </section>
 );
}
