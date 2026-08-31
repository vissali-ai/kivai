"use client";

import { FormEvent, useRef, useState } from "react";
import { Calculator, Check, Copy, RotateCcw } from "lucide-react";

import { AdSlot } from "@/components/ads/AdSlot";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  PercentageMode,
  PercentageResult,
  calculate,
  format,
  modes,
} from "./percentage-utils";

const percentageResultModes: PercentageMode[] = [
  "whatPercentage",
  "percentageIncrease",
  "percentageDecrease",
];

export default function CalculadoraDePorcentagemClient() {
  const [mode, setMode] = useState<PercentageMode>("percentageOfValue");
  const [first, setFirst] = useState("");
  const [second, setSecond] = useState("");
  const [result, setResult] = useState<PercentageResult | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const config = modes[mode];

  function reset() {
    setFirst("");
    setSecond("");
    setResult(null);
    setError("");
    setCopied(false);
  }

  function selectMode(next: PercentageMode) {
    setMode(next);
    reset();
  }

  function showResult(next: PercentageResult) {
    setResult(next);
    setError("");
    setTimeout(
      () => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }),
      0,
    );
  }

  function submit(event?: FormEvent) {
    event?.preventDefault();
    const next = calculate(mode, first, second);

    if ("error" in next) {
      setError(next.error);
      setResult(null);
      return;
    }

    showResult(next);
  }

  async function copy() {
    if (!result) return;

    try {
      await navigator.clipboard.writeText(result.answer);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Não foi possível copiar o resultado.");
    }
  }

  function example(a: string, b: string) {
    setFirst(a);
    setSecond(b);
    const next = calculate(mode, a, b);

    if ("error" in next) {
      setError(next.error);
      setResult(null);
      return;
    }

    showResult(next);
  }

  const inputClassName =
    "h-11 w-full border border-border bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary";

  return (
    <section className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-6xl px-4 pb-12 pt-32 sm:px-6 sm:pt-32 lg:px-8 lg:pb-16 lg:pt-32">
        <div className="mb-10 max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-wider text-primary">
            Matemática
          </p>

          <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
            Calculadora de Porcentagem
          </h1>

          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
            Calcule porcentagens, aumentos, reduções, descontos e valores originais em oito tipos de cálculo.
          </p>
        </div>

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Escolha o cálculo</CardTitle>
            <CardDescription>{config.description}</CardDescription>
          </CardHeader>

          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {(Object.keys(modes) as PercentageMode[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={mode === item}
                  onClick={() => selectMode(item)}
                  className={`min-h-16 border p-3 text-left text-sm transition-colors ${
                    mode === item
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  {modes[item].label}
                </button>
              ))}
            </div>

            <form onSubmit={submit} className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="space-y-5 border border-border bg-muted/20 p-4 sm:p-5">
                <div>
                  <label htmlFor="percentage-first" className="text-sm font-medium">
                    {config.firstLabel}
                  </label>
                  <input
                    id="percentage-first"
                    value={first}
                    inputMode="decimal"
                    autoComplete="off"
                    placeholder={config.firstPlaceholder}
                    onChange={(event) => {
                      setFirst(event.target.value);
                      setError("");
                    }}
                    className={`mt-2 ${inputClassName}`}
                  />
                </div>

                <div>
                  <label htmlFor="percentage-second" className="text-sm font-medium">
                    {config.secondLabel}
                  </label>
                  <input
                    id="percentage-second"
                    value={second}
                    inputMode="decimal"
                    autoComplete="off"
                    placeholder={config.secondPlaceholder}
                    onChange={(event) => {
                      setSecond(event.target.value);
                      setError("");
                    }}
                    className={`mt-2 ${inputClassName}`}
                  />
                </div>

                {error ? (
                  <div role="alert" className="border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                    {error}
                  </div>
                ) : null}

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button type="submit" size="lg" disabled={!first.trim() || !second.trim()} className="sm:flex-1">
                    <Calculator className="size-4" aria-hidden="true" />
                    Calcular
                  </Button>
                  <Button type="button" variant="outline" size="lg" onClick={reset} className="sm:flex-1">
                    <RotateCcw className="size-4" aria-hidden="true" />
                    Limpar
                  </Button>
                </div>
              </div>

              <div ref={resultRef}>
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Resultado
                </p>

                <div className="min-h-64 border border-border bg-muted/20 p-5">
                  {result ? (
                    <div>
                      <p className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
                        {format(result.value)}
                        {percentageResultModes.includes(mode) ? "%" : ""}
                      </p>

                      <p className="mt-4 text-sm leading-6 text-muted-foreground">
                        {result.answer}
                      </p>

                      <div className="mt-5 border-t border-border pt-4 text-sm">
                        <p className="font-medium">Como foi calculado</p>
                        <p className="mt-2 leading-6 text-muted-foreground">
                          Fórmula: {result.formula}
                        </p>
                        {result.steps.map((step) => (
                          <p key={step} className="mt-1 leading-6 text-muted-foreground">
                            {step}
                          </p>
                        ))}
                      </div>

                      <Button className="mt-5 w-full sm:w-auto" type="button" variant="outline" onClick={copy}>
                        {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
                        {copied ? "Resultado copiado" : "Copiar resultado"}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex min-h-52 items-center justify-center text-center text-sm leading-6 text-muted-foreground">
                      Preencha os dois campos e clique em Calcular. Você pode usar ponto ou vírgula como separador decimal.
                    </div>
                  )}
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        <section className="mt-8" aria-labelledby="percentage-examples-title">
          <h2 id="percentage-examples-title" className="text-xl font-semibold">
            Exemplos para este cálculo
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Clique em um exemplo para preencher os campos e ver o resultado imediatamente.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {config.examples.map(([a, b]) => (
              <Button
                key={`${mode}-${a}-${b}`}
                type="button"
                variant="outline"
                className="h-auto min-h-10 whitespace-normal py-2 text-left"
                onClick={() => example(a, b)}
              >
                {a} e {b}
              </Button>
            ))}
          </div>
        </section>

        <div className="mx-auto mt-8 max-w-4xl">
          <AdSlot variant="banner" />
        </div>
      </div>
    </section>
  );
}
