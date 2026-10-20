"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getStoredSession } from "@/lib/user-auth";
import { AI_CREDIT_PACKS, type AiCreditPackCode } from "@/lib/ai/packs";
import type { AiCreditsInfo } from "@/components/tools/ai-credit-balance";

export function CreditPacksClient() {
  const router = useRouter();
  const [salesEnabled, setSalesEnabled] = useState(false);
  const [loading, setLoading] = useState<AiCreditPackCode | null>(null);
  const [error, setError] = useState("");
  const [loginNeeded, setLoginNeeded] = useState(false);
  useEffect(() => {
    const session = getStoredSession();
    if (!session?.access_token) { setLoginNeeded(true); return; }
    void fetch("/api/ai/credits", {
      headers: { Authorization: `Bearer ${session.access_token}` },
      cache: "no-store",
    }).then(async response => {
      if (!response.ok) return;
      const result = await response.json() as AiCreditsInfo;
      setSalesEnabled(result.salesEnabled);
    }).catch(() => {});
  }, []);

  async function buy(pack: AiCreditPackCode) {
    const session = getStoredSession();
    if (!session?.access_token) {
      router.push("/conta/login?next=%2Fcreditos");
      return;
    }
    setError(""); setLoading(pack);
    try {
      const response = await fetch("/api/ai/credits/checkout", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ pack }),
      });
      const json = await response.json() as { checkoutUrl?: string; error?: string };
      if (!response.ok || !json.checkoutUrl ||
          !/^https:\/\/(checkout\.infinitepay\.com\.br|checkout\.infinitepay\.io|buy\.infinitepay\.io)\//.test(json.checkoutUrl)) {
        throw new Error(json.error || "O pagamento não pôde ser iniciado.");
      }
      window.location.assign(json.checkoutUrl);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível iniciar o pagamento.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <section className="space-y-4" aria-labelledby="credit-packs-heading">
      <div>
        <h2 id="credit-packs-heading" className="text-xl font-semibold">Pacotes avulsos</h2>
        <p className="mt-1 text-sm text-muted-foreground">Créditos adicionais para quando sua franquia mensal acabar.</p>
      </div>
      {!salesEnabled && <p className="border border-border bg-muted/20 p-3 text-sm">
        Os pacotes estão em preparação. A contratação ainda não está disponível e não haverá cobrança nesta página.
      </p>}
      {loginNeeded && <p className="text-sm text-muted-foreground">Entre na conta para acompanhar seus créditos e comprar pacotes quando disponíveis.</p>}
      <div className="grid gap-4 md:grid-cols-3">
        {(Object.entries(AI_CREDIT_PACKS) as Array<[AiCreditPackCode, typeof AI_CREDIT_PACKS[AiCreditPackCode]]>).map(([key, pack]) => (
          <article key={key} className="flex flex-col gap-3 border border-border bg-card p-5">
            <h3 className="text-xl font-semibold">{pack.label}</h3>
            <p className="text-3xl font-bold">{(pack.cents / 100).toLocaleString("pt-BR", {style:"currency",currency:"BRL"})}</p>
            <p className="text-lg font-semibold">{pack.credits} créditos</p>
            <p className="text-sm text-muted-foreground">
              {(pack.cents / 100 / pack.credits).toLocaleString("pt-BR", {style:"currency",currency:"BRL"})} por crédito, aproximadamente.
            </p>
            <Button className="mt-auto w-full" disabled={!salesEnabled || Boolean(loading)} onClick={() => void buy(key)}>
              {loading === key ? <LoaderCircle className="size-4 animate-spin" /> : <ShoppingCart className="size-4" />}
              {loading === key ? "Abrindo pagamento…" : salesEnabled ? "Comprar créditos" : "Em breve"}
            </Button>
          </article>
        ))}
      </div>
      {error && <p role="alert" className="border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
    </section>
  );
}
