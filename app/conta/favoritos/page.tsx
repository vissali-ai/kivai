import type { Metadata } from "next";
import { AccountWorkspaceNav } from "@/components/account/account-workspace-nav";
import { MyFavoriteTools } from "@/components/account/my-favorite-tools";
import { noIndexRobots } from "@/lib/seo";

export const metadata: Metadata = { title: "Ferramentas Favoritas", robots: noIndexRobots };

export default function AccountFavoritesPage() {
  return (
    <main className="mx-auto min-h-[78vh] w-full max-w-7xl px-4 pb-20 pt-24 sm:px-6 lg:px-8">
      <div className="grid min-w-0 gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <AccountWorkspaceNav />
        <div className="min-w-0"><MyFavoriteTools /></div>
      </div>
    </main>
  );
}
