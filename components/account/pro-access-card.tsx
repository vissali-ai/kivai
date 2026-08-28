"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Crown } from "lucide-react";
import { getCurrentUser, getStoredSession, supabaseUserFetch } from "@/lib/user-auth";

export function ProAccessCard() {
  const [plan, setPlan] = useState<"free" | "pro" | "agency" | null>(null);
  useEffect(() => {
    async function load() {
      const session = getStoredSession();
      if (!session?.access_token) return;
      const user = await getCurrentUser(session);
      if (!user?.id) return;
      const response = await supabaseUserFetch(`/rest/v1/user_profiles?select=plan_code&user_id=eq.${encodeURIComponent(user.id)}&limit=1`);
      if (!response.ok) return;
      const rows = await response.json() as Array<{ plan_code: "free" | "pro" | "agency" }>;
      setPlan(rows[0]?.plan_code ?? "free");
    }
    load();
  }, []);
  if (plan !== "pro" && plan !== "agency") return null;
  return <Link href="/conta/pro" className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-primary/25 bg-primary/[0.04] p-5 transition hover:border-primary/45"><div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Crown className="size-5" /></div><div><p className="font-semibold">Área {plan === "agency" ? "Agency" : "Pro"}</p><p className="mt-1 text-sm text-muted-foreground">Acesse perfis acompanhados, histórico e comparações.</p></div></div><ArrowRight className="size-5 text-primary" /></Link>;
}
