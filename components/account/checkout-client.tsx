"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, CreditCard, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentUser, getStoredSession } from "@/lib/user-auth";

declare global {
  interface Window {
    SumUpCard?: {
      mount(options: {
        id: string;
        checkoutId: string;
        onResponse?: (type: string, body: Record<string, unknown>) => void;
      }): void;
      unmount?: (id?: string) => void;
    };
  }
}

type StartResult = {
  mode: "hosted" | "recurring_setup";
  reference: string;
  checkoutId: string;
  hostedCheckoutUrl?: string;
  amount?: number;
};

export function CheckoutClient({ plan, billing }: { plan: "pro" | "agency"; billing: "monthly" | "annual" }) {
  const [status, setStatus] = useState<"checking" | "ready" | "starting" | "widget" | "activating" | "done" | "error">("checking");
  const [message, setMessage] = useState("");
  const [setup, setSetup] = useState<StartResult | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const mounted = useRef(false);

  const planName = plan === "pro" ? "Pro" : "Agency";
  const price = plan === "pro"
    ? billing === "monthly" ? "R$ 19,90/mês" : "R$ 199/ano"
    : billing === "monthly" ? "R$ 59,90/mês" : "R$ 599/ano";

  useEffect(() => {
    const session = getStoredSession();
    if (!session?.access_token) {
      const next = `/conta/checkout?plan=${plan}&billing=${billing}`;
      window.location.replace(`/conta/login?next=${encodeURIComponent(next)}`);
      return;
    }
    getCurrentUser(session).then((user) => {
      if (!user?.id) {
        const next = `/conta/checkout?plan=${plan}&billing=${billing}`;
        window.location.replace(`/conta/login?next=${encodeURIComponent(next)}`);
        return;
      }
      setStatus("ready");
    }).catch(() => setStatus("ready"));
  }, [plan, billing]);

  async function authorizedPost(path: string, body: unknown) {
    const session = getStoredSession();
    if (!session?.access_token) throw new Error("Faça login para continuar.");
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Não foi possível continuar o pagamento.");
    return data;
  }

  async function start() {
    setStatus("starting"); setMessage("");
    try {
      const data = await authorizedPost("/api/billing/sumup/start", { plan, billing }) as StartResult;
      if (data.mode === "hosted") {
        if (!data.hostedCheckoutUrl) throw new Error("Não foi possível abrir o pagamento seguro.");
        window.location.assign(data.hostedCheckoutUrl);
        return;
      }
      setSetup(data);
      setStatus("widget");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível iniciar o pagamento.");
      setStatus("error");
    }
  }

  useEffect(() => {
    if (!sdkReady || status !== "widget" || !setup?.checkoutId || mounted.current || !window.SumUpCard) return;
    mounted.current = true;
    window.SumUpCard.mount({
      id: "sumup-card",
      checkoutId: setup.checkoutId,
      onResponse: async (type, body) => {
        const normalized = type.toLowerCase();
        const bodyStatus = String(body?.status ?? "").toLowerCase();
        if (normalized.includes("error") || bodyStatus.includes("failed")) {
          setMessage("Não foi possível autorizar este cartão. Confira os dados e tente novamente.");
          return;
        }
        if (!(normalized.includes("success") || normalized.includes("sent") || ["paid", "successful"].includes(bodyStatus))) return;
        setStatus("activating");
        try {
          await authorizedPost("/api/billing/sumup/complete-recurring", { reference: setup.reference });
          setStatus("done");
          window.setTimeout(() => window.location.replace("/conta?assinatura=ativada"), 1000);
        } catch (error) {
          setMessage(error instanceof Error ? error.message : "Não foi possível confirmar sua assinatura.");
          setStatus("error");
        }
      },
    });
  }, [sdkReady, status, setup]);

  return <div className="mx-auto max-w-2xl space-y-6">
    <Script src="https://gateway.sumup.com/gateway/ecom/card/v2/sdk.js" strategy="afterInteractive" onLoad={() => setSdkReady(true)} />
    <section className="border border-white/10 bg-card p-6 sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Assinatura Kivai</p>
      <h1 className="mt-2 text-3xl font-semibold">Plano {planName}</h1>
      <p className="mt-3 text-lg font-semibold text-primary">{price}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">Pagamento vinculado à sua conta Kivai. A ativação acontece somente depois da confirmação da SumUp.</p>
      <div className="mt-5 flex items-start gap-3 border border-primary/20 bg-primary/[0.03] p-4 text-sm leading-6 text-muted-foreground"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" /><span>Os dados do cartão são coletados diretamente pela SumUp. O Kivai não recebe número completo do cartão nem CVV.</span></div>
    </section>

    {status === "checking" ? <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Validando sua conta...</p> : null}
    {status === "ready" ? <Button className="h-12 w-full" onClick={start}><CreditCard />Continuar para pagamento seguro</Button> : null}
    {status === "starting" ? <p className="flex items-center gap-2 border border-white/10 bg-card p-5 text-sm"><Loader2 className="size-4 animate-spin text-primary" />Preparando seu pagamento...</p> : null}

    {status === "widget" ? <section className="border border-white/10 bg-card p-5 sm:p-6"><h2 className="font-semibold">Autorize seu cartão para a assinatura mensal</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">A SumUp fará a autenticação necessária e solicitará seu consentimento para as cobranças recorrentes. A autorização inicial de tokenização é estornada pela própria SumUp; em seguida o Kivai realiza a primeira cobrança do plano.</p><div id="sumup-card" className="mt-5 min-h-60" /></section> : null}
    {status === "activating" ? <p className="flex items-center gap-2 border border-primary/20 bg-primary/[0.03] p-5 text-sm"><Loader2 className="size-4 animate-spin text-primary" />Confirmando a primeira cobrança e ativando o plano...</p> : null}
    {status === "done" ? <div className="flex items-center gap-3 border border-emerald-500/25 bg-emerald-500/5 p-5 text-sm"><CheckCircle2 className="size-5 text-emerald-400" /><span>Pagamento confirmado. Seu plano {planName} está ativo.</span></div> : null}
    {message ? <div className="border border-red-500/25 bg-red-500/5 p-4 text-sm text-red-200">{message}{status === "error" ? <Button type="button" variant="outline" size="sm" className="mt-3 block" onClick={() => { mounted.current = false; setSetup(null); setStatus("ready"); setMessage(""); }}>Tentar novamente</Button> : null}</div> : null}
  </div>;
}
