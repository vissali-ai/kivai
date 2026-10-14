import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Coins, ShieldCheck } from "lucide-react";
import { noIndexRobots } from "@/lib/seo";
import { CreditPacksClient } from "@/components/tools/credit-packs-client";
import { AiCreditBalance } from "@/components/tools/ai-credit-balance";

export const metadata: Metadata = {
  title: "Créditos de IA | Kivai",
  description: "Créditos para ferramentas inteligentes e franquias por plano.",
  robots: noIndexRobots,
};

export default function CreditsPage() {
  return (
    <main className="mx-auto min-h-[75vh] w-full max-w-5xl space-y-8 px-4 py-20 sm:px-6 lg:px-8">
      <Link href="/ferramentas/gerador-de-relatorio-social-media"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" /> Voltar à ferramenta
      </Link>
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-primary">
          <Coins className="size-6" aria-hidden="true"/><span className="text-sm font-semibold">Kivai IA</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Créditos para ferramentas inteligentes</h1>
        <p className="max-w-3xl text-muted-foreground">
          Você utiliza primeiro os créditos mensais incluídos no seu plano. Se precisar, pode complementar o saldo com créditos avulsos.
        </p>
      </div>
      <AiCreditBalance />
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Benefícios por plano</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {[{name:"Free",limit:10},{name:"Pro",limit:100},{name:"Agency",limit:300}].map(p=>(
            <div key={p.name} className="space-y-1 border border-border bg-card p-4">
              <p className="font-semibold">{p.name}</p>
              <p className="text-2xl font-bold">{p.limit}</p>
              <p className="text-xs text-muted-foreground">créditos mensais incluídos</p>
            </div>
          ))}
        </div>
        <p className="text-xs leading-5 text-muted-foreground">
          Os créditos mensais renovam no dia 1º de cada mês e não são cumulativos.
          Apenas assinaturas ativas recebem as franquias Pro e Agency.
        </p>
      </section>
      <CreditPacksClient />
      <section className="space-y-3 border border-border p-5">
        <h2 className="text-lg font-semibold">Como funcionam os créditos?</h2>
        <p className="text-sm leading-6">
          Análise de métricas e importação CSV/Excel: 1 crédito por solicitação. Importação de prints
          (até três juntos), inclusive por colagem, ou PDF: 2 créditos por solicitação.
          O custo é mostrado antes de iniciar.
        </p>
        <p className="text-sm leading-6">
          Os créditos extras, quando as vendas estiverem ativadas, não expiram e são usados
          depois da franquia mensal. Cada pagamento será confirmado no servidor antes da liberação do saldo.
          O limite de segurança de solicitações por hora continua valendo para todos os usuários.
        </p>
        <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true"/>
          O saldo é contabilizado no servidor. Solicitações que falham no processamento têm reserva de crédito
          devolvida, quando a falha é detectada ou recuperada automaticamente.
        </p>
      </section>
    </main>
  );
}
