import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { ToolEditorialLayout } from "@/components/tools/tool-editorial-layout";
import { getToolMetadataAsync } from "@/lib/seo";
import { getPublishedToolOverride } from "@/lib/site-cms/repository";
import { postImageEnabled } from "@/lib/ai/post-image";
import { POST_CREATOR_SLUG } from "@/lib/post-creator/schema";
import { postCreatorEditorial } from "@/lib/post-creator/editorial";
import CreatorClient from "./creator-client";

export const dynamic = "force-dynamic";
export async function generateMetadata() { return getToolMetadataAsync(POST_CREATOR_SLUG); }
export default async function Page() {
  const content = await getPublishedToolOverride(POST_CREATOR_SLUG);
  return <><ToolPageShell title={content?.title || "Criador de Posts para Redes Sociais com IA"} description={content?.shortDescription || "Transforme uma ideia em legenda e arte. Edite textos, cores e logotipo, salve seu projeto e confira no Preview."} categoryName="Social Media" categoryHref="/ferramentas/social-media" processingMode="server" privacyMessage="A geração de IA envia briefing ou descrição visual ao provedor com sua autorização. Edição e exportação acontecem no navegador; salvar na conta armazena o projeto no Kivai."><CreatorClient imageEnabled={postImageEnabled()} /></ToolPageShell><ToolEditorialLayout slug={POST_CREATOR_SLUG} {...postCreatorEditorial} relatedTools={postCreatorEditorial.related} /></>;
}
