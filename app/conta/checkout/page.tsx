import type { Metadata } from "next";
import Link from "next/link";
import { CheckoutClient } from "@/components/account/checkout-client";

export const metadata: Metadata = {
  title: { absolute: "Finalizar assinatura | Kivai" },
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ plan?: string; billing?: string }> };

export default async function CheckoutPage({ searchParams }: Props) {
  const params = await searchParams;
  const plan = params.plan === "agency" ? "agency" : params.plan === "pro" ? "pro" : null;
  const billing = params.billing === "annual" ? "annual" : params.billing === "monthly" ? "monthly" : null;

  if (!plan || !billing) {
    return <main className="min-h-screen px-4 pb-20 pt-24"><div className="mx-auto max-w-xl border border-white/10 bg-card p-6"><h1 className="text-2xl font-semibold">Escolha um plano</h1><p className="mt-3 text-sm text-muted-foreground">Volte para a página de planos e escolha a modalidade e a periodicidade antes de continuar.</p><Link href="/planos" className="mt-5 inline-flex bg-primary px-5 py-3 text-sm font-medium text-primary-foreground">Ver planos</Link></div></main>;
  }

  return <main className="min-h-screen px-4 pb-20 pt-24 sm:px-6"><CheckoutClient plan={plan} billing={billing} /></main>;
}
