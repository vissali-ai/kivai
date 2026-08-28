import { SITE_URL } from "@/lib/seo";

export type ToolSchemaBreadcrumb = {
  name: string;
  href: string;
};

export type ToolSchemaFaq = {
  question: string;
  answer: string;
};

type BuildToolPageSchemaInput = {
  name: string;
  slug: string;
  description: string;
  applicationCategory?: string;
  breadcrumbs: readonly ToolSchemaBreadcrumb[];
  faqs?: readonly ToolSchemaFaq[];
};

/**
 * Builder padrão de dados estruturados das páginas de ferramenta do Kivai.
 * Mantém URL canônica, SoftwareApplication, breadcrumb e FAQ coerentes entre
 * páginas sem obrigar cada ferramenta a repetir a montagem do JSON-LD.
 */
export function buildToolPageSchema({
  name,
  slug,
  description,
  applicationCategory = "UtilitiesApplication",
  breadcrumbs,
  faqs = [],
}: BuildToolPageSchemaInput) {
  const url = `${SITE_URL}/ferramentas/${slug}`;

  const graph: Record<string, unknown>[] = [
    {
      "@type": "SoftwareApplication",
      name,
      applicationCategory,
      operatingSystem: "Qualquer sistema com navegador moderno",
      url,
      description,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "BRL",
      },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbs.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        item: item.href.startsWith("http") ? item.href : `${SITE_URL}${item.href}`,
      })),
    },
  ];

  if (faqs.length) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: faqs.map(({ question, answer }) => ({
        "@type": "Question",
        name: question,
        acceptedAnswer: {
          "@type": "Answer",
          text: answer,
        },
      })),
    });
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}
