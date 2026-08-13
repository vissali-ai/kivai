import type { Metadata } from "next";

import { LoginForm } from "@/components/admin/login-form";
import { noIndexRobots } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Login",
  robots: noIndexRobots,
  alternates: { canonical: "/login" },
};

export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = "/admin/blog" } = await searchParams;
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <section className="w-full max-w-md border border-white/10 bg-card p-6 shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Kivai CMS</p>
        <h1 className="mt-2 text-2xl font-semibold">Acesso administrativo</h1>
        <p className="mt-2 text-sm text-muted-foreground">Entre para gerenciar as matérias do blog.</p>
        <LoginForm next={next} />
      </section>
    </main>
  );
}
