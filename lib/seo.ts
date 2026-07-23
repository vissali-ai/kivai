import type { Metadata } from "next";
import { tools } from "@/lib/tools";

const BASE_URL = "https://kivai.com.br";

export function getToolMetadata(slug: string): Metadata {
  const tool = tools.find((t) => t.slug === slug);

  if (!tool) {
    return {
      title: "Ferramenta | Kivai",
      description: "Ferramentas online gratuitas do Kivai.",
    };
  }

  const title =
    tool.seoTitle ??
    `${tool.name} Online Grátis | Kivai`;

  const description =
    tool.seoDescription ??
    tool.description;

  const url = `${BASE_URL}/ferramentas/${tool.slug}`;

  return {
    title,
    description,

    keywords: tool.keywords,

    alternates: {
      canonical: url,
    },

    openGraph: {
      title,
      description,
      url,
      siteName: "Kivai",
      locale: "pt_BR",
      type: "website",
    },

    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}