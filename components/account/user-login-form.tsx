"use client";

import Link from "next/link";
import { useState } from "react";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signInWithGoogle, signInWithPassword } from "@/lib/user-auth";

export function UserLoginForm({ next = "/conta" }: { next?: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      await signInWithPassword(email, password);
      window.location.assign(next.startsWith("/") ? next : "/conta");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível entrar.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-5">
      <Button type="button" variant="outline" className="h-11 w-full" onClick={() => signInWithGoogle(next)}>
        Continuar com Google
      </Button>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        ou entre com e-mail
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block space-y-1.5 text-sm">
          <span>E-mail</span>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" required className="h-11" />
        </label>
        <label className="block space-y-1.5 text-sm">
          <span>Senha</span>
          <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete="current-password" required className="h-11" />
        </label>
        {error ? <p className="border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</p> : null}
        <Button type="submit" disabled={pending} className="h-11 w-full">
          <LogIn /> {pending ? "Entrando..." : "Entrar"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Ainda não tem conta? <Link href="/conta/cadastro" className="font-medium text-primary hover:underline">Criar conta</Link>
      </p>
    </div>
  );
}
