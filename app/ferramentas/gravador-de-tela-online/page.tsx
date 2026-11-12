import { notFound } from "next/navigation";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
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
  const title = content?.title || tool.name;
  const description = content?.shortDescription || tool.description;

  return <>
    <ToolPageShell
      title={title}
      description={description}
      categoryName="Vídeos"
      categoryHref="/ferramentas/videos"
      processingMode="local"
      privacyMessage="A gravação é criada no navegador a partir da tela, janela ou aba que você autorizar. O Kivai não inicia captura sem a sua ação."
    >
      <Recorder />
    </ToolPageShell>
    <VideoToolSeoContent variant="recorder" />
  </>;
}
