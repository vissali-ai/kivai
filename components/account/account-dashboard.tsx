"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Building2, Crown, History, LogOut, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentUser, getStoredSession, signOut, supabaseUserFetch } from "@/lib/user-auth";

type Profile = {
  full_name: string | null;
  avatar_url: string | null;
  plan_code: "free" | "pro" | "agency";
};

type Snapshot = {
  id: string;
  analyzed_at: string;
  follower_count: number;
  following_count: number;
  new_followers_count: number | null;
  unfollowers_count: number | null;
  social_account_id: string;
};

type SocialAccount = { id: string; username: string };

export function AccountDashboard() {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [snapshots, setSnapshots] = useState<Array<Snapshot & { username?: string }>>([]);

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
      const [profileResponse, accountsResponse, snapshotsResponse] = await Promise.all([
        supabaseUserFetch(`/rest/v1/user_profiles?select=full_name,avatar_url,plan_code&user_id=eq.${encodeURIComponent(user.id)}&limit=1`),
        supabaseUserFetch("/rest/v1/social_accounts?select=id,username&platform=eq.instagram"),
        supabaseUserFetch("/rest/v1/social_snapshots?select=id,analyzed_at,follower_count,following_count,new_followers_count,unfollowers_count,social_account_id&order=analyzed_at.desc&limit=8"),
      ]);

      if (profileResponse.ok) {
        const rows = (await profileResponse.json()) as Profile[];
        setProfile(rows[0] ?? null);
      }

      if (accountsResponse.ok && snapshotsResponse.ok) {
        const accounts = (await accountsResponse.json()) as SocialAccount[];
        const accountMap = new Map(accounts.map((item) => [item.id, item.username]));
        const rows = (await snapshotsResponse.json()) as Snapshot[];
        setSnapshots(rows.map((item) => ({ ...item, username: accountMap.get(item.social_account_id) })));
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleLogout() {
    await signOut();
    window.location.replace("/");
  }

  if (loading) return <p className="text-sm text-muted-foreground">Carregando sua conta...</p>;

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
          <h2 className="font-semibold">Quem deixou de seguir no Instagram</h2>
          <p className="mt-2 text-sm text-muted-foreground">Importe seus dados e gere uma nova análise.</p>
        </Link>
        <Link href="/planos" className="border border-white/10 bg-card p-5 transition hover:border-primary/40">
          <h2 className="font-semibold">Plano e cobrança</h2>
          <p className="mt-2 text-sm text-muted-foreground">Compare os planos e gerencie a modalidade da sua conta.</p>
        </Link>
        <div className="border border-white/10 bg-card p-5">
          <h2 className="font-semibold">Histórico</h2>
          <p className="mt-2 text-sm text-muted-foreground">{snapshots.length ? `${snapshots.length} análise${snapshots.length === 1 ? "" : "s"} recente${snapshots.length === 1 ? "" : "s"}.` : "As análises Pro e Agency salvas aparecerão aqui."}</p>
        </div>
      </section>

      {snapshots.length ? <section className="border border-white/10 bg-card">
        <div className="flex items-center gap-3 border-b border-white/10 p-5"><History className="size-5 text-primary" /><div><h2 className="font-semibold">Análises recentes</h2><p className="mt-1 text-xs text-muted-foreground">Histórico privado dos seus perfis do Instagram.</p></div></div>
        <div className="divide-y divide-white/5">{snapshots.map((snapshot) => <div key={snapshot.id} className="grid gap-3 p-5 sm:grid-cols-[minmax(0,1fr)_repeat(4,auto)] sm:items-center">
          <div><p className="font-medium">@{snapshot.username || "instagram"}</p><p className="mt-1 text-xs text-muted-foreground">{new Date(snapshot.analyzed_at).toLocaleString("pt-BR")}</p></div>
          <div className="text-sm"><span className="block text-xs text-muted-foreground">Seguidores</span>{Number(snapshot.follower_count).toLocaleString("pt-BR")}</div>
          <div className="text-sm"><span className="block text-xs text-muted-foreground">Seguindo</span>{Number(snapshot.following_count).toLocaleString("pt-BR")}</div>
          <div className="text-sm"><span className="block text-xs text-muted-foreground">Novos</span>{snapshot.new_followers_count == null ? "-" : Number(snapshot.new_followers_count).toLocaleString("pt-BR")}</div>
          <div className="text-sm"><span className="block text-xs text-muted-foreground">Unfollows</span>{snapshot.unfollowers_count == null ? "-" : Number(snapshot.unfollowers_count).toLocaleString("pt-BR")}</div>
        </div>)}</div>
      </section> : null}

      <Button variant="outline" onClick={handleLogout}><LogOut /> Sair da conta</Button>
    </div>
  );
}
