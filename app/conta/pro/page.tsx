import type { Metadata } from "next";
import { ProDashboard } from "@/components/account/pro-dashboard";
import { noIndexRobots } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Área Pro",
  robots: noIndexRobots,
};

export default function ProAccountPage() {
  return <main className="mx-auto min-h-[78vh] w-full max-w-6xl px-4 py-20 sm:px-6 lg:px-8"><ProDashboard /></main>;
}
