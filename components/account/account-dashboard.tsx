"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Building2,
  Crown,
  History,
  Home,
  LayoutDashboard,
  LogOut,
  Sparkles,
  UserRound,
} from "lucide-react";
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

const planLabels = {
  free: "Grátis",
  pro: "Pro",
  agency: "Agency",
} as const;

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

  if (loading) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto size-9 animate-pulse rounded-full border border-primary/30 bg-primary/10" />
          <p className="mt-4 text-sm text-muted-foreground">Carregando seu painel...</p>
        </div>
      </div>
    );
  }

  const plan = profile?.plan_code ?? "free";
  const PlanIcon = plan === "agency" ? Building2 : plan === "pro" ? Crown : UserRound;
  const displayName = profile?.full_name?.trim() || email.split("@")[0] || "Usuário Kivai";
  const firstName = displayName.split(/\s+/)[0];

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-card p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              <LayoutDashboard className="size-4" /> Meu painel
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Olá, {firstName}.</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
              Este é o seu espaço no Kivai. Acesse suas ferramentas, acompanhe seu plano e consulte suas análises salvas em um só lugar.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/ferramentas/instagram-follow-analyzer">Abrir ferramenta <ArrowRight /></Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/"><Home /> Voltar para a Home</Link>
              </Button>
            </div>
          </div>

          <div className="min-w-[230px] rounded-2xl border border-primary/20 bg-primary/[0.05] p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Seu plano atual</p>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <PlanIcon className="size-5" />
              </div>
              <div>
                <p className="text-lg font-semibold">Plano {planLabels[plan]}</p>
                <p className="text-xs text-muted-foreground">{email}</p>
              </div>
            </div>
            {plan === "free" ? (
              <Button asChild size="sm" className="mt-5 w-full">
                <Link href="/planos"><Sparkles /> Conhecer planos pagos</Link>
              </Button>
            ) : (
              <Button asChild size="sm" variant="outline" className="mt-5 w-full">
                <Link href="/planos">Ver meu plano</Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Link href="/ferramentas/instagram-follow-analyzer" className="group rounded-2xl border border-white/10 bg-card p-5 transition hover:-translate-y-0.5 hover:border-primary/40">
          <div className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-primary">
            <Sparkles className="size-5" />
          </div>
          <h2 className="mt-4 font-semibold">Quem deixou de seguir</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Importe seus dados do Instagram e gere uma nova análise.</p>
          <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">Acessar ferramenta <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></span>
        </Link>

        <Link href="/planos" className="group rounded-2xl border border-white/10 bg-card p-5 transition hover:-translate-y-0.5 hover:border-primary/40">
          <div className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-primary">
            <Crown className="size-5" />
          </div>
          <h2 className="mt-4 font-semibold">Planos e contratação</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Compare os recursos do Grátis, Pro e Agency e escolha a melhor opção.</p>
          <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">Ver planos <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></span>
        </Link>

        <div className="rounded-2xl border border-white/10 bg-card p-5">
          <div className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-primary">
            <History className="size-5" />
          </div>
          <h2 className="mt-4 font-semibold">Histórico privado</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {snapshots.length
              ? `${snapshots.length} análise${snapshots.length === 1 ? "" : "s"} recente${snapshots.length === 1 ? "" : "s"} disponível${snapshots.length === 1 ? "" : "is"}.`
              : plan === "free"
                ? "Seu histórico aparecerá aqui quando sua conta tiver acesso ao recurso."
                : "Suas análises salvas aparecerão aqui."}
          </p>
        </div>
      </section>

      {plan === "free" ? (
        <section className="rounded-3xl border border-primary/20 bg-primary/[0.035] p-6 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Mais recursos</p>
              <h2 className="mt-2 text-2xl font-semibold">Evolua sua conta quando precisar</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                Os planos pagos ampliam limites, quantidade de contas e recursos de histórico e comparação. A contratação fica sempre acessível pelo seu painel.
              </p>
            </div>
            <Button asChild className="w-full lg:w-auto">
              <Link href="/planos">Comparar Pro e Agency <ArrowRight /></Link>
            </Button>
          </div>
        </section>
      ) : null}

      {snapshots.length ? (
        <section className="overflow-hidden rounded-2xl border border-white/10 bg-card">
          <div className="flex items-center gap-3 border-b border-white/10 p-5">
            <History className="size-5 text-primary" />
            <div>
              <h2 className="font-semibold">Análises recentes</h2>
              <p className="mt-1 text-xs text-muted-foreground">Histórico privado dos seus perfis do Instagram.</p>
            </div>
          </div>
          <div className="divide-y divide-white/5">
            {snapshots.map((snapshot) => (
              <div key={snapshot.id} className="grid gap-3 p-5 sm:grid-cols-[minmax(0,1fr)_repeat(4,auto)] sm:items-center">
                <div>
                  <p className="font-medium">@{snapshot.username || "instagram"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{new Date(snapshot.analyzed_at).toLocaleString("pt-BR")}</p>
                </div>
                <div className="text-sm"><span className="block text-xs text-muted-foreground">Seguidores</span>{Number(snapshot.follower_count).toLocaleString("pt-BR")}</div>
                <div className="text-sm"><span className="block text-xs text-muted-foreground">Seguindo</span>{Number(snapshot.following_count).toLocaleString("pt-BR")}</div>
                <div className="text-sm"><span className="block text-xs text-muted-foreground">Novos</span>{snapshot.new_followers_count == null ? "-" : Number(snapshot.new_followers_count).toLocaleString("pt-BR")}</div>
                <div className="text-sm"><span className="block text-xs text-muted-foreground">Unfollows</span>{snapshot.unfollowers_count == null ? "-" : Number(snapshot.unfollowers_count).toLocaleString("pt-BR")}</div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div className="flex flex-col gap-3 border-t border-white/8 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">Sua conta Kivai permanece conectada até você sair.</p>
        <Button variant="outline" onClick={handleLogout}><LogOut /> Sair da conta</Button>
      </div>
    </div>
  );
}
