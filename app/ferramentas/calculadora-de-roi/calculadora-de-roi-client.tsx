"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  CircleDollarSign,
  RotateCcw,
  TrendingDown,
  TrendingUp,
  Wallet,
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

function getRoiAnalysis(roi: number) {
  if (roi < 0) {
    return {
      title: "Retorno negativo",
      description:
        "O retorno obtido ficou abaixo do valor investido. O resultado indica perda financeira no período analisado.",
      className:
        "border-red-200 bg-red-50 text-red-900 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-100",
    };
  }

  if (Math.abs(roi) < 0.01) {
    return {
      title: "Retorno no ponto de equilíbrio",
      description:
        "O retorno obtido foi equivalente ao investimento total. Não houve ganho nem perda financeira considerando apenas os valores informados.",
      className:
        "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100",
    };
  }

  return {
    title: "Retorno positivo",
    description:
      "O retorno obtido superou o investimento total. O resultado indica ganho financeiro no período analisado.",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-100",
  };
}

export default function CalculadoraDeRoiClient() {
  const [investimento, setInvestimento] = useState("");
  const [retorno, setRetorno] = useState("");

  const resultado = useMemo(() => {
    const investimentoNumero = Number(investimento);
    const retornoNumero = Number(retorno);

    if (
      !Number.isFinite(investimentoNumero) ||
      !Number.isFinite(retornoNumero) ||
      investimentoNumero <= 0 ||
      retornoNumero < 0
    ) {
      return null;
    }

    const ganhoOuPerda = retornoNumero - investimentoNumero;
    const roi = (ganhoOuPerda / investimentoNumero) * 100;

    return {
      investimento: investimentoNumero,
      retorno: retornoNumero,
      ganhoOuPerda,
      roi,
      analysis: getRoiAnalysis(roi),
    };
  }, [investimento, retorno]);

  function limparCampos() {
    setInvestimento("");
    setRetorno("");
  }

  const inputClassName =
    "h-11 w-full border border-border bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary";

  const ResultadoIcon =
    resultado && resultado.roi < 0 ? TrendingDown : TrendingUp;

  return (
    <section className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mb-8">
          <Link
          href="/ferramentas/calculadoras"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Voltar para calculadoras
          </Link>
        </div>

        <div className="mb-10 max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-wider text-primary">
            Negócios e Performance
          </p>

          <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
            Calculadora de ROI
          </h1>

          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
            Calcule o retorno sobre investimento e descubra o ganho ou perda
            financeira da sua operação.
          </p>
        </div>

        <Card className="mx-auto max-w-4xl overflow-hidden">
          <CardHeader>
            <CardTitle>Calcule o ROI do seu investimento</CardTitle>

            <CardDescription>
              Informe o investimento total e o retorno obtido para analisar a
              rentabilidade percentual do resultado.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
              <div className="space-y-6">
                <div className="border border-border bg-muted/20 p-4 sm:p-5">
                  <p className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Dados do investimento
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="investimento"
                        className="text-sm font-medium"
                      >
                        Investimento total
                      </label>

                      <div className="mt-2 flex items-center border border-border bg-background">
                        <span className="pl-3 text-sm text-muted-foreground">
                          R$
                        </span>

                        <input
                          id="investimento"
                          type="number"
                          min="0"
                          step="0.01"
                          inputMode="decimal"
                          placeholder="1000,00"
                          value={investimento}
                          onChange={(event) =>
                            setInvestimento(event.target.value)
                          }
                          className={`${inputClassName} border-0`}
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="retorno"
                        className="text-sm font-medium"
                      >
                        Retorno obtido
                      </label>

                      <div className="mt-2 flex items-center border border-border bg-background">
                        <span className="pl-3 text-sm text-muted-foreground">
                          R$
                        </span>

                        <input
                          id="retorno"
                          type="number"
                          min="0"
                          step="0.01"
                          inputMode="decimal"
                          placeholder="1500,00"
                          value={retorno}
                          onChange={(event) =>
                            setRetorno(event.target.value)
                          }
                          className={`${inputClassName} border-0`}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border border-border bg-muted/20 p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center border border-border bg-background text-primary">
                      <Wallet className="size-4" aria-hidden="true" />
                    </div>

                    <div>
                      <p className="text-sm font-medium">
                        Como interpretar o ROI
                      </p>

                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        ROI positivo indica retorno acima do investimento. ROI
                        negativo indica que o retorno ficou abaixo do valor
                        investido no período analisado.
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
                    Seu ROI
                  </p>

                  <p className="mt-2 font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
                    {resultado
                      ? `${formatPercentage(resultado.roi)}%`
                      : "0,00%"}
                  </p>

                  <p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">
                    {resultado
                      ? resultado.ganhoOuPerda >= 0
                        ? `O investimento gerou um ganho de ${formatCurrency(
                            resultado.ganhoOuPerda
                          )}.`
                        : `O investimento gerou uma perda de ${formatCurrency(
                            Math.abs(resultado.ganhoOuPerda)
                          )}.`
                      : "Preencha o investimento total e o retorno obtido para calcular o ROI."}
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
                          Retorno obtido
                        </p>
                      </div>

                      <p className="mt-2 font-heading text-xl font-semibold">
                        {formatCurrency(resultado.retorno)}
                      </p>
                    </div>

                    <div className="border border-border bg-muted/20 p-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <ResultadoIcon
                          className="size-4"
                          aria-hidden="true"
                        />

                        <p className="text-xs uppercase tracking-wider">
                          Ganho ou perda
                        </p>
                      </div>

                      <p className="mt-2 font-heading text-xl font-semibold">
                        {formatCurrency(resultado.ganhoOuPerda)}
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