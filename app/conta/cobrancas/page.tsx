import type { Metadata } from "next";
import { BillingCenter } from "@/components/account/billing-center";
import { noIndexRobots } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Minha assinatura e pagamentos",
  robots: noIndexRobots,
};
export default function BillingCenterPage() {
  return <main className="mx-auto min-h-[78vh] w-full max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
    <BillingCenter />
  </main>;
}
