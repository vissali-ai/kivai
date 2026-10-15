"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getStoredSession } from "@/lib/user-auth";

export function CreditPaymentReturn({ orderId, transactionNsu, slug }: { orderId: string; transactionNsu: string; slug: string }) {
  const [state, setState] = useState<"checking"|"paid"|"pending"|"error">("checking");
  const [credits, setCredits] = useState(0);
  async function check() {
    const session = getStoredSession();
    if (!session?.access_token) { setState("error"); return; }
    setState("checking");
    try {
      const response = await fetch("/api/ai/credits/confirm", {
        method:"POST", cache:"no-store",
        headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type":"application/json" },
        body: JSON.stringify({orderId, transactionNsu, slug}),
      });
      if (!response.ok) { setState("error"); return; }
      const data = await response.json() as { paid:boolean; credits?:number };
      if (data.paid) { setCredits(data.credits || 0); setState("paid"); }
      else setState("pending");
    } catch { setState("error"); }
  }
  useEffect(() => { void check(); }, [orderId, transactionNsu, slug]);
  return (
    <div className="mx-auto max-w-xl space-y-5 border border-border bg-card p-6">
      <h1 className="text-2xl font-semibold">Confirmação de créditos</h1>
      {state === "checking" && <p className="flex items-center gap-2 text-sm"><LoaderCircle className="size-4 animate-spin" /> Verificando pagamento diretamente com a operadora...</p>}
      {state === "paid" && <p role="status" className="text-sm">Pagamento confirmado. {credits} créditos foram creditados na sua conta.</p>}
      {state === "pending" && <p role="status" className="text-sm">Ainda não recebemos a confirmação de pagamento. Aguarde alguns instantes: o webhook da InfinitePay também pode atualizar seu saldo automaticamente. Não faça outro pagamento antes de conferir seu saldo.</p>}
      {state === "error" && <p role="alert" className="text-sm">Não foi possível confirmar agora. Entre na sua conta e tente verificar novamente. Se o pagamento foi efetuado, não refaça a compra antes da confirmação.</p>}
      {state !== "paid" && <Button type="button" onClick={() => void check()}>Verificar novamente</Button>}
      <Link className="block text-sm text-primary underline" href="/creditos">Voltar aos créditos</Link>
    </div>
  );
}
