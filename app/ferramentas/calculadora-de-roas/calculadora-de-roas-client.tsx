"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  CircleDollarSign,
  RotateCcw,
  Target,
  TrendingUp,
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

function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function getRoasAnalysis(roas: number) {
  if (roas < 1) {
    return {
      title: "Receita abaixo do investimento em mídia",
      description:
        "A receita atribuída aos anúncios está abaixo do valor investido em mídia. Analise segmentação, oferta, criativos, conversão e custos antes de aumentar o orçamento.",
      className:
        "border-red-200 bg-red-50 text-red-900 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-100",
    };
  }

  if (roas === 1) {
    return {
      title: "Receita equivalente ao investimento em mídia",
      description:
        "A campanha gerou uma receita equivalente ao valor investido em anúncios. Isso não significa ponto de equilíbrio do negócio, pois ainda podem existir custos de produto, impostos, taxas e operação.",
      className:
        "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100",
    };
  }

  if (roas < 3) {
    return {
      title: "Receita superior ao investimento em mídia",
      description:
        "A campanha está gerando mais receita do que o valor investido em anúncios. Verifique sua margem e demais custos para saber se a operação é realmente lucrativa.",
      className:
        "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-100",
    };
  }

  return {
    title: "Retorno elevado sobre o investimento em mídia",
    description:
      "A receita atribuída aos anúncios é várias vezes superior ao investimento em mídia. Antes de escalar, confirme margem, capacidade operacional e estabilidade dos resultados.",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-100",
  };
}

function getBreakEvenAnalysis(roas: number, breakEvenRoas: number) {
  const difference = roas - breakEvenRoas;

  if (difference < -0.01) {
    return {
      title: "ROAS abaixo do ponto de equilíbrio",
      description:
        "Com base na margem informada, o ROAS atual está abaixo do nível estimado necessário para cobrir o investimento em mídia.",
      className:
        "border-red-200 bg-red-50 text-red-900 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-100",
    };
  }

  if (Math.abs(difference) <= 0.01) {
    return {
      title: "ROAS próximo do ponto de equilíbrio",
      description:
        "Com base na margem informada, o ROAS atual está muito próximo do nível estimado de equilíbrio da operação.",
      className:
        "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100",
    };
  }

  return {
    title: "ROAS acima do ponto de equilíbrio",
    description:
      "Com base na margem informada, o ROAS atual está acima do nível estimado necessário para cobrir o investimento em mídia.",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-100",
  };
}

