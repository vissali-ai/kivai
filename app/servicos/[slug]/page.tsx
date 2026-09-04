import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PublicServicePage } from "@/components/site-cms/public-service-page";
import { getPublishedSiteService } from "@/lib/site-cms/service-repository";
import { getPageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = (await params).slug;
  const item = await getPublishedSiteService(slug);
  if (!item) return {};
  if (slug === "trafego-kivai") return { ...getPageMetadata({ title: item.seoTitle || item.title, description: item.seoDescription || item.shortDescription, pathname: item.path }), robots: { index: false, follow: true } };
  return { ...getPageMetadata({ title: item.seoTitle || item.title, description: item.seoDescription || item.shortDescription, pathname: item.path }), ...(item.canonicalUrl ? { alternates: { canonical: item.canonicalUrl } } : {}), robots: { index: item.indexable, follow: item.indexable } };
}

export default async function ManagedServicePage({ params }: Props) {
  const slug = (await params).slug;
  if (slug === "trafego-kivai") redirect("https://trafego.kivai.com.br");
  const item = await getPublishedSiteService(slug);
  if (!item || item.existingServiceSlug) notFound();
  return <PublicServicePage service={item} />;
}
