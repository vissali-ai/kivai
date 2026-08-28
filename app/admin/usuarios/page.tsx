import { Crown, Search, ShieldAlert, Trash2, UserRound, UsersRound } from "lucide-react";
import { listAdminCustomers } from "@/lib/admin/customer-users";
import { deleteCustomerPermanently, grantProTest, updateCustomerMarketing } from "./actions";

export const dynamic = "force-dynamic";

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("pt-BR");
}

export default async function AdminUsuariosPage({ searchParams }: { searchParams: Promise<{ q?: string; plan?: string; status?: string }> }) {
  const params = await searchParams;
  const all = await listAdminCustomers();
  const q = (params.q ?? "").trim().toLowerCase();
  const plan = params.plan ?? "all";
  const status = params.status ?? "all";
  const users = all.filter((user) => {
    if (q && !`${user.fullName ?? ""} ${user.email}`.toLowerCase().includes(q)) return false;
    if (plan !== "all" && user.planCode !== plan) return false;
    if (status === "active" && user.subscriptionStatus !== "active") return false;
    if (status === "expired" && user.subscriptionStatus !== "past_due") return false;
    return true;
  });

  const counts = {
    total: all.length,
    free: all.filter((u) => u.planCode === "free").length,
    pro: all.filter((u) => u.planCode === "pro").length,
    agency: all.filter((u) => u.planCode === "agency").length,
  };

  return <div className="space-y-6">
    <section className="border border-white/10 bg-card p-6">
      <div className="flex items-start justify-between gap-5">
        <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">CRM de clientes</p><h1 className="mt-2 text-3xl font-semibold">Usuários</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Visualize todos os usuários do Kivai, plano atual, situação da assinatura, histórico comercial e ações de retenção.</p></div>
        <UsersRound className="size-7 text-primary" />
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        <div className="border border-white/10 p-4"><p className="text-xs text-muted-foreground">Total</p><p className="mt-1 text-2xl font-semibold">{counts.total}</p></div>
        <div className="border border-white/10 p-4"><p className="text-xs text-muted-foreground">Grátis</p><p className="mt-1 text-2xl font-semibold">{counts.free}</p></div>
        <div className="border border-white/10 p-4"><p className="text-xs text-muted-foreground">Pro</p><p className="mt-1 text-2xl font-semibold text-primary">{counts.pro}</p></div>
        <div className="border border-white/10 p-4"><p className="text-xs text-muted-foreground">Agency</p><p className="mt-1 text-2xl font-semibold">{counts.agency}</p></div>
      </div>
    </section>

    <form className="grid gap-3 border border-white/10 bg-card p-4 md:grid-cols-[1fr_180px_180px_auto]">
      <label className="relative"><Search className="absolute left-3 top-3 size-4 text-muted-foreground" /><input name="q" defaultValue={params.q} placeholder="Buscar por nome ou e-mail" className="h-10 w-full border border-white/10 bg-background pl-9 pr-3 text-sm" /></label>
      <select name="plan" defaultValue={plan} className="h-10 border border-white/10 bg-background px-3 text-sm"><option value="all">Todos os planos</option><option value="free">Grátis</option><option value="pro">Pro</option><option value="agency">Agency</option></select>
      <select name="status" defaultValue={status} className="h-10 border border-white/10 bg-background px-3 text-sm"><option value="all">Todos os status</option><option value="active">Ativos</option><option value="expired">Vencidos</option></select>
      <button className="h-10 bg-primary px-5 text-sm font-semibold text-primary-foreground">Filtrar</button>
    </form>

    <div className="space-y-4">
      {users.map((user) => <article key={user.id} className="border border-white/10 bg-card p-5">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto]">
          <div>
            <div className="flex flex-wrap items-center gap-2"><div className="flex size-9 items-center justify-center border border-white/10 bg-white/[0.03]"><UserRound className="size-4 text-primary" /></div><div><h2 className="font-semibold">{user.fullName || "Usuário sem nome"}</h2><p className="text-sm text-muted-foreground">{user.email}</p></div><span className="border border-primary/20 bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">{user.planCode.toUpperCase()}</span>{user.testAccess ? <span className="border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-xs text-amber-200">TESTE</span> : null}</div>
            <div className="mt-4 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3"><span>Cadastro: {formatDate(user.createdAt)}</span><span>Último login: {formatDate(user.lastSignInAt)}</span><span>Vencimento: {formatDate(user.periodEnd)}</span></div>
          </div>

          <form action={updateCustomerMarketing} className="grid gap-2 sm:grid-cols-2">
            <input type="hidden" name="userId" value={user.id} />
            <label className="text-xs text-muted-foreground">Estágio<select name="lifecycleStage" defaultValue={user.lifecycleStage} className="mt-1 h-9 w-full border border-white/10 bg-background px-2 text-sm text-foreground"><option value="lead">Lead</option><option value="free">Grátis</option><option value="trial">Teste</option><option value="active">Ativo</option><option value="expiring">Perto de vencer</option><option value="expired">Vencido</option><option value="churned">Churn</option><option value="vip">VIP</option></select></label>
            <label className="text-xs text-muted-foreground">Score 0-100<input name="customerScore" type="number" min="0" max="100" defaultValue={user.customerScore} className="mt-1 h-9 w-full border border-white/10 bg-background px-2 text-sm text-foreground" /></label>
            <label className="text-xs text-muted-foreground sm:col-span-2">Tags<input name="tags" defaultValue={user.marketingTags.join(", ")} placeholder="bom-cliente, potencial-pro" className="mt-1 h-9 w-full border border-white/10 bg-background px-2 text-sm text-foreground" /></label>
            <label className="text-xs text-muted-foreground sm:col-span-2">Observação<input name="notes" placeholder="Observação interna" className="mt-1 h-9 w-full border border-white/10 bg-background px-2 text-sm text-foreground" /></label>
            <button className="h-9 border border-white/10 px-3 text-xs font-semibold sm:col-span-2">Salvar perfil comercial</button>
          </form>

          <div className="flex min-w-[190px] flex-col gap-2">
            <form action={grantProTest}><input type="hidden" name="userId" value={user.id} /><button className="flex h-9 w-full items-center justify-center gap-2 border border-primary/30 bg-primary/10 px-3 text-xs font-semibold text-primary"><Crown className="size-4" /> Pro teste 7 dias</button></form>
            <details className="border border-red-500/20 bg-red-500/[0.04] p-3"><summary className="cursor-pointer text-xs font-semibold text-red-300"><span className="inline-flex items-center gap-2"><Trash2 className="size-4" /> Excluir usuário</span></summary><form action={deleteCustomerPermanently} className="mt-3 space-y-2"><input type="hidden" name="userId" value={user.id} /><p className="text-xs leading-5 text-muted-foreground">Exclusão permanente da conta e registros vinculados por cascata. Digite EXCLUIR.</p><input name="confirmation" required placeholder="EXCLUIR" className="h-8 w-full border border-red-500/20 bg-background px-2 text-xs" /><button className="flex h-8 w-full items-center justify-center gap-2 bg-red-500/15 text-xs font-semibold text-red-200"><ShieldAlert className="size-3.5" /> Excluir permanentemente</button></form></details>
          </div>
        </div>
      </article>)}
      {!users.length ? <div className="border border-white/10 bg-card p-8 text-center text-sm text-muted-foreground">Nenhum usuário encontrado com esses filtros.</div> : null}
    </div>
  </div>;
}
