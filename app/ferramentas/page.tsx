import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

import { GlobalSearch } from "@/components/marketing/global-search";
import { getPageMetadata, SITE_URL } from "@/lib/seo";
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
    "Encontre ferramentas online do Kivai para PDFs, imagens, vídeos, textos, redes sociais e cálculos.",
  pathname: "/ferramentas",
});

const reviewedTools = tools.filter((tool) => isToolIndexable(tool.slug));

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
      url: `${SITE_URL}${getToolHref(tool.slug)}`,
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
          Pesquise diretamente pelo que você precisa fazer ou escolha uma categoria.
          O Kivai mostra ferramentas disponíveis e conteúdos relacionados para ajudar
          você a encontrar a opção mais adequada.
        </p>

        <div className="mt-8">
          <GlobalSearch />
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {toolCategories.map((category) => {
            const Icon = category.icon;
            const availableCount = getToolsByCategory(category.slug).filter(
              (tool) => tool.available
            ).length;

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
                href={getToolHref(tool.slug)}
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
