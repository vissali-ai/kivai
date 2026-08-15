import Link from "next/link";
import { ArrowRight, CheckCircle2, HelpCircle, SearchCheck } from "lucide-react";
import { SITE_URL } from "@/lib/seo";

export type ServiceFaq = {
  question: string;
  answer: string;
};

export type ServiceSeoItem = {
  title: string;
  description: string;
};

export type RelatedServiceArticle = {
  title: string;
  description: string;
  slug: string;
};

export function ServiceStructuredData({
  name,
  description,
  pathname,
  serviceType,
  audience,
  faqs,
}: {
  name: string;
  description: string;
  pathname: string;
  serviceType: string;
  audience: string;
  faqs: ServiceFaq[];
}) {
  const url = `${SITE_URL}${pathname}`;
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        "@id": `${url}#service`,
        name,
        description,
        serviceType,
        url,
        areaServed: {
          "@type": "Country",
          name: "Brasil",
        },
        audience: {
          "@type": "Audience",
          audienceType: audience,
        },
        provider: {
          "@type": "Organization",
          "@id": `${SITE_URL}/#organization`,
          name: "Kivai",
          url: SITE_URL,
        },
      },
      {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}

export function ServiceSeoContent({
  eyebrow,
  title,
  description,
  items,
}: {
  eyebrow: string;
  title: string;
  description: string;
  items: ServiceSeoItem[];
}) {
  return (
    <section className="relative border-b border-white/5 py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
            <SearchCheck className="size-4" />
            {eyebrow}
          </div>
          <h2 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
            {title}
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            {description}
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-6xl gap-4 md:grid-cols-3">
          {items.map((item) => (
            <article
              key={item.title}
              className="rounded-3xl border border-white/10 bg-white/[0.025] p-6 sm:p-7"
            >
              <CheckCircle2 className="size-5 text-primary" />
              <h3 className="mt-5 text-lg font-semibold tracking-tight">
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ServiceFaqSection({
  title,
  description,
  faqs,
}: {
  title: string;
  description: string;
  faqs: ServiceFaq[];
}) {
  return (
    <section className="relative border-b border-white/5 bg-[#07080d] py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
            <HelpCircle className="size-4" />
            Perguntas frequentes
          </div>
          <h2 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
            {title}
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            {description}
          </p>
        </div>

        <div className="mt-12 space-y-3">
          {faqs.map((faq) => (
            <details
              key={faq.question}
              className="group rounded-2xl border border-white/10 bg-white/[0.025] p-5 open:border-primary/25 open:bg-primary/[0.05] sm:p-6"
            >
              <summary className="cursor-pointer list-none pr-8 text-base font-semibold marker:hidden sm:text-lg">
                {faq.question}
              </summary>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function RelatedServiceArticles({
  articles,
}: {
  articles: RelatedServiceArticle[];
}) {
  return (
    <section className="relative border-b border-white/5 py-16 sm:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/[0.09] via-white/[0.025] to-cyan-400/[0.04] p-6 sm:p-8">
          <p className="text-sm font-medium text-primary">Conteúdo relacionado</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            Saiba mais antes de contratar
          </h2>
          <div className="mt-6 grid gap-3">
            {articles.map((article) => (
              <Link
                key={article.slug}
                href={`/blog/${article.slug}`}
                className="group rounded-2xl border border-white/10 bg-black/10 p-5 transition hover:border-primary/30 hover:bg-primary/[0.06]"
              >
                <h3 className="font-semibold">{article.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {article.description}
                </p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                  Ler artigo
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
