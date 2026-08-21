import type { ReactNode } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export type ToolEditorialUseCase = {
  title: string;
  description: string;
};

export type ToolEditorialSpecification = {
  label: string;
  value: string;
};

export type ToolEditorialFaq = {
  question: string;
  answer: string;
};

export type ToolEditorialLink = {
  href: string;
  label: string;
};

type ToolEditorialLayoutProps = {
  overview: string[];
  useCases: ToolEditorialUseCase[];
  steps: string[];
  specificationsTitle?: string;
  specifications: ToolEditorialSpecification[];
  privacy: string;
  limitations: string[];
  faqs: ToolEditorialFaq[];
  relatedTools: ToolEditorialLink[];
  relatedArticles?: ToolEditorialLink[];
  afterFaq?: ReactNode;
};

export function ToolEditorialLayout({
  overview,
  useCases,
  steps,
  specificationsTitle = "Formatos, controles e resultado",
  specifications,
  privacy,
  limitations,
  faqs,
  relatedTools,
  relatedArticles = [],
  afterFaq,
}: ToolEditorialLayoutProps) {
  return (
    <section className="border-t border-border bg-muted/10 py-12 sm:py-16">
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 sm:px-6 lg:px-8">
        <article className="rounded-xl border border-border bg-background p-5 sm:p-6">
          <h2 className="text-2xl font-semibold">Sobre esta ferramenta</h2>
          <div className="mt-4 space-y-4 leading-7 text-muted-foreground">
            {overview.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </div>
        </article>

        <div className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-xl border border-border bg-background p-5 sm:p-6">
            <h2 className="text-2xl font-semibold">Como usar</h2>
            <ol className="mt-5 list-none space-y-3">
              {steps.map((step, index) => (
                <li key={step} className="flex gap-3 text-sm leading-6 text-muted-foreground">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </article>

          <article className="rounded-xl border border-border bg-background p-5 sm:p-6">
            <h2 className="text-2xl font-semibold">Quando utilizar</h2>
            <div className="mt-5 space-y-4">
              {useCases.map((item) => (
                <div key={item.title}>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </article>
        </div>

        <article className="rounded-xl border border-border bg-background p-5 sm:p-6">
          <h2 className="text-2xl font-semibold">{specificationsTitle}</h2>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            {specifications.map((item) => (
              <div key={item.label} className="rounded-lg border border-border bg-muted/10 p-4">
                <dt className="text-sm font-semibold">{item.label}</dt>
                <dd className="mt-2 text-sm leading-6 text-muted-foreground">{item.value}</dd>
              </div>
            ))}
          </dl>
        </article>

        <div className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-xl border border-border bg-background p-5 sm:p-6">
            <h2 className="text-2xl font-semibold">Privacidade e processamento</h2>
            <p className="mt-4 leading-7 text-muted-foreground">{privacy}</p>
          </article>

          <article className="rounded-xl border border-border bg-background p-5 sm:p-6">
            <h2 className="text-2xl font-semibold">Limitações importantes</h2>
            <ul className="mt-4 space-y-3">
              {limitations.map((item) => (
                <li key={item} className="flex gap-2 text-sm leading-6 text-muted-foreground">
                  <CheckCircle2 className="mt-1 size-4 shrink-0 text-primary" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
        </div>

        <article className="rounded-xl border border-border bg-background p-5 sm:p-6">
          <h2 className="text-2xl font-semibold">Perguntas frequentes</h2>
          <div className="mt-5 space-y-3">
            {faqs.map((item) => (
              <details key={item.question} className="rounded-lg border border-border p-4">
                <summary className="cursor-pointer font-medium">{item.question}</summary>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.answer}</p>
              </details>
            ))}
          </div>
        </article>

        {afterFaq ? <div className="py-2">{afterFaq}</div> : null}

        <div className={relatedArticles.length ? "grid gap-6 lg:grid-cols-2" : undefined}>
          <nav aria-label="Ferramentas relacionadas" className="rounded-xl border border-border bg-background p-5 sm:p-6">
            <h2 className="text-2xl font-semibold">Ferramentas relacionadas</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {relatedTools.map((item) => (
                <Link key={item.href} href={item.href} className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:border-primary hover:text-primary">
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>

          {relatedArticles.length ? (
            <nav aria-label="Conteúdos relacionados" className="rounded-xl border border-border bg-background p-5 sm:p-6">
              <h2 className="text-2xl font-semibold">Conteúdos relacionados</h2>
              <div className="mt-4 space-y-3">
                {relatedArticles.map((item) => (
                  <Link key={item.href} href={item.href} className="block text-sm font-medium text-primary underline-offset-4 hover:underline">
                    {item.label}
                  </Link>
                ))}
              </div>
            </nav>
          ) : null}
        </div>
      </div>
    </section>
  );
}
