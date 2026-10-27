"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowUp, Building2, CheckCircle2, Crown, History, LayoutDashboard, LogOut, Settings, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getStoredSession, signOut, supabaseUserFetch } from "@/lib/user-auth";
import { AiCreditBalance } from "@/components/tools/ai-credit-balance";

import { useAccountAccess } from "@/lib/billing/access-client";
import { SavedProjects } from "@/components/account/saved-projects";
import { MyFavoriteTools } from "@/components/account/my-favorite-tools";
import { AccountNotifications } from "@/components/account/account-notifications";
import { RoutineReminderSettings } from "@/components/account/routine-reminder-settings";
import { AccountWelcome } from "@/components/account/account-welcome";
import { SupportBell } from "@/components/account/support-bell";
import { Headset } from "lucide-react";

type Profile = { full_name: string | null; avatar_url: string | null; plan_code: "free" | "pro" | "agency" };
type Snapshot = { id: string; analyzed_at: string; follower_count: number; following_count: number; new_followers_count: number | null; unfollowers_count: number | null; social_account_id: string };
type SocialAccount = { id: string; username: string };
type SubscriptionRequest = { id: string; plan_code: "pro" | "agency"; billing_cycle: "monthly" | "annual"; amount_brl: number | string; status: "awaiting_payment" | "payment_reported"; payment_link: string; created_at: string };
const planLabels = { free: "Grátis", pro: "Pro", agency: "Agency" } as const;

