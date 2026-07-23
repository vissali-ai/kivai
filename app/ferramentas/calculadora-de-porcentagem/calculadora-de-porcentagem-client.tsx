"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Percent,
  RotateCcw,
  Calculator,
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

function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function getAnalysis(percentual: number) {
  if (percentual === 0) {
    return {
      title: "Resultado zero",
      description:
        "Qualquer porcentagem igual a 0% resulta em zero.",
      className:
        "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100",
    };
  }

  return {
    title: "Cálculo concluído",
    description:
      "O resultado foi obtido utilizando a fórmula (percentual × valor) ÷ 100.",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-100",
  };
}

export default function CalculadoraDePorcentagemClient() {
  const [percentual, setPercentual] = useState("");
  const [valor, setValor] = useState("");

  const resultado = useMemo(() => {
    const p = Number(percentual);
    const v = Number(valor);

    if (
      !Number.isFinite(p) ||
      !Number.isFinite(v) ||
      v < 0
    ) {
      return null;
    }

    const resposta = (p * v) / 100;

    return {
      percentual: p,
      valor: v,
      resposta,
      analysis: getAnalysis(p),
    };
  }, [percentual, valor]);

  function limparCampos() {
    setPercentual("");
    setValor("");
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
            <ArrowLeft className="size-4" />
            Voltar para Calculadoras
          </Link>
        </div>

        <div className="mb-10 max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-wider text-primary">
            Matemática
          </p>

          <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
            Calculadora de Porcentagem
          </h1>

          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
            Descubra rapidamente quanto representa uma porcentagem de um valor.
          </p>
        </div>

        <Card className="mx-auto max-w-4xl overflow-hidden">

          <CardHeader>
            <CardTitle>Quanto é X% de Y?</CardTitle>

            <CardDescription>
              Informe uma porcentagem e um valor para calcular o resultado.
            </CardDescription>
          </CardHeader>

          <CardContent>

            <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">

              <div className="space-y-6">

                <div className="border border-border bg-muted/20 p-5">

                  <div className="space-y-4">

                    <div>

                      <label className="text-sm font-medium">
                        Porcentagem (%)
                      </label>

                      <div className="mt-2 flex items-center border border-border bg-background">

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={percentual}
                          onChange={(e) => setPercentual(e.target.value)}
                          className={`${inputClassName} border-0`}
                        />

                        <span className="pr-3 text-sm text-muted-foreground">
                          %
                        </span>

                      </div>

                    </div>

                    <div>

                      <label className="text-sm font-medium">
                        Valor
                      </label>

                      <div className="mt-2 flex items-center border border-border bg-background">

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={valor}
                          onChange={(e) => setValor(e.target.value)}
                          className={inputClassName}
                        />

                      </div>

                    </div>

                  </div>

                </div>

                <Button
                  variant="outline"
                  size="lg"
                  className="w-full"
                  onClick={limparCampos}
                >
                  <RotateCcw className="size-4" />
                  Limpar campos
                </Button>

              </div>

              <div>

                <div className="flex min-h-64 flex-col items-center justify-center border border-border bg-muted/20 p-5 text-center">

                  <div className="flex size-14 items-center justify-center border border-border bg-background text-primary">
                    <Calculator className="size-5" />
                  </div>

                  <p className="mt-5 text-sm text-muted-foreground">
                    Resultado
                  </p>

                  <p className="mt-2 font-heading text-5xl font-semibold">
                    {resultado
                      ? formatNumber(resultado.resposta)
                      : "0,00"}
                  </p>

                </div>

                {resultado && (

                  <div className="mt-4 grid gap-3">

                    <div className="border border-border bg-muted/20 p-4">

                      <div className="flex items-center gap-2 text-muted-foreground">

                        <Percent className="size-4" />

                        <p className="text-xs uppercase tracking-wider">
                          Fórmula utilizada
                        </p>

                      </div>

                      <p className="mt-2 text-sm">
                        ({formatNumber(resultado.percentual)} × {formatNumber(resultado.valor)}) ÷ 100
                      </p>

                    </div>

                    <div className={`border p-4 ${resultado.analysis.className}`}>

                      <p className="font-semibold">
                        {resultado.analysis.title}
                      </p>

                      <p className="mt-2 text-xs leading-5">
                        {resultado.analysis.description}
                      </p>

                    </div>

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