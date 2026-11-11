import { notFound } from "next/navigation";
import { ImageToolEditorialV2 } from "@/components/tools/image-tool-editorial-v2";
import { getToolMetadataAsync } from "@/lib/seo";
import { getToolOverride } from "@/lib/site-cms/repository";
import { getToolBySlug } from "@/lib/tools";
import ScreenshotEditor from "./screenshot-editor";

const slug = "capturador-de-tela-online";
export const generateMetadata = () => getToolMetadataAsync(slug);

export default async function Page() {
  const content = await getToolOverride(slug);
  if (content && content.status !== "published") notFound();
  const tool = getToolBySlug(slug)!;
  return <main><div className="mx-auto max-w-6xl space-y-6 px-4 py-16 sm:px-6">
    <a href="/ferramentas/imagens" className="text-sm underline">Hub Imagens</a>
    <header><h1 className="font-heading text-4xl font-bold">{content?.title || tool.name}</h1>
      <p className="mt-3 text-muted-foreground">{content?.shortDescription || tool.description}</p></header>
    <ScreenshotEditor />
  </div><ImageToolEditorialV2 slug={slug}/></main>;
}
