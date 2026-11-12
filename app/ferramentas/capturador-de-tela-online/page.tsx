import { notFound } from "next/navigation";
import { ImageToolEditorialV2 } from "@/components/tools/image-tool-editorial-v2";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
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
  const title = content?.title || tool.name;
  const description = content?.shortDescription || tool.description;

  return <>
    <ToolPageShell
      title={title}
      description={description}
      categoryName="Imagens"
      categoryHref="/ferramentas/imagens"
      processingMode="local"
      privacyMessage="A captura e a edição acontecem no navegador. O compartilhamento de tela é encerrado assim que o frame é obtido."
    >
      <ScreenshotEditor />
    </ToolPageShell>
    <ImageToolEditorialV2 slug={slug} />
  </>;
}
