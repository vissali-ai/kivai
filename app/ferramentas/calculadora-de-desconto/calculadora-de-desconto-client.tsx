"use client";

import { useMemo, useState } from "react";
import {
  BadgePercent,
  CircleDollarSign,
  RotateCcw,
  ShoppingBag,
  TrendingDown,
} from "lucide-react";

import { AdSlot } from "@/components/ads/AdSlot";
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

function getDiscountAnalysis(discount: number) {
  if (discount === 0) {
    return {
      title: "Sem desconto",
      description:
        "O preço final permanece igual ao preço original, pois nenhum desconto foi aplicado.",
      className:
        "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100",
    };
  }

  if (discount === 100) {
    return {
      title: "Desconto total",
      description:
        "Um desconto de 100% resulta em preço final igual a zero.",
      className:
        "border-red-200 bg-red-50 text-red-900 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-100",
    };
  }

  return {
    title: "Desconto aplicado",
    description:
      "O preço final foi calculado com base no percentual informado.",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-100",
  };
}

export default function CalculadoraDeDescontoClient() {
  const [precoOriginal, setPrecoOriginal] = useState("");
  const [desconto, setDesconto] = useState("");

  const resultado = useMemo(() => {
    const preco = Number(precoOriginal);
    const percentual = Number(desconto);

    if (
      !Number.isFinite(preco) ||
      !Number.isFinite(percentual) ||
      preco <= 0 ||
      percentual < 0 ||
      percentual > 100
    ) {
      return null;
    }

    const valorDesconto = preco * (percentual / 100);
    const precoFinal = preco - valorDesconto;

    return {
      preco,
      percentual,
      valorDesconto,
      precoFinal,
      analysis: getDiscountAnalysis(percentual),
    };
  }, [precoOriginal, desconto]);

  function limparCampos() {
    setPrecoOriginal("");
    setDesconto("");
  }

  const inputClassName =
    "h-11 w-full border border-border bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary";

  return (
    <section className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-6xl px-4 pb-12 pt-32 sm:px-6 sm:pt-32 lg:px-8 lg:pb-16 lg:pt-32">
        <div className="mb-10 max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-wider text-primary">
            Vendas e Promoções
          </p>

          <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
            Calculadora de Desconto
          </h1>

          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
            Descubra quanto será economizado e qual será o preço final após a
            aplicação de um desconto percentual.
          </p>
        </div>

        <Card className="mx-auto max-w-4xl overflow-hidden">
          <CardHeader>
            <CardTitle>Calcule um desconto</CardTitle>

            <CardDescription>
              Informe o preço original e um percentual entre 0% e 100%.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
              <div className="space-y-6">
                <div className="border border-border bg-muted/20 p-4 sm:p-5">
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="precoOriginal" className="text-sm font-medium">
                        Preço original
                      </label>

                      <div className="mt-2 flex items-center border border-border bg-background">
                        <span className="pl-3 text-sm text-muted-foreground">
                          R$
                        </span>

                        <input
                          id="precoOriginal"
                          type="number"
                          min="0"
                          step="0.01"
                          inputMode="decimal"
                          placeholder="100,00"
                          value={precoOriginal}
                          onChange={(event) => setPrecoOriginal(event.target.value)}
                          className={`${inputClassName} border-0`}
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="desconto" className="text-sm font-medium">
                        Desconto (%)
                      </label>

                      <div className="mt-2 flex items-center border border-border bg-background">
                        <input
                          id="desconto"
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          inputMode="decimal"
                          placeholder="10"
                          value={desconto}
                          onChange={(event) => setDesconto(event.target.value)}
                          className={`${inputClassName} border-0`}
                        />

                        <span className="pr-3 text-sm text-muted-foreground">
                          %
                        </span>
                      </div>

                      <p className="mt-2 text-xs leading-5 text-muted-foreground">
                        Use valores de 0% a 100%. Percentuais acima de 100% não são calculados.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border border-border bg-muted/20 p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center border border-border bg-background text-primary">
                      <ShoppingBag className="size-4" aria-hidden="true" />
                    </div>

                    <div>
                      <p className="text-sm font-medium">Dica</p>

                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        Compare promoções utilizando sempre o preço final e o
                        valor efetivamente economizado.
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
                    <TrendingDown className="size-5" aria-hidden="true" />
                  </div>

                  <p className="mt-5 text-sm font-medium text-muted-foreground">
                    Preço final
                  </p>

                  <p className="mt-2 font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
                    {resultado ? formatCurrency(resultado.precoFinal) : "R$ 0,00"}
                  </p>

                  <p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">
                    {resultado
                      ? `Você economiza ${formatCurrency(resultado.valorDesconto)} sobre o preço original.`
                      : "Preencha o preço original e um desconto entre 0% e 100% para calcular."}
                  </p>
                </div>

                {resultado && (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                    <div className="border border-border bg-muted/20 p-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <CircleDollarSign className="size-4" aria-hidden="true" />
                        <p className="text-xs uppercase tracking-wider">
                          Valor economizado
                        </p>
                      </div>

                      <p className="mt-2 font-heading text-xl font-semibold">
                        {formatCurrency(resultado.valorDesconto)}
                      </p>
                    </div>

                    <div className="border border-border bg-muted/20 p-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <BadgePercent className="size-4" aria-hidden="true" />
                        <p className="text-xs uppercase tracking-wider">
                          Desconto aplicado
                        </p>
                      </div>

                      <p className="mt-2 font-heading text-xl font-semibold">
                        {formatPercentage(resultado.percentual)}%
                      </p>
                    </div>
                  </div>
                )}

                {resultado && (
                  <div className={`mt-4 border p-4 ${resultado.analysis.className}`}>
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