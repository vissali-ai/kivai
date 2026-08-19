import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { getToolBySlug } from "@/lib/tools";
import {
  imageToolEditorialContent,
  type ImageToolEditorialSlug,
} from "@/lib/image-tool-editorial-content";

const siteUrl = "https://www.kivai.com.br";

export function ImageToolEditorial({ slug }: { slug: ImageToolEditorialSlug }) {
  const content = imageToolEditorialContent[slug];
  const tool = getToolBySlug(slug);

  if (!tool) return null;

  const url = `${siteUrl}/ferramentas/${slug}`;
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: tool.name,
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Qualquer sistema com navegador moderno",
        url,
        description: tool.seoDescription ?? tool.description,
        offers: { "@type": "Offer", price: "0", priceCurrency: "BRL" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Início", item: siteUrl },
          {
            "@type": "ListItem",
            position: 2,
            name: "Ferramentas de imagens",
            item: `${siteUrl}/ferramentas/imagens`,
          },
          { "@type": "ListItem", position: 3, name: tool.name, item: url },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: content.faqs.map(({ question, answer }) => ({
          "@type": "Question",
          name: question,
          acceptedAnswer: { "@type": "Answer", text: answer },
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
        }}
      />

      <section className="border-t border-border bg-muted/10 py-12 sm:py-16">
        <div className="mx-auto w-full max-w-6xl space-y-6 px-4 sm:px-6 lg:px-8">
          <article className="rounded-xl border border-border bg-background p-5 sm:p-6">
            <h2 className="text-2xl font-semibold">Sobre esta ferramenta</h2>
            <div className="mt-4 space-y-4 leading-7 text-muted-foreground">
              {content.overview.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </article>

          <div className="grid gap-6 lg:grid-cols-2">
            <article className="rounded-xl border border-border bg-background p-5 sm:p-6">
              <h2 className="text-2xl font-semibold">Quando utilizar</h2>
              <div className="mt-5 space-y-4">
                {content.useCases.map(({ title, description }) => (
                  <div key={title}>
                    <h3 className="font-semibold text-foreground">{title}</h3>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {description}
                    </p>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-xl border border-border bg-background p-5 sm:p-6">
              <h2 className="text-2xl font-semibold">Como usar</h2>
              <ol className="mt-5 list-none space-y-3">
                {content.steps.map((step, index) => (
                  <li key={step} className="flex gap-3 text-sm leading-6 text-muted-foreground">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </article>
          </div>

          <article className="rounded-xl border border-border bg-background p-5 sm:p-6">
            <h2 className="text-2xl font-semibold">Formatos, controles e resultado</h2>
            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              {content.specifications.map(({ label, value }) => (
                <div key={label} className="rounded-lg border border-border bg-muted/10 p-4">
                  <dt className="text-sm font-semibold text-foreground">{label}</dt>
                  <dd className="mt-2 text-sm leading-6 text-muted-foreground">{value}</dd>
                </div>
              ))}
            </dl>
          </article>

          <div className="grid gap-6 lg:grid-cols-2">
            <article className="rounded-xl border border-border bg-background p-5 sm:p-6">
              <h2 className="text-2xl font-semibold">Privacidade e processamento</h2>
              <p className="mt-4 leading-7 text-muted-foreground">{content.privacy}</p>
            </article>

            <article className="rounded-xl border border-border bg-background p-5 sm:p-6">
              <h2 className="text-2xl font-semibold">Limitações importantes</h2>
              <ul className="mt-4 space-y-3">
                {content.limitations.map((limitation) => (
                  <li key={limitation} className="flex gap-2 text-sm leading-6 text-muted-foreground">
                    <CheckCircle2 className="mt-1 size-4 shrink-0 text-primary" />
                    {limitation}
                  </li>
                ))}
              </ul>
            </article>
          </div>

          <article className="rounded-xl border border-border bg-background p-5 sm:p-6">
            <h2 className="text-2xl font-semibold">Perguntas frequentes</h2>
            <div className="mt-5 space-y-3">
              {content.faqs.map(({ question, answer }) => (
                <details key={question} className="rounded-lg border border-border p-4">
                  <summary className="cursor-pointer font-medium">{question}</summary>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{answer}</p>
                </details>
              ))}
            </div>
          </article>

          <nav
            aria-label="Ferramentas de imagens relacionadas"
            className="rounded-xl border border-border bg-background p-5 sm:p-6"
          >
            <h2 className="text-2xl font-semibold">Ferramentas relacionadas</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {content.related.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
                >
                  {label}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      </section>
    </>
  );
}
