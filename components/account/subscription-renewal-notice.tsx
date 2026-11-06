"use client";

import Link from "next/link";
import { useAccountAccess } from "@/lib/billing/access-client";

export function SubscriptionRenewalNotice() {
  const { access, loading } = useAccountAccess();
  const subscription = access?.subscription;
  if (loading || !subscription || (subscription.plan_code !== "pro" && subscription.plan_code !== "agency")) return null;

  const end = subscription.current_period_end ? new Date(subscription.current_period_end) : null;
  const validEnd = end && !Number.isNaN(end.getTime());
  const days = validEnd ? Math.ceil((end!.getTime() - Date.now()) / 86400000) : null;
  const currentlyPaid = access?.plan === "pro" || access?.plan === "agency";
  const needsAttention = !currentlyPaid || (days !== null && days <= 14);
  if (!needsAttention) return null;

  const formattedEnd = validEnd ? end!.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }) : null;
  const trial = subscription.test_access;
  const heading = currentlyPaid
    ? trial ? "Seu período de teste está terminando" : "Confira a próxima renovação do seu plano"
    : "Seu acesso pago precisa de atenção";

  return (
    <section aria-labelledby="renewal-notice-title" className="rounded-2xl border border-primary/25 bg-card p-5">
      <h2 id="renewal-notice-title" className="text-base font-semibold">{heading}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {formattedEnd ? `Data registrada de término do período: ${formattedEnd}. ` : ""}
        {trial ? "O teste não gera cobrança automática. " : ""}
        {currentlyPaid ? "Confira a situação do pagamento antes de contratar novamente." : "Se você já pagou, solicite a conferência para evitar uma cobrança duplicada."}
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link href="/planos" className="inline-flex min-h-10 items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Ver planos e renovação</Link>
        <Link href="/conta/atendimento" className="inline-flex min-h-10 items-center rounded-md border border-border px-4 py-2 text-sm font-medium">Falar com o atendimento</Link>
      </div>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">O acesso é atualizado após a confirmação do pagamento. Se você autorizou cobranças recorrentes na InfinitePay, confira o pagamento antes de iniciar uma nova contratação.</p>
    </section>
  );
}
