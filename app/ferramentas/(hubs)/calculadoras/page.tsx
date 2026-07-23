"use client";

import { useState } from "react";
import Link from "next/link";

import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Calculator,
  Percent,
  Tags,
  TrendingUp,
} from "lucide-react";

import { AdSlot } from "@/components/ads/AdSlot";

type Calculator = {
  title: string;
  description: string;
  icon: any;
  badge: string;
  category: string;
  href: string;
  available: boolean;
};

const filters = [
  "Todos",
  "Marketing",
  "Vendas",
  "Financeiro",
];

const calculators: Calculator[] = [
  {
    title: "Calculadora de ROAS",
    description:
      "Calcule o retorno dos anúncios e estime o ROAS de equilíbrio da operação.",
    icon: BarChart3,
    badge: "Marketing",
    category: "Marketing",
    href: "/ferramentas/calculadora-de-roas",
    available: true,
  },
  {
    title: "Calculadora de ROI",
    description:
      "Calcule a rentabilidade e descubra o ganho ou perda do seu investimento.",
    icon: TrendingUp,
    badge: "Negócios",
    category: "Financeiro",
    href: "/ferramentas/calculadora-de-roi",
    available: true,
  },
  {
    title: "Calculadora de Margem",
    description:
      "Calcule a margem percentual e analise o lucro ou prejuízo por venda.",
    icon: Percent,
    badge: "Vendas",
    category: "Vendas",
    href: "/ferramentas/calculadora-de-margem",
    available: true,
  },
  {
    title: "Calculadora de Markup",
    description:
      "Calcule o preço de venda, o lucro bruto e a margem resultante.",
    icon: Tags,
    badge: "Precificação",
    category: "Vendas",
    href: "/ferramentas/calculadora-de-markup",
    available: true,
  },
  {
    title: "Calculadora de Desconto",
    description:
      "Calcule o valor economizado e descubra o preço final.",
    icon: Percent,
    badge: "Vendas",
    category: "Vendas",
    href: "/ferramentas/calculadora-de-desconto",
    available: true,
  },
  {
    title: "Calculadora de Porcentagem",
    description:
      "Resolva cálculos percentuais de forma simples e rápida.",
    icon: Calculator,
    badge: "Matemática",
    category: "Financeiro",
    href: "/ferramentas/calculadora-de-porcentagem",
    available: true,
  },
];

export default function CalculadorasPage() {
  const [filter, setFilter] = useState("Todos");

  const filteredCalculators =
    filter === "Todos"
      ? calculators
      : calculators.filter(
          (calculator) => calculator.category === filter
        );

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">

        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Voltar para o início
          </Link>
        </div>

        <div className="max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-wider text-primary">
            Negócios e Performance
          </p>

          <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
            Calculadoras
          </h1>

          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
            Ferramentas para analisar campanhas, investimentos,
            margens, preços, descontos e indicadores importantes
            para decisões de negócio.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            {filters.map((item) => (
              <button
                key={item}
                onClick={() => setFilter(item)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                  filter === item
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:border-primary hover:text-primary"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">

          {filteredCalculators.map((calculator) => {
            const Icon = calculator.icon;
                        const content = (
              <div className="flex h-full flex-col">
                <div className="flex items-start justify-between">
                  <span className="flex size-9 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
                    <Icon className="size-4" />
                  </span>

                  <span
                    className={[
                      "rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-muted-foreground",
                      !calculator.available && "opacity-70",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {calculator.available ? calculator.badge : "Em breve"}
                  </span>
                </div>

                <h2 className="mt-4 text-[15px] font-semibold">
                  {calculator.title}
                </h2>

                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  {calculator.description}
                </p>

                <div className="mt-auto flex items-center gap-1.5 pt-4 text-xs font-medium group-hover:text-primary">
                  {calculator.available
                    ? "Abrir calculadora"
                    : "Em breve"}

                  {calculator.available && (
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                  )}
                </div>
              </div>
            );

            if (calculator.available) {
              return (
                <Link
                  key={calculator.title}
                  href={calculator.href}
                  className="group relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-white/[0.035] p-4 transition duration-300 hover:-translate-y-1 hover:border-primary/35 hover:bg-white/[0.055]"
                >
                  {content}
                </Link>
              );
            }

            return (
              <article
                key={calculator.title}
                className="relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-white/[0.035] p-4 opacity-75"
              >
                {content}
              </article>
            );
          })}
        </div>
                <div className="mt-8">
          <AdSlot variant="banner" />
        </div>

      </section>
    </main>
  );
}