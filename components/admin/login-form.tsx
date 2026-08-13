"use client";

import { useActionState, useEffect } from "react";
import { LogIn } from "lucide-react";
import { loginAction } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(loginAction, { error: "", redirectTo: "" });
  useEffect(() => {
    if (state.redirectTo) window.location.assign(state.redirectTo);
  }, [state.redirectTo]);
  return (
    <form action={action} className="mt-6 space-y-4">
      <input type="hidden" name="next" value={next} />
      <label className="block space-y-1.5 text-sm"><span>E-mail administrativo</span><Input name="email" type="email" required autoComplete="username" className="h-10" /></label>
      <label className="block space-y-1.5 text-sm"><span>Senha</span><Input name="password" type="password" required autoComplete="current-password" className="h-10" /></label>
      {state.error ? <p className="border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{state.error}</p> : null}
      <Button type="submit" disabled={pending} className="h-10 w-full"><LogIn />{pending ? "Entrando..." : "Entrar no painel"}</Button>
    </form>
  );
}
