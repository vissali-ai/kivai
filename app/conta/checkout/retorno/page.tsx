import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Consultar pagamento | Kivai",
  robots: { index: false, follow: false },
};

/**
 * Preserva links antigos sem ativar nenhum serviço de pagamento descontinuado.
 * A conferência de pagamentos anteriores ocorre pelo atendimento.
 */
export default function LegacyCheckoutReturnPage() {
  return <main className="min-h-screen px-4 pb-20 pt-24 sm:px-6">
    <section className="mx-auto max-w-xl border border-border bg-card p-6 sm:p-8">
      <h1 className="text-2xl font-semibold">Conferir situação do pagamento</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Este fluxo de contratação foi substituído. Se você realizou algum pagamento anteriormente,
        consulte sua conta e entre em contato com o atendimento antes de tentar pagar novamente,
        para evitar cobranças duplicadas.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/conta" className="inline-flex bg-primary px-5 py-3 text-sm font-medium text-primary-foreground">Minha conta</Link>
        <Link href="/conta/atendimento" className="inline-flex border border-border px-5 py-3 text-sm font-medium">Falar com atendimento</Link>
      </div>
    </section>
  </main>;
}
