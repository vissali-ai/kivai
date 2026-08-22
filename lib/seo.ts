import type { Metadata } from "next";
import { isToolIndexable, tools } from "@/lib/tools";
import { getPublishedSiteContentByPath, getToolOverride } from "@/lib/site-cms/repository";
import { getSiteHubBySlug } from "@/lib/site-cms/repository";

export const SITE_URL = "https://www.kivai.com.br";
export const DEFAULT_SOCIAL_IMAGE = `${SITE_URL}/og-image.jpg`;

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
  const normalizedTitle = title
    .replace(/\bNexion(?: Tools)?\b/gi, "")
    .replace(/\s*\|\s*Kivai\s*$/i, "")
    .replace(/\s*\|\s*$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  return `${normalizedTitle} | Kivai`;
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
      images: [{ url: DEFAULT_SOCIAL_IMAGE, width: 1200, height: 630, alt: "Kivai" }],
    },
    twitter: {
      card: "summary_large_image",
      title: brandedTitle,
      description,
      images: [DEFAULT_SOCIAL_IMAGE],
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
      images: [{ url: DEFAULT_SOCIAL_IMAGE, width: 1200, height: 630, alt: "Kivai" }],
    },

    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [DEFAULT_SOCIAL_IMAGE],
    },
  };
}

export async function getToolMetadataAsync(slug: string): Promise<Metadata> {
  const base = getToolMetadata(slug);
  const override = await getToolOverride(slug)
    ?? await getPublishedSiteContentByPath(`/ferramentas/${slug}`);
  if (!override) return base;
  if (override.status === "draft") return base;
  if (override.status === "archived") return { ...base, robots: noIndexRobots };

  const title = override.seoTitle || override.title;
  const description = override.seoDescription || override.shortDescription || base.description || "Ferramentas online gratuitas do Kivai.";
  const canonical = override.canonicalUrl || `${SITE_URL}${override.path}`;
  const brandedTitle = withBrand(title);
  return {
    ...base,
    title: { absolute: brandedTitle },
    description,
    robots: override.indexable ? undefined : noIndexRobots,
    alternates: { canonical },
    openGraph: { title: brandedTitle, description, url: canonical, siteName: "Kivai", locale: "pt_BR", type: "website", images: [{ url: DEFAULT_SOCIAL_IMAGE, width: 1200, height: 630, alt: "Kivai" }] },
    twitter: { card: "summary_large_image", title: brandedTitle, description, images: [DEFAULT_SOCIAL_IMAGE] },
  };
}

export async function getCmsPageMetadata(pathname: string): Promise<Metadata> {
  const content = await getPublishedSiteContentByPath(pathname);
  if (!content) return { title: { absolute: "Página não encontrada | Kivai" }, robots: noIndexRobots };
  const metadata = getPageMetadata({ title: content.seoTitle || content.title, description: content.seoDescription || content.shortDescription, pathname });
  return { ...metadata, robots: content.indexable ? undefined : noIndexRobots,
    ...(content.canonicalUrl ? { alternates: { canonical: content.canonicalUrl } } : {}) };
}

export async function getCmsHubMetadata(slug: string, fallback?: Metadata): Promise<Metadata> {
  const hub = await getSiteHubBySlug(slug);
  if (!hub) return fallback ?? { title: { absolute: "Hub não encontrado | Kivai" }, robots: noIndexRobots };
  if (hub.status === "draft") return fallback ?? { title: { absolute: `${hub.name} | Kivai` }, robots: noIndexRobots };
  if (hub.status === "archived") return { ...(fallback ?? {}), robots: noIndexRobots };
  const fallbackTitle = typeof fallback?.title === "object" && fallback.title && "absolute" in fallback.title ? String(fallback.title.absolute) : hub.name;
  const metadata = getPageMetadata({ title: hub.seoTitle || fallbackTitle, description: hub.seoDescription || fallback?.description || hub.description, pathname: hub.path });
  return { ...metadata, robots: hub.indexable ? undefined : noIndexRobots };
}
