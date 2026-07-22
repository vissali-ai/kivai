"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  CircleDollarSign,
  Percent,
  RotateCcw,
  Tags,
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

function getMarkupAnalysis(markup: number, margem: number) {
  if (markup === 0) {
    return {
      title: "Preço sem acréscimo",
      description:
        "O preço sugerido está igual ao custo total informado. Não há lucro bruto considerando apenas esses valores.",
      className:
        "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100",
    };
  }

  return {
    title: "Preço calculado com markup",
    description: `Um markup de ${formatPercentage(
      markup
    )}% resulta em uma margem de ${formatPercentage(
      margem
    )}%. Markup e margem são indicadores diferentes.`,
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-100",
  };
}

export default function CalculadoraDeMarkupClient() {
  const [custoTotal, setCustoTotal] = useState("");
  const [markup, setMarkup] = useState("");

  const resultado = useMemo(() => {
    const custoTotalNumero = Number(custoTotal);
    const markupNumero = Number(markup);

    if (
      !Number.isFinite(custoTotalNumero) ||
      !Number.isFinite(markupNumero) ||
      custoTotalNumero <= 0 ||
      markupNumero < 0
    ) {
      return null;
    }

    const precoSugerido =
      custoTotalNumero * (1 + markupNumero / 100);

    const lucroBruto = precoSugerido - custoTotalNumero;

    const margem =
      precoSugerido > 0
        ? (lucroBruto / precoSugerido) * 100
        : 0;

    return {
      custoTotal: custoTotalNumero,
      markup: markupNumero,
      precoSugerido,
      lucroBruto,
      margem,
      analysis: getMarkupAnalysis(markupNumero, margem),
    };
  }, [custoTotal, markup]);

  function limparCampos() {
    setCustoTotal("");
    setMarkup("");
  }

  const inputClassName =
    "h-11 w-full border border-border bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary";

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
            Precificação e Rentabilidade
          </p>

          <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
            Calculadora de Markup
          </h1>

          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
            Calcule um preço de venda sugerido com base no custo total e no
            percentual de markup desejado.
          </p>
        </div>

        <Card className="mx-auto max-w-4xl overflow-hidden">
          <CardHeader>
            <CardTitle>Calcule seu preço com markup</CardTitle>

            <CardDescription>
              Informe o custo total e o percentual de markup para estimar o
              preço de venda, o lucro bruto e a margem resultante.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
              <div className="space-y-6">
                <div className="border border-border bg-muted/20 p-4 sm:p-5">
                  <p className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Dados da precificação
                  </p>

                  <div className="space-y-4">
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
                          placeholder="100,00"
                          value={custoTotal}
                          onChange={(event) =>
                            setCustoTotal(event.target.value)
                          }
                          className={`${inputClassName} border-0`}
                        />
                      </div>

                      <p className="mt-2 text-xs leading-5 text-muted-foreground">
                        Considere produto, taxas, impostos, embalagem, frete e
                        outros custos aplicáveis.
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor="markup"
                        className="text-sm font-medium"
                      >
                        Markup desejado
                      </label>

                      <div className="mt-2 flex items-center border border-border bg-background">
                        <input
                          id="markup"
                          type="number"
                          min="0"
                          step="0.01"
                          inputMode="decimal"
                          placeholder="50,00"
                          value={markup}
                          onChange={(event) =>
                            setMarkup(event.target.value)
                          }
                          className={`${inputClassName} border-0`}
                        />

                        <span className="pr-3 text-sm text-muted-foreground">
                          %
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border border-border bg-muted/20 p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center border border-border bg-background text-primary">
                      <Tags className="size-4" aria-hidden="true" />
                    </div>

                    <div>
                      <p className="text-sm font-medium">
                        Markup não é margem
                      </p>

                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        Um markup de 50% sobre um custo de R$ 100,00 gera um
                        preço de R$ 150,00, mas a margem resultante é 33,33%.
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
                    <TrendingUp className="size-5" aria-hidden="true" />
                  </div>

                  <p className="mt-5 text-sm font-medium text-muted-foreground">
                    Preço sugerido
                  </p>

                  <p className="mt-2 font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
                    {resultado
                      ? formatCurrency(resultado.precoSugerido)
                      : "R$ 0,00"}
                  </p>

                  <p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">
                    {resultado
                      ? `Com markup de ${formatPercentage(
                          resultado.markup
                        )}%, o lucro bruto estimado é ${formatCurrency(
                          resultado.lucroBruto
                        )}.`
                      : "Preencha o custo total e o markup desejado para calcular o preço sugerido."}
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
                          Lucro bruto
                        </p>
                      </div>

                      <p className="mt-2 font-heading text-xl font-semibold">
                        {formatCurrency(resultado.lucroBruto)}
                      </p>
                    </div>

                    <div className="border border-border bg-muted/20 p-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Percent className="size-4" aria-hidden="true" />

                        <p className="text-xs uppercase tracking-wider">
                          Margem resultante
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