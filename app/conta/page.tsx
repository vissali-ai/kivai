import type { Metadata } from "next";
import { AccountDashboard } from "@/components/account/account-dashboard";
import { ContactPreferences } from "@/components/account/contact-preferences";
import { ProAccessCard } from "@/components/account/pro-access-card";
import { noIndexRobots } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Minha conta",
  robots: noIndexRobots,
  alternates: { canonical: "/conta" },
};

export default function AccountPage() {
  return (
    <main className="mx-auto min-h-[78vh] w-full max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
      <AccountDashboard />
      <ProAccessCard />
      <div className="mt-6"><ContactPreferences /></div>
    </main>
  );
}
