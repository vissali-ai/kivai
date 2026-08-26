"use client";

import Link from "next/link";
import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signInWithGoogle, signUpWithPassword } from "@/lib/user-auth";

export function UserSignupForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (password.length < 8) {
      setError("Use uma senha com pelo menos 8 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    setPending(true);
    try {
      const result = await signUpWithPassword(name, email, password);
      if (result.access_token) {
        window.location.assign("/conta");
        return;
      }
      setMessage("Conta criada. Confira seu e-mail para confirmar o cadastro e depois faça login.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível criar sua conta.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-5">
      <Button type="button" variant="outline" className="h-11 w-full" onClick={() => signInWithGoogle("/conta")}>
        Continuar com Google
      </Button>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        ou crie com e-mail
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block space-y-1.5 text-sm">
          <span>Nome</span>
          <Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required className="h-11" />
        </label>
        <label className="block space-y-1.5 text-sm">
          <span>E-mail</span>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" required className="h-11" />
        </label>
        <label className="block space-y-1.5 text-sm">
          <span>Senha</span>
          <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete="new-password" required className="h-11" />
        </label>
        <label className="block space-y-1.5 text-sm">
          <span>Confirmar senha</span>
          <Input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} type="password" autoComplete="new-password" required className="h-11" />
        </label>
        {error ? <p className="border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</p> : null}
        {message ? <p className="border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">{message}</p> : null}
        <Button type="submit" disabled={pending} className="h-11 w-full">
          <UserPlus /> {pending ? "Criando..." : "Criar conta"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Já tem conta? <Link href="/conta/login" className="font-medium text-primary hover:underline">Entrar</Link>
      </p>
    </div>
  );
}
