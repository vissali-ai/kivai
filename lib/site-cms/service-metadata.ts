import type { Metadata } from "next";
import { getPageMetadata } from "@/lib/seo";
import type { SiteService } from "@/lib/site-cms/types";

export function getManagedServiceMetadata(item: SiteService): Metadata {
  return { ...getPageMetadata({ title: item.seoTitle || item.title, description: item.seoDescription || item.shortDescription, pathname: item.path }), ...(item.canonicalUrl ? { alternates: { canonical: item.canonicalUrl } } : {}), robots: { index: item.indexable, follow: item.indexable, googleBot: { index: item.indexable, follow: item.indexable } } };
}
