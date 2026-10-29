import type { Metadata } from "next";
import { UserLoginForm } from "@/components/account/user-login-form";
import { noIndexRobots } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Entrar na sua conta",
  robots: noIndexRobots,
  alternates: { canonical: "/conta/login" },
};

export default async function UserLoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <main className="kivai-auth-page flex min-h-[78vh] items-center justify-center px-4 py-20">
      <section className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-[0_12px_32px_rgba(32,41,56,0.07)] sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Conta Kivai</p>
        <h1 className="mt-2 text-2xl font-semibold">Entrar</h1>
        <p className="mt-2 text-sm text-muted-foreground">Acesse suas análises, histórico e recursos do seu plano.</p>
        <div className="mt-5 rounded-lg border border-primary/20 bg-primary/[0.04] px-4 py-3"><p className="text-sm font-semibold">7 dias de Kivai Pro grátis</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Benefício de boas-vindas, disponível uma única vez para contas elegíveis. Ative após entrar, sem cartão ou cobrança automática.</p></div>
        <div className="mt-6"><UserLoginForm next={next} /></div>
      </section>
    </main>
  );
}
