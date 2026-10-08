import type { Metadata } from "next";
import { UserSignupForm } from "@/components/account/user-signup-form";
import { noIndexRobots } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Criar conta",
  robots: noIndexRobots,
  alternates: { canonical: "/conta/cadastro" },
};

export default async function UserSignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = "/conta" } = await searchParams;
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/conta";
  return (
    <main className="flex min-h-[78vh] items-center justify-center px-4 py-20">
      <section className="w-full max-w-md border border-white/10 bg-card p-6 shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Conta Kivai</p>
        <h1 className="mt-2 text-2xl font-semibold">Criar conta</h1>
        <div className="mt-6"><UserSignupForm next={safeNext} /></div>
      </section>
    </main>
  );
}
