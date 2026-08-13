import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/blog/auth";
import { noIndexRobots } from "@/lib/seo";

export const metadata: Metadata = { title: "Administração do blog", robots: noIndexRobots };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return <AdminShell>{children}</AdminShell>;
}
