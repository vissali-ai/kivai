"use client";

import { useEffect, useState } from "react";
import { consumeOAuthNext, saveSession, type KivaiAuthSession } from "@/lib/user-auth";

export default function UserAuthCallbackPage() {
  const [message, setMessage] = useState("Concluindo seu acesso...");

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const accessToken = hash.get("access_token");
    const refreshToken = hash.get("refresh_token") ?? undefined;
    const expiresIn = Number(hash.get("expires_in") ?? 0) || undefined;
    const tokenType = hash.get("token_type") ?? undefined;
    const errorDescription = hash.get("error_description") ?? hash.get("error");
    const query = new URLSearchParams(window.location.search);
    const queryNext = query.get("next");
    const next = queryNext?.startsWith("/") ? queryNext : consumeOAuthNext();

    if (errorDescription) {
      setMessage(`Não foi possível entrar: ${errorDescription}`);
      return;
    }

    if (!accessToken) {
      setMessage("Não recebemos uma sessão válida. Volte e tente novamente.");
      return;
    }

    const session: KivaiAuthSession = {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: expiresIn,
      token_type: tokenType,
    };
    saveSession(session);
    window.history.replaceState({}, "", window.location.pathname);
    window.location.replace(next);
  }, []);

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-6">
      <div className="max-w-md text-center">
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </main>
  );
}
