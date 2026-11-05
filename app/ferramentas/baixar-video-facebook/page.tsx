import { notFound } from "next/navigation";
import { VideoServerToolEditorialV2 } from "@/components/tools/video-server-tool-editorial-v2";
import { getToolMetadataAsync } from "@/lib/seo";
import { getToolBySlug } from "@/lib/tools";
import { getToolOverride, listSiteHubs } from "@/lib/site-cms/repository";
import FacebookDownloaderClient from "./facebook-downloader-client";

export async function generateMetadata() {
  return getToolMetadataAsync("baixar-video-facebook");
}

export default async function Page() {
  const tool = getToolBySlug("baixar-video-facebook")!;
  const override = await getToolOverride(tool.slug);
  if (override && override.status !== "published") notFound();
  const hub = override?.hubId ? (await listSiteHubs()).find(item => item.id === override.hubId) : null;
  return <>
    <FacebookDownloaderClient title={override?.title || tool.name} description={override?.shortDescription || tool.description}
      categoryName={hub?.name || "Vídeos"} categoryHref={hub?.path || "/ferramentas/videos"} />
    <VideoServerToolEditorialV2 slug="baixar-video-facebook" />
  </>;
}
