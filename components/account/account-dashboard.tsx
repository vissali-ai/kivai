"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LogOut, UserRound, Crown, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentUser, getStoredSession, signOut, supabaseUserFetch } from "@/lib/user-auth";

type Profile = {
  full_name: string | null;
  avatar_url: string | null;
  plan_code: "free" | "pro" | "agency";
};

export function AccountDashboard() {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    async function load() {
      const session = getStoredSession();
      if (!session?.access_token) {
        window.location.replace("/conta/login?next=/conta");
        return;
      }

      const user = await getCurrentUser(session);
      if (!user?.id) {
        await signOut();
        window.location.replace("/conta/login?next=/conta");
        return;
      }

      setEmail(user.email ?? "");
      const response = await supabaseUserFetch(`/rest/v1/user_profiles?select=full_name,avatar_url,plan_code&user_id=eq.${encodeURIComponent(user.id)}&limit=1`);
      if (response.ok) {
        const rows = (await response.json()) as Profile[];
        setProfile(rows[0] ?? null);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleLogout() {
    await signOut();
    window.location.replace("/");
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Carregando sua conta...</p>;
  }

  const plan = profile?.plan_code ?? "free";
  const PlanIcon = plan === "agency" ? Building2 : plan === "pro" ? Crown : UserRound;

  return (
    <div className="space-y-6">
      <section className="border border-white/10 bg-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Minha conta</p>
            <h1 className="mt-2 text-2xl font-semibold">{profile?.full_name || email || "Usuário Kivai"}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{email}</p>
          </div>
          <div className="inline-flex w-fit items-center gap-2 border border-primary/20 bg-primary/10 px-3 py-2 text-sm font-medium text-primary">
            <PlanIcon className="size-4" /> Plano {plan === "free" ? "Grátis" : plan === "pro" ? "Pro" : "Agency"}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Link href="/ferramentas/instagram-follow-analyzer" className="border border-white/10 bg-card p-5 transition hover:border-primary/40">
          <h2 className="font-semibold">Instagram Follow Analyzer</h2>
          <p className="mt-2 text-sm text-muted-foreground">Importe seus dados e veja suas análises.</p>
        </Link>
        <div className="border border-white/10 bg-card p-5">
          <h2 className="font-semibold">Histórico</h2>
          <p className="mt-2 text-sm text-muted-foreground">Suas análises salvas aparecerão aqui.</p>
        </div>
        <div className="border border-white/10 bg-card p-5">
          <h2 className="font-semibold">Plano e cobrança</h2>
          <p className="mt-2 text-sm text-muted-foreground">Upgrade para Pro ou Agency será integrado à SumUp.</p>
        </div>
      </section>

      <Button variant="outline" onClick={handleLogout}>
        <LogOut /> Sair da conta
      </Button>
    </div>
  );
}
