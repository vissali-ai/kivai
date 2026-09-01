import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

import { getPageMetadata, SITE_URL } from "@/lib/seo";
import { plannedToolCategories } from "@/lib/planned-tool-categories";
import { removedorMetadadosTool } from "@/lib/removedor-metadados-tool";
import {
  getToolHref,
  getToolsByCategory,
  isToolIndexable,
  toolCategories,
  tools,
} from "@/lib/tools";

export const metadata = getPageMetadata({
  title: "Ferramentas Online",
  description:
    "Encontre ferramentas online do Kivai para PDFs, imagens, vídeos, arquivos, textos, redes sociais e cálculos.",
  pathname: "/ferramentas",
});

const arquivosReviewedTools = [
  {
    slug: "descompactar-zip",
    name: "Descompactar ZIP",
    description: "Abra um arquivo ZIP, visualize seu conteúdo e baixe os arquivos diretamente no navegador.",
  },
  {
    slug: "descompactar-rar",
    name: "Descompactar RAR",
    description: "Abra um arquivo RAR, visualize o conteúdo e extraia os arquivos diretamente no navegador.",
  },
  {
    slug: "compactar-arquivos-zip",
    name: "Compactar Arquivos em ZIP",
    description: "Reúna vários arquivos em um único ZIP e faça o download diretamente no navegador.",
  },
  {
    slug: "renomear-arquivos-em-lote",
    name: "Renomear Arquivos em Lote",
    description: "Padronize vários nomes com numeração automática, preserve as extensões e baixe as cópias em ZIP.",
  },
  {
    slug: "adicionar-prefixo-sufixo-arquivos",
    name: "Adicionar Prefixo ou Sufixo em Lote",
    description: "Acrescente texto antes ou depois do nome de vários arquivos e baixe as cópias modificadas em ZIP.",
  },
];

const standaloneReviewedTools = [
  {
    slug: removedorMetadadosTool.slug,
    name: removedorMetadadosTool.name,
    description: removedorMetadadosTool.description,
  },
];

const reviewedTools = [
  ...tools.filter((tool) => isToolIndexable(tool.slug)).map((tool) => ({
    slug: tool.slug,
    name: tool.name,
    description: tool.description,
  })),
  ...standaloneReviewedTools,
  ...arquivosReviewedTools,
];
const categories = [...toolCategories, ...plannedToolCategories];
const standaloneSlugs = new Set([
  ...arquivosReviewedTools.map((item) => item.slug),
  ...standaloneReviewedTools.map((item) => item.slug),
]);

const schema = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Ferramentas online do Kivai",
  url: `${SITE_URL}/ferramentas`,
  mainEntity: {
    "@type": "ItemList",
    itemListElement: reviewedTools.map((tool, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: tool.name,
      url: `${SITE_URL}/ferramentas/${tool.slug}`,
    })),
  },
};

export default function FerramentasPage() {
  return (
    <main className="min-h-screen bg-background pb-16 pt-24 text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }}
      />

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-sm font-medium uppercase tracking-wider text-primary">
          Diretório Kivai
        </p>
        <h1 className="mt-3 max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl">
          Ferramentas para tarefas digitais do dia a dia
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">
          Escolha uma categoria para encontrar a operação adequada. As ferramentas
          ficam disponíveis gratuitamente; páginas em revisão continuam acessíveis,
          mas só entram na seleção editorial depois de receber documentação própria.
        </p>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => {
            const Icon = category.icon;
            const isArquivos = category.slug === "arquivos";
            const isImagens = category.slug === "imagens";
            const registeredCount = isArquivos
              ? 0
              : getToolsByCategory(category.slug).filter((tool) => tool.available).length;
            const availableCount = isArquivos ? 5 : isImagens ? registeredCount + 1 : registeredCount;

            return (
              <Link
                key={category.slug}
                href={category.href}
                className="group rounded-2xl border border-border bg-background p-6 transition hover:-translate-y-1 hover:border-primary/40"
              >
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
                <h2 className="mt-5 text-xl font-semibold">{category.name}</h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {category.description}
                </p>
                <p className="mt-5 flex items-center gap-2 text-sm font-medium text-primary">
                  Ver {availableCount} {availableCount === 1 ? "ferramenta" : "ferramentas"}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-border bg-muted/10 p-6 sm:p-8">
          <p className="text-sm font-medium uppercase tracking-wider text-primary">
            Seleção editorial inicial
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">
            Ferramentas com documentação completa
          </h2>
          <p className="mt-4 max-w-3xl leading-7 text-muted-foreground">
            Estas páginas explicam formatos, limites, privacidade, situações de uso e
            possíveis diferenças no resultado. A seleção é pequena de propósito e será
            ampliada somente após revisão individual.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {reviewedTools.map((tool) => (
              <Link
                key={tool.slug}
                href={standaloneSlugs.has(tool.slug) ? `/ferramentas/${tool.slug}` : getToolHref(tool.slug)}
                prefetch={false}
                className="group rounded-xl border border-border bg-background p-5 transition hover:border-primary/40"
              >
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-semibold">{tool.name}</h3>
                  <CheckCircle2 className="size-5 shrink-0 text-emerald-400" />
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {tool.description}
                </p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary">
                  Abrir ferramenta
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto mt-10 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-xl border border-border p-6">
            <h2 className="text-xl font-semibold">Como avaliamos uma ferramenta</h2>
            <p className="mt-4 leading-7 text-muted-foreground">
              Verificamos se a função principal está disponível, se erros e limites são
              comunicados, se a página funciona em diferentes tamanhos de tela e se o
              conteúdo explica o resultado sem promessas exageradas.
            </p>
            <Link href="/metodologia" className="mt-5 inline-flex items-center gap-2 font-medium text-primary hover:underline">
              Conhecer a metodologia <ArrowRight className="size-4" />
            </Link>
          </article>
          <article className="rounded-xl border border-border p-6">
            <h2 className="text-xl font-semibold">Encontrou um problema?</h2>
            <p className="mt-4 leading-7 text-muted-foreground">
              Informe qual ferramenta utilizou, o navegador, o formato do arquivo e o
              comportamento observado. Não envie documentos confidenciais pelo formulário.
            </p>
            <Link href="/contato" className="mt-5 inline-flex items-center gap-2 font-medium text-primary hover:underline">
              Enviar relato <ArrowRight className="size-4" />
            </Link>
          </article>
        </div>
      </section>
    </main>
  );
}
