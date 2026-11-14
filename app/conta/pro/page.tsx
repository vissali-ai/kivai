import type { Metadata } from "next";
import { ProDashboard } from "@/components/account/pro-dashboard";
import { noIndexRobots } from "@/lib/seo";
import { FREE_PUBLIC_MODE } from "@/lib/billing/availability";

export const metadata: Metadata = {
  title: FREE_PUBLIC_MODE ? "Histórico do Instagram" : "Área Pro e Agency",
  robots: noIndexRobots,
};

export default function ProAccountPage() {
  return <main className="mx-auto min-h-[78vh] w-full max-w-6xl px-4 py-20 sm:px-6 lg:px-8"><ProDashboard /></main>;
}
