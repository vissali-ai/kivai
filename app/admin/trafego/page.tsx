import type { Metadata } from "next";

import { noIndexRobots } from "@/lib/seo";
import { TrafegoAdmin } from "@/components/admin/trafego-admin";

export const metadata: Metadata = {
  title: "Leads de tráfego",
  robots: noIndexRobots,
  alternates: { canonical: "/admin/trafego" },
};

export default function TrafegoLeadsPage() {
  return <TrafegoAdmin />;
}
