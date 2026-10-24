import type { Metadata } from "next";
import { UserSignupForm } from "@/components/account/user-signup-form";
import { noIndexRobots } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Criar conta",
  robots: noIndexRobots,
  alternates: { canonical: "/conta/cadastro" },
};

export default async function UserSignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <main className="kivai-auth-page flex min-h-[78vh] items-center justify-center px-4 py-20">
      <section className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-[0_12px_32px_rgba(32,41,56,0.07)] sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Conta Kivai</p>
        <h1 className="mt-2 text-2xl font-semibold">Criar conta</h1>
        <div className="mt-6"><UserSignupForm next={next} /></div>
      </section>
    </main>
  );
}
