"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  FileImage,
  FileText,
  Combine,
  Scissors,
  Minimize2,
  RotateCw,
} from "lucide-react";

type Tool = {
  title: string;
  description: string;
  icon: any;
  badge: string;
  href: string;
  available: boolean;
  category: string;
};

const filters = [
  "Todos",
  "Converter",
  "Editar",
  "Otimizar",
];

const tools: Tool[] = [
  {
    title: "Imagens para PDF",
    description:
      "Transforme arquivos JPG, PNG e WebP em um único documento PDF.",
    icon: FileImage,
    badge: "PDF",
    href: "/ferramentas/imagens-para-pdf",
    available: true,
    category: "Converter",
  },
  {
    title: "PDF para Imagens",
    description:
      "Extraia todas as páginas de um arquivo PDF em formato PNG ou JPG.",
    icon: FileText,
    badge: "PDF",
    href: "/ferramentas/pdf-para-imagens",
    available: true,
    category: "Converter",
  },
  {
    title: "Unir PDFs",
    description:
      "Combine vários arquivos PDF em um único documento.",
    icon: Combine,
    badge: "PDF",
    href: "/ferramentas/unir-pdfs",
    available: true,
    category: "Editar",
  },
  {
    title: "Dividir PDF",
    description:
      "Separe cada página de um documento PDF em arquivos individuais.",
    icon: Scissors,
    badge: "PDF",
    href: "/ferramentas/dividir-pdf",
    available: true,
    category: "Editar",
  },
  {
    title: "Compactar PDF",
    description:
      "Reduza o tamanho de arquivos PDF mantendo a melhor qualidade possível.",
    icon: Minimize2,
    badge: "PDF",
    href: "/ferramentas/compactar-pdf",
    available: true,
    category: "Otimizar",
  },
  {
    title: "Girar PDF",
    description:
      "Gire todas as páginas de um arquivo PDF em 90°, 180° ou 270°.",
    icon: RotateCw,
    badge: "PDF",
    href: "/ferramentas/girar-pdf",
    available: true,
    category: "Editar",
  },
];

export default function PdfsPage() {
  const [filter, setFilter] = useState("Todos");

  const filteredTools =
    filter === "Todos"
      ? tools
      : tools.filter((tool) => tool.category === filter);

  return (
   <section className="relative overflow-hidden bg-background pt-24 pb-12 sm:pt-24 sm:pb-14 lg:pt-24 lg:pb-16">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">

        <div className="mb-8">

          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="size-4" />
            Voltar para o início
          </Link>

          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            PDFs
          </h1>

          <p className="mt-2 text-muted-foreground">
            Ferramentas para converter, organizar e editar documentos PDF.
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">

          {filteredTools.map((tool) => {
            const Icon = tool.icon;
                        const content = (
              <div className="flex h-full flex-col">
                <div className="flex items-start justify-between">
                  <span className="flex size-9 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
                    <Icon className="size-4" />
                  </span>

                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-muted-foreground">
                    {tool.badge}
                  </span>
                </div>

                <h2 className="mt-4 text-[15px] font-semibold">
                  {tool.title}
                </h2>

                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  {tool.description}
                </p>

                <div className="mt-auto flex items-center gap-1.5 pt-4 text-xs font-medium group-hover:text-primary">
                  {tool.available ? "Explorar" : "Em breve"}

                  {tool.available && (
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                  )}
                </div>
              </div>
            );

            if (tool.available) {
              return (
                <Link
                  key={tool.title}
                  href={tool.href}
               className="group relative min-h-[220px] overflow-hidden rounded-xl border border-white/10 bg-white/[0.035] p-5 transition duration-300 hover:-translate-y-1 hover:border-primary/35 hover:bg-white/[0.055] sm:aspect-square sm:p-4"
                >
                  {content}
                </Link>
              );
            }

            return (
              <div
                key={tool.title}
                className="cursor-not-allowed rounded-xl border border-white/10 bg-white/[0.02] p-4 opacity-70"
              >
                {content}
              </div>
            );
          })}
        </div>
              </div>
    </section>
  );
}