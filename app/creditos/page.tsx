import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Coins, ShieldCheck } from "lucide-react";
import { noIndexRobots } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Créditos de IA | Kivai",
  description: "Conheça a franquia gratuita e os pacotes de créditos para ferramentas inteligentes no Kivai.",
  robots: noIndexRobots,
};

const packages = [
  { label: "Inicial", price: "R$ 9,90", credits: 50, per: "R$ 0,20" },
  { label: "Profissional", price: "R$ 19,90", credits: 150, per: "R$ 0,13" },
  { label: "Agência", price: "R$ 39,90", credits: 400, per: "R$ 0,10" },
];

export default function CreditsPage() {
  return (
    <main className="mx-auto min-h-[75vh] w-full max-w-5xl space-y-8 px-4 py-20 sm:px-6 lg:px-8">
      <Link href="/ferramentas/gerador-de-relatorio-social-media"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" /> Voltar à ferramenta
      </Link>
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-primary"><Coins className="size-6" aria-hidden="true" /><span className="text-sm font-semibold">Kivai IA</span></div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Créditos para ferramentas inteligentes</h1>
        <p className="max-w-3xl text-muted-foreground">
          Sua conta recebe 10 créditos gratuitos por mês, renovados automaticamente.
          Os créditos adicionais permitirão ampliar o uso de recursos com inteligência artificial no Kivai.
        </p>
      </div>
      <div className="border border-border bg-muted/20 p-4 text-sm leading-6">
        <strong>Pacotes em preparação.</strong> Os valores abaixo são uma proposta de lançamento.
        As compras ainda não estão habilitadas. Nenhuma cobrança será realizada nesta página.
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {packages.map(pack => (
          <section key={pack.label} className="flex flex-col gap-3 border border-border bg-card p-5">
            <h2 className="text-xl font-semibold">{pack.label}</h2>
            <p className="text-3xl font-bold">{pack.price}</p>
            <p className="text-lg font-semibold">{pack.credits} créditos</p>
            <p className="text-sm text-muted-foreground">A partir de {pack.per} por crédito, conforme o pacote.</p>
            <div className="mt-auto pt-3">
              <Link href="/contato" className="inline-flex min-h-10 w-full items-center justify-center border border-border px-4 text-sm font-medium hover:bg-muted">
                Tenho interesse neste pacote
              </Link>
            </div>
          </section>
        ))}
      </div>
      <section className="space-y-3 border border-border p-5">
        <h2 className="text-lg font-semibold">Como funciona a contagem?</h2>
        <p className="text-sm leading-6">1 crédito por diagnóstico de métricas ou importação de CSV/Excel. São 2 créditos por importação de imagem (até 3 prints no mesmo pedido) ou PDF. Você sempre vê o custo antes de analisar.</p>
        <p className="text-sm leading-6">Os 10 créditos gratuitos são renovados no início de cada mês e não acumulam. O limite de segurança de 5 solicitações por hora continua valendo, mesmo quando houver saldo. Os créditos comprados, quando o sistema de venda estiver ativo, terão condições e validade informadas antes do pagamento.</p>
        <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          Os créditos são contabilizados no servidor e vinculados à sua conta. Uma falha técnica de processamento não deve consumir seus créditos, embora possa contar no limite de tentativas por hora.
        </p>
      </section>
    </main>
  );
}
