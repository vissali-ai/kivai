"use client";

// Deployment checkpoint após correção da Área Pro. Nova tentativa de publicação.
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, BarChart3, CalendarClock, Camera, Crown, History, LockKeyhole, RefreshCw, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentUser, getStoredSession, supabaseUserFetch } from "@/lib/user-auth";

type Profile = { plan_code: "free" | "pro" | "agency"; full_name: string | null };
type Subscription = { status: string; current_period_end: string | null; billing_cycle: string | null; test_access: boolean };
type SocialAccount = { id: string; username: string; follower_count: number | null; following_count: number | null; last_analyzed_at: string | null };
type Snapshot = { id: string; social_account_id: string; analyzed_at: string; follower_count: number; following_count: number; new_followers_count: number | null; unfollowers_count: number | null };

export function ProDashboard() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);

  useEffect(() => {
    async function load() {
      const session = getStoredSession();
      if (!session?.access_token) { window.location.replace("/conta/login?next=/conta/pro"); return; }
      const user = await getCurrentUser(session);
      if (!user?.id) { window.location.replace("/conta/login?next=/conta/pro"); return; }
      const [profileRes, subscriptionRes, accountsRes, snapshotsRes] = await Promise.all([
        supabaseUserFetch(`/rest/v1/user_profiles?select=plan_code,full_name&user_id=eq.${encodeURIComponent(user.id)}&limit=1`),
        supabaseUserFetch("/rest/v1/user_subscriptions?select=status,current_period_end,billing_cycle,test_access&order=created_at.desc&limit=1"),
        supabaseUserFetch("/rest/v1/social_accounts?select=id,username,follower_count,following_count,last_analyzed_at&platform=eq.instagram&order=updated_at.desc"),
        supabaseUserFetch("/rest/v1/social_snapshots?select=id,social_account_id,analyzed_at,follower_count,following_count,new_followers_count,unfollowers_count&order=analyzed_at.desc&limit=20"),
      ]);
      if (profileRes.ok) { const rows = await profileRes.json() as Profile[]; setProfile(rows[0] ?? null); }
      if (subscriptionRes.ok) { const rows = await subscriptionRes.json() as Subscription[]; setSubscription(rows[0] ?? null); }
      if (accountsRes.ok) setAccounts(await accountsRes.json() as SocialAccount[]);
      if (snapshotsRes.ok) setSnapshots(await snapshotsRes.json() as Snapshot[]);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="flex min-h-[55vh] items-center justify-center text-sm text-muted-foreground">Carregando Área Pro...</div>;
  const paid = profile?.plan_code === "pro" || profile?.plan_code === "agency";
  if (!paid) return <div className="mx-auto max-w-2xl border border-white/10 bg-card p-8 text-center"><LockKeyhole className="mx-auto size-8 text-primary" /><h1 className="mt-4 text-2xl font-semibold">Área exclusiva dos planos pagos</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">Seu plano atual é Grátis. Faça upgrade para acessar histórico, comparação entre exportações e acompanhamento de múltiplos perfis.</p><Button asChild className="mt-6"><Link href="/planos">Conhecer o Plano Pro <ArrowRight /></Link></Button></div>;

  const planName = profile?.plan_code === "agency" ? "Agency" : "Pro";
  const accountLimit = profile?.plan_code === "agency" ? 20 : 5;
  return <div className="space-y-6">
    <section className="relative overflow-hidden rounded-3xl border border-primary/25 bg-primary/[0.045] p-6 sm:p-8"><div className="absolute -right-20 -top-20 size-64 rounded-full bg-primary/10 blur-3xl" /><div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between"><div><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary"><Crown className="size-4" /> Área {planName}</div><h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Acompanhe seus perfis em um só lugar</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Importe novas exportações da Meta, compare períodos e acompanhe quem entrou e quem saiu da sua audiência.</p><div className="mt-5 flex flex-wrap gap-3"><Button asChild><Link href="/ferramentas/analisador-de-seguidores-instagram">Nova análise <ArrowRight /></Link></Button><Button asChild variant="outline"><Link href="/conta"><RefreshCw /> Voltar ao painel</Link></Button></div></div><div className="min-w-[240px] border border-primary/20 bg-background/60 p-5"><p className="text-xs text-muted-foreground">Plano ativo</p><p className="mt-1 text-xl font-semibold">{planName}</p><p className="mt-3 text-xs text-muted-foreground">{subscription?.test_access ? "Acesso de teste" : subscription?.billing_cycle === "annual" ? "Plano anual" : "Plano mensal"}</p><p className="mt-1 text-sm">Válido até {subscription?.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString("pt-BR") : "-"}</p></div></div></section>

    <section className="grid gap-4 md:grid-cols-4"><div className="border border-white/10 bg-card p-4"><UsersRound className="size-5 text-primary" /><p className="mt-3 text-xs text-muted-foreground">Perfis acompanhados</p><p className="mt-1 text-2xl font-semibold">{accounts.length}/{accountLimit}</p></div><div className="border border-white/10 bg-card p-4"><History className="size-5 text-primary" /><p className="mt-3 text-xs text-muted-foreground">Análises salvas</p><p className="mt-1 text-2xl font-semibold">{snapshots.length}</p></div><div className="border border-white/10 bg-card p-4"><BarChart3 className="size-5 text-primary" /><p className="mt-3 text-xs text-muted-foreground">Novos seguidores</p><p className="mt-1 text-2xl font-semibold">{snapshots[0]?.new_followers_count ?? "-"}</p></div><div className="border border-white/10 bg-card p-4"><CalendarClock className="size-5 text-primary" /><p className="mt-3 text-xs text-muted-foreground">Unfollows no último período</p><p className="mt-1 text-2xl font-semibold">{snapshots[0]?.unfollowers_count ?? "-"}</p></div></section>

    <section className="border border-white/10 bg-card"><div className="flex items-center justify-between border-b border-white/10 p-5"><div><h2 className="font-semibold">Perfis do Instagram</h2><p className="mt-1 text-xs text-muted-foreground">Cada nova exportação atualiza o histórico do perfil.</p></div><Camera className="size-5 text-primary" /></div>{accounts.length ? <div className="divide-y divide-white/10">{accounts.map((account) => <div key={account.id} className="grid gap-3 p-5 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center"><div><p className="font-medium">@{account.username}</p><p className="mt-1 text-xs text-muted-foreground">Última análise: {account.last_analyzed_at ? new Date(account.last_analyzed_at).toLocaleString("pt-BR") : "-"}</p></div><div className="text-sm"><span className="block text-xs text-muted-foreground">Seguidores</span>{account.follower_count?.toLocaleString("pt-BR") ?? "-"}</div><div className="text-sm"><span className="block text-xs text-muted-foreground">Seguindo</span>{account.following_count?.toLocaleString("pt-BR") ?? "-"}</div><Button asChild size="sm" variant="outline"><Link href="/ferramentas/analisador-de-seguidores-instagram">Atualizar análise</Link></Button></div>)}</div> : <div className="p-8 text-center"><p className="text-sm text-muted-foreground">Você ainda não possui perfis salvos.</p><Button asChild className="mt-4"><Link href="/ferramentas/analisador-de-seguidores-instagram">Fazer primeira análise</Link></Button></div>}</section>

    {snapshots.length ? <section className="border border-white/10 bg-card"><div className="border-b border-white/10 p-5"><h2 className="font-semibold">Histórico recente</h2><p className="mt-1 text-xs text-muted-foreground">As comparações são calculadas a partir das exportações salvas do mesmo perfil.</p></div><div className="divide-y divide-white/10">{snapshots.slice(0,10).map((item) => { const account = accounts.find((a) => a.id === item.social_account_id); return <div key={item.id} className="grid gap-3 p-5 sm:grid-cols-[1fr_repeat(4,auto)] sm:items-center"><div><p className="font-medium">@{account?.username || "instagram"}</p><p className="mt-1 text-xs text-muted-foreground">{new Date(item.analyzed_at).toLocaleString("pt-BR")}</p></div><div className="text-sm"><span className="block text-xs text-muted-foreground">Seguidores</span>{item.follower_count.toLocaleString("pt-BR")}</div><div className="text-sm"><span className="block text-xs text-muted-foreground">Seguindo</span>{item.following_count.toLocaleString("pt-BR")}</div><div className="text-sm"><span className="block text-xs text-muted-foreground">Novos</span>{item.new_followers_count ?? "-"}</div><div className="text-sm"><span className="block text-xs text-muted-foreground">Unfollows</span>{item.unfollowers_count ?? "-"}</div></div>})}</div></section> : null}
  </div>;
}
