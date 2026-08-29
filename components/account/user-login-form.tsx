"use client";

import Link from "next/link";
import { useState } from "react";
import { KeyRound, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signInWithGoogle, signInWithPassword } from "@/lib/user-auth";

export function UserLoginForm({ next = "/conta" }: { next?: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [resetMode, setResetMode] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError(""); setMessage("");
    try { await signInWithPassword(email, password); window.location.assign(next.startsWith("/") ? next : "/conta"); }
    catch (err) { setError(err instanceof Error ? err.message : "Não foi possível entrar."); }
    finally { setPending(false); }
  }

  async function handleReset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/account/password-reset", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Não foi possível solicitar a redefinição.");
      setMessage(payload.message || "Se a conta usa e-mail e senha, enviaremos as instruções para o e-mail cadastrado.");
    } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível solicitar a redefinição."); }
    finally { setPending(false); }
  }

  if (resetMode) return <div className="space-y-5">
    <div><div className="flex items-center gap-2"><KeyRound className="size-5 text-primary" /><h2 className="font-semibold">Redefinir senha</h2></div><p className="mt-2 text-sm leading-6 text-muted-foreground">Informe o e-mail usado no cadastro. Esta opção é destinada a contas criadas com e-mail e senha. Contas que entram pelo Google continuam usando o acesso do Google.</p></div>
    <form onSubmit={handleReset} className="space-y-4"><label className="block space-y-1.5 text-sm"><span>E-mail</span><Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" required className="h-11" /></label>{error ? <p className="border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</p> : null}{message ? <p className="border border-primary/20 bg-primary/5 p-3 text-sm text-muted-foreground">{message}</p> : null}<Button type="submit" disabled={pending} className="h-11 w-full">{pending ? "Enviando..." : "Enviar link de redefinição"}</Button></form>
    <Button type="button" variant="ghost" className="w-full" onClick={() => { setResetMode(false); setError(""); setMessage(""); }}>Voltar para o login</Button>
  </div>;

  return <div className="space-y-5">
    <Button type="button" variant="outline" className="h-11 w-full" onClick={() => signInWithGoogle(next)}>Continuar com Google</Button>
    <div className="flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />ou entre com e-mail<span className="h-px flex-1 bg-border" /></div>
    <form onSubmit={handleSubmit} className="space-y-4"><label className="block space-y-1.5 text-sm"><span>E-mail</span><Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" required className="h-11" /></label><label className="block space-y-1.5 text-sm"><span>Senha</span><Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete="current-password" required className="h-11" /></label><div className="text-right"><button type="button" onClick={() => { setResetMode(true); setError(""); }} className="text-xs font-medium text-primary hover:underline">Esqueci a senha</button></div>{error ? <p className="border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</p> : null}<Button type="submit" disabled={pending} className="h-11 w-full"><LogIn /> {pending ? "Entrando..." : "Entrar"}</Button></form>
    <p className="text-center text-sm text-muted-foreground">Ainda não tem conta? <Link href="/conta/cadastro" className="font-medium text-primary hover:underline">Criar conta</Link></p>
  </div>;
}
