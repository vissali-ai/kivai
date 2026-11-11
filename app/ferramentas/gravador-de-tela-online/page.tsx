import { notFound } from "next/navigation";
import { VideoToolSeoContent } from "@/components/tools/video-tool-seo-content";
import { getToolMetadataAsync } from "@/lib/seo";
import { getToolOverride } from "@/lib/site-cms/repository";
import { getToolBySlug } from "@/lib/tools";
import Recorder from "./recorder";

const slug = "gravador-de-tela-online";
export const generateMetadata = () => getToolMetadataAsync(slug);

export default async function Page() {
  const content = await getToolOverride(slug);
  if (content && content.status !== "published") notFound();
  const tool = getToolBySlug(slug)!;
  return <main>
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-16 sm:px-6">
      <a href="/ferramentas/videos" className="text-sm underline">Hub Vídeos</a>
      <header><h1 className="font-heading text-4xl font-bold">{content?.title || tool.name}</h1>
        <p className="mt-3 text-muted-foreground">{content?.shortDescription || tool.description}</p></header>
      <Recorder />
    </div>
    <VideoToolSeoContent variant="recorder" />
  </main>;
}
