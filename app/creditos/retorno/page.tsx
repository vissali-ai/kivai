import type { Metadata } from "next";
import { CreditPaymentReturn } from "@/components/tools/credit-payment-return";
import { noIndexRobots } from "@/lib/seo";
export const metadata: Metadata = { title: "Confirmar créditos | Kivai", robots: noIndexRobots };
export default async function CreditReturnPage({searchParams}: {searchParams: Promise<{order?:string}>}) {
  const p=await searchParams;
  const order=(p.order||"").slice(0,100);
  return <main className="min-h-[75vh] px-4 py-24">
    { /^[a-f\d-]{36}$/i.test(order)
      ? <CreditPaymentReturn orderId={order} />
      : <div className="mx-auto max-w-xl border border-border p-6">Referência de compra não encontrada.</div> }
  </main>;
}
