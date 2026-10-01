"use client";

import Link from "next/link";
import { useAccountAccess } from "@/lib/billing/access-client";
import { ArrowRight, Crown } from "lucide-react";


export function ProAccessCard() {
  const { access } = useAccountAccess();
  const plan = access?.plan;
  if (plan !== "pro" && plan !== "agency") return null;
  return <Link href="/conta/pro" className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-primary/25 bg-primary/[0.04] p-5 transition hover:border-primary/45"><div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Crown className="size-5" /></div><div><p className="font-semibold">Área {plan === "agency" ? "Agency" : "Pro"}</p><p className="mt-1 text-sm text-muted-foreground">Acesse perfis acompanhados, histórico e comparações.</p></div></div><ArrowRight className="size-5 text-primary" /></Link>;
}
