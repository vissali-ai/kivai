"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { getStoredSession } from "@/lib/user-auth";

export function PaymentReturnClient({ reference }: { reference: string }) {
  const [status, setStatus] = useState<"checking" | "success" | "pending" | "error">("checking");
  const [message, setMessage] = useState("Confirmando seu pagamento...");

  useEffect(() => {
    async function confirm() {
      const session = getStoredSession();
      if (!session?.access_token) {
        const next = `/conta/checkout/retorno?ref=${encodeURIComponent(reference)}`;
        window.location.replace(`/conta/login?next=${encodeURIComponent(next)}`);
        return;
      }
      try {
        const response = await fetch("/api/billing/sumup/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ reference }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Não foi possível confirmar o pagamento.");
        if (data.active) {
          setStatus("success");
          setMessage("Pagamento confirmado. Seu plano está ativo.");
        } else {
          setStatus("pending");
          setMessage("O pagamento ainda está sendo processado. Aguarde alguns instantes e atualize esta página.");
        }
      } catch (error) {
        setStatus("error");
        setMessage(error instanceof Error ? error.message : "Não foi possível confirmar o pagamento.");
      }
    }
    confirm();
  }, [reference]);

  return <div className="mx-auto max-w-xl border border-white/10 bg-card p-6 sm:p-8">
    {status === "checking" ? <Loader2 className="size-7 animate-spin text-primary" /> : status === "success" ? <CheckCircle2 className="size-8 text-emerald-400" /> : null}
    <h1 className="mt-4 text-2xl font-semibold">{status === "success" ? "Assinatura ativada" : "Confirmação de pagamento"}</h1>
    <p className="mt-3 text-sm leading-6 text-muted-foreground">{message}</p>
    <div className="mt-6 flex flex-wrap gap-3">{status === "success" ? <Link href="/conta" className="inline-flex bg-primary px-5 py-3 text-sm font-medium text-primary-foreground">Ir para minha conta</Link> : <button type="button" onClick={() => window.location.reload()} className="inline-flex border border-primary/30 px-5 py-3 text-sm font-medium text-primary">Verificar novamente</button>}<Link href="/planos" className="inline-flex px-5 py-3 text-sm text-muted-foreground">Ver planos</Link></div>
  </div>;
}
