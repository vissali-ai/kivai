import { notFound } from "next/navigation";
import { PublicContentPage } from "@/components/site-cms/public-content-page";
import { getPublishedSiteContentByPath } from "@/lib/site-cms/repository";
import { getCmsPageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props) { return getCmsPageMetadata(`/recursos/${(await params).slug}`); }
export default async function ResourcePage({ params }: Props) {
  const content = await getPublishedSiteContentByPath(`/recursos/${(await params).slug}`);
  if (!content || content.contentType !== "resource") notFound();
  return <PublicContentPage content={content} />;
}
