import type { Metadata } from "next";

import { noIndexRobots } from "@/lib/seo";
import { TrafegoAdmin } from "@/components/admin/trafego-admin";

export const metadata: Metadata = {
  title: "Painel administrativo",
  robots: noIndexRobots,
  alternates: { canonical: "/admin" },
};

export default function Admin() {
  return <TrafegoAdmin />;
}
