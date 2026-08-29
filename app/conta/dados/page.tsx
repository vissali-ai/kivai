import type { Metadata } from "next";
import { AccountDataPage } from "@/components/account/account-data-page";
import { noIndexRobots } from "@/lib/seo";

export const metadata: Metadata = { title: "Meus Dados", robots: noIndexRobots };

export default function CustomerDataPage() {
  return <main className="mx-auto w-full max-w-6xl px-4 pb-20 pt-24 sm:px-6 lg:px-8"><AccountDataPage /></main>;
}
