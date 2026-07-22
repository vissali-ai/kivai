"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  CircleDollarSign,
  Percent,
  RotateCcw,
  Scale,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { AdSlot } from "@/components/ads/ad-slot";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatPercentage(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function getMarginAnalysis(margem: number) {
  if (margem < 0) {
    return {
      title: "Margem negativa",
      description:
        "O custo total está acima do preço de venda. O resultado indica prejuízo por venda com base nos valores informados.",
      className:
        "border-red-200 bg-red-50 text-red-900 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-100",
    };
  }

  if (Math.abs(margem) < 0.01) {
    return {
      title: "Venda no ponto de equilíbrio",
      description:
        "O preço de venda está equivalente ao custo total. Não há lucro nem prejuízo considerando apenas os valores informados.",
      className:
        "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100",
    };
  }

  return {
    title: "Margem positiva",
    description:
      "O preço de venda está acima do custo total. O resultado indica lucro por venda com base nos valores informados.",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-100",
  };
}

export default function CalculadoraDeMargemClient() {
  const [precoVenda, setPrecoVenda] = useState("");
  const [custoTotal, setCustoTotal] = useState("");

  const resultado = useMemo(() => {
    const precoVendaNumero = Number(precoVenda);
    const custoTotalNumero = Number(custoTotal);

    if (
      !Number.isFinite(precoVendaNumero) ||
      !Number.isFinite(custoTotalNumero) ||
      precoVendaNumero <= 0 ||
      custoTotalNumero < 0
    ) {
      return null;
    }

    const lucroOuPrejuizo = precoVendaNumero - custoTotalNumero;
    const margem = (lucroOuPrejuizo / precoVendaNumero) * 100;

    return {
      precoVenda: precoVendaNumero,
      custoTotal: custoTotalNumero,
      lucroOuPrejuizo,
      margem,
      analysis: getMarginAnalysis(margem),
    };
  }, [precoVenda, custoTotal]);

  function limparCampos() {
    setPrecoVenda("");
    setCustoTotal("");
  }

  const inputClassName =
    "h-11 w-full border border-border bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary";

  const ResultadoIcon =
    resultado && resultado.margem < 0 ? TrendingDown : TrendingUp;

  return (
    <section className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mb-8">
          <Link
            href="/ferramentas/calculadoras"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Voltar para Calculadoras
          </Link>
        </div>

        <div className="mb-10 max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-wider text-primary">
            Vendas e Rentabilidade
          </p>

          <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
            Calculadora de Margem
          </h1>

          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
            Calcule a margem percentual e descubra o lucro ou prejuízo por venda
            com base no preço e no custo total.
          </p>
        </div>

        <Card className="mx-auto max-w-4xl overflow-hidden">
          <CardHeader>
            <CardTitle>Calcule a margem da sua venda</CardTitle>

            <CardDescription>
              Informe o preço de venda e o custo total para analisar a margem
              percentual e o resultado financeiro por venda.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
              <div className="space-y-6">
                <div className="border border-border bg-muted/20 p-4 sm:p-5">
                  <p className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Dados da venda
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="precoVenda"
                        className="text-sm font-medium"
                      >
                        Preço de venda
                      </label>

                      <div className="mt-2 flex items-center border border-border bg-background">
                        <span className="pl-3 text-sm text-muted-foreground">
                          R$
                        </span>

                        <input
                          id="precoVenda"
                          type="number"
                          min="0"
                          step="0.01"
                          inputMode="decimal"
                          placeholder="100,00"
                          value={precoVenda}
                          onChange={(event) =>
                            setPrecoVenda(event.target.value)
                          }
                          className={`${inputClassName} border-0`}
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="custoTotal"
                        className="text-sm font-medium"
                      >
                        Custo total
                      </label>

                      <div className="mt-2 flex items-center border border-border bg-background">
                        <span className="pl-3 text-sm text-muted-foreground">
                          R$
                        </span>

                        <input
                          id="custoTotal"
                          type="number"
                          min="0"
                          step="0.01"
                          inputMode="decimal"
                          placeholder="60,00"
                          value={custoTotal}
                          onChange={(event) =>
                            setCustoTotal(event.target.value)
                          }
                          className={`${inputClassName} border-0`}
                        />
                      </div>

                      <p className="mt-2 text-xs leading-5 text-muted-foreground">
                        Considere produto, taxas, impostos, embalagem, frete
                        subsidiado e outros custos aplicáveis à venda.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border border-border bg-muted/20 p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center border border-border bg-background text-primary">
                      <Scale className="size-4" aria-hidden="true" />
                    </div>

                    <div>
                      <p className="text-sm font-medium">
                        Como interpretar a margem
                      </p>

                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        A margem mostra qual percentual do preço de venda resta
                        após descontar o custo total informado. Margem e markup
                        são indicadores diferentes.
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="w-full"
                  onClick={limparCampos}
                >
                  <RotateCcw className="size-4" aria-hidden="true" />
                  Limpar campos
                </Button>
              </div>

              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Resultado
                </p>

                <div className="flex min-h-64 flex-col items-center justify-center border border-border bg-muted/20 p-5 text-center">
                  <div className="flex size-14 items-center justify-center border border-border bg-background text-primary">
                    <ResultadoIcon className="size-5" aria-hidden="true" />
                  </div>

                  <p className="mt-5 text-sm font-medium text-muted-foreground">
                    Sua margem
                  </p>

                  <p className="mt-2 font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
                    {resultado
                      ? `${formatPercentage(resultado.margem)}%`
                      : "0,00%"}
                  </p>

                  <p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">
                    {resultado
                      ? resultado.lucroOuPrejuizo >= 0
                        ? `A venda gera ${formatCurrency(
                            resultado.lucroOuPrejuizo
                          )} de lucro com base nos valores informados.`
                        : `A venda gera ${formatCurrency(
                            Math.abs(resultado.lucroOuPrejuizo)
                          )} de prejuízo com base nos valores informados.`
                      : "Preencha o preço de venda e o custo total para calcular a margem."}
                  </p>
                </div>

                {resultado && (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                    <div className="border border-border bg-muted/20 p-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <CircleDollarSign
                          className="size-4"
                          aria-hidden="true"
                        />

                        <p className="text-xs uppercase tracking-wider">
                          Resultado por venda
                        </p>
                      </div>

                      <p className="mt-2 font-heading text-xl font-semibold">
                        {formatCurrency(resultado.lucroOuPrejuizo)}
                      </p>
                    </div>

                    <div className="border border-border bg-muted/20 p-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Percent className="size-4" aria-hidden="true" />

                        <p className="text-xs uppercase tracking-wider">
                          Margem
                        </p>
                      </div>

                      <p className="mt-2 font-heading text-xl font-semibold">
                        {formatPercentage(resultado.margem)}%
                      </p>
                    </div>
                  </div>
                )}

                {resultado && (
                  <div
                    className={`mt-4 border p-4 ${resultado.analysis.className}`}
                  >
                    <p className="text-sm font-semibold">
                      {resultado.analysis.title}
                    </p>

                    <p className="mt-2 text-xs leading-5 opacity-90">
                      {resultado.analysis.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mx-auto mt-8 max-w-4xl">
          <AdSlot variant="banner" />
        </div>
      </div>
    </section>
  );
}