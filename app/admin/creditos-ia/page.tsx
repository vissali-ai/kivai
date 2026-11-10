import { randomUUID } from "node:crypto";
import Link from "next/link";
import { listAdminCustomers } from "@/lib/admin/customer-users";
import { supabaseRest } from "@/lib/blog/supabase";
import { getAiCreditBalance } from "@/lib/ai/credits";
import { adjustCustomerAiCredits } from "./actions";

export const dynamic = "force-dynamic";

type Adjustment = { id: string; delta: number; balance_before: number; balance_after: number; reason: string; operator_email: string; created_at: string };
type Purchase = { id: string; pack_code: string; credits: number; amount_cents: number; status: string; created_at: string; paid_at: string | null };
type Usage = { id: string; cost: number; free_spent: number; purchased_spent: number; status: string; created_at: string };
function formatDate(value: string) { return new Date(value).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }); }

export default async function AdminAiCreditsPage({
  searchParams,
}: { searchParams: Promise<{ q?: string; user?: string }> }) {
  const params = await searchParams;
  const all = await listAdminCustomers();
  const q = (params.q ?? "").trim().toLowerCase().slice(0, 120);
  const selected = all.find(item => item.id === params.user);
  const candidates = q
    ? all.filter(item => `${item.email} ${item.fullName ?? ""}`.toLowerCase().includes(q)).slice(0, 30)
    : [];
  const [balance, adjustments, purchases, usage] = selected
    ? await Promise.all([
      getAiCreditBalance(selected.id),
      supabaseRest<Adjustment[]>(`ai_credit_admin_adjustments?select=id,delta,balance_before,balance_after,reason,operator_email,created_at&user_id=eq.${selected.id}&order=created_at.desc&limit=40`),
      supabaseRest<Purchase[]>(`ai_credit_orders?select=id,pack_code,credits,amount_cents,status,created_at,paid_at&user_id=eq.${selected.id}&order=created_at.desc&limit=30`),
      supabaseRest<Usage[]>(`ai_credit_operations?select=id,cost,free_spent,purchased_spent,status,created_at&user_id=eq.${selected.id}&order=created_at.desc&limit=30`),
    ])
    : [null, [], [], []];
  const operationId = randomUUID();

  return <div className="space-y-6">
    <header className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Comercial / IA</p>
      <h1 className="text-3xl font-semibold">Gerenciar Créditos de IA</h1>
      <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
        Consulte saldos, conceda bônus e faça ajustes justificados. As compras InfinitePay
        continuam automáticas e nunca são marcadas como pagas por este painel.
      </p>
    </header>

    <form action="/admin/creditos-ia" className="flex flex-wrap gap-3 border border-border bg-card p-4">
      <input name="q" defaultValue={params.q ?? ""} placeholder="Buscar cliente por nome ou e-mail"
        className="min-h-11 min-w-[220px] flex-1 border border-border bg-background px-3 text-sm" />
      <button className="min-h-11 bg-primary px-5 text-sm font-semibold text-primary-foreground">Buscar cliente</button>
    </form>
    {q && <section className="space-y-2" aria-label="Resultados da busca">
      <p className="text-sm text-muted-foreground">Até 30 resultados para sua busca.</p>
      {candidates.length === 0 ? <p className="text-sm">Nenhum cliente encontrado.</p> : candidates.map(customer =>
        <Link key={customer.id} href={`/admin/creditos-ia?user=${encodeURIComponent(customer.id)}`}
          className="flex flex-wrap items-center justify-between gap-2 border border-border bg-card p-3 text-sm hover:border-primary/40">
          <span><strong>{customer.fullName || "Usuário"}</strong><span className="ml-2 text-muted-foreground">{customer.email}</span></span>
          <span className="text-primary">Gerenciar saldo</span>
        </Link>)}
    </section>}

    {selected && balance && <div className="space-y-5">
      <section className="space-y-3 border border-border bg-card p-5">
        <div>
          <h2 className="text-xl font-semibold">{selected.fullName || "Cliente"} <span className="text-sm font-normal text-muted-foreground">{selected.email}</span></h2>
          <p className="text-xs text-muted-foreground">Plano atual: {selected.planCode.toUpperCase()}. O ajuste administrativo não altera o plano.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="border border-border p-4"><p className="text-xs text-muted-foreground">Saldo total</p><p className="text-3xl font-semibold">{balance.total_remaining}</p></div>
          <div className="border border-border p-4"><p className="text-xs text-muted-foreground">Franquia mensal restante</p><p className="text-3xl font-semibold">{balance.free_remaining}</p></div>
          <div className="border border-border p-4"><p className="text-xs text-muted-foreground">Avulsos e bônus restantes</p><p className="text-3xl font-semibold">{balance.purchased_remaining}</p></div>
        </div>
        <p className="text-xs text-muted-foreground">A franquia renova em {new Date(balance.renews_on + "T12:00:00-03:00").toLocaleDateString("pt-BR")}. Créditos avulsos e bônus permanecem no saldo.</p>
      </section>

      <section className="border border-border bg-card p-5">
        <h2 className="text-xl font-semibold">Ajuste manual</h2>
        <p className="mt-1 text-sm text-muted-foreground">Adição ou retirada afeta somente o saldo avulso. A retirada não pode ultrapassar os créditos disponíveis e não gera estorno financeiro.</p>
        <form action={adjustCustomerAiCredits} className="mt-4 grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="userId" value={selected.id} />
          <input type="hidden" name="operationId" value={operationId} />
          <label className="grid gap-1 text-sm font-medium">Operação
            <select name="kind" required className="min-h-11 border border-border bg-background px-3">
              <option value="grant">Adicionar créditos</option><option value="deduct">Retirar créditos</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm font-medium">Quantidade (1 a 10.000)
            <input name="quantity" inputMode="numeric" type="number" required min={1} max={10000} step={1}
              className="min-h-11 border border-border bg-background px-3" placeholder="Ex.: 50" />
          </label>
          <label className="grid gap-1 text-sm font-medium sm:col-span-2">Motivo obrigatório (mínimo de 10 caracteres)
            <textarea name="reason" minLength={10} maxLength={500} required rows={3}
              className="border border-border bg-background p-3" placeholder="Ex.: Bônus concedido após atendimento ao cliente" />
          </label>
          <label className="grid gap-1 text-sm font-medium">Digite CONFIRMAR para concluir
            <input name="confirmation" required pattern="CONFIRMAR" autoComplete="off"
              className="min-h-11 border border-border bg-background px-3" placeholder="CONFIRMAR" />
          </label>
          <div className="flex items-end">
            <button className="min-h-11 w-full bg-primary px-5 text-sm font-semibold text-primary-foreground">Registrar ajuste de créditos</button>
          </div>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Histórico de ajustes administrativos</h2>
        {adjustments.length === 0 ? <p className="border border-border p-4 text-sm text-muted-foreground">Nenhum ajuste administrativo registrado.</p>
          : <div className="space-y-2">{adjustments.map(item => <article key={item.id} className="border border-border bg-card p-4 text-sm">
            <div className="flex flex-wrap justify-between gap-2"><strong>{item.delta > 0 ? "+" : ""}{item.delta} créditos</strong><span className="text-muted-foreground">{formatDate(item.created_at)}</span></div>
            <p className="mt-1">Saldo avulso: {item.balance_before} → {item.balance_after}</p>
            <p className="mt-1 text-muted-foreground">Justificativa: {item.reason}</p>
            <p className="mt-1 text-xs text-muted-foreground">Responsável: {item.operator_email}</p>
          </article>)}</div>}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Compras InfinitePay</h2>
        {purchases.length === 0 ? <p className="border border-border p-4 text-sm text-muted-foreground">Nenhuma compra avulsa registrada.</p>
          : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-border"><th className="p-3">Data</th><th className="p-3">Pacote</th><th className="p-3">Créditos</th><th className="p-3">Valor</th><th className="p-3">Status</th></tr></thead><tbody>{purchases.map(item =>
            <tr key={item.id} className="border-b border-border"><td className="p-3">{formatDate(item.created_at)}</td><td className="p-3">{item.pack_code}</td><td className="p-3">{item.credits}</td><td className="p-3">R$ {(item.amount_cents / 100).toFixed(2).replace(".", ",")}</td><td className="p-3">{item.status === "paid" ? "Pago" : item.status === "pending" ? "Pendente" : "Cancelado"}</td></tr>)}</tbody></table></div>}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Últimas operações de uso</h2>
        {usage.length === 0 ? <p className="border border-border p-4 text-sm text-muted-foreground">Nenhuma utilização registrada.</p>
          : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-border"><th className="p-3">Data</th><th className="p-3">Consumo</th><th className="p-3">Franquia</th><th className="p-3">Avulsos</th><th className="p-3">Status</th></tr></thead><tbody>{usage.map(item =>
            <tr key={item.id} className="border-b border-border"><td className="p-3">{formatDate(item.created_at)}</td><td className="p-3">{item.cost}</td><td className="p-3">{item.free_spent}</td><td className="p-3">{item.purchased_spent}</td><td className="p-3">{item.status}</td></tr>)}</tbody></table></div>}
      </section>
    </div>}
    {params.user && !selected && <p className="border border-border bg-card p-4 text-sm">Usuário não encontrado. Faça uma nova busca.</p>}
  </div>;
}
