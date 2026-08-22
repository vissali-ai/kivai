import { notFound } from "next/navigation";
import { PublicContentPage } from "@/components/site-cms/public-content-page";
import { getPublishedSiteContentByPath } from "@/lib/site-cms/repository";
import { getCmsPageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props) { return getCmsPageMetadata(`/paginas/${(await params).slug}`); }
export default async function CmsPage({ params }: Props) {
  const content = await getPublishedSiteContentByPath(`/paginas/${(await params).slug}`);
  if (!content || content.contentType !== "page") notFound();
  return <PublicContentPage content={content} />;
}