export default function CalculadoraDeRoasClient() {
  const [investimento, setInvestimento] = useState("");
  const [receita, setReceita] = useState("");
  const [margem, setMargem] = useState("");

  const resultado = useMemo(() => {
    const investimentoNumero = Number(investimento);
    const receitaNumero = Number(receita);
    const margemNumero = Number(margem);

    if (
      !Number.isFinite(investimentoNumero) ||
      !Number.isFinite(receitaNumero) ||
      investimentoNumero <= 0 ||
      receitaNumero < 0
    ) {
      return null;
    }

    const roas = receitaNumero / investimentoNumero;

    const margemValida =
      margem !== "" &&
      Number.isFinite(margemNumero) &&
      margemNumero > 0 &&
      margemNumero <= 100;

    const breakEvenRoas = margemValida ? 100 / margemNumero : null;

    return {
      roas,
      analysis: getRoasAnalysis(roas),
      breakEvenRoas,
      breakEvenAnalysis:
        breakEvenRoas !== null
          ? getBreakEvenAnalysis(roas, breakEvenRoas)
          : null,
    };
  }, [investimento, receita, margem]);

  function limparCampos() {
    setInvestimento("");
    setReceita("");
    setMargem("");
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
            Voltar para calculadoras
          </Link>
        </div>

        <div className="mb-10 max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-wider text-primary">
            Marketing e Performance
          </p>

          <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
            Calculadora de ROAS
          </h1>

          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
            Calcule o retorno sobre o investimento em anúncios e descubra quanto
            sua campanha gera em receita para cada real investido.
          </p>
        </div>

        <Card className="mx-auto max-w-4xl overflow-hidden">
          <CardHeader>
            <CardTitle>Calcule o ROAS da sua campanha</CardTitle>

            <CardDescription>
              Informe o investimento em anúncios e a receita atribuída à
              campanha. A margem de contribuição é opcional.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
              <div className="space-y-6">
                <div className="border border-border bg-muted/20 p-4 sm:p-5">
                  <p className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Dados da campanha
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="investimento"
                        className="text-sm font-medium"
                      >
                        Investimento em anúncios
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
                      <label htmlFor="receita" className="text-sm font-medium">
                        Receita gerada
                      </label>

                      <div className="mt-2 flex items-center border border-border bg-background">
                        <span className="pl-3 text-sm text-muted-foreground">
                          R$
                        </span>

                        <input
                          id="receita"
                          type="number"
                          min="0"
                          step="0.01"
                          inputMode="decimal"
                          placeholder="5000,00"
                          value={receita}
                          onChange={(event) => setReceita(event.target.value)}
                          className={`${inputClassName} border-0`}
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="margem" className="text-sm font-medium">
                        Margem de contribuição
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          Opcional
                        </span>
                      </label>

                      <div className="mt-2 flex items-center border border-border bg-background">
                        <input
                          id="margem"
                          type="number"
                          min="0.01"
                          max="100"
                          step="0.01"
                          inputMode="decimal"
                          placeholder="25"
                          value={margem}
                          onChange={(event) => setMargem(event.target.value)}
                          className={`${inputClassName} border-0`}
                        />

                        <span className="pr-3 text-sm text-muted-foreground">
                          %
                        </span>
                      </div>

                      <p className="mt-2 text-xs leading-5 text-muted-foreground">
                        Informe a margem disponível antes do custo de mídia para
                        estimar o ROAS de equilíbrio.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border border-border bg-muted/20 p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center border border-border bg-background text-primary">
                      <Target className="size-4" aria-hidden="true" />
                    </div>

                    <div>
                      <p className="text-sm font-medium">
                        Como interpretar o resultado
                      </p>

                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        Um ROAS maior não garante lucro. Margem, impostos,
                        taxas, produto e custos operacionais também influenciam
                        o resultado final.
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
                    <BarChart3 className="size-5" aria-hidden="true" />
                  </div>

                  <p className="mt-5 text-sm font-medium text-muted-foreground">
                    Seu ROAS
                  </p>

                  <p className="mt-2 font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
                    {resultado ? `${formatNumber(resultado.roas)}x` : "0,00x"}
                  </p>

                  <p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">
                    {resultado
                      ? `Para cada R$ 1,00 investido em anúncios, sua campanha gerou ${formatCurrency(
                          resultado.roas
                        )} em receita.`
                      : "Preencha o investimento em anúncios e a receita gerada para calcular o ROAS."}
                  </p>
                </div>

                {resultado?.breakEvenRoas !== null &&
                  resultado?.breakEvenRoas !== undefined && (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                      <div className="border border-border bg-muted/20 p-4">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <TrendingUp className="size-4" aria-hidden="true" />
                          <p className="text-xs uppercase tracking-wider">
                            ROAS atual
                          </p>
                        </div>

                        <p className="mt-2 font-heading text-2xl font-semibold">
                          {formatNumber(resultado.roas)}x
                        </p>
                      </div>

                      <div className="border border-border bg-muted/20 p-4">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <CircleDollarSign
                            className="size-4"
                            aria-hidden="true"
                          />
                          <p className="text-xs uppercase tracking-wider">
                            Equilíbrio
                          </p>
                        </div>

                        <p className="mt-2 font-heading text-2xl font-semibold">
                          {formatNumber(resultado.breakEvenRoas)}x
                        </p>
                      </div>
                    </div>
                  )}

                {resultado && !resultado.breakEvenAnalysis && (
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

                {resultado?.breakEvenAnalysis && (
                  <div
                    className={`mt-4 border p-4 ${resultado.breakEvenAnalysis.className}`}
                  >
                    <p className="text-sm font-semibold">
                      {resultado.breakEvenAnalysis.title}
                    </p>

                    <p className="mt-2 text-xs leading-5 opacity-90">
                      {resultado.breakEvenAnalysis.description}
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