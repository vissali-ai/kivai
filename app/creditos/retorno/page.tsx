import type { Metadata } from "next";
import { CreditPaymentReturn } from "@/components/tools/credit-payment-return";
import { noIndexRobots } from "@/lib/seo";

export const metadata: Metadata = { title: "Confirmar créditos | Kivai", robots: noIndexRobots };

type Search = { order?: string; transaction_nsu?: string; slug?: string; order_nsu?: string };

export default async function CreditReturnPage({ searchParams }: { searchParams: Promise<Search> }) {
  const p = await searchParams;
  const order = (p.order || "").slice(0, 100);
  const transactionNsu = (p.transaction_nsu || "").slice(0, 150);
  const slug = (p.slug || "").slice(0, 150);
  const reference = (p.order_nsu || "").slice(0, 150);
  const matches = reference === `kivai-ai-${order}`;

  return <main className="min-h-[75vh] px-4 py-24">
    {/^[a-f\d-]{36}$/i.test(order)
      ? <CreditPaymentReturn
          orderId={order}
          transactionNsu={matches ? transactionNsu : ""}
          slug={matches ? slug : ""}
        />
      : <div className="mx-auto max-w-xl border border-border p-6">Referência de compra não encontrada.</div>}
  </main>;
}
