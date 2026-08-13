"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BlogAdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-[55vh] items-center justify-center">
      <section className="w-full max-w-xl border border-red-500/30 bg-red-500/5 p-6">
        <AlertTriangle className="size-7 text-red-400" />
        <h1 className="mt-4 text-xl font-semibold">Não foi possível carregar o painel</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{error.message || "Confira a conexão com o banco de dados e tente novamente."}</p>
        <Button className="mt-5" onClick={reset}><RefreshCw />Tentar novamente</Button>
      </section>
    </main>
  );
}
