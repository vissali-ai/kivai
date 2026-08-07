import type { Metadata } from "next";
import { isToolIndexable, tools } from "@/lib/tools";

export const SITE_URL = "https://www.kivai.com.br";

export const noIndexRobots: NonNullable<Metadata["robots"]> = {
  index: false,
  follow: false,
  googleBot: {
    index: false,
    follow: false,
  },
};

type PageMetadataInput = {
  title: string;
  description: string;
  pathname: string;
};

function withBrand(title: string) {
  return `${title.replace(/\s*\|\s*(?:Kivai|Nexion Tools)\s*$/i, "")} | Kivai`;
}

export function getPageMetadata({
  title,
  description,
  pathname,
}: PageMetadataInput): Metadata {
  const brandedTitle = withBrand(title);
  const url = `${SITE_URL}${pathname === "/" ? "" : pathname}`;

  return {
    title: { absolute: brandedTitle },
    description,
    alternates: { canonical: url },
    openGraph: {
      title: brandedTitle,
      description,
      url,
      siteName: "Kivai",
      locale: "pt_BR",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: brandedTitle,
      description,
    },
  };
}

export function getToolMetadata(slug: string): Metadata {
  const tool = tools.find((t) => t.slug === slug);

  if (!tool) {
    return {
      title: { absolute: "Ferramenta não encontrada | Kivai" },
      description: "Ferramentas online gratuitas do Kivai.",
      robots: noIndexRobots,
    };
  }

  const title = withBrand(tool.seoTitle ?? `${tool.name} Online Grátis`);

  const description =
    tool.seoDescription ??
    tool.description;

  const url = `${SITE_URL}/ferramentas/${tool.slug}`;

  return {
    title: { absolute: title },
    description,

    ...(!isToolIndexable(tool.slug) ? { robots: noIndexRobots } : {}),

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
