"use client";

import { useEffect, useState } from "react";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updatePassword } from "@/lib/user-auth";

export function ResetPasswordForm() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    if (params.get("type") === "recovery") setToken(params.get("access_token") ?? "");
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError(""); setMessage("");
    if (!token) { setError("Este link de redefinição é inválido ou expirou. Solicite um novo link."); return; }
    if (password.length < 8) { setError("A nova senha deve ter pelo menos 8 caracteres."); return; }
    if (password !== confirmation) { setError("As senhas informadas não são iguais."); return; }
    setPending(true);
    try { await updatePassword(token, password); setMessage("Senha redefinida com sucesso. Você já pode entrar com a nova senha."); window.history.replaceState({}, "", window.location.pathname); }
    catch (err) { setError(err instanceof Error ? err.message : "Não foi possível redefinir a senha."); }
    finally { setPending(false); }
  }

  return <section className="w-full max-w-md border border-white/10 bg-card p-6 shadow-2xl"><div className="flex items-center gap-2"><KeyRound className="size-5 text-primary" /><p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Conta Kivai</p></div><h1 className="mt-3 text-2xl font-semibold">Criar nova senha</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">Defina uma nova senha para sua conta criada com e-mail.</p><form onSubmit={submit} className="mt-6 space-y-4"><label className="block space-y-1.5 text-sm"><span>Nova senha</span><Input type="password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} /></label><label className="block space-y-1.5 text-sm"><span>Confirmar nova senha</span><Input type="password" minLength={8} required value={confirmation} onChange={(e) => setConfirmation(e.target.value)} /></label>{error ? <p className="border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</p> : null}{message ? <p className="border border-primary/20 bg-primary/5 p-3 text-sm text-muted-foreground">{message}</p> : null}<Button className="w-full" disabled={pending}>{pending ? "Salvando..." : "Redefinir senha"}</Button>{message ? <Button type="button" variant="outline" className="w-full" onClick={() => window.location.assign("/conta/login")}>Ir para o login</Button> : null}</form></section>;
}
