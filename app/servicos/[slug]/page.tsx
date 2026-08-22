import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicServicePage } from "@/components/site-cms/public-service-page";
import { getPublishedSiteService } from "@/lib/site-cms/service-repository";
import { getPageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> { const item = await getPublishedSiteService((await params).slug); if (!item) return {}; return { ...getPageMetadata({ title: item.seoTitle || item.title, description: item.seoDescription || item.shortDescription, pathname: item.path }), ...(item.canonicalUrl ? { alternates: { canonical: item.canonicalUrl } } : {}), robots: { index: item.indexable, follow: item.indexable } }; }
export default async function ManagedServicePage({ params }: Props) { const item = await getPublishedSiteService((await params).slug); if (!item || item.existingServiceSlug) notFound(); return <PublicServicePage service={item} />; }
