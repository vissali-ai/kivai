import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { ToolEditorialLayout } from "@/components/tools/tool-editorial-layout";
import { getToolMetadataAsync } from "@/lib/seo";
import { getPublishedToolOverride } from "@/lib/site-cms/repository";
import { POST_CREATOR_SLUG } from "@/lib/post-creator/schema";
import { postCreatorEditorial } from "@/lib/post-creator/editorial";
import CreatorClient from "./creator-client";

export const dynamic = "force-dynamic";
export async function generateMetadata() { return getToolMetadataAsync(POST_CREATOR_SLUG); }
export default async function Page() {
  const content = await getPublishedToolOverride(POST_CREATOR_SLUG);
  return <><ToolPageShell title={content?.title || "Criador de Posts para Redes Sociais com IA"} description={content?.shortDescription || "Gere títulos, legendas, chamadas, hashtags e roteiros de carrossel para redes sociais com IA."} categoryName="Social Media" categoryHref="/ferramentas/social-media" processingMode="server" privacyMessage="Ao clicar em Gerar conteúdo, o briefing é enviado ao provedor externo de IA. Projetos salvos na conta ficam armazenados no Kivai."><CreatorClient /></ToolPageShell><ToolEditorialLayout slug={POST_CREATOR_SLUG} {...postCreatorEditorial} relatedTools={postCreatorEditorial.related} /></>;
}
