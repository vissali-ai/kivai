import type { Metadata } from "next";
import { UserLoginForm } from "@/components/account/user-login-form";
import { noIndexRobots } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Entrar na sua conta",
  robots: noIndexRobots,
  alternates: { canonical: "/conta/login" },
};

export default async function UserLoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = "/conta" } = await searchParams;
  return (
    <main className="flex min-h-[78vh] items-center justify-center px-4 py-20">
      <section className="w-full max-w-md border border-white/10 bg-card p-6 shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Conta Kivai</p>
        <h1 className="mt-2 text-2xl font-semibold">Entrar</h1>
        <p className="mt-2 text-sm text-muted-foreground">Acesse suas análises, histórico e recursos do seu plano.</p>
        <div className="mt-6"><UserLoginForm next={next} /></div>
      </section>
    </main>
  );
}
