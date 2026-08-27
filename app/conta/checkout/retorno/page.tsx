import type { Metadata } from "next";
import { PaymentReturnClient } from "@/components/account/payment-return-client";

export const metadata: Metadata = {
  title: { absolute: "Confirmar pagamento | Kivai" },
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ ref?: string }> };

export default async function PaymentReturnPage({ searchParams }: Props) {
  const params = await searchParams;
  const reference = (params.ref ?? "").slice(0, 120);
  if (!reference) return <main className="min-h-screen px-4 pb-20 pt-24"><div className="mx-auto max-w-xl border border-white/10 bg-card p-6"><h1 className="text-2xl font-semibold">Referência de pagamento não encontrada</h1><p className="mt-3 text-sm text-muted-foreground">Volte para a página de planos e inicie novamente a contratação.</p></div></main>;
  return <main className="min-h-screen px-4 pb-20 pt-24 sm:px-6"><PaymentReturnClient reference={reference} /></main>;
}
