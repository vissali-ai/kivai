import type { Metadata } from "next";

import { noIndexRobots } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: noIndexRobots,
  alternates: { canonical: "/dashboard" },
};

export default function Dashboard() {
  return (
    <main>
      <h1>Dashboard</h1>

      <p>Painel do usuário.</p>
    </main>
  );
}