export function AccountDashboard() {
  const { access, loading: accessLoading, error: accessError } = useAccountAccess();
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [snapshots, setSnapshots] = useState<Array<Snapshot & { username?: string }>>([]);
  const [pendingRequest, setPendingRequest] = useState<SubscriptionRequest | null>(null);
  const [reportingPayment, setReportingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const paymentInFlight = useRef(false);
  const paymentVersion = useRef(0);

  useEffect(() => {
    let active = true;
    let running = false;
    async function load() {
      const session = getStoredSession();
      if (!session?.access_token) { window.location.replace("/conta/login?next=/conta"); return; }
      const userResponse = await supabaseUserFetch("/auth/v1/user");
      if (!active) return;
      if (userResponse.status === 401 || userResponse.status === 403) { await signOut(); window.location.replace("/conta/login?next=/conta"); return; }
      if (!userResponse.ok) throw new Error("USER_UNAVAILABLE");
      const user = await userResponse.json() as { id?: string; email?: string };
      if (!user.id) throw new Error("USER_UNAVAILABLE");
      if (!active) return;
      setEmail(user.email ?? "");
      setUserId(user.id);
      const version = paymentVersion.current;
      const [profileResponse, accountsResponse, snapshotsResponse, requestResponse] = await Promise.all([
        supabaseUserFetch(`/rest/v1/user_profiles?select=full_name,avatar_url,plan_code&user_id=eq.${encodeURIComponent(user.id)}&limit=1`),
        supabaseUserFetch("/rest/v1/social_accounts?select=id,username&platform=eq.instagram"),
        supabaseUserFetch("/rest/v1/social_snapshots?select=id,analyzed_at,follower_count,following_count,new_followers_count,unfollowers_count,social_account_id&order=analyzed_at.desc&limit=8"),
        supabaseUserFetch("/rest/v1/subscription_requests?select=id,plan_code,billing_cycle,amount_brl,status,payment_link,created_at&status=in.(awaiting_payment,payment_reported)&order=created_at.desc&limit=1"),
      ]);
      if (!active) return;
      setLoadError([profileResponse, accountsResponse, snapshotsResponse, requestResponse].every(response => response.ok) ? "" : "Alguns dados estão temporariamente indisponíveis. Tente atualizar o painel.");
      if (profileResponse.ok) { const rows = (await profileResponse.json()) as Profile[]; setProfile(rows[0] ?? null); }
      if (accountsResponse.ok && snapshotsResponse.ok) {
        const accounts = (await accountsResponse.json()) as SocialAccount[];
        const accountMap = new Map(accounts.map((item) => [item.id, item.username]));
        const rows = (await snapshotsResponse.json()) as Snapshot[];
        setSnapshots(rows.map((item) => ({ ...item, username: accountMap.get(item.social_account_id) })));
      }
      if (requestResponse.ok) { const rows = (await requestResponse.json()) as SubscriptionRequest[]; if (active && !paymentInFlight.current && version === paymentVersion.current) setPendingRequest(rows[0] ?? null); }
      setLoading(false);
    }
    const refresh = () => {
      if (running || document.visibilityState === "hidden") return;
      running = true;
      void load().catch(() => { if (active) setLoadError("Não foi possível carregar todos os dados. Tente atualizar o painel."); })
        .finally(() => { running = false; if (active) setLoading(false); });
    };
    refresh();
    const timer = window.setInterval(refresh, 15000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => { active = false; window.clearInterval(timer); window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); };
  }, []);

  async function handleLogout() { await signOut(); window.location.replace("/"); }
  async function reportPayment() {
    if (paymentInFlight.current || !pendingRequest || pendingRequest.status !== "awaiting_payment") return;
    const session = getStoredSession(); if (!session?.access_token) { setPaymentError("Sua sessão expirou. Entre novamente para informar o pagamento."); return; }
    paymentInFlight.current = true;
    paymentVersion.current += 1;
    setPaymentError("");
    setReportingPayment(true);
    try {
      const response = await fetch("/api/account/subscription-request", { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ requestId: pendingRequest.id }) });
      if (!response.ok) throw new Error("PAYMENT_REPORT_FAILED");
      setPendingRequest(current => current?.id === pendingRequest.id ? { ...current, status: "payment_reported" } : current);
    } catch {
      setPaymentError("Não foi possível informar o pagamento. Tente novamente; isso não fará uma nova cobrança.");
    } finally { paymentVersion.current += 1; paymentInFlight.current = false; setReportingPayment(false); }
  }

  if (loading || accessLoading) return <div className="flex min-h-[55vh] items-center justify-center"><p className="text-sm text-muted-foreground">Carregando seu painel...</p></div>;
  const plan = access?.plan;
  const PlanIcon = plan === "agency" ? Building2 : plan === "pro" ? Crown : UserRound;
  const displayName = profile?.full_name?.trim() || email.split("@")[0] || "Usuário Kivai";
  const firstName = displayName.split(/\s+/)[0];

  return <div id="painel-inicio" tabIndex={-1} className="scroll-mt-28 space-y-6">
    {accessError || loadError ? <div role="alert" className="rounded border p-4"><p>{accessError || loadError}</p><Button variant="outline" size="sm" className="mt-3" onClick={() => window.location.reload()}>Atualizar painel</Button></div> : null}
    <section className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 sm:p-8">
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary"><LayoutDashboard className="size-4" /> Meu Kivai</span>
            <SupportBell />
            <Button asChild variant="ghost" size="sm"><Link href="/conta/dados" title="Configurações da conta"><Settings className="size-4" /> Configurações</Link></Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}><LogOut className="size-4" /> Sair da conta</Button>
          </div>
          <h1 className="mt-3 break-words text-3xl font-semibold tracking-tight sm:text-4xl">Olá, {firstName}.</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">Seu espaço para retomar ferramentas recentes, encontrar favoritos e descobrir recursos úteis para sua rotina.</p>
          <div className="mt-5"><Button asChild variant="outline"><Link href="/ferramentas"><LayoutDashboard /> Todas as ferramentas</Link></Button></div>
        </div>
        <div className="w-full min-w-0 rounded-2xl border border-primary/20 bg-primary/[0.05] p-5 lg:w-80 lg:shrink-0">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Seu plano atual</p>
          <div className="mt-3 flex items-center gap-3"><div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><PlanIcon className="size-5" /></div><div className="min-w-0"><p className="text-lg font-semibold">{plan ? `Plano ${planLabels[plan]}` : "Plano indisponível"}</p><p className="break-all text-xs text-muted-foreground">{email}</p></div></div>
          <Button asChild size="sm" className="mt-5 w-full"><Link href="/conta/dados"><UserRound /> Meus Dados</Link></Button>
        </div>
      </div>
    </section>



    {userId ? <div id="painel-creditos" tabIndex={-1} className="scroll-mt-28"><AiCreditBalance /></div> : null}
    {userId ? <AccountWelcome userId={userId} firstName={firstName} /> : null}
    <div id="painel-favoritos" tabIndex={-1} className="scroll-mt-28"><MyFavoriteTools /></div>
    <div id="painel-projetos" tabIndex={-1} className="scroll-mt-28"><SavedProjects /></div>
    {plan ? <section id="painel-plano" tabIndex={-1} className="scroll-mt-28 rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">{plan === "agency" ? "Área Agency" : "Área Pro"}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{plan === "free" ? "Conheça os benefícios dos planos Pro e Agency." : "Acesse seus benefícios, histórico e recursos exclusivos do plano."}</p>
        </div>
        <Button asChild><Link href={plan === "free" ? "/planos" : "/conta/pro"}>{plan === "free" ? "Conhecer benefícios" : "Abrir benefícios"} <ArrowRight className="size-4" /></Link></Button>
      </div>
    </section> : null}
    {snapshots.length ? <section className="overflow-hidden rounded-2xl border border-border bg-card"><div className="flex items-center gap-3 border-b border-border p-5"><History className="size-5 text-primary" /><div><h2 className="font-semibold">Análises recentes</h2><p className="mt-1 text-xs text-muted-foreground">Histórico privado dos seus perfis do Instagram.</p></div></div><div className="divide-y divide-white/5">{snapshots.map((snapshot) => <div key={snapshot.id} className="grid gap-3 p-5 sm:grid-cols-[minmax(0,1fr)_repeat(4,auto)] sm:items-center"><div><p className="font-medium">@{snapshot.username || "instagram"}</p><p className="mt-1 text-xs text-muted-foreground">{new Date(snapshot.analyzed_at).toLocaleString("pt-BR")}</p></div><div className="text-sm"><span className="block text-xs text-muted-foreground">Seguidores</span>{Number(snapshot.follower_count).toLocaleString("pt-BR")}</div><div className="text-sm"><span className="block text-xs text-muted-foreground">Seguindo</span>{Number(snapshot.following_count).toLocaleString("pt-BR")}</div><div className="text-sm"><span className="block text-xs text-muted-foreground">Novos</span>{snapshot.new_followers_count == null ? "-" : Number(snapshot.new_followers_count).toLocaleString("pt-BR")}</div><div className="text-sm"><span className="block text-xs text-muted-foreground">Unfollows</span>{snapshot.unfollowers_count == null ? "-" : Number(snapshot.unfollowers_count).toLocaleString("pt-BR")}</div></div>)}</div></section> : null}

    <section id="painel-atendimento" className="scroll-mt-28 rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-start gap-3"><Headset className="mt-1 size-5 text-primary"/><div><h2 className="text-xl font-semibold">Central de Atendimento</h2><p className="mt-1 text-sm text-muted-foreground">Abra chamados, reporte erros e acompanhe as respostas da equipe Kivai.</p></div></div><Button asChild><Link href="/conta/atendimento">Meus protocolos <ArrowRight className="size-4"/></Link></Button></div>
    </section>
    <div id="painel-avisos" tabIndex={-1} className="scroll-mt-28"><AccountNotifications /></div>
    <div id="painel-lembretes" tabIndex={-1} className="scroll-mt-28"><RoutineReminderSettings /></div>
    {paymentError ? <p role="alert" className="rounded border border-destructive/40 p-4 text-sm">{paymentError}</p> : null}
    {pendingRequest ? <section className="rounded-2xl border border-primary/25 bg-primary/[0.035] p-5 sm:p-6"><div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Contratação em andamento</p><h2 className="mt-2 text-xl font-semibold">Plano {pendingRequest.plan_code === "pro" ? "Pro" : "Agency"} {pendingRequest.billing_cycle === "monthly" ? "mensal" : "anual"}</h2><p className="mt-2 text-sm text-muted-foreground">Valor: R$ {Number(pendingRequest.amount_brl).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p><p className="mt-1 text-sm leading-6 text-muted-foreground">{pendingRequest.status === "payment_reported" ? "Pagamento informado. Aguardando confirmação e ativação." : "Depois de concluir o pagamento, informe aqui para destacar a solicitação no Admin."}</p></div><div className="flex min-w-[220px] flex-col gap-2">{pendingRequest.status === "awaiting_payment" ? <><Button onClick={reportPayment} disabled={reportingPayment}>{reportingPayment ? "Registrando..." : "Já realizei o pagamento"}</Button></> : <div className="flex items-center justify-center gap-2 border border-primary/30 bg-primary/10 px-4 py-3 text-sm font-medium text-primary"><CheckCircle2 className="size-4" /> Aguardando confirmação</div>}<Button asChild variant="outline"><a href={pendingRequest.payment_link} target="_blank" rel="noopener noreferrer">Acessar o Link de Pagamento Novamente</a></Button></div></div></section> : null}

    <section className="rounded-3xl border border-primary/20 bg-primary/[0.035] p-6 sm:p-8"><div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Mais recursos</p><h2 className="mt-2 text-2xl font-semibold">Soluções para cada fase da sua presença digital</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Pro e Agency incluem histórico do Instagram e projetos salvos na conta. O Agency também permite enviar publicações para aprovação dos clientes por links privados, além de organizar projetos por cliente. Serviços de execução, como gestão de redes sociais e tráfego, são contratados separadamente.</p></div><div className="grid gap-2"><Button asChild><Link href="/planos">Planos e benefícios Kivai <ArrowRight /></Link></Button><Button asChild variant="outline"><Link href="/servicos">Nossos Serviços <ArrowRight /></Link></Button></div></div></section>

    <div className="flex justify-end"><a href="#painel-inicio" className="inline-flex min-h-11 items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"><ArrowUp aria-hidden="true" className="size-4" /> Voltar ao início do painel</a></div>
  </div>;
}
