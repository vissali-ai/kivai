import { notFound } from "next/navigation";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { getToolMetadataAsync } from "@/lib/seo";
import { getToolOverride, listSiteHubs } from "@/lib/site-cms/repository";
import ConnectClient from "./connect-client";

export const dynamic = "force-dynamic";
export const generateMetadata = () => getToolMetadataAsync("kivai-connect");
export default async function Page() {
  const [content, hubs] = await Promise.all([getToolOverride("kivai-connect"), listSiteHubs()]);
  if (!content || content.status !== "published" || content.technicalStatus !== "ready") notFound();
  const hub = hubs.find(item => item.id === content.hubId);
  const visible = content.blockVisibility ?? content.customData.blockVisibility ?? {};
  const tutorial = content.customData.originalFields?.find(field => field.key === "tutorial-url")?.value;
  const tutorialUrl = typeof tutorial === "string" && /^https:\/\/[^\s]+$/i.test(tutorial) ? tutorial : null;
  return <ToolPageShell title={content.title} description={visible.summary === false ? "" : content.shortDescription} showHeader={visible.hero !== false}
    categoryName={hub?.status === "published" ? hub.name : "Ferramentas"} categoryHref={hub?.status === "published" ? hub.path : "/ferramentas"}
    processingMode="hybrid" privacyMessage="O auxiliar coleta o diagnóstico no computador. O relatório permanece local; somente o resumo revisado é enviado ao Kivai e ao provedor de IA quando você autoriza uma análise."
    complementaryContent={visible.content === false ? null : <article className="space-y-4 text-sm leading-7 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_ol]:list-decimal [&_ol]:pl-5" dangerouslySetInnerHTML={{ __html: content.contentHtml }} />}>
    <ConnectClient />
    {tutorialUrl && <a href={tutorialUrl} target="_blank" rel="noopener noreferrer" className="inline-block text-sm text-primary underline">Abrir tutorial</a>}
  </ToolPageShell>;
}
